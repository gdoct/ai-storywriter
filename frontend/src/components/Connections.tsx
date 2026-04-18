import { useMemo } from 'react'
import type { BoardNode, Connection } from '../types/board'

interface Props {
  nodes: BoardNode[]
  connections: Connection[]
  hoverIds: string[]
}

function nodeSize(n: BoardNode): { w: number; h: number } {
  if (n.kind === 'character') return { w: 200, h: 260 }
  if (n.kind === 'world') return { w: 220, h: 100 }
  if (n.kind === 'tone') return { w: 180, h: 100 }
  return { w: 170, h: 90 }
}

export function Connections({ nodes, connections, hoverIds }: Props) {
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])

  return (
    <svg className="connections">
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,1 L8,5 L0,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </marker>
      </defs>
      {connections.map((c, i) => {
        const a = byId[c.from]
        const b = byId[c.to]
        if (!a || !b) return null
        const as = nodeSize(a)
        const bs = nodeSize(b)
        const ax = a.x + as.w / 2
        const ay = a.y + as.h / 2
        const bx = b.x + bs.w / 2
        const by = b.y + bs.h / 2
        const dx = bx - ax
        const dy = by - ay
        const mx = (ax + bx) / 2 + dy * 0.08
        const my = (ay + by) / 2 - dx * 0.08
        const d = `M${ax},${ay} Q${mx},${my} ${bx},${by}`
        const active = hoverIds.includes(c.from) || hoverIds.includes(c.to)
        return (
          <g key={i}>
            <path d={d} className={`connection ${active ? 'active' : ''}`} />
            {c.label && (
              <text x={mx} y={my - 4} className="connection-label" textAnchor="middle">
                {c.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
