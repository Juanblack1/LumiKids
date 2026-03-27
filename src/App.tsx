import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BookHeart,
  BookOpen,
  Brain,
  Heart,
  Home,
  LogOut,
  Palette,
  Printer,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { Toaster, toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MemoryGame, SequenceGame, TicTacToeGame, WorksheetGame } from '@/components/mini-games'
import {
  getCatalog,
  getGames,
  getPrintables,
  getSession,
  getStories,
  login,
  logout,
  saveProgress,
  toggleFavorite,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import type {
  CatalogCategory,
  FavoriteKind,
  Game,
  Printable,
  ProgressRecord,
  SessionPayload,
  Story,
} from '@/types'

type AppContextValue = {
  loading: boolean
  session: SessionPayload
  categories: CatalogCategory[]
  stories: Story[]
  games: Game[]
  printables: Printable[]
  loginAction: (input: { email: string; password: string; role: string }) => Promise<boolean>
  logoutAction: () => Promise<void>
  favoriteSet: Set<string>
  progressMap: Map<string, ProgressRecord>
  toggleFavoriteAction: (itemKind: FavoriteKind, itemSlug: string) => Promise<void>
  recordProgressAction: (input: {
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
  }) => Promise<void>
}

const AppDataContext = createContext<AppContextValue | null>(null)

const emptySession: SessionPayload = {
  user: null,
  favorites: [],
  progress: [],
}

const toneMap: Record<CatalogCategory['tone'] | Story['coverTone'] | Printable['tone'], string> = {
  aqua: 'from-aqua/30 to-white',
  coral: 'from-coral/20 to-white',
  mint: 'from-mint to-white',
  sky: 'from-sky/20 to-white',
  slate: 'from-slate-100 to-white',
  sun: 'from-sun/30 to-white',
}

const brandLogo = '/ai-assets/logo-alt.png'

const categoryArtMap: Record<string, string> = {
  jogos: '/ai-assets/game-tictactoe.png',
  historias: '/ai-assets/story-library.png',
  'desenhos-para-colorir': '/ai-assets/printable-worksheet.png',
  abcdario: '/ai-assets/category-alphabet.png',
  'numeros-e-continhas': '/ai-assets/category-numbers.png',
  memoria: '/ai-assets/game-memory.png',
  'atividades-escolares': '/ai-assets/printable-worksheet.png',
  'musica-e-rimas': '/ai-assets/story-library.png',
  'formas-e-cores': '/ai-assets/game-sequence.png',
}

const storyArtMap: Record<string, string> = {
  'o-jardim-da-lua': '/ai-assets/story-garden.png',
  'a-mochila-das-emocoes': '/ai-assets/story-backpack.png',
  'os-amigos-da-floresta-azul': '/ai-assets/story-forest.png',
  'noite-de-estrelas-musicais': '/ai-assets/story-musical-night.png',
  'o-mapa-do-tesouro-da-biblioteca': '/ai-assets/story-library-treasure.png',
  'a-girafa-que-contava-pontos': '/ai-assets/story-giraffe-counting.png',
}

const gameArtMap: Record<string, string> = {
  'jogo-da-velha-colorido': '/ai-assets/game-tictactoe.png',
  'memoria-dos-animais': '/ai-assets/game-memory.png',
  'sequencia-das-cores': '/ai-assets/game-sequence.png',
  'caca-palavras-da-fazenda': '/ai-assets/printable-worksheet.png',
  'labirinto-do-foguete': '/ai-assets/game-maze.png',
  'ligue-os-pontos-do-dragao': '/ai-assets/printable-worksheet.png',
}

const printableArtMap: Record<string, string> = {
  'folhas-colorir-animais': '/ai-assets/printable-coloring-animals.png',
  'tracejado-letras-iniciais': '/ai-assets/printable-tracing-letters.png',
  'cruzadinha-das-frutas': '/ai-assets/printable-fruit-crossword.png',
  'labirintos-de-ferias': '/ai-assets/game-maze.png',
  'numeros-ilustrados': '/ai-assets/category-numbers.png',
  'ligue-colunas-escola': '/ai-assets/printable-school-match.png',
  'cartoes-memoria-caseira': '/ai-assets/game-memory.png',
  'rimas-para-cantar': '/ai-assets/story-musical-night.png',
}

const iconMap = {
  'abcdario': Sparkles,
  'atividades-escolares': Printer,
  'desenhos-para-colorir': Palette,
  'formas-e-cores': Sparkles,
  'historias': BookOpen,
  'jogos': Rocket,
  'memoria': Brain,
  'musica-e-rimas': Star,
  'numeros-e-continhas': Trophy,
  'printables': Printer,
} as const

function getProgressLabel(progress: ProgressRecord | undefined, fallback: string) {
  if (!progress) return fallback
  if (progress.status === 'completed') return 'concluido'
  if (progress.currentLevel && progress.maxLevel) return `nivel ${progress.currentLevel}/${progress.maxLevel}`
  if (progress.attemptCount) return `${progress.attemptCount} tentativa(s)`
  return fallback
}

function getProgressDetail(progress: ProgressRecord | undefined, fallback: string) {
  if (!progress) return fallback
  if (progress.status === 'completed' && progress.bestScore) return `melhor score ${progress.bestScore}`
  if (progress.currentPhase) return progress.currentPhase.replace(/-/g, ' ')
  if (progress.attemptCount) return `${progress.attemptCount} tentativa(s)`
  return fallback
}

function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppData must be used within AppProvider')
  }

  return context
}

