import { Fragment, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Board, BoardNode, Connection, NodeKind } from '../types/board'
import { LANES } from '../data/sampleBoard'
import { Connections } from './Connections'
import { Inspector } from './Inspector'
import { NodeCard } from './NodeCard'
import { Persona } from './Persona'

interface Props {
  board: Board
  onBoardChange: (board: Board) => void
  onBoardReplaced: (board: Board) => void
}

type Tool = 'select' | 'connect' | NodeKind

function makeNode(kind: NodeKind, x: number, y: number): BoardNode {
  const id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  switch (kind) {
    case 'character':
      return { id, kind, x, y, name: 'New Character', role: 'role', age: '', body: 'Click to describe.', tags: [] }
    case 'world':
      return { id, kind, x, y, title: 'New setting', body: 'Click to describe.' }
    case 'tone':
      return { id, kind, x, y, title: 'Tone', body: 'Click to describe.' }
    case 'beat':
      return { id, kind, x, y, title: 'New beat', body: '' }
  }
}

const BOUNDS = { minX: 100, minY: 60, maxX: 1000, maxY: 870 }

export function CanvasBoard({ board, onBoardChange, onBoardReplaced }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [panning, setPanning] = useState(false)
  const [personaOpen, setPersonaOpen] = useState(true)
  const [connectFromId, setConnectFromId] = useState<string | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const { nodes, connections } = board
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTool('select')
        setConnectFromId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (tool !== 'connect') setConnectFromId(null)
  }, [tool])

  function setNodes(next: BoardNode[]) {
    onBoardChange({ ...board, nodes: next })
  }

  function setConnections(next: Connection[]) {
    onBoardChange({ ...board, connections: next })
  }

  function handleNodeDown(e: ReactPointerEvent, node: BoardNode) {
    if (tool !== 'select') return
    e.stopPropagation()
    setSelectedId(node.id)
    setDraggingId(node.id)
    const startX = e.clientX
    const startY = e.clientY
    const origX = node.x
    const origY = node.y
    document.body.style.cursor = 'grabbing'

    let latest: BoardNode[] = nodes
    const onMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom
      const dy = (ev.clientY - startY) / zoom
      latest = latest.map((n) => (n.id === node.id ? { ...n, x: origX + dx, y: origY + dy } : n))
      onBoardChange({ ...board, nodes: latest })
    }
    const onUp = () => {
      setDraggingId(null)
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  function handleNodeClick(node: BoardNode) {
    if (tool === 'connect') {
      if (connectFromId === null) {
        setConnectFromId(node.id)
        return
      }
      if (connectFromId === node.id) {
        setConnectFromId(null)
        return
      }
      const exists = connections.some(
        (c) =>
          (c.from === connectFromId && c.to === node.id) ||
          (c.from === node.id && c.to === connectFromId),
      )
      if (!exists) {
        const label = window.prompt('Connection label (optional)') ?? ''
        setConnections([
          ...connections,
          { from: connectFromId, to: node.id, label: label.trim() || undefined },
        ])
      }
      setConnectFromId(null)
      setTool('select')
      return
    }
    setSelectedId(node.id)
  }

  function handleCanvasDown(e: ReactPointerEvent) {
    if ((e.target as HTMLElement).closest('.node')) return
    setSelectedId(null)
    if (tool === 'connect') {
      setConnectFromId(null)
      return
    }
    if (tool === 'select') {
      const startX = e.clientX
      const startY = e.clientY
      const origPan = { ...pan }
      setPanning(true)
      const onMove = (ev: PointerEvent) => {
        setPan({ x: origPan.x + (ev.clientX - startX), y: origPan.y + (ev.clientY - startY) })
      }
      const onUp = () => {
        setPanning(false)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      return
    }
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left - pan.x) / zoom - 80
    const y = (e.clientY - rect.top - pan.y) / zoom - 40
    const node = makeNode(tool, x, y)
    setNodes([...nodes, node])
    setSelectedId(node.id)
    setTool('select')
  }

  function updateNode(n: BoardNode) {
    setNodes(nodes.map((x) => (x.id === n.id ? n : x)))
  }

  function deleteNode(id: string) {
    onBoardChange({
      ...board,
      nodes: nodes.filter((n) => n.id !== id),
      connections: connections.filter((c) => c.from !== id && c.to !== id),
    })
    setSelectedId(null)
  }

  function removeConnectionsAt(nodeId: string) {
    setConnections(connections.filter((c) => c.from !== nodeId && c.to !== nodeId))
  }

  function adjustZoom(dz: number) {
    setZoom((z) => Math.min(2, Math.max(0.4, z + dz)))
  }
  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const hoverIds = selectedId
    ? [selectedId]
    : connectFromId
    ? [connectFromId]
    : []
  const bw = BOUNDS.maxX - BOUNDS.minX
  const bh = BOUNDS.maxY - BOUNDS.minY

  const toolButtons: Array<{ id: Tool; label: string; dot?: string }> = [
    { id: 'character', label: 'Character', dot: '#a94441' },
    { id: 'world', label: 'World', dot: '#22424d' },
    { id: 'tone', label: 'Tone', dot: '#8b6d1e' },
    { id: 'beat', label: 'Beat', dot: '#3d2e6b' },
  ]

  const connectingCursor = tool === 'connect' ? 'crosshair' : undefined

  return (
    <>
      <div className="floating-top">
        <div
          className={`tool ${tool === 'select' ? 'active' : ''}`}
          onClick={() => setTool('select')}
        >
          <span>↖</span> Select
        </div>
        <div className="sep" />
        {toolButtons.map((b) => (
          <div
            key={b.id}
            className={`tool ${tool === b.id ? 'active' : ''}`}
            onClick={() => setTool(b.id)}
          >
            <span style={{ color: b.dot }}>●</span> {b.label}
          </div>
        ))}
        <div className="sep" />
        <div
          className={`tool ${tool === 'connect' ? 'active' : ''}`}
          onClick={() => setTool(tool === 'connect' ? 'select' : 'connect')}
          title="Click two cards to link them"
        >
          <span>↔</span> Connect
        </div>
      </div>

      {tool === 'connect' && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 15,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent-ink)',
            fontSize: 12,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
            border: '1px solid var(--line)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          {connectFromId
            ? 'Click the second card to link · Esc to cancel'
            : 'Click the first card to connect · Esc to cancel'}
        </div>
      )}

      <div
        className={`canvas ${panning ? 'grabbing' : ''}`}
        ref={stageRef}
        onPointerDown={handleCanvasDown}
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
          cursor: connectingCursor,
        }}
      >
        <div
          className="canvas-inner"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {LANES.map((lane, i) => (
            <Fragment key={lane.id}>
              <div className="lane-label" style={{ left: 40, top: lane.y }}>
                <span className="num">{lane.num}</span>
                {lane.label}
              </div>
              {i > 0 && (
                <div
                  className="lane-divider"
                  style={{ top: lane.y - 20, width: 1200, left: 0 }}
                />
              )}
            </Fragment>
          ))}

          <Connections nodes={nodes} connections={connections} hoverIds={hoverIds} />
          {nodes.map((n) => (
            <NodeCard
              key={n.id}
              node={n}
              selected={selectedId === n.id || connectFromId === n.id}
              dragging={draggingId === n.id}
              onPointerDown={handleNodeDown}
              onClick={handleNodeClick}
            />
          ))}
        </div>
      </div>

      <div className="zoom-controls">
        <button onClick={() => adjustZoom(0.1)} title="Zoom in">
          +
        </button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        <button onClick={() => adjustZoom(-0.1)} title="Zoom out">
          −
        </button>
        <button onClick={resetView} title="Reset" style={{ fontSize: 12 }}>
          ⌂
        </button>
      </div>

      {!selectedNode && (
        <div className="minimap">
          <div className="minimap-label">OVERVIEW</div>
          <div className="minimap-inner">
            {nodes.map((n) => {
              const color =
                n.kind === 'character'
                  ? 'var(--note-rose-ink)'
                  : n.kind === 'world'
                  ? 'var(--note-ocean-ink)'
                  : n.kind === 'tone'
                  ? 'var(--note-butter-ink)'
                  : 'var(--note-lavender-ink)'
              return (
                <div
                  key={n.id}
                  className="minimap-dot"
                  style={{
                    left: `${((n.x - BOUNDS.minX) / bw) * 100}%`,
                    top: `${((n.y - BOUNDS.minY) / bh) * 100}%`,
                    background: color,
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {selectedNode && (
        <Inspector
          node={selectedNode}
          onChange={updateNode}
          onDelete={deleteNode}
          onUnlink={() => removeConnectionsAt(selectedNode.id)}
          hasLinks={connections.some((c) => c.from === selectedNode.id || c.to === selectedNode.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {personaOpen && !selectedNode && (
        <Persona
          personaName={board.personaName}
          boardId={board.id}
          onDismiss={() => setPersonaOpen(false)}
          onBoardReplaced={onBoardReplaced}
        />
      )}
      {!personaOpen && !selectedNode && (
        <button
          className="btn"
          style={{ position: 'absolute', right: 14, bottom: 14, zIndex: 20 }}
          onClick={() => setPersonaOpen(true)}
        >
          <span style={{ color: 'var(--accent)' }}>●</span> Ask {board.personaName}
        </button>
      )}
    </>
  )
}
