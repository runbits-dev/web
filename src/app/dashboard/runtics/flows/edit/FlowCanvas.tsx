"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, X, ChevronDown } from 'lucide-react'
import type { Agent, FlowDsl, FlowNode } from '../../_lib'

/**
 * Visual editor for the flow DSL.
 *
 * Limitations of the current DSL (src/flows.ts in runtics-control): flows are
 * LINEAR. nodes[i].args_template can reference {{node.<previous-id>.output.x}}
 * and {{input.x}}. No branching, no conditionals, no parallelism yet.
 *
 * So the canvas presents a vertical chain: top node is first to execute,
 * subsequent ones cascade down. Drag re-ordering changes the execution
 * sequence in the DSL.
 *
 * Each node carries: id, agent (from catalog), args_template (free-form JSON
 * editable via side panel).
 *
 * Save flow: parent component reads `getDsl()` via the ref-style callback.
 */

const NODE_HORIZONTAL_OFFSET = 0
const NODE_VERTICAL_GAP = 120

function flowNodesToCanvas(flowNodes: FlowNode[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = flowNodes.map((n, i) => ({
    id: n.id,
    position: { x: NODE_HORIZONTAL_OFFSET, y: i * NODE_VERTICAL_GAP },
    data: { agent: n.agent, args_template: n.args_template ?? {} },
    type: 'agent',
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }))
  const edges: Edge[] = []
  for (let i = 0; i < flowNodes.length - 1; i++) {
    edges.push({
      id: `${flowNodes[i].id}->${flowNodes[i + 1].id}`,
      source: flowNodes[i].id,
      target: flowNodes[i + 1].id,
      animated: true,
    })
  }
  return { nodes, edges }
}

function canvasNodesToDsl(nodes: Node[]): FlowDsl {
  // Order DSL nodes by their Y position so drag-to-reorder reflects in
  // execution order. Edges are derived (linear), so we ignore them on save.
  const ordered = [...nodes].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
  return {
    nodes: ordered.map((n) => ({
      id: n.id,
      agent: (n.data as { agent: string }).agent,
      args_template: (n.data as { args_template?: Record<string, unknown> }).args_template ?? {},
    })),
  }
}

export interface FlowCanvasProps {
  initialDsl: FlowDsl
  agents: Agent[]
  onChange: (dsl: FlowDsl) => void
}

export function FlowCanvas({ initialDsl, agents, onChange }: FlowCanvasProps) {
  const initial = useMemo(() => flowNodesToCanvas(initialDsl.nodes ?? []), [initialDsl])
  const [nodes, setNodes] = useState<Node[]>(initial.nodes)
  const [edges, setEdges] = useState<Edge[]>(initial.edges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddPicker, setShowAddPicker] = useState(false)

  // Bubble changes upward so parent's save button knows the latest DSL.
  useEffect(() => {
    onChange(canvasNodesToDsl(nodes))
  }, [nodes, onChange])

  // Auto-rebuild linear edges every time nodes change (order or add/remove).
  useEffect(() => {
    const ordered = [...nodes].sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
    const next: Edge[] = []
    for (let i = 0; i < ordered.length - 1; i++) {
      next.push({
        id: `${ordered[i].id}->${ordered[i + 1].id}`,
        source: ordered[i].id,
        target: ordered[i + 1].id,
        animated: true,
      })
    }
    setEdges(next)
  }, [nodes])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [])

  function addNode(agentId: string) {
    const id = `node_${Date.now().toString(36)}`
    const y = nodes.length * NODE_VERTICAL_GAP
    setNodes((nds) => [
      ...nds,
      {
        id,
        position: { x: NODE_HORIZONTAL_OFFSET, y },
        data: { agent: agentId, args_template: {} },
        type: 'agent',
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      },
    ])
    setShowAddPicker(false)
    setSelectedId(id)
  }

  function deleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setSelectedId(null)
  }

  function updateNode(id: string, patch: Partial<{ agent: string; args_template: Record<string, unknown>; id: string }>) {
    setNodes((nds) => nds.map((n) => {
      if (n.id !== id) return n
      const data = { ...n.data, ...patch } as { agent: string; args_template: Record<string, unknown> }
      return { ...n, id: patch.id ?? n.id, data }
    }))
    if (patch.id) setSelectedId(patch.id)
  }

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 min-h-[500px]">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
        {/* Add node button overlay */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={() => setShowAddPicker((s) => !s)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar agente
          </button>
          {showAddPicker && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-auto">
              {agents.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-500">No hay agentes disponibles.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {agents.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => addNode(a.id)}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm"
                      >
                        <div className="font-medium text-slate-900">{a.id}</div>
                        {a.description && (
                          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.description}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-slate-400">Vacío. Click "Agregar agente" arriba a la derecha.</p>
          </div>
        )}
      </div>
      <NodeInspector
        node={selected}
        agents={agents}
        onUpdate={(patch) => selected && updateNode(selected.id, patch)}
        onDelete={() => selected && deleteNode(selected.id)}
      />
    </div>
  )
}

// ─── Custom node component ─────────────────────────────────────────────────

import { Handle } from '@xyflow/react'

function AgentNode({ data, selected, id }: { data: { agent: string }; selected?: boolean; id: string }) {
  const argCount = Object.keys((data as unknown as { args_template?: Record<string, unknown> }).args_template ?? {}).length
  return (
    <div
      className={`bg-white border-2 rounded-xl px-3 py-2 shadow-sm min-w-[180px] ${
        selected ? 'border-indigo-500 shadow-md' : 'border-slate-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !border-0 !w-2 !h-2" />
      <div className="text-[10px] font-mono text-slate-400 mb-0.5">{id}</div>
      <div className="font-semibold text-sm text-slate-900">{data.agent}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        {argCount} {argCount === 1 ? 'arg' : 'args'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !border-0 !w-2 !h-2" />
    </div>
  )
}

const NODE_TYPES = { agent: AgentNode }

// ─── Side panel: node inspector ────────────────────────────────────────────

function NodeInspector({
  node,
  agents,
  onUpdate,
  onDelete,
}: {
  node: Node | null | undefined
  agents: Agent[]
  onUpdate: (patch: { agent?: string; args_template?: Record<string, unknown>; id?: string }) => void
  onDelete: () => void
}) {
  const [argsText, setArgsText] = useState('')
  const [argsError, setArgsError] = useState<string | null>(null)
  const [idDraft, setIdDraft] = useState('')

  useEffect(() => {
    if (!node) return
    const args = (node.data as { args_template?: Record<string, unknown> }).args_template ?? {}
    setArgsText(JSON.stringify(args, null, 2))
    setArgsError(null)
    setIdDraft(node.id)
  }, [node?.id])

  if (!node) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <p className="text-xs text-slate-400 text-center py-8">
          Click un nodo del canvas para editarlo.
        </p>
      </div>
    )
  }

  const agent = (node.data as { agent: string }).agent

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 self-start sticky top-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-slate-900">Nodo</h3>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-600"
        >
          Eliminar
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">ID</label>
        <input
          type="text"
          value={idDraft}
          onChange={(e) => setIdDraft(e.target.value)}
          onBlur={() => {
            const trimmed = idDraft.trim()
            if (trimmed && trimmed !== node.id && /^[a-z0-9_-]+$/i.test(trimmed)) {
              onUpdate({ id: trimmed })
            } else {
              setIdDraft(node.id)
            }
          }}
          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Agente</label>
        <div className="relative">
          <select
            value={agent}
            onChange={(e) => onUpdate({ agent: e.target.value })}
            className="w-full appearance-none px-2.5 py-1.5 pr-7 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.id}</option>
            ))}
            {/* Allow keeping a value that's not in the catalog (legacy / disabled). */}
            {!agents.some((a) => a.id === agent) && <option value={agent}>{agent} (no en catálogo)</option>}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-slate-700">args_template (JSON)</label>
        </div>
        <textarea
          value={argsText}
          onChange={(e) => {
            setArgsText(e.target.value)
            try {
              const parsed = JSON.parse(e.target.value)
              setArgsError(null)
              onUpdate({ args_template: parsed })
            } catch {
              setArgsError('JSON inválido')
            }
          }}
          rows={10}
          spellCheck={false}
          className={`w-full px-2.5 py-2 border rounded-lg text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            argsError ? 'border-red-300' : 'border-slate-200'
          }`}
        />
        {argsError && <p className="text-[10px] text-red-500 mt-0.5">{argsError}</p>}
        <p className="text-[10px] text-slate-400 mt-1">
          Placeholders: <code>{`{{input.x}}`}</code>, <code>{`{{<node_id>.output.y}}`}</code>
        </p>
      </div>
    </div>
  )
}

// Re-export the close icon import so tree-shaking keeps it if used elsewhere
export const _icons = { X }