function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionPayload>(emptySession)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [printables, setPrintables] = useState<Printable[]>([])

  const load = async () => {
    setLoading(true)

    try {
      const [sessionPayload, categoryPayload, storyPayload, gamePayload, printablePayload] = await Promise.all([
        getSession(),
        getCatalog(),
        getStories(),
        getGames(),
        getPrintables(),
      ])

      setSession(sessionPayload)
      setCategories(categoryPayload.categories)
      setStories(storyPayload.stories)
      setGames(gamePayload.games)
      setPrintables(printablePayload.printables)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao carregar a plataforma.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const favoriteSet = useMemo(
    () => new Set(session.favorites.map((favorite) => `${favorite.itemKind}:${favorite.itemSlug}`)),
    [session.favorites],
  )

  const progressMap = useMemo(
    () => new Map(session.progress.map((progress) => [`${progress.itemKind}:${progress.itemSlug}`, progress])),
    [session.progress],
  )

  const loginAction = async (input: { email: string; password: string; role: string }) => {
    try {
      const nextSession = await login(input)
      setSession(nextSession)
      toast.success(`Ola, ${nextSession.user?.name ?? 'visitante'}!`) 
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel entrar.')
      return false
    }
  }

  const logoutAction = async () => {
    await logout()
    setSession(emptySession)
    toast.success('Sessao encerrada com seguranca.')
  }

  const toggleFavoriteAction = async (itemKind: FavoriteKind, itemSlug: string) => {
    if (!session.user) {
      toast.message('Entre com um perfil para salvar favoritos.')
      return
    }

    try {
      const payload = await toggleFavorite({ itemKind, itemSlug })
      setSession((current) => ({ ...current, favorites: payload.favorites }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel atualizar favoritos.')
    }
  }

  const recordProgressAction = useCallback(async (input: {
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
  }) => {
    if (!session.user) return

    try {
      const payload = await saveProgress(input)
      setSession((current) => ({ ...current, progress: payload.progress }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel salvar o progresso.')
    }
  }, [session.user])

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      session,
      categories,
      stories,
      games,
      printables,
      loginAction,
      logoutAction,
      favoriteSet,
      progressMap,
      toggleFavoriteAction,
      recordProgressAction,
    }),
    [categories, favoriteSet, games, loading, printables, progressMap, session, stories],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

function AppShell({ children }: { children: ReactNode }) {
  const { session, logoutAction } = useAppData()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/catalog', label: 'Catalogo', icon: Search },
    { href: '/games', label: 'Jogos', icon: Rocket },
    { href: '/stories', label: 'Historias', icon: BookOpen },
    { href: '/printables', label: 'Imprimir', icon: Printer },
  ]

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={brandLogo} alt="Logo LumiKids" className="h-12 w-12 rounded-[18px] object-cover shadow-sm" />
            <div>
              <p className="font-display text-2xl font-extrabold text-coral">LumiKids</p>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-ink">brincar, ler e imprimir</p>
            </div>
          </Link>

          <nav className="grid w-full grid-cols-2 gap-2 rounded-[30px] border border-white/80 bg-white/90 px-2 py-2 shadow-sm sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:rounded-full">
            {navItems.map(({ href, label, icon: Icon }, index) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  cn(
                    'inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition sm:w-auto',
                    index === navItems.length - 1 && 'col-span-2 sm:col-auto',
                    isActive
                      ? 'bg-ink text-white shadow-[0_10px_25px_rgba(25,50,60,0.18)]'
                      : 'text-ink hover:bg-sand',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session.user ? (
              <div className="flex items-center gap-3 rounded-full border border-white/80 bg-white/95 px-4 py-2 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-lg">{session.user.avatar}</span>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-extrabold text-ink">{session.user.name}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-ink">{session.user.role === 'child' ? 'perfil infantil' : 'responsavel'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => void logoutAction()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : location.pathname === '/login' ? null : (
              <Button variant="secondary" asChild>
                <Link to="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="no-print mt-16 border-t border-white/60 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr,1fr] lg:px-8">
          <div className="space-y-3">
            <p className="font-display text-3xl font-extrabold text-ink">Educacao, diversao e seguranca em uma mesma jornada.</p>
            <p className="max-w-2xl text-base leading-7 text-muted-ink">
              LumiKids combina jogos online, historias infantis, atividades escolares e materiais imprimiveis pensados para casa,
              escola e momentos em familia.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FooterCard title="Para criancas" description="Botoes grandes, feedback positivo e caminhos simples para explorar com autonomia." />
            <FooterCard title="Para adultos" description="Progresso, favoritos, filtros por idade e modo imprimivel em A4." />
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm">
      <p className="font-display text-xl font-extrabold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-ink">{description}</p>
    </div>
  )
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-aqua">{eyebrow}</p>
      <h2 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">{title}</h2>
      <p className="text-base leading-7 text-muted-ink sm:text-lg">{body}</p>
    </div>
  )
}

function FavoriteButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-2 transition',
        active ? 'border-coral bg-coral text-white' : 'border-soft-border bg-white text-muted-ink hover:border-coral hover:text-coral',
      )}
      aria-label={active ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
    >
      <Heart className={cn('h-4 w-4', active && 'fill-current')} />
    </button>
  )
}

function CategoryCard({ category }: { category: CatalogCategory }) {
  const Icon = iconMap[category.slug as keyof typeof iconMap] ?? Sparkles
  const image = categoryArtMap[category.slug] ?? '/ai-assets/hero-main.png'

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link to={category.route}>
        <Card className={cn('h-full bg-gradient-to-br', toneMap[category.tone])}>
          <CardHeader className="gap-4">
            <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70">
              <img src={image} alt={`Ilustracao da categoria ${category.title}`} className="h-40 w-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/80 text-ink shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <Badge className="border-white/70 bg-white/70 text-[10px] text-muted-ink">{category.ageRange}</Badge>
            </div>
            <div>
              <CardTitle className="text-[1.6rem] leading-tight">{category.title}</CardTitle>
              <CardDescription className="mt-2 text-sm">{category.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm font-bold text-muted-ink">
            <span>{category.itemsCount} experiencias</span>
            <span>{category.printable ? 'online + A4' : 'digital'}</span>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function StoryCard({ story }: { story: Story }) {
  const { favoriteSet, progressMap, toggleFavoriteAction } = useAppData()
  const favoriteKey = `story:${story.slug}`
  const progress = progressMap.get(favoriteKey)
  const image = storyArtMap[story.slug] ?? '/ai-assets/story-library.png'

  return (
    <Card className={cn('h-full bg-gradient-to-br', toneMap[story.coverTone])}>
      <CardHeader className="gap-4">
        <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70">
          <img src={image} alt={`Capa ilustrada da historia ${story.title}`} className="h-40 w-full object-cover" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge className="bg-white/80 text-[10px] text-muted-ink">{story.ageRange}</Badge>
            <Badge className="bg-white/65 text-[10px] text-muted-ink">{story.readTime}</Badge>
          </div>
          <FavoriteButton active={favoriteSet.has(favoriteKey)} onClick={() => void toggleFavoriteAction('story', story.slug)} />
        </div>
        <div>
          <CardTitle className="text-[1.55rem] leading-tight">{story.title}</CardTitle>
          <CardDescription className="mt-2">{story.blurb}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {story.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} className="bg-white/75 text-[10px] text-muted-ink">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-muted-ink">{getProgressLabel(progress, story.theme)}</span>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/stories/${story.slug}`}>Ler agora</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function GameCard({ game }: { game: Game }) {
  const { favoriteSet, progressMap, toggleFavoriteAction } = useAppData()
  const favoriteKey = `game:${game.slug}`
  const progress = progressMap.get(favoriteKey)
  const image = gameArtMap[game.slug] ?? '/ai-assets/game-tictactoe.png'

  return (
    <Card className={cn('h-full bg-gradient-to-br', toneMap[game.coverTone])}>
      <CardHeader className="gap-4">
        <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70">
          <img src={image} alt={`Thumbnail ilustrada do jogo ${game.title}`} className="h-40 w-full object-cover" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/80 text-[10px] text-muted-ink">{game.ageRange}</Badge>
            <Badge className="bg-white/65 text-[10px] text-muted-ink">{game.difficulty}</Badge>
          </div>
          <FavoriteButton active={favoriteSet.has(favoriteKey)} onClick={() => void toggleFavoriteAction('game', game.slug)} />
        </div>
        <div>
          <CardTitle className="text-[1.55rem] leading-tight">{game.title}</CardTitle>
          <CardDescription className="mt-2">{game.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {game.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} className="bg-white/75 text-[10px] text-muted-ink">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-muted-ink">{getProgressDetail(progress, game.reward)}</span>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/games/${game.slug}`}>Jogar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PrintableCard({ printable }: { printable: Printable }) {
  const { favoriteSet, toggleFavoriteAction } = useAppData()
  const favoriteKey = `printable:${printable.slug}`
  const image = printableArtMap[printable.slug] ?? '/ai-assets/printable-worksheet.png'

  return (
    <Card className={cn('h-full bg-gradient-to-br', toneMap[printable.tone])}>
      <CardHeader className="gap-4">
        <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70">
          <img src={image} alt={`Thumbnail ilustrada da atividade ${printable.title}`} className="h-40 w-full object-cover" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/80 text-[10px] text-muted-ink">{printable.ageRange}</Badge>
            <Badge className="bg-white/65 text-[10px] text-muted-ink">{printable.pages} pagina(s)</Badge>
          </div>
          <FavoriteButton active={favoriteSet.has(favoriteKey)} onClick={() => void toggleFavoriteAction('printable', printable.slug)} />
        </div>
        <div>
          <CardTitle className="text-[1.45rem] leading-tight">{printable.title}</CardTitle>
          <CardDescription className="mt-2">{printable.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {printable.materials.map((material) => (
            <Badge key={material} className="bg-white/75 text-[10px] text-muted-ink">
              {material}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir A4
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed border-soft-border/80 bg-white/80">
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Sparkles className="h-8 w-8 text-coral" />
        <p className="font-display text-2xl font-extrabold text-ink">{title}</p>
        <p className="max-w-md text-sm leading-6 text-muted-ink">{description}</p>
      </CardContent>
    </Card>
  )
}

function PrintableSurface({ title, body, bullets }: { title: string; body: string; bullets: string[] }) {
  return (
    <Card className="print-card bg-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-[24px] border border-dashed border-soft-border bg-sand/35 p-5">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-ink">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

function PrintableGameSheet({ game }: { game: Game }) {
  if (game.engine === 'tic-tac-toe') {
    return (
      <Card className="print-card bg-white">
        <CardHeader>
          <CardTitle>Folha A4: duelo de tabuleiro</CardTitle>
          <CardDescription>Versao de mesa para dois jogadores marcarem X e O com lapis ou canetinha.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-dashed border-soft-border bg-sand/35 p-4">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-[18px] border-2 border-ink/20 bg-white" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-[#f7fbff] p-4 text-sm font-bold text-ink">Jogador 1: marque com X</div>
            <div className="rounded-[20px] bg-[#f7fbff] p-4 text-sm font-bold text-ink">Jogador 2: marque com O</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (game.engine === 'memory') {
    return (
      <Card className="print-card bg-white">
        <CardHeader>
          <CardTitle>Folha A4: recorte e vire</CardTitle>
          <CardDescription>Imprima, recorte os cartoes e jogue memoria fora da tela com pares embaralhados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-4 gap-3 rounded-[24px] border border-dashed border-soft-border bg-sky/10 p-4">
            {['🦊', '🐳', '🌈', '🚀', '🍎', '🎈', '🦊', '🐳', '🌈', '🚀', '🍎', '🎈'].map((item, index) => (
              <div key={`${item}-${index}`} className="flex aspect-square items-center justify-center rounded-[18px] border border-soft-border bg-white text-3xl">
                {item}
              </div>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-ink">Depois de recortar, vire tudo para baixo e encontre os pares sem repetir posicoes.</p>
        </CardContent>
      </Card>
    )
  }

  if (game.engine === 'sequence') {
    return (
      <Card className="print-card bg-white">
        <CardHeader>
          <CardTitle>Folha A4: copie o padrao</CardTitle>
          <CardDescription>Uma fileira mostra a ordem das cores e outra fileira fica vazia para a crianca reproduzir com giz ou adesivos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-4 gap-3 rounded-[24px] border border-dashed border-soft-border bg-mint/30 p-4">
            {['bg-coral', 'bg-sky', 'bg-aqua', 'bg-sun'].map((tone) => (
              <div key={tone} className={cn('h-16 rounded-[20px]', tone)} />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 rounded-[24px] border border-dashed border-soft-border bg-white p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-[20px] border-2 border-dashed border-soft-border" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (game.slug === 'caca-palavras-da-fazenda') {
    const rows = ['VACAOQTR', 'GATOBMIL', 'MILHOPAZ', 'PATOREIS', 'TRATORUZ', 'OVELHAQC']
    return (
      <Card className="print-card bg-white">
        <CardHeader>
          <CardTitle>Folha A4: caca-palavras</CardTitle>
          <CardDescription>Circule as palavras escondidas na grade e depois pinte um animal favorito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[24px] border border-dashed border-soft-border bg-sand/35 p-4 font-display text-lg font-bold tracking-[0.2em] text-ink">
            {rows.map((row) => (
              <div key={row} className="grid grid-cols-8 gap-2 py-1">
                {row.split('').map((letter, index) => (
                  <span key={`${row}-${index}`} className="text-center">{letter}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-ink">
            {['VACA', 'GATO', 'PATO', 'OVELHA', 'MILHO', 'TRATOR'].map((word) => (
              <span key={word} className="rounded-full bg-[#f7fbff] px-3 py-2">{word}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (game.slug === 'labirinto-do-foguete') {
    return (
      <Card className="print-card bg-white">
        <CardHeader>
          <CardTitle>Folha A4: encontre a rota</CardTitle>
          <CardDescription>Trace o caminho do foguete ate a estrela sem passar pelos becos sem saida.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[24px] border border-dashed border-soft-border bg-[#f7fbff] p-5">
            <div className="relative mx-auto h-64 max-w-[20rem] rounded-[24px] border-2 border-ink/20 bg-white">
              <div className="absolute left-6 top-6 h-10 w-24 rounded-full bg-ink" />
              <div className="absolute left-6 top-6 h-28 w-10 rounded-full bg-ink" />
              <div className="absolute left-6 top-24 h-10 w-40 rounded-full bg-ink" />
              <div className="absolute right-8 top-24 h-28 w-10 rounded-full bg-ink" />
              <div className="absolute left-24 bottom-8 h-10 w-32 rounded-full bg-ink" />
              <div className="absolute left-8 bottom-8 text-2xl">🚀</div>
              <div className="absolute right-8 top-8 text-2xl">⭐</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="print-card bg-white">
      <CardHeader>
        <CardTitle>Folha A4: ligue os pontos</CardTitle>
        <CardDescription>Siga os numeros em ordem, una os pontos e revele o desenho final antes de colorir.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-6 rounded-[24px] border border-dashed border-soft-border bg-sand/30 p-6 text-center text-sm font-bold text-ink">
          {['1', '2', '3', '4', '8', '7', '6', '5', '9', '10', '11', '12'].map((label) => (
            <div key={label} className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink/25 bg-white">
              {label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function HomePage() {
  const { categories, games, stories, printables, loading, session } = useAppData()

  if (loading) {
    return <LoadingPage label="Montando o universo LumiKids..." />
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-white via-sand to-[#f7fbff]">
            <CardContent className="grid gap-10 px-6 pb-8 pt-8 sm:px-8 lg:grid-cols-[1fr,320px] lg:items-center">
              <div className="space-y-6">
                <Badge className="bg-aqua/10 text-[11px] text-aqua">aprendizado + criatividade + impressao</Badge>
                <div className="space-y-4">
                  <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-ink sm:text-6xl">
                    Jogos, historias e atividades para aprender brincando.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-ink">
                    Uma plataforma infantil segura, divertida e intuitiva para criancas, pais e professores explorarem jogos online,
                    leitura guiada e folhas prontas para imprimir em A4.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" asChild>
                    <Link to="/catalog">Explorar atividades</Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/stories">Ver historias</Link>
                  </Button>
                  <Button size="lg" variant="dark" asChild>
                    <Link to="/login">Entrar</Link>
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    'Mini games com feedback positivo',
                    'Leitura guiada com audio opcional',
                    'Atividades prontas para imprimir',
                  ].map((item) => (
                    <div key={item} className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-muted-ink shadow-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_50px_rgba(28,55,69,0.1)]">
                <img
                  src="/ai-assets/hero-main.png"
                  alt="Ilustracao infantil com formas coloridas representando o universo LumiKids"
                  className="w-full rounded-[28px] border border-soft-border object-cover"
                />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-white p-4 shadow-sm">
                    <p className="font-display text-2xl font-extrabold text-ink">{games.length}+ jogos</p>
                    <p className="text-sm text-muted-ink">digitais e imprimiveis</p>
                  </div>
                  <div className="rounded-[24px] bg-[#f7fbff] p-4 shadow-sm">
                    <p className="font-display text-2xl font-extrabold text-ink">{stories.length}+ historias</p>
                    <p className="text-sm text-muted-ink">para ler, ouvir e guardar</p>
                  </div>
                </div>
                {session.user && (
                  <div className="mt-4 rounded-[22px] bg-ink p-4 text-white">
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-white/70">Sessao ativa</p>
                    <p className="mt-2 font-display text-2xl font-extrabold">Oi, {session.user.name}!</p>
                    <p className="mt-1 text-sm text-white/80">Seu proximo passo recomendado esta no catalogo personalizado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <InfoPanel
              icon={ShieldCheck}
              title="Seguro para familias"
              description="Interface sem excesso, linguagem simples, progresso salvo e perfis separados para criancas e responsaveis."
              accent="bg-ink text-white"
            />
            <InfoPanel
              icon={Printer}
              title="Modo imprimivel A4"
              description="Labirintos, desenhos, folhas de tracejado e desafios educativos prontos para imprimir em poucos cliques."
              accent="bg-sand text-ink"
            />
            <InfoPanel
              icon={BookHeart}
              title="Conteudo com cuidado pedagogico"
              description="Historias sobre amizade, natureza, escola e emocoes com leitura leve, divertida e acessivel."
              accent="bg-[#f7fbff] text-ink"
            />
          </div>
        </div>

        <section className="space-y-6">
          <SectionTitle
            eyebrow="o que existe na plataforma"
            title="Um catalogo grande, clicavel e gostoso de explorar"
            body="As categorias foram desenhadas para criancas encontrarem rapido o que querem, enquanto pais e professores ganham filtros por idade, tema e modo de uso."
          />
          <div className="catalog-grid grid gap-4">
            {categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="overflow-hidden bg-ink text-white">
            <CardContent className="space-y-5 px-6 py-8 sm:px-8">
              <Badge className="border-white/20 bg-white/10 text-[11px] text-white">digital + papel</Badge>
              <h2 className="font-display text-4xl font-extrabold leading-tight">Jogos com dois modos de uso</h2>
              <p className="max-w-2xl text-base leading-7 text-white/78">
                Cada jogo nasce com uma versao online para a crianca interagir sozinha e com um roteiro de impressao para continuar a brincadeira na mesa, em sala de aula ou em viagens.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link to="/games">Jogar agora</Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/printables">Ver materiais A4</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90">
            <CardContent className="space-y-4 px-6 py-8">
              <p className="font-display text-3xl font-extrabold text-ink">Para pais e professores</p>
              <ul className="space-y-3 text-sm leading-6 text-muted-ink">
                <li>Favoritos salvos para retomar atividades em poucos segundos.</li>
                <li>Progresso por historia e jogo com recomendacoes do que fazer depois.</li>
                <li>Busca por idade, tema e habilidades como leitura, logica e coordenacao.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="historias em destaque"
              title="Leituras curtas, afetivas e prontas para compartilhar"
              body="Contos para dormir, fabulas, aventuras e historias com escolhas para desenvolver imaginacao e conversas importantes."
            />
            <Button variant="secondary" asChild>
              <Link to="/stories">Ver todas</Link>
            </Button>
          </div>
          <div className="story-grid grid gap-4">
            {stories.slice(0, 3).map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="jogos em destaque"
              title="Mini games educativos para usar no navegador"
              body="Uma primeira colecao de desafios simples, responsivos e amigaveis, com instrucoes claras e feedback visual acolhedor."
            />
            <Button variant="secondary" asChild>
              <Link to="/games">Abrir area de jogos</Link>
            </Button>
          </div>
          <div className="game-grid grid gap-4">
            {games.slice(0, 3).map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="conteudo imprimivel"
              title="Atividades prontas para mesa, casa e sala de aula"
              body="Folhas de colorir, labirintos, tracejados, cruzadinhas e desafios educativos com visual organizado para impressao em folha A4."
            />
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir resumo
            </Button>
          </div>
          <div className="printable-grid grid gap-4">
            {printables.slice(0, 4).map((printable) => (
              <PrintableCard key={printable.slug} printable={printable} />
            ))}
          </div>
        </section>
      </section>
    </AppShell>
  )
}

function InfoPanel({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
  accent: string
}) {
  return (
    <div className={cn('rounded-[30px] p-6 shadow-[0_22px_50px_rgba(25,50,60,0.08)]', accent)}>
      <Icon className="h-6 w-6" />
      <p className="mt-5 font-display text-2xl font-extrabold">{title}</p>
      <p className={cn('mt-2 text-sm leading-6', accent.includes('text-white') ? 'text-white/80' : 'text-muted-ink')}>{description}</p>
    </div>
  )
}

function LoginPage() {
  const { session, loginAction } = useAppData()
  const navigate = useNavigate()
  const [role, setRole] = useState<'child' | 'guardian'>('child')
  const [email, setEmail] = useState('luna@lumikids.com')
  const [password, setPassword] = useState('123456')
  const [submitting, setSubmitting] = useState(false)

  if (session.user) {
    return <Navigate to="/catalog" replace />
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    const ok = await loginAction({ email, password, role })
    setSubmitting(false)
    if (ok) navigate('/catalog')
  }

  const demoMap = {
    child: { email: 'luna@lumikids.com', password: '123456' },
    guardian: { email: 'familia@lumikids.com', password: '123456' },
  }

  return (
    <AppShell>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8 lg:pt-12">
        <Card className="overflow-hidden bg-ink text-white">
          <CardContent className="space-y-6 px-6 py-8 sm:px-8">
            <Badge className="border-white/15 bg-white/10 text-[11px] text-white">seguro + acolhedor + rapido</Badge>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] text-white sm:text-6xl">
              Entre no seu cantinho de descobertas.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              Criancas encontram um ambiente claro e responsivo. Pais e professores acessam favoritos, historico e progresso sem complicacao.
            </p>
            <div className="rounded-[32px] border border-white/10 bg-white/8 p-6">
              <img
                src="/ai-assets/login-welcome.png"
                alt="Ilustracao para area de login com mascote e cards de boas-vindas"
                className="w-full rounded-[28px] border border-white/10 object-cover shadow-[0_20px_40px_rgba(0,0,0,0.16)]"
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-white/95 p-4 text-ink shadow-sm">
                  <p className="font-display text-xl font-extrabold">Modo visitante</p>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">Explore o catalogo e experimente atividades antes de criar conta.</p>
                </div>
                <div className="rounded-[24px] bg-sand p-4 text-ink shadow-sm">
                  <p className="font-display text-xl font-extrabold">Avatar favorito</p>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">Volte com suas medalhas, historias salvas e trilhas preferidas.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardContent className="space-y-6 px-6 py-8 sm:px-8">
            <div className="space-y-2">
              <p className="font-display text-4xl font-extrabold text-ink">Entrar</p>
              <p className="text-sm leading-6 text-muted-ink">Use uma conta demo segura para testar o fluxo completo da plataforma.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { key: 'child', title: 'Perfil infantil', body: 'Avatar, medalhas e continuidade rapida.' },
                { key: 'guardian', title: 'Responsavel', body: 'Favoritos, historico e filtros por idade.' },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setRole(item.key)
                    setEmail(demoMap[item.key].email)
                    setPassword(demoMap[item.key].password)
                  }}
                  className={cn(
                    'rounded-[24px] border p-4 text-left transition',
                    role === item.key ? 'border-coral bg-sand shadow-sm' : 'border-soft-border bg-[#f7fbff] hover:border-sky/50',
                  )}
                >
                  <p className="font-display text-xl font-extrabold text-ink">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">{item.body}</p>
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-bold text-muted-ink">
                  E-mail ou nome de usuario
                </label>
                <Input
                  id="login-email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="luna@lumikids.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-bold text-muted-ink">
                  Senha
                </label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="123456"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-sm font-bold">
                <button type="button" className="text-aqua">
                  Esqueci minha senha
                </button>
                <button type="button" className="text-muted-ink">
                  Lembrete de acesso
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <Button className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Entrando...' : 'Entrar'}
                </Button>
                <Button className="w-full" size="lg" variant="dark" type="button" onClick={() => navigate('/catalog')}>
                  Continuar como visitante
                </Button>
                <Button className="w-full" size="lg" variant="secondary" type="button">
                  Criar conta
                </Button>
              </div>
            </form>

            <div className="rounded-[22px] bg-[#fff6f1] p-4 text-sm leading-6 text-[#d16a4b]">
              <p className="font-bold">Mensagem amigavel:</p>
              <p>Se algo falhar, confira o e-mail, escolha o perfil correto e tente novamente.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  )
}

function CatalogPage() {
  const { categories, games, stories, loading } = useAppData()
  const [query, setQuery] = useState('')

  const filteredCategories = useMemo(() => {
    if (!query.trim()) return categories
    const value = query.toLowerCase()
    return categories.filter((category) => `${category.title} ${category.description} ${category.highlight}`.toLowerCase().includes(value))
  }, [categories, query])

  if (loading) {
    return <LoadingPage label="Abrindo o catalogo interativo..." />
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="grid gap-5 lg:grid-cols-[1.2fr,300px]">
          <Card className="bg-white/95">
            <CardContent className="space-y-4 px-6 py-7 sm:px-8">
              <Badge className="bg-aqua/10 text-[11px] text-aqua">catalogo clicavel</Badge>
              <h1 className="font-display text-5xl font-extrabold text-ink">Escolha um mundo para brincar agora</h1>
              <p className="max-w-3xl text-base leading-7 text-muted-ink">
                Cards grandes, icones claros e descricoes curtas ajudam a crianca a descobrir atividades rapidamente, sem menus confusos.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-sand">
            <CardContent className="space-y-3 px-6 py-7">
              <p className="font-display text-2xl font-extrabold text-ink">Buscar por tema</p>
              <div className="relative">
                <label htmlFor="catalog-search" className="sr-only">
                  Buscar por tema
                </label>
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ink" />
                <Input
                  id="catalog-search"
                  className="pl-11"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="animais, letras, numeros..."
                />
              </div>
              <p className="text-sm leading-6 text-muted-ink">Filtros rapidos para idade, leitura, coordenacao motora e modo imprimivel.</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          {['todos', 'para imprimir', 'com audio', 'mais jogados'].map((tag) => (
            <Badge key={tag} className={cn(tag === 'todos' ? 'bg-ink text-white' : 'bg-white text-ink', 'px-4 py-2 text-[11px]')}>
              {tag}
            </Badge>
          ))}
        </div>

        {filteredCategories.length === 0 ? (
          <EmptyState title="Nada encontrado" description="Tente buscar por outro tema, habilidade ou faixa etaria." />
        ) : (
          <div className="catalog-grid grid gap-4">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <HighlightRail title="Jogos em alta" description="Primeiros desafios para brincar ja." items={games.slice(0, 3).map((game) => game.title)} />
          <HighlightRail title="Historias queridinhas" description="Leituras curtas para qualquer hora do dia." items={stories.slice(0, 3).map((story) => story.title)} />
        </div>
      </section>
    </AppShell>
  )
}

function HighlightRail({ title, description, items }: { title: string; description: string; items: string[] }) {
  return (
    <Card className="bg-white/90">
      <CardContent className="space-y-4 px-6 py-7">
        <div>
          <p className="font-display text-3xl font-extrabold text-ink">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-ink">{description}</p>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item} className="rounded-[22px] border border-soft-border bg-[#f7fbff] px-4 py-3 text-sm font-bold text-ink">
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GamesPage() {
  const { games, loading } = useAppData()

  if (loading) {
    return <LoadingPage label="Preparando a area de jogos..." />
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <SectionTitle
          eyebrow="jogar online"
          title="Mini games educativos com instrucoes simples"
          body="Cada experiencia tem objetivo claro, dificuldade leve para comecar e modo imprimivel sugerido para continuar fora da tela."
        />
        <div className="game-grid grid gap-4">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}

function GameDetailPage() {
  const { slug } = useParams()
  const { games, progressMap, recordProgressAction, loading } = useAppData()
  const game = games.find((entry) => entry.slug === slug)
  const gameImage = game ? gameArtMap[game.slug] ?? '/ai-assets/game-tictactoe.png' : '/ai-assets/game-tictactoe.png'
  const progress = game ? progressMap.get(`game:${game.slug}`) : undefined

  useEffect(() => {
    if (!game) return

    void recordProgressAction({
      itemKind: 'game',
      itemSlug: game.slug,
      status: progress?.status === 'completed' ? 'completed' : 'started',
      score: progress?.bestScore ?? 0,
      currentPhase: progress?.currentPhase ?? 'opened',
      currentLevel: progress?.currentLevel ?? 1,
      maxLevel: progress?.maxLevel ?? 1,
      meta: { source: 'detail-page' },
    })
  }, [game?.slug])

  const handleGameProgress = useCallback((payload: {
    status: ProgressRecord['status']
    score: number
    currentPhase?: string
    currentLevel?: number
    maxLevel?: number
    attemptDelta?: number
    successDelta?: number
    meta?: Record<string, unknown>
  }) => {
    if (!game) return

    void recordProgressAction({ itemKind: 'game', itemSlug: game.slug, ...payload })
  }, [game?.slug, recordProgressAction])

  if (loading) {
    return <LoadingPage label="Abrindo o jogo..." />
  }

  if (!game) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:px-6 lg:px-8">
          <EmptyState title="Jogo nao encontrado" description="Escolha outra atividade no catalogo infantil." />
        </section>
      </AppShell>
    )
  }

  const complete = (score: number) => {
    toast.success(`Muito bem! ${game.reward}`)
    void recordProgressAction({ itemKind: 'game', itemSlug: game.slug, status: 'completed', score, currentPhase: 'game-complete', currentLevel: progress?.maxLevel ?? progress?.currentLevel ?? 1, maxLevel: progress?.maxLevel ?? progress?.currentLevel ?? 1, successDelta: 1 })
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <Card className={cn('bg-gradient-to-br', toneMap[game.coverTone])}>
          <CardContent className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.02fr,0.98fr] lg:items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/75 text-[11px] text-muted-ink">{game.ageRange}</Badge>
                <Badge className="bg-white/75 text-[11px] text-muted-ink">{game.difficulty}</Badge>
                <Badge className="bg-white/75 text-[11px] text-muted-ink">online + A4</Badge>
              </div>
              <h1 className="font-display text-5xl font-extrabold text-ink">{game.title}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-ink">{game.description}</p>
              <div className="flex flex-wrap gap-2">
                {game.skills.map((skill) => (
                  <Badge key={skill} className="bg-white/75 text-[11px] text-muted-ink">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">progresso</p>
                  <p className="mt-2 text-sm font-bold text-ink">{getProgressLabel(progress, 'nova partida')}</p>
                </div>
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">tentativas</p>
                  <p className="mt-2 text-sm font-bold text-ink">{progress?.attemptCount ?? 0}</p>
                </div>
                <div className="rounded-[22px] bg-white/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">melhor score</p>
                  <p className="mt-2 text-sm font-bold text-ink">{progress?.bestScore ?? 0}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-sm">
                <img src={gameImage} alt={`Arte do jogo ${game.title}`} className="h-64 w-full object-cover sm:h-72" />
              </div>
              <PrintableSurface title="Instrucoes do jogo" body={game.printPrompt} bullets={game.instructions} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="no-print space-y-4">
            <div className="rounded-[24px] bg-white/85 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-aqua">modo online</p>
              <p className="mt-2 text-sm leading-6 text-muted-ink">Aqui a crianca toca, testa, recebe feedback imediato e pode reiniciar quantas vezes quiser.</p>
            </div>
            {game.engine === 'tic-tac-toe' && <TicTacToeGame onComplete={complete} onProgress={handleGameProgress} />}
            {game.engine === 'memory' && <MemoryGame onComplete={complete} onProgress={handleGameProgress} />}
            {game.engine === 'sequence' && <SequenceGame onComplete={complete} onProgress={handleGameProgress} />}
            {game.engine === 'worksheet' && <WorksheetGame slug={game.slug as 'caca-palavras-da-fazenda' | 'labirinto-do-foguete' | 'ligue-os-pontos-do-dragao'} onComplete={complete} onProgress={handleGameProgress} />}
          </div>

          <Card className="bg-white/95 print-card">
            <CardHeader>
              <CardTitle className="text-2xl">Versao imprimivel A4</CardTitle>
              <CardDescription>Na impressao a dinamica muda: sai o toque na tela e entra recorte, pintura, traco, circulo ou jogo em dupla.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="no-print rounded-[24px] border border-dashed border-soft-border bg-sand/40 p-5">
                <p className="font-display text-2xl font-extrabold text-ink">{game.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-ink">{game.printPrompt}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-ink">
                  {game.instructions.map((instruction) => (
                    <li key={instruction}>{instruction}</li>
                  ))}
                </ul>
              </div>
              <PrintableGameSheet game={game} />
              <div className="no-print flex flex-wrap gap-3">
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir agora
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/games">Voltar aos jogos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}

function StoriesPage() {
  const { stories, loading } = useAppData()

  if (loading) {
    return <LoadingPage label="Abrindo a biblioteca de historias..." />
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <SectionTitle
            eyebrow="ler no site ou imprimir"
            title="Historias infantis afetuosas e divertidas"
            body="Titulos curtos com faixa etaria recomendada, tempo estimado, tema, moral da historia e sugestao de impressao para compartilhar sem pressa."
          />
          <Card className="overflow-hidden bg-white/90">
            <CardContent className="p-4">
              <img
                src="/ai-assets/story-library.png"
                alt="Ilustracao para a biblioteca de historias com foco em leitura acolhedora"
                className="w-full rounded-[28px] border border-soft-border object-cover"
              />
            </CardContent>
          </Card>
        </div>
        <div className="story-grid grid gap-4">
          {stories.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}

function StoryDetailPage() {
  const { slug } = useParams()
  const { stories, recordProgressAction, loading } = useAppData()
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const story = stories.find((entry) => entry.slug === slug)
  const storyImage = story ? storyArtMap[story.slug] ?? '/ai-assets/story-library.png' : '/ai-assets/story-library.png'

  useEffect(() => {
    if (story) {
      void recordProgressAction({ itemKind: 'story', itemSlug: story.slug, status: 'started', score: 30 })
    }
  }, [recordProgressAction, story])

  if (loading) {
    return <LoadingPage label="Abrindo a historia..." />
  }

  if (!story) {
    return (
      <AppShell>
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:px-6 lg:px-8">
          <EmptyState title="Historia nao encontrada" description="Volte para a biblioteca e escolha outra leitura." />
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <Card className={cn('bg-gradient-to-br', toneMap[story.coverTone])}>
          <CardContent className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1.02fr,0.98fr] lg:items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/75 text-[11px] text-muted-ink">{story.ageRange}</Badge>
                <Badge className="bg-white/75 text-[11px] text-muted-ink">{story.readTime}</Badge>
                <Badge className="bg-white/75 text-[11px] text-muted-ink">{story.audio ? 'audio sugerido' : 'leitura tranquila'}</Badge>
              </div>
              <h1 className="font-display text-5xl font-extrabold text-ink">{story.title}</h1>
              <p className="text-lg leading-8 text-muted-ink">{story.blurb}</p>
              <div className="flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <Badge key={tag} className="bg-white/75 text-[11px] text-muted-ink">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-sm">
                <img src={storyImage} alt={`Arte da historia ${story.title}`} className="h-64 w-full object-cover sm:h-72" />
              </div>
              <PrintableSurface title="Imprimir historia" body={story.printPrompt} bullets={story.lessons} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.08fr,0.92fr]">
          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle className="text-3xl">Ler agora</CardTitle>
              <CardDescription>Texto com ritmo leve, bom para leitura em voz alta ou compartilhada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-[1.05rem] leading-8 text-ink">
              {story.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {story.choices ? (
                <div className="rounded-[28px] bg-sand/60 p-5">
                  <p className="font-display text-2xl font-extrabold text-ink">Escolha interativa</p>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">{story.choices.prompt}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {story.choices.branches.map((branch) => (
                      <Button key={branch.title} variant={selectedBranch === branch.title ? 'brand' : 'secondary'} onClick={() => setSelectedBranch(branch.title)}>
                        {branch.title}
                      </Button>
                    ))}
                  </div>
                  {selectedBranch && (
                    <p className="mt-4 rounded-[22px] bg-white p-4 text-sm leading-6 text-muted-ink">
                      {story.choices.branches.find((branch) => branch.title === selectedBranch)?.result}
                    </p>
                  )}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Imprimir historia
                </Button>
                <Button variant="secondary" onClick={() => void recordProgressAction({ itemKind: 'story', itemSlug: story.slug, status: 'completed', score: 90 })}>
                  Marcar como lida
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95">
            <CardHeader>
              <CardTitle className="text-2xl">Boas conversas depois da leitura</CardTitle>
              <CardDescription>Use as ideias abaixo para ampliar o aprendizado fora da tela.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {story.lessons.map((lesson) => (
                <div key={lesson} className="rounded-[22px] border border-soft-border bg-[#f7fbff] p-4 text-sm leading-6 text-muted-ink">
                  {lesson}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  )
}

function PrintablesPage() {
  const { printables, loading } = useAppData()

  if (loading) {
    return <LoadingPage label="Organizando os materiais imprimiveis..." />
  }

  return (
    <AppShell>
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <SectionTitle
          eyebrow="modo impressao"
          title="Conteudos planejados para folha A4"
          body="Desafios educativos, jogos de mesa, folhas de colorir e atividades escolares com visual limpo para imprimir em casa ou na escola."
        />
        <div className="printable-grid grid gap-4">
          {printables.map((printable) => (
            <PrintableCard key={printable.slug} printable={printable} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}

function LoadingPage({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-[32px] border border-white/80 bg-white/85 px-8 py-10 text-center shadow-[0_25px_70px_rgba(25,50,60,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral/15 text-coral">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <p className="mt-4 font-display text-2xl font-extrabold text-ink">{label}</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/games/:slug" element={<GameDetailPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/stories/:slug" element={<StoryDetailPage />} />
      <Route path="/printables" element={<PrintablesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AnimatePresence mode="wait">
          <AppRoutes />
        </AnimatePresence>
        <Toaster richColors position="top-right" />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
