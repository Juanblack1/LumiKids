export type UserRole = 'child' | 'guardian'
export type FavoriteKind = 'story' | 'game' | 'printable'
export type GameEngine = 'tic-tac-toe' | 'memory' | 'sequence' | 'worksheet'

export interface SessionUser {
  id: string
  name: string
  role: UserRole
  ageRange: string
  avatar: string
}

export interface FavoriteRecord {
  itemKind: FavoriteKind
  itemSlug: string
}

export interface ProgressRecord {
  itemKind: 'story' | 'game'
  itemSlug: string
  status: 'started' | 'completed'
  score: number
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
  currentPhase?: string | null
  currentLevel?: number | null
  maxLevel?: number | null
  attemptCount?: number
  successCount?: number
  bestScore?: number
  lastScore?: number
  meta?: Record<string, unknown> | null
}

export interface SessionPayload {
  user: SessionUser | null
  favorites: FavoriteRecord[]
  progress: ProgressRecord[]
  csrfToken?: string
}

export interface ChildActivityPayload {
  child: SessionUser | null
  favorites: FavoriteRecord[]
  progress: ProgressRecord[]
}

export interface CatalogCategory {
  slug: string
  title: string
  description: string
  route: string
  ageRange: string
  itemsCount: number
  printable: boolean
  highlight: string
  tone: 'coral' | 'sky' | 'mint' | 'aqua' | 'sun' | 'slate'
}

export interface Story {
  slug: string
  title: string
  blurb: string
  ageRange: string
  readTime: string
  theme: string
  printable: boolean
  audio: boolean
  coverTone: 'coral' | 'sky' | 'mint' | 'aqua' | 'sun'
  tags: string[]
  lessons: string[]
  paragraphs: string[]
  printPrompt: string
  choices?: {
    prompt: string
    branches: Array<{
      title: string
      result: string
    }>
  }
}

export interface Game {
  slug: string
  title: string
  description: string
  ageRange: string
  difficulty: string
  category: string
  printable: boolean
  engine: GameEngine
  coverTone: 'coral' | 'sky' | 'mint' | 'aqua' | 'sun'
  skills: string[]
  instructions: string[]
  printPrompt: string
  reward: string
}

export interface Printable {
  slug: string
  title: string
  description: string
  category: string
  ageRange: string
  pages: number
  materials: string[]
  instructions: string[]
  tone: 'coral' | 'sky' | 'mint' | 'aqua' | 'sun'
}
