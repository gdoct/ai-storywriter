import { useEffect, useRef, useState } from 'react'
import { streamGeneration } from '../api/client'

interface Props {
  boardId: string
  onBack: () => void
}

interface Chapter {
  num: string
  title: string
  content: string
}

export function ReaderPage({ boardId, onBack }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [streaming, setStreaming] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setChapters([])
    setActiveIdx(0)
    setStreaming(true)
    setError(null)

    ;(async () => {
      try {
        for await (const evt of streamGeneration(boardId, ctrl.signal)) {
          if (evt.type === 'chapter_start' && evt.chapter) {
            setChapters((cs) => {
              const next = [...cs, { num: evt.chapter!.num, title: evt.chapter!.title, content: '' }]
              setActiveIdx(next.length - 1)
              return next
            })
          } else if (evt.type === 'token' && evt.content) {
            setChapters((cs) => {
              if (cs.length === 0) return cs
              const copy = [...cs]
              const last = copy[copy.length - 1]
              copy[copy.length - 1] = { ...last, content: last.content + evt.content! }
              return copy
            })
          } else if (evt.type === 'done') {
            setStreaming(false)
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError(String(err))
      } finally {
        setStreaming(false)
      }
    })()

    return () => ctrl.abort()
  }, [boardId])

  const current = chapters[activeIdx]
  const totalChars = chapters.reduce((s, c) => s + c.content.length, 0)
  const wordEstimate = Math.round(totalChars / 5.5)
  const progressPct = Math.min(100, (wordEstimate / 40000) * 100)

  return (
    <div className="screen-page">
      <div className="reader">
        <div className="reader-progress">
          <span>
            CH {chapters.length > 0 ? activeIdx + 1 : 0} / {Math.max(chapters.length, 1)}
          </span>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span>
            {wordEstimate.toLocaleString()} / ~40,000 w
          </span>
          <button className="btn sm ghost" onClick={onBack}>
            ← board
          </button>
        </div>
        <div className="chapter-nav">
          {chapters.map((c, i) => (
            <span
              key={i}
              className={`chap-pill ${i === activeIdx ? 'active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {c.num} · {c.title}
            </span>
          ))}
          {chapters.length === 0 && (
            <span className="chap-pill pending">Waiting for the Writer…</span>
          )}
        </div>
        <div className="reader-body">
          {current && (
            <>
              <span className="chap-num">{current.num}</span>
              <h2>{current.title}</h2>
              {current.content.split(/\n\n+/).map((p, i, arr) => (
                <p key={i}>
                  {p}
                  {streaming && i === arr.length - 1 && activeIdx === chapters.length - 1 && (
                    <span className="cursor" />
                  )}
                </p>
              ))}
            </>
          )}
          {!current && !error && (
            <p style={{ color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: 15 }}>
              The Writer is preparing your story…
            </p>
          )}
          {error && <p style={{ color: 'oklch(0.5 0.16 25)' }}>Error: {error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 32, justifyContent: 'center' }}>
          <button
            className="btn"
            onClick={() => {
              abortRef.current?.abort()
              setStreaming(false)
            }}
            disabled={!streaming}
          >
            ⏸ Pause
          </button>
          <button className="btn">Nudge tone</button>
          <button className="btn">Request revision</button>
          <button className="btn accent">Export ↓</button>
        </div>
      </div>
    </div>
  )
}
