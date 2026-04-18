import { useEffect, useState, type ReactNode } from 'react'
import { getScenario } from '../api/client'
import type { Scenario } from '../types/board'

interface Props {
  boardId: string
  onBack: () => void
  onGenerate: () => void
}

function renderJson(v: unknown, indent = 0): ReactNode {
  const pad = '  '.repeat(indent)
  if (v === null) return <span className="b">null</span>
  if (typeof v === 'string') return <span className="s">"{v}"</span>
  if (typeof v === 'number') return <span className="n">{v}</span>
  if (typeof v === 'boolean') return <span className="b">{String(v)}</span>
  if (Array.isArray(v)) {
    if (v.length === 0) return <>[]</>
    return (
      <>
        {'[\n'}
        {v.map((x, i) => (
          <span key={i}>
            {pad}  {renderJson(x, indent + 1)}
            {i < v.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}
        {']'}
      </>
    )
  }
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>)
    if (entries.length === 0) return <>{'{}'}</>
    return (
      <>
        {'{\n'}
        {entries.map(([k, val], i) => (
          <span key={k}>
            {pad}  <span className="k">"{k}"</span>: {renderJson(val, indent + 1)}
            {i < entries.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {pad}
        {'}'}
      </>
    )
  }
  return String(v)
}

export function ScenarioPage({ boardId, onBack, onGenerate }: Props) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(null)
    getScenario(boardId)
      .then((s) => {
        if (!cancelled) setScenario(s)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
    return () => {
      cancelled = true
    }
  }, [boardId])

  async function copy() {
    if (!scenario) return
    try {
      await navigator.clipboard?.writeText(JSON.stringify(scenario, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div className="screen-page">
      <div className="container">
        <div className="eyebrow">AUTO-ASSEMBLED FROM YOUR BOARD</div>
        <h1>Scenario</h1>
        <p className="lede">
          This is what the Writer will read. Every field comes from a card on your board — edit the
          board, and this updates.
        </p>

        {error && <div style={{ color: 'oklch(0.5 0.16 25)' }}>Failed to load: {error}</div>}
        {!scenario && !error && <div style={{ color: 'var(--ink-soft)' }}>Assembling…</div>}

        {scenario && (
          <div className="scenario-grid">
            <div className="spec-card">
              <header>
                <span className="t">scenario.json</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm ghost" onClick={() => void copy()}>
                    {copied ? '✓ copied' : 'copy'}
                  </button>
                  <button className="btn sm ghost">download</button>
                </div>
              </header>
              <pre className="json-pretty">
                <code>{renderJson(scenario)}</code>
              </pre>
            </div>

            <div>
              <div className="scenario-sidecard">
                <h3>{scenario.title}</h3>
                <div className="logline">"{scenario.logline}"</div>
                <div className="stat-row">
                  <span className="k">POV</span>
                  <span className="v">{scenario.pov}</span>
                </div>
                <div className="stat-row">
                  <span className="k">Characters</span>
                  <span className="v">{scenario.characters.length}</span>
                </div>
                <div className="stat-row">
                  <span className="k">Plot beats</span>
                  <span className="v">{scenario.plot.beats.length}</span>
                </div>
                <div className="stat-row">
                  <span className="k">Target length</span>
                  <span className="v">{scenario.length_target.toLocaleString()} w</span>
                </div>
                <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className="btn accent"
                    onClick={onGenerate}
                    disabled={scenario.characters.length === 0}
                    title={
                      scenario.characters.length === 0
                        ? 'Add at least one character first'
                        : scenario.ready
                        ? ''
                        : 'The Writer will do its best with what you have'
                    }
                  >
                    Hand to the Writer →
                  </button>
                  <button className="btn" onClick={onBack}>
                    Back to the board
                  </button>
                </div>
              </div>

              <div className="scenario-sidecard" style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    color: 'var(--ink-soft)',
                    marginBottom: 6,
                  }}
                >
                  VALIDATION
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <ValidationRow
                    ok={scenario.characters.length > 0}
                    label={`${scenario.characters.length} character${scenario.characters.length === 1 ? '' : 's'}`}
                  />
                  <ValidationRow
                    ok={scenario.characters.some(
                      (c) => String((c as { role?: string }).role ?? '').toLowerCase().includes('protagonist'),
                    )}
                    label="A character is marked as protagonist"
                  />
                  <ValidationRow
                    ok={!!scenario.world.setting}
                    label="World has a setting"
                  />
                  <ValidationRow
                    ok={scenario.plot.beats.length >= 3}
                    label={`${scenario.plot.beats.length} plot beat${scenario.plot.beats.length === 1 ? '' : 's'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ValidationRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ color: ok ? 'oklch(0.5 0.16 145)' : 'var(--ink-soft)' }}>
      {ok ? '✓' : '○'} {label}
    </div>
  )
}
