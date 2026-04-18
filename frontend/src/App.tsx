import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasBoard } from './components/CanvasBoard'
import { Landing } from './components/Landing'
import { ReaderPage } from './components/ReaderPage'
import { ScenarioPage } from './components/ScenarioPage'
import { applyPalette } from './data/palettes'
import { createBoard, getBoard, listBoards, saveBoard } from './api/client'
import type { Board, BoardSummary, PaletteName } from './types/board'

type Screen = 'landing' | 'board' | 'scenario' | 'reader'
type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 500

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [boards, setBoards] = useState<BoardSummary[]>([])
  const [board, setBoard] = useState<Board | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)
  const lastSavedJson = useRef<string>('')
  const pendingBoard = useRef<Board | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)

  useEffect(() => {
    listBoards()
      .then(setBoards)
      .catch((e) => setLoadError(String(e)))
  }, [])

  useEffect(() => {
    applyPalette(board?.palette ?? 'warm')
  }, [board?.palette])

  const doSave = useCallback(async () => {
    const b = pendingBoard.current
    if (!b) return
    const json = JSON.stringify(b)
    if (json === lastSavedJson.current) return
    pendingBoard.current = null
    setSaveState('saving')
    try {
      await saveBoard(b)
      lastSavedJson.current = json
      setSaveError(null)
      setSaveState(pendingBoard.current ? 'pending' : 'saved')
    } catch (e) {
      setSaveError(String(e))
      setSaveState('error')
      pendingBoard.current = b
      throw e
    }
  }, [])

  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    if (inFlight.current) {
      try {
        await inFlight.current
      } catch {
        // swallow; state already reflects error
      }
    }
    if (pendingBoard.current) {
      const p = doSave()
      inFlight.current = p.catch(() => {}).finally(() => {
        inFlight.current = null
      })
      try {
        await p
      } catch {
        // already in error state
      }
    }
  }, [doSave])

  useEffect(() => {
    if (!board) return
    const json = JSON.stringify(board)
    if (json === lastSavedJson.current) {
      pendingBoard.current = null
      return
    }
    pendingBoard.current = board
    setSaveState('pending')
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null
      const p = doSave()
      inFlight.current = p.catch(() => {}).finally(() => {
        inFlight.current = null
      })
    }, SAVE_DEBOUNCE_MS)
  }, [board, doSave])

  const goToScreen = useCallback(
    async (next: Screen) => {
      if (board && next !== 'board' && screen === 'board') {
        await flushSave()
      }
      setScreen(next)
    },
    [board, screen, flushSave],
  )

  const replaceBoard = useCallback((b: Board) => {
    lastSavedJson.current = JSON.stringify(b)
    pendingBoard.current = null
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setSaveState('saved')
    setBoard(b)
  }, [])

  const openBoard = useCallback(async (id: string) => {
    try {
      const b = await getBoard(id)
      lastSavedJson.current = JSON.stringify(b)
      pendingBoard.current = null
      setSaveState('saved')
      setBoard(b)
      setScreen('board')
    } catch (e) {
      setLoadError(String(e))
    }
  }, [])

  const startBoard = useCallback(async () => {
    try {
      const b = await createBoard('Untitled board')
      lastSavedJson.current = JSON.stringify(b)
      pendingBoard.current = null
      setSaveState('saved')
      setBoard(b)
      setBoards((bs) => [
        ...bs,
        {
          id: b.id,
          title: b.title,
          personaName: b.personaName,
          palette: b.palette,
          nodeCount: b.nodes.length,
          connectionCount: b.connections.length,
        },
      ])
      setScreen('board')
    } catch (e) {
      setLoadError(String(e))
    }
  }, [])

  const setPalette = (palette: PaletteName) => {
    if (!board) {
      applyPalette(palette)
      return
    }
    setBoard({ ...board, palette })
  }

  const statusPill = (() => {
    if (screen === 'landing') return { label: 'Home', ready: false }
    if (screen === 'board') return { label: 'Editing board', ready: false }
    if (screen === 'scenario') return { label: 'Scenario ready', ready: true }
    return { label: 'Drafting', ready: true }
  })()

  return (
    <div className="app">
      <div className="app-header">
        <div className="logo">StoryWriter</div>
        <div className="breadcrumb">
          <span className="sep">/</span>
          <span>My boards</span>
          {board && (
            <>
              <span className="sep">/</span>
              <EditableTitle
                value={board.title}
                onChange={(title) => setBoard({ ...board, title })}
              />
            </>
          )}
        </div>
        <div className="header-actions">
          <SaveIndicator state={saveState} error={saveError} />
          <span className={`pill ${statusPill.ready ? 'ready' : ''}`}>
            <span className="dot" />
            {statusPill.label}
          </span>
          <PaletteSwatches value={board?.palette ?? 'warm'} onChange={setPalette} />
          <button className="btn ghost sm">Share</button>
          {screen === 'board' && board && (
            <button className="btn accent" onClick={() => void goToScreen('scenario')}>
              Scenario →
            </button>
          )}
          {screen === 'scenario' && board && (
            <button className="btn accent" onClick={() => void goToScreen('reader')}>
              Generate →
            </button>
          )}
        </div>
      </div>

      <div className="rail">
        <RailButton
          icon="⌂"
          label="Home"
          active={screen === 'landing'}
          onClick={() => void goToScreen('landing')}
        />
        <RailButton
          icon="◫"
          label="Board"
          active={screen === 'board'}
          disabled={!board}
          onClick={() => board && void goToScreen('board')}
        />
        <RailButton
          icon="❴❵"
          label="Scenario"
          active={screen === 'scenario'}
          disabled={!board}
          onClick={() => board && void goToScreen('scenario')}
        />
        <RailButton
          icon={
            <span style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 20 }}>
              A
            </span>
          }
          label="Story"
          active={screen === 'reader'}
          disabled={!board}
          onClick={() => board && void goToScreen('reader')}
        />
        <div className="rail-divider" />
        <RailButton
          icon="☰"
          label="Library"
          active={false}
          onClick={() => void goToScreen('landing')}
        />
      </div>

      <div className="stage">
        {loadError && (
          <div style={{ padding: 24, color: 'oklch(0.5 0.16 25)' }}>
            Backend error: {loadError}. Is the backend running on port 8000?
          </div>
        )}
        {screen === 'landing' && (
          <Landing boards={boards} onStart={startBoard} onOpen={openBoard} />
        )}
        {screen === 'board' && board && (
          <CanvasBoard board={board} onBoardChange={setBoard} onBoardReplaced={replaceBoard} />
        )}
        {screen === 'scenario' && board && (
          <ScenarioPage
            boardId={board.id}
            onBack={() => void goToScreen('board')}
            onGenerate={() => void goToScreen('reader')}
          />
        )}
        {screen === 'reader' && board && (
          <ReaderPage boardId={board.id} onBack={() => void goToScreen('board')} />
        )}
      </div>
    </div>
  )
}

