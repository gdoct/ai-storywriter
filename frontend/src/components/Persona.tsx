import { useEffect, useRef, useState } from 'react'
import { streamPersona } from '../api/client'
import type { Board } from '../types/board'

interface Props {
  personaName: string
  boardId: string
  onDismiss: () => void
  onBoardReplaced: (board: Board) => void
}

type Entry =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; output?: string }

const TOOL_LABELS: Record<string, string> = {
  add_character: 'adding character',
  add_setting: 'adding setting',
  add_tone: 'adding tone',
  add_beat: 'adding beat',
  update_node: 'updating card',
  delete_node: 'deleting card',
  add_connection: 'linking cards',
  remove_connection: 'unlinking cards',
}

export function Persona({ personaName, boardId, onDismiss, onBoardReplaced }: Props) {
  const [input, setInput] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setEntries((xs) => [...xs, { kind: 'user', text }, { kind: 'assistant', text: '' }])
    setStreaming(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      for await (const evt of streamPersona(boardId, text, ctrl.signal)) {
        if (evt.type === 'token' && evt.content) {
          setEntries((xs) => {
            const copy = [...xs]
            const last = copy[copy.length - 1]
            if (last && last.kind === 'assistant') {
              copy[copy.length - 1] = { kind: 'assistant', text: last.text + evt.content }
            } else {
              copy.push({ kind: 'assistant', text: evt.content ?? '' })
            }
            return copy
          })
        } else if (evt.type === 'tool_start' && evt.name) {
          setEntries((xs) => {
            const copy = [...xs]
            const last = copy[copy.length - 1]
            if (last && last.kind === 'assistant' && last.text === '') copy.pop()
            return [...copy, { kind: 'tool', name: evt.name! }, { kind: 'assistant', text: '' }]
          })
        } else if (evt.type === 'tool_end' && evt.name) {
          setEntries((xs) => {
            const copy = [...xs]
            for (let i = copy.length - 1; i >= 0; i--) {
              const e = copy[i]
              if (e.kind === 'tool' && e.name === evt.name && !e.output) {
                copy[i] = { ...e, output: evt.output }
                break
              }
            }
            return copy
          })
        } else if (evt.type === 'board_updated' && evt.board) {
          onBoardReplaced(evt.board)
        }
      }
    } catch (err) {
      setEntries((xs) => [...xs, { kind: 'assistant', text: `(error: ${String(err)})` }])
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }

  return (
    <div className="persona">
      <div className="persona-head">
        <div className="persona-avatar">{personaName[0]}</div>
        <div style={{ flex: 1 }}>
          <div className="persona-name">{personaName}</div>
          <div className="persona-role">your story companion</div>
        </div>
        <button className="btn icon ghost" onClick={onDismiss} title="Dismiss">
          ✕
        </button>
      </div>

      <div
        ref={bodyRef}
        className="persona-body"
        style={{ maxHeight: 220, overflowY: 'auto', minHeight: 56 }}
      >
        {entries.length === 0 ? (
          <div style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            Ask me to riff on your story, or tell me to add, rename, or link cards.
          </div>
        ) : (
          entries.map((e, i) => {
            if (e.kind === 'tool') {
              const label = TOOL_LABELS[e.name] ?? e.name
              return (
                <div
                  key={i}
                  style={{
                    margin: '6px 0',
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--ink-soft)',
                    letterSpacing: '0.04em',
                  }}
                >
                  · {label}{e.output ? ` — done` : '…'}
                </div>
              )
            }
            const mine = e.kind === 'user'
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong style={{ color: mine ? 'var(--ink-2)' : 'var(--accent-deep)' }}>
                  {mine ? 'You' : personaName}:
                </strong>{' '}
                {e.text || (streaming && i === entries.length - 1 ? '…' : '')}
              </div>
            )
          })
        )}
      </div>

      <form
        className="persona-actions"
        style={{ marginTop: 8 }}
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${personaName}…`}
          disabled={streaming}
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid var(--line)',
            borderRadius: 6,
            background: 'var(--paper)',
            font: 'inherit',
          }}
        />
        <button className="btn sm accent" type="submit" disabled={streaming || !input.trim()}>
          {streaming ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
