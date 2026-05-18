// Auto-layout for the Pulse map using dagre. Computes initial positions for
// react-flow nodes when no saved layout exists.

import dagre from 'dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH = 220
const NODE_HEIGHT = 92

export function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  direction: 'LR' | 'TB' = 'LR'
): Node[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 120,
    edgesep: 40,
    marginx: 40,
    marginy: 40,
  })

  for (const n of nodes) {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const e of edges) {
    g.setEdge(e.source, e.target)
  }

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    if (!pos) return n
    return {
      ...n,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })
}

// localStorage helpers — persist user-dragged positions per node id.
const STORAGE_KEY = 'pulse:layout:v1'

export function loadStoredPositions(): Record<string, { x: number; y: number }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, { x: number; y: number }>
  } catch {
    return {}
  }
}

export function saveStoredPositions(positions: Record<string, { x: number; y: number }>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {
    /* ignore quota */
  }
}

export function clearStoredPositions() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
