export type NodeKind = 'character' | 'world' | 'tone' | 'beat'

export interface BaseNode {
  id: string
  kind: NodeKind
  x: number
  y: number
}

export interface CharacterNode extends BaseNode {
  kind: 'character'
  name: string
  role?: string
  age?: number | string
  body?: string
  tags?: string[]
}

export interface WorldNode extends BaseNode {
  kind: 'world'
  title: string
  body?: string
}

export interface ToneNode extends BaseNode {
  kind: 'tone'
  title: string
  body?: string
}

export interface BeatNode extends BaseNode {
  kind: 'beat'
  title: string
  body?: string
}

export type BoardNode = CharacterNode | WorldNode | ToneNode | BeatNode

export interface Connection {
  from: string
  to: string
  label?: string
}

export interface Board {
  id: string
  title: string
  personaName: string
  palette: PaletteName
  nodes: BoardNode[]
  connections: Connection[]
  updatedAt?: string
}

export interface BoardSummary {
  id: string
  title: string
  personaName: string
  palette: PaletteName
  nodeCount: number
  connectionCount: number
  updatedAt?: string
}

export type PaletteName = 'warm' | 'cool' | 'rose' | 'ink'

export interface Scenario {
  title: string
  pov: string
  length_target: number
  logline: string
  characters: Array<Record<string, unknown>>
  world: {
    setting: string
    rules: string[]
    tone: string
  }
  plot: {
    structure: string
    beats: Array<{ title: string; description?: string }>
  }
  connections: Array<[string, string, string]>
  ready: boolean
}
