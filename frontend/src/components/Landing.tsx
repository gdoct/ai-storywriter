import type { BoardSummary } from '../types/board'

interface Props {
  boards: BoardSummary[]
  onStart: () => Promise<void> | void
  onOpen: (id: string) => void
}

export function Landing({ boards, onStart, onOpen }: Props) {
  return (
    <div className="screen-page">
      <div className="landing">
        <div className="hero">
          <div>
            <div className="eyebrow">STORYWRITER · CANVAS</div>
            <h1>
              Begin with a <em>board,</em> not a blank page.
            </h1>
            <p className="sub">
              Stick characters, worlds, and plot beats anywhere. Connect what matters. When it
              feels right, the Writer turns your board into a long story — chapter by chapter, in
              your voice.
            </p>
            <div className="hero-actions">
              <button className="btn accent" onClick={() => void onStart()}>
                Start a new board →
              </button>
              {boards[0] && (
                <button className="btn" onClick={() => onOpen(boards[0].id)}>
                  Open {boards[0].title}
                </button>
              )}
            </div>
          </div>
          <div className="demo">
            <div
              className="mini-node"
              style={{
                left: 28,
                top: 30,
                width: 110,
                background: 'var(--note-rose)',
                color: 'var(--note-rose-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>CHARACTER</div>
              <div className="t">Wren</div>
            </div>
            <div
              className="mini-node"
              style={{
                left: 170,
                top: 50,
                width: 130,
                background: 'var(--note-ocean)',
                color: 'var(--note-ocean-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>WORLD</div>
              <div className="t">1953 cliffs</div>
            </div>
            <div
              className="mini-node"
              style={{
                right: 24,
                top: 36,
                width: 110,
                background: 'var(--note-rose)',
                color: 'var(--note-rose-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>CHARACTER</div>
              <div className="t">Isaac</div>
            </div>
            <div
              className="mini-node"
              style={{
                left: '50%',
                top: '46%',
                transform: 'translate(-50%, 0)',
                width: 150,
                background: 'var(--note-butter)',
                color: 'var(--note-butter-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>TONE</div>
              <div className="t">gothic, patient</div>
            </div>
            <div
              className="mini-node"
              style={{
                left: 28,
                bottom: 30,
                width: 100,
                background: 'var(--note-lavender)',
                color: 'var(--note-lavender-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>BEAT 1</div>
              <div className="t">The storm</div>
            </div>
            <div
              className="mini-node"
              style={{
                left: '40%',
                bottom: 46,
                width: 100,
                background: 'var(--note-lavender)',
                color: 'var(--note-lavender-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>BEAT 2</div>
              <div className="t">Isaac arrives</div>
            </div>
            <div
              className="mini-node"
              style={{
                right: 28,
                bottom: 34,
                width: 100,
                background: 'var(--note-lavender)',
                color: 'var(--note-lavender-ink)',
              }}
            >
              <div style={{ fontSize: 9, letterSpacing: '0.12em', opacity: 0.6 }}>BEAT 3</div>
              <div className="t">The choice</div>
            </div>
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <path d="M 140 60 Q 160 70 170 70" stroke="var(--ink-soft)" strokeWidth="1.3" fill="none" opacity="0.5" />
              <path d="M 300 70 Q 340 60 360 60" stroke="var(--ink-soft)" strokeWidth="1.3" fill="none" opacity="0.5" />
            </svg>
          </div>
        </div>

        <div className="lib-head">
          <h3>Your boards</h3>
          <button className="btn ghost sm">view all →</button>
        </div>
        <div className="library-row">
          {boards.map((b, i) => (
            <div key={b.id} className="lib-card" onClick={() => onOpen(b.id)}>
              <div
                className="cover"
                style={{
                  background:
                    i % 3 === 0
                      ? 'linear-gradient(135deg, var(--note-rose), var(--note-ocean))'
                      : i % 3 === 1
                      ? 'linear-gradient(135deg, var(--note-sage), var(--note-butter))'
                      : undefined,
                }}
              />
              <h4>{b.title}</h4>
              <div className="meta">
                {b.nodeCount} cards · {b.connectionCount} links
              </div>
            </div>
          ))}
          <div className="lib-card new" onClick={() => void onStart()}>
            + New board
          </div>
        </div>
      </div>
    </div>
  )
}
