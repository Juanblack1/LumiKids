import type {
  CatalogCategory,
  FavoriteKind,
  Game,
  Printable,
  ProgressRecord,
  SessionPayload,
  Story,
} from '@/types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
let csrfToken: string | undefined

function readCookie(name: string) {
  if (typeof document === 'undefined') return undefined

  const prefix = `${name}=`
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)
}

function rememberCsrfToken(payload: unknown) {
  if (payload && typeof payload === 'object' && 'csrfToken' in payload) {
    const nextToken = (payload as { csrfToken?: unknown }).csrfToken
    if (typeof nextToken === 'string' && nextToken.length > 0) {
      csrfToken = nextToken
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET'
  const requestCsrfToken = method === 'GET' ? undefined : csrfToken ?? readCookie('lumi_csrf')

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(requestCsrfToken ? { 'x-csrf-token': requestCsrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'Nao foi possivel concluir a solicitacao.')
  }

  const payload = (await response.json()) as T
  rememberCsrfToken(payload)
  return payload
}

export function getSession() {
  return request<SessionPayload>('/api/auth/session')
}

export function login(input: { email: string; password: string; role: string }) {
  return request<SessionPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function logout() {
  return request<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
  })
}

export function getCatalog() {
  return request<{ categories: CatalogCategory[] }>('/api/catalog')
}

export function getStories() {
  return request<{ stories: Story[] }>('/api/stories')
}

export function getGames() {
  return request<{ games: Game[] }>('/api/games')
}

export function getPrintables() {
  return request<{ printables: Printable[] }>('/api/printables')
}

export function toggleFavorite(input: { itemKind: FavoriteKind; itemSlug: string }) {
  return request<{ favorites: SessionPayload['favorites'] }>('/api/favorites/toggle', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function saveProgress(input: {
  itemKind: ProgressRecord['itemKind']
  itemSlug: string
  status: ProgressRecord['status']
  score: number
  currentPhase?: string
  currentLevel?: number
  maxLevel?: number
  attemptDelta?: number
  successDelta?: number
  meta?: Record<string, unknown>
}) {
  return request<{ progress: ProgressRecord[] }>('/api/progress', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
