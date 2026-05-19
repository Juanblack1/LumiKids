import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

const sessionAnonymous = { user: null, favorites: [], progress: [] }
const sessionLogged = {
  user: { id: 'u1', name: 'Luna', role: 'child', ageRange: '5-7 anos', avatar: '🦊' },
  favorites: [],
  progress: [],
}
const guardianSession = {
  user: { id: 'g1', name: 'Familia Sol', role: 'guardian', ageRange: 'responsavel', avatar: '🌟' },
  favorites: [],
  progress: [],
}

const categories = [
  { slug: 'jogos', title: 'Jogos', description: 'Jogos divertidos.', route: '/games', ageRange: '4-9 anos', itemsCount: 3, printable: true, highlight: 'online', tone: 'coral' },
]

const games = [
  { slug: 'memoria-dos-animais', title: 'Memoria dos animais', description: 'Ache os pares.', ageRange: '4-8 anos', difficulty: 'Facil', category: 'Jogos', printable: true, engine: 'memory', coverTone: 'sky', skills: ['memoria'], instructions: ['vire'], printPrompt: 'imprima', reward: 'Muito bem' },
]

const stories = [
  { slug: 'o-jardim-da-lua', title: 'O jardim da Lua', blurb: 'Uma historia.', ageRange: '4-7 anos', readTime: '6 min', theme: 'natureza', printable: true, audio: true, coverTone: 'sun', tags: ['natureza'], lessons: ['converse'], paragraphs: ['Era uma vez.'], printPrompt: 'imprima' },
]

const printables = [
  { slug: 'folhas-colorir-animais', title: 'Folhas para colorir', description: 'Pinte os animais.', category: 'Colorir', ageRange: '3-7 anos', pages: 2, materials: ['giz'], instructions: ['pinte'], tone: 'sun' },
]

describe('App integration', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/login')
    document.cookie = 'lumi_csrf=test-csrf-token'

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method?.toUpperCase() ?? 'GET'

      if (url.endsWith('/api/auth/session')) {
        return new Response(JSON.stringify(sessionAnonymous), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/catalog')) {
        return new Response(JSON.stringify({ categories }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/stories')) {
        return new Response(JSON.stringify({ stories }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/games')) {
        return new Response(JSON.stringify({ games }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/printables')) {
        return new Response(JSON.stringify({ printables }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/auth/login') && method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as { role?: string }
        return new Response(JSON.stringify(body.role === 'guardian' ? guardianSession : sessionLogged), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/guardian/child-activity')) {
        return new Response(
          JSON.stringify({
            child: sessionLogged.user,
            favorites: [{ itemKind: 'story', itemSlug: 'o-jardim-da-lua' }],
            progress: [{ itemKind: 'game', itemSlug: 'memoria-dos-animais', status: 'completed', score: 94, bestScore: 94, updatedAt: new Date().toISOString(), attemptCount: 2 }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/api/auth/logout') && method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/progress') && method === 'POST') {
        return new Response(JSON.stringify({ progress: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (url.endsWith('/api/favorites/toggle') && method === 'POST') {
        return new Response(JSON.stringify({ favorites: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ error: 'Unhandled mock' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    })

    vi.stubGlobal('fetch', fetchMock)
  })

  it('logs in and navigates from login to catalog and games', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: /Escolha um mundo para brincar agora/i })).toBeInTheDocument()

    await user.click(screen.getAllByRole('link', { name: /Jogos/i })[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Mini games educativos com instrucoes simples/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Memoria dos animais/i)).toBeInTheDocument()
  })

  it('shows a guardian dashboard with child activity', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: /Responsavel/i }))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: /Atividade da Luna/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Memoria dos animais/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/O jardim da Lua/i).length).toBeGreaterThan(0)
  })
})
