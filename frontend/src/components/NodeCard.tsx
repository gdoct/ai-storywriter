import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { BoardNode } from '../types/board'

interface Props {
  node: BoardNode
  selected: boolean
  dragging: boolean
  onPointerDown: (e: ReactPointerEvent, node: BoardNode) => void
  onClick: (node: BoardNode) => void
}

export function NodeCard({ node, selected, dragging, onPointerDown, onClick }: Props) {
  const displayTitle = 'name' in node ? node.name : node.title
  const kindLabel =
    node.kind === 'character'
      ? 'Character'
      : node.kind === 'world'
      ? 'World · Setting'
      : node.kind === 'tone'
      ? 'World · Tone'
      : 'Plot beat'

  const body = 'body' in node ? node.body : undefined
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) {
      setOverflowing(false)
      return
    }
    setOverflowing(el.scrollHeight - el.clientHeight > 1)
  }, [body])

  return (
    <div
      className={`node ${node.kind} ${selected ? 'selected' : ''} ${dragging ? 'dragging' : ''}`}
      style={{ left: node.x, top: node.y }}
      onPointerDown={(e) => onPointerDown(e, node)}
      onClick={(e) => {
        e.stopPropagation()
        onClick(node)
      }}
      data-id={node.id}
    >
      {node.kind === 'character' && <div className="portrait">PORTRAIT</div>}
      <div className="node-kind">{kindLabel}</div>
      <div className="node-title">{displayTitle}</div>
      {node.kind === 'character' && node.role && (
        <div className="node-meta">
          {node.role}
          {node.age ? ` · ${node.age}` : ''}
        </div>
      )}
      {body && (
        <>
          <div ref={bodyRef} className="node-body">
            {body}
          </div>
          {overflowing && !dragging && (
            <div className="node-body-popup has-overflow" role="tooltip">
              {body}
            </div>
          )}
        </>
      )}
      {node.kind === 'character' && node.tags && node.tags.length > 0 && (
        <div className="node-tags">
          {node.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
