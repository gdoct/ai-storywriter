import type { Board, BoardSummary, Scenario } from '../types/board'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:8000'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

export async function listBoards(): Promise<BoardSummary[]> {
  return json(await fetch(`${API_BASE}/boards`))
}

export async function getBoard(id: string): Promise<Board> {
  return json(await fetch(`${API_BASE}/boards/${id}`))
}

export async function saveBoard(board: Board): Promise<Board> {
  return json(
    await fetch(`${API_BASE}/boards/${board.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(board),
    }),
  )
}

export async function createBoard(title: string): Promise<Board> {
  return json(
    await fetch(`${API_BASE}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  )
}

export async function getScenario(id: string): Promise<Scenario> {
  return json(await fetch(`${API_BASE}/boards/${id}/scenario`))
}

export interface StreamEvent {
  type: 'token' | 'tool_start' | 'tool_end' | 'chapter_start' | 'chapter_end' | 'board_updated' | 'done'
  content?: string
  name?: string
  input?: unknown
  output?: string
  chapter?: { num: string; title: string }
  board?: Board
}

export async function* streamGeneration(boardId: string, signal?: AbortSignal): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/boards/${boardId}/generate`, {
    method: 'POST',
    signal,
  })
  if (!res.body) throw new Error('No stream body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.replace(/^data: /, '').trim()
      if (!line) continue
      try {
        yield JSON.parse(line) as StreamEvent
      } catch {
        // ignore
      }
    }
  }
}

export async function* streamPersona(
  boardId: string,
  message: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/boards/${boardId}/persona`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  })
  if (!res.body) throw new Error('No stream body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.replace(/^data: /, '').trim()
      if (!line) continue
      try {
        yield JSON.parse(line) as StreamEvent
      } catch {
        // ignore
      }
    }
  }
}
