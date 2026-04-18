import type { BoardNode } from '../types/board'

interface Props {
  node: BoardNode
  onChange: (node: BoardNode) => void
  onDelete: (id: string) => void
  onUnlink?: () => void
  hasLinks?: boolean
  onClose: () => void
}

export function Inspector({ node, onChange, onDelete, onUnlink, hasLinks, onClose }: Props) {
  const title = 'name' in node ? node.name : node.title

  return (
    <div className="inspector">
      <button className="close" onClick={onClose}>
        ✕
      </button>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-soft)',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {node.kind}
      </div>
      <h4>{title || 'Untitled'}</h4>

      {node.kind === 'character' && (
        <>
          <label>Name</label>
          <input
            type="text"
            value={node.name ?? ''}
            onChange={(e) => onChange({ ...node, name: e.target.value })}
          />
          <label>Role</label>
          <input
            type="text"
            value={node.role ?? ''}
            onChange={(e) => onChange({ ...node, role: e.target.value })}
          />
          <label>Age</label>
          <input
            type="text"
            value={node.age ?? ''}
            onChange={(e) => onChange({ ...node, age: e.target.value })}
          />
          <label>Description</label>
          <textarea
            value={node.body ?? ''}
            onChange={(e) => onChange({ ...node, body: e.target.value })}
          />
          <label>Traits</label>
          <div className="chip-row">
            {(node.tags ?? []).map((t, i) => (
              <span
                key={i}
                className="chip removable"
                onClick={() =>
                  onChange({ ...node, tags: (node.tags ?? []).filter((_, j) => j !== i) })
                }
              >
                {t} ✕
              </span>
            ))}
            <span
              className="chip"
              onClick={() => {
                const t = prompt('New trait')
                if (t) onChange({ ...node, tags: [...(node.tags ?? []), t] })
              }}
            >
              + trait
            </span>
          </div>
        </>
      )}

      {(node.kind === 'world' || node.kind === 'tone') && (
        <>
          <label>Title</label>
          <input
            type="text"
            value={node.title ?? ''}
            onChange={(e) => onChange({ ...node, title: e.target.value })}
          />
          <label>Description</label>
          <textarea
            value={node.body ?? ''}
            onChange={(e) => onChange({ ...node, body: e.target.value })}
          />
        </>
      )}

      {node.kind === 'beat' && (
        <>
          <label>Beat title</label>
          <input
            type="text"
            value={node.title ?? ''}
            onChange={(e) => onChange({ ...node, title: e.target.value })}
          />
          <label>What happens</label>
          <textarea
            value={node.body ?? ''}
            onChange={(e) => onChange({ ...node, body: e.target.value })}
          />
        </>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={() => onDelete(node.id)}>
          Delete
        </button>
        {hasLinks && onUnlink && (
          <button className="btn sm" onClick={onUnlink} title="Remove all links to/from this card">
            Unlink
          </button>
        )}
        <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