function SaveIndicator({ state, error }: { state: SaveState; error: string | null }) {
  if (state === 'idle') return null
  const label =
    state === 'pending' ? 'unsaved…' :
    state === 'saving' ? 'saving…' :
    state === 'saved' ? 'saved' :
    `save failed: ${error ?? ''}`
  const color =
    state === 'error' ? 'oklch(0.5 0.16 25)' :
    state === 'saved' ? 'var(--ink-soft)' :
    'var(--ink-2)'
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color,
        opacity: state === 'saved' ? 0.6 : 1,
      }}
      title={error ?? undefined}
    >
      {label}
    </span>
  )
}

function EditableTitle({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onChange(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="active breadcrumb-edit"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }
  return (
    <span
      className="active breadcrumb-editable"
      onClick={() => setEditing(true)}
      title="Rename board"
    >
      {value}
    </span>
  )
}

function RailButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`rail-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
      title={label}
    >
      <span>{icon}</span>
      <span className="rail-tooltip">{label}</span>
    </button>
  )
}

function PaletteSwatches({
  value,
  onChange,
}: {
  value: PaletteName
  onChange: (p: PaletteName) => void
}) {
  const all: PaletteName[] = ['warm', 'cool', 'rose', 'ink']
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {all.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          title={p}
          aria-label={`palette ${p}`}
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: value === p ? '2px solid var(--ink)' : '1px solid var(--line)',
            background:
              p === 'warm'
                ? 'oklch(0.72 0.14 65)'
                : p === 'cool'
                ? 'oklch(0.62 0.11 190)'
                : p === 'rose'
                ? 'oklch(0.65 0.15 15)'
                : 'oklch(0.5 0.14 270)',
            cursor: 'pointer',
            padding: 0,
          }}
        />
      ))}
    </div>
  )
}
