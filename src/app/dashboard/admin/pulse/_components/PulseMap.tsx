"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type ReactFlowInstance,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { PulseState, PulseResource, ResourceType, DriftSeverity } from '../_lib/types'
import { RESOURCE_COLORS, EDGE_COLORS } from '../_lib/colors'
import { PulseNode, type PulseNodeData } from './PulseNode'
import { layoutGraph, loadStoredPositions, saveStoredPositions } from '../_lib/layout'
import styles from '../_styles/pulse.module.css'

interface PulseMapProps {
  state: PulseState
  search: string
  typeFilters: Set<ResourceType>
  driftOnly: boolean
  selectedId?: string
  onSelect: (resource: PulseResource) => void
}

const nodeTypes = { pulse: PulseNode }

function resolveDriftSeverity(resource: PulseResource, state: PulseState): DriftSeverity | null {
  const drifts = state.drift_events.filter(
    (d) => d.resource_id === resource.id && d.status === 'open'
  )
  if (drifts.some((d) => d.severity === 'critical')) return 'critical'
  if (drifts.some((d) => d.severity === 'warning')) return 'warning'
  if (drifts.length > 0) return 'info'
  return null
}

function resourceSubtitle(r: PulseResource): string | undefined {
  try {
    const spec = JSON.parse(r.spec_json)
    if (r.type === 'worker') {
      const bindings = Array.isArray(spec.bindings) ? spec.bindings.length : 0
      const cron = Array.isArray(spec.cron) ? spec.cron.length : 0
      const parts: string[] = []
      if (bindings) parts.push(`${bindings} bindings`)
      if (cron) parts.push(`${cron} cron`)
      return parts.join(' · ') || undefined
    }
    if (r.type === 'd1') return `${spec.migrations ?? 0} migrations · ${spec.size_mb ?? 0}MB`
    if (r.type === 'kv') return `${(spec.keys ?? 0).toLocaleString()} keys`
    if (r.type === 'r2') return `${spec.objects ?? 0} obj · ${spec.size_gb ?? 0}GB`
    if (r.type === 'queue') return `backlog ${spec.backlog ?? 0} · ${spec.throughput_per_min ?? 0}/min`
    if (r.type === 'pages') return spec.domain as string | undefined
  } catch {
    /* ignore */
  }
  return undefined
}

export function PulseMap({
  state,
  search,
  typeFilters,
  driftOnly,
  selectedId,
  onSelect,
}: PulseMapProps) {
  // Build raw nodes/edges from state.
  const { rawNodes, rawEdges, visibleIds } = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()
    const visible = new Set<string>()
    for (const r of state.resources) {
      if (!typeFilters.has(r.type)) continue
      if (driftOnly && r.drift_count === 0) continue
      if (lowerSearch && !r.name.toLowerCase().includes(lowerSearch) && !r.id.toLowerCase().includes(lowerSearch)) continue
      visible.add(r.id)
    }

    const nodes: Node[] = state.resources
      .filter((r) => visible.has(r.id))
      .map((r) => {
        const driftSeverity = resolveDriftSeverity(r, state)
        const data: PulseNodeData = {
          resourceId: r.id,
          type: r.type,
          name: r.name,
          driftCount: r.drift_count,
          driftSeverity,
          subtitle: resourceSubtitle(r),
        }
        return {
          id: r.id,
          type: 'pulse',
          data,
          position: { x: 0, y: 0 },
        }
      })

    const edges: Edge[] = state.edges
      .filter((e) => visible.has(e.from_resource) && visible.has(e.to_resource))
      .map((e) => {
        const color = EDGE_COLORS[e.edge_type].stroke
        return {
          id: e.id,
          source: e.from_resource,
          target: e.to_resource,
          type: 'smoothstep',
          animated: e.edge_type === 'service_binding' || e.edge_type === 'frontend_call',
          style: { stroke: color, strokeWidth: 1.5, opacity: 0.65 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color,
            width: 14,
            height: 14,
          },
          data: { edge_type: e.edge_type, source: e.source },
        } as Edge
      })

    return { rawNodes: nodes, rawEdges: edges, visibleIds: visible }
  }, [state, search, typeFilters, driftOnly])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const flowRef = useRef<ReactFlowInstance | null>(null)
  const [ready, setReady] = useState(false)

  // (Re)layout whenever the visible set changes. Apply stored positions for
  // nodes the user has dragged.
  useEffect(() => {
    const stored = loadStoredPositions()
    const laidOut = layoutGraph(rawNodes, rawEdges, 'LR')
    const withStored = laidOut.map((n) => {
      const pos = stored[n.id]
      if (pos) return { ...n, position: pos }
      return n
    })
    setNodes(withStored)
    setEdges(rawEdges)
    setReady(true)
    // fit view in next tick once react-flow has measured
    setTimeout(() => {
      flowRef.current?.fitView({ padding: 0.2, duration: 400 })
    }, 60)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes.length, rawEdges.length, search, driftOnly, [...typeFilters].sort().join(',')])

  // Reflect selection visually (also enlarges selected nodes).
  useEffect(() => {
    setNodes((curr) =>
      curr.map((n) => ({
        ...n,
        selected: n.id === selectedId,
      }))
    )
  }, [selectedId, setNodes])

  const handleNodeClick = useCallback<NodeMouseHandler>(
    (_, node) => {
      const r = state.resources.find((x) => x.id === node.id)
      if (r) onSelect(r)
    },
    [state.resources, onSelect]
  )

  // Persist dragged positions on each node-drag-stop.
  const handleNodeDragStop = useCallback<NodeMouseHandler>((_, node) => {
    const stored = loadStoredPositions()
    stored[node.id] = node.position
    saveStoredPositions(stored)
  }, [])

  return (
    <div className={`${styles.canvasWrap} relative w-full h-full`}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
          Calculando layout…
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onInit={(inst) => { flowRef.current = inst }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: false }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        selectionOnDrag={false}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="rgba(148,163,184,0.18)"
        />
        <MiniMap
          pannable
          zoomable
          ariaLabel="Mini mapa del stack"
          nodeColor={(n) => {
            const t = (n.data as PulseNodeData | undefined)?.type ?? 'worker'
            return RESOURCE_COLORS[t].border
          }}
          nodeStrokeColor="transparent"
          nodeBorderRadius={4}
          maskColor="rgba(2,6,23,0.6)"
          style={{ width: 180, height: 120 }}
        />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>

      {/* Visibility hint when nothing matches */}
      {visibleIds.size === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`${styles.glassStrong} px-6 py-4 rounded-2xl text-center max-w-md`}>
            <div className="text-sm text-slate-200 font-semibold mb-1">Nada coincide con tus filtros</div>
            <div className="text-xs text-slate-400">Probá ajustar el search o desactivar “solo con drift”.</div>
          </div>
        </div>
      )}
    </div>
  )
}
