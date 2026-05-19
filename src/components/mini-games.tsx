import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { RefreshCw, Sparkles, Star, Trophy, WandSparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type GameDifficulty = 'easy' | 'medium' | 'challenge'

type ProgressPayload = {
  status: 'started' | 'completed'
  score: number
  currentPhase?: string
  currentLevel?: number
  maxLevel?: number
  attemptDelta?: number
  successDelta?: number
  meta?: Record<string, unknown>
}

type MiniGameProps = {
  onComplete: (score: number) => void
  onProgress?: (payload: ProgressPayload) => void
  difficulty?: GameDifficulty
}

type WorksheetSlug = 'caca-palavras-da-fazenda' | 'labirinto-do-foguete' | 'ligue-os-pontos-do-dragao'
const CONNECT_DOT_POINTS = Array.from({ length: 16 }, (_, index) => String(index + 1))

const timeLimits: Record<GameDifficulty, number | null> = {
  easy: null,
  medium: 90,
  challenge: 55,
}

const memoryThemes = [
  { name: 'Bichinhos da floresta', emojis: ['🦊', '🐻', '🦉', '🐿️', '🦔', '🦝', '🐰', '🦌'] },
  { name: 'Festa no espaço', emojis: ['🚀', '🪐', '⭐', '🌙', '☄️', '🛸', '👩‍🚀', '🌎'] },
  { name: 'Frutas coloridas', emojis: ['🍎', '🍌', '🍓', '🍇', '🍉', '🍍', '🥝', '🍒'] },
  { name: 'Praia divertida', emojis: ['🐳', '🐠', '🐙', '🦀', '🐚', '🏖️', '⛵', '🌊'] },
]

const wordSearchRounds = [
  {
    theme: 'Fazenda feliz',
    words: ['VACA', 'GATO', 'PATO', 'OVELHA', 'MILHO', 'TRATOR'],
    rows: ['VACAOQTR', 'GATOBMIL', 'MILHOPAZ', 'PATOREIS', 'TRATORUZ', 'OVELHAQC'],
  },
  {
    theme: 'Praia ensolarada',
    words: ['SOL', 'MAR', 'AREIA', 'PEIXE', 'CONCHA', 'BARCO'],
    rows: ['SOLARCOB', 'MAREQPRA', 'AREIAZUL', 'PEIXEFOZ', 'CONCHAXY', 'BARCOTIM'],
  },
  {
    theme: 'Espaço curioso',
    words: ['LUA', 'SOL', 'ROBO', 'ASTRO', 'FOGUETE', 'PLANETA'],
    rows: ['LUAXROBO', 'SOLNAVEQ', 'ASTROZIM', 'FOGUETEX', 'PLANETAX', 'COMETARI'],
  },
]

const mazeRounds = [
  {
    theme: 'Rota das estrelas',
    safe: ['0-0', '1-0', '2-0', '2-1', '2-2', '3-2', '4-2', '4-3', '4-4'],
    easyExtra: ['0-1', '1-1', '1-2', '3-3'],
    stars: ['2-1', '4-3'],
    goal: '4-4',
  },
  {
    theme: 'Cinturão de asteroides',
    safe: ['0-0', '0-1', '0-2', '1-2', '2-2', '2-3', '3-3', '4-3', '4-4'],
    easyExtra: ['1-0', '1-1', '3-2', '3-4'],
    stars: ['0-2', '3-3'],
    goal: '4-4',
  },
  {
    theme: 'Volta pela nebulosa',
    safe: ['0-0', '1-0', '1-1', '1-2', '2-2', '3-2', '3-1', '4-1', '4-2', '4-3', '4-4'],
    easyExtra: ['0-1', '2-1', '3-3'],
    stars: ['1-2', '4-1'],
    goal: '4-4',
  },
]

const quizRounds = [
  {
    theme: 'Animais',
    questions: [
      { prompt: 'Qual animal late?', options: ['Gato', 'Cachorro', 'Peixe'], answer: 'Cachorro' },
      { prompt: 'Quem vive no mar?', options: ['Baleia', 'Galinha', 'Cavalo'], answer: 'Baleia' },
      { prompt: 'Qual animal tem listras?', options: ['Zebra', 'Pato', 'Sapo'], answer: 'Zebra' },
    ],
  },
  {
    theme: 'Natureza',
    questions: [
      { prompt: 'O que nasce da semente?', options: ['Planta', 'Pedra', 'Lua'], answer: 'Planta' },
      { prompt: 'O que ilumina o dia?', options: ['Sol', 'Nuvem', 'Sapato'], answer: 'Sol' },
      { prompt: 'Onde o peixe nada?', options: ['Água', 'Árvore', 'Areia'], answer: 'Água' },
    ],
  },
  {
    theme: 'Cores',
    questions: [
      { prompt: 'Mistura de azul e amarelo lembra qual cor?', options: ['Verde', 'Rosa', 'Marrom'], answer: 'Verde' },
      { prompt: 'Qual cor parece uma banana madura?', options: ['Amarelo', 'Azul', 'Cinza'], answer: 'Amarelo' },
      { prompt: 'Qual cor parece o céu limpo?', options: ['Azul', 'Preto', 'Laranja'], answer: 'Azul' },
    ],
  },
]

const mathRounds = [
  { theme: 'Estrelas', items: '⭐', problems: [{ prompt: '2 + 1', answer: 3 }, { prompt: '3 + 2', answer: 5 }, { prompt: '5 - 2', answer: 3 }] },
  { theme: 'Maçãs', items: '🍎', problems: [{ prompt: '1 + 4', answer: 5 }, { prompt: '6 - 3', answer: 3 }, { prompt: '2 + 5', answer: 7 }] },
  { theme: 'Balões', items: '🎈', problems: [{ prompt: '4 + 2', answer: 6 }, { prompt: '7 - 2', answer: 5 }, { prompt: '3 + 3', answer: 6 }] },
]

const syllableRounds = [
  { theme: 'Animais', words: [{ word: 'GATO', syllables: ['GA', 'TO'] }, { word: 'PATO', syllables: ['PA', 'TO'] }, { word: 'MACACO', syllables: ['MA', 'CA', 'CO'] }] },
  { theme: 'Comidas', words: [{ word: 'BOLO', syllables: ['BO', 'LO'] }, { word: 'PIPOCA', syllables: ['PI', 'PO', 'CA'] }, { word: 'MELAO', syllables: ['ME', 'LAO'] }] },
  { theme: 'Natureza', words: [{ word: 'LUA', syllables: ['LU', 'A'] }, { word: 'MATA', syllables: ['MA', 'TA'] }, { word: 'JARDIM', syllables: ['JAR', 'DIM'] }] },
]

const difficultyCopy: Record<GameDifficulty, { label: string; tag: string }> = {
  easy: { label: 'Facil', tag: 'primeiros passos' },
  medium: { label: 'Medio', tag: 'mais foco' },
  challenge: { label: 'Desafio', tag: 'modo campeao' },
}

function difficultyLabel(difficulty: GameDifficulty) {
  return difficultyCopy[difficulty].label
}

function shortcutList(shortcuts: string[]) {
  return shortcuts.map((shortcut) => (
    <kbd key={shortcut} className="rounded-full bg-white px-2 py-1 font-display text-[0.72rem] font-extrabold text-ink shadow-sm">
      {shortcut}
    </kbd>
  ))
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function Pill({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'coral' | 'aqua' | 'sun' }) {
  const tones = {
    neutral: 'bg-[#f7fbff] text-ink',
    coral: 'bg-coral/12 text-coral',
    aqua: 'bg-aqua/12 text-aqua',
    sun: 'bg-sun/35 text-ink',
  }

  return <span className={cn('rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em]', tones[tone])}>{children}</span>
}

function GameStatus({ children }: { children: string }) {
  return <p className="max-w-xl text-sm font-extrabold leading-6 text-ink sm:text-base">{children}</p>
}

function ControlHint({ touch, keyboard, difficulty }: { touch: string; keyboard: string[]; difficulty: GameDifficulty }) {
  return (
    <div className="grid gap-2 rounded-[24px] bg-white/85 p-4 text-sm font-bold text-muted-ink sm:grid-cols-[1fr,auto] sm:items-center">
      <p>
        <span className="text-ink">Celular:</span> {touch}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink">PC:</span>
        {shortcutList(keyboard)}
        <span className="rounded-full bg-sun/45 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-ink">
          {difficultyLabel(difficulty)}
        </span>
      </div>
    </div>
  )
}

function TimerPanel({ difficulty, onExpire, seconds = timeLimits[difficulty] }: { difficulty: GameDifficulty; onExpire: () => void; seconds?: number | null }) {
  const [timeLeft, setTimeLeft] = useState(seconds ?? 0)
  const expire = useEffectEvent(() => onExpire())

  useEffect(() => {
    if (!seconds) return

    const id = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(id)
          expire()
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [seconds])

  if (!seconds) {
    return (
      <div className="rounded-[24px] bg-mint/70 p-4 text-sm font-extrabold text-ink">
        Modo fácil: sem tempo. Brinque no seu ritmo.
      </div>
    )
  }

  const urgent = timeLeft <= 15

  return (
    <div className={cn('rounded-[24px] p-4 text-sm font-extrabold text-ink', urgent ? 'bg-coral/18 text-coral' : 'bg-sun/45')}>
      Tempo restante: <span className="font-display text-xl">{timeLeft}s</span>
    </div>
  )
}

function nextRoundIndex(current: number, total: number) {
  return (current + 1) % total
}

function ProgressStrip({ value, tone = 'aqua' }: { value: number; tone?: 'aqua' | 'coral' | 'sun' }) {
  const toneClass = tone === 'coral' ? 'from-coral to-sun' : tone === 'sun' ? 'from-sun to-coral' : 'from-aqua to-sky'

  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/80 shadow-inner">
      <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', toneClass)} style={{ width: `${Math.max(6, Math.min(100, value))}%` }} />
    </div>
  )
}

function statusMessage(winner: string | null, player: string) {
  if (winner === player) return 'Voce venceu esta rodada!'
  if (winner === 'draw') return 'Empate divertido!'
  if (winner) return 'A Luna ganhou desta vez. Tente outra estrategia!'
  return 'Sua vez!'
}

export function TicTacToeGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [winner, setWinner] = useState<string | null>(null)
  const [winningCells, setWinningCells] = useState<number[]>([])
  const [roundScore, setRoundScore] = useState({ child: 0, luna: 0, draws: 0 })
  const [roundId, setRoundId] = useState(0)
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'match-start', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
  }, [])

  const checkWinner = (nextBoard: string[]) => {
    for (const line of lines) {
      const [a, b, c] = line
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        return { winner: nextBoard[a], line }
      }
    }

    return nextBoard.every(Boolean) ? { winner: 'draw', line: [] as number[] } : null
  }

  const availableCells = (nextBoard: string[]) => nextBoard.map((value, idx) => (value ? null : idx)).filter((value): value is number => value !== null)

  const findLineMove = (nextBoard: string[], mark: string) => {
    for (const line of lines) {
      const values = line.map((index) => nextBoard[index])
      const emptyIndex = line.find((index) => !nextBoard[index])
      if (emptyIndex !== undefined && values.filter((value) => value === mark).length === 2) return emptyIndex
    }

    return null
  }

  const chooseRivalMove = (nextBoard: string[]) => {
    const available = availableCells(nextBoard)
    if (available.length === 0) return undefined

    if (difficulty === 'easy') return available[Math.floor(Math.random() * available.length)]

    const winningMove = findLineMove(nextBoard, 'O')
    if (winningMove !== null) return winningMove

    const blockMove = findLineMove(nextBoard, 'X')
    if (blockMove !== null) return blockMove


    if (available.includes(4)) return 4


    if (difficulty === 'challenge') {
      const corners = [0, 2, 6, 8].filter((index) => available.includes(index))
      if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)]
    }

    return available[0]
  }

  const resetBoard = () => {
    setBoard(Array(9).fill(''))
    setWinner(null)
    setWinningCells([])
    setRoundId((current) => current + 1)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'new-round', currentLevel: 1, maxLevel: 1, attemptDelta: 1, meta: { roundScore } })
  }

  const resetMatch = () => {
    setBoard(Array(9).fill(''))
    setWinner(null)
    setWinningCells([])
    setRoundScore({ child: 0, luna: 0, draws: 0 })
    setRoundId((current) => current + 1)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'match-reset', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
  }

  const expireRound = () => {
    if (winner) return
    const nextScore = { ...roundScore, luna: roundScore.luna + 1 }
    setWinner('O')
    setRoundScore(nextScore)
    onProgress?.({ status: 'started', score: 20, currentPhase: 'time-expired', currentLevel: 1, maxLevel: 1, meta: { difficulty, roundScore: nextScore } })
  }

  const finishRound = (result: { winner: string; line: number[] }, nextBoard: string[]) => {
    setBoard(nextBoard)
    setWinner(result.winner)
    setWinningCells(result.line)

    if (result.winner === 'X') {
      const nextScore = { ...roundScore, child: roundScore.child + 1 }
      setRoundScore(nextScore)
      onProgress?.({ status: 'completed', score: 100, currentPhase: 'round-win', currentLevel: 1, maxLevel: 1, successDelta: 1, meta: { roundScore: nextScore } })
      onComplete(100)
      return
    }

    if (result.winner === 'O') {
      const nextScore = { ...roundScore, luna: roundScore.luna + 1 }
      setRoundScore(nextScore)
      onProgress?.({ status: 'started', score: 35, currentPhase: 'round-loss', currentLevel: 1, maxLevel: 1, meta: { roundScore: nextScore } })
      return
    }

    const nextScore = { ...roundScore, draws: roundScore.draws + 1 }
    setRoundScore(nextScore)
    onProgress?.({ status: 'started', score: 70, currentPhase: 'round-draw', currentLevel: 1, maxLevel: 1, meta: { roundScore: nextScore } })
    onComplete(70)
  }

  function play(index: number) {
    if (board[index] || winner) return
    const next = [...board]
    next[index] = 'X'
    const result = checkWinner(next)
    if (result) {
      finishRound(result, next)
      return
    }

    const rivalIndex = chooseRivalMove(next)

    if (rivalIndex !== undefined) {
      next[rivalIndex] = 'O'
    }

    const finalResult = checkWinner(next)
    if (finalResult) {
      finishRound(finalResult, next)
      return
    }

    setBoard(next)
  }

  const playFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
    if (!/^[1-9]$/.test(event.key)) return

    event.preventDefault()
    play(Number(event.key) - 1)
  })

  useEffect(() => {
    window.addEventListener('keydown', playFromKeyboard)
    return () => window.removeEventListener('keydown', playFromKeyboard)
  }, [])

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-sand to-[#f7fbff]">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl">
            <Sparkles className="h-5 w-5 text-coral" /> Jogo da velha colorido
          </CardTitle>
          <Pill tone="coral">{difficultyCopy[difficulty].tag}</Pill>
        </div>
        <CardDescription>Jogue contra a Luna, vença rodadas e descubra novas estrategias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque em uma casa livre" keyboard={['1-9']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundId}`} difficulty={difficulty} onExpire={expireRound} />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] bg-sand/70 p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Voce</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink">{roundScore.child}</p>
          </div>
          <div className="rounded-[22px] bg-[#f7fbff] p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Empates</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink">{roundScore.draws}</p>
          </div>
          <div className="rounded-[22px] bg-sky/15 p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Luna</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink">{roundScore.luna}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[30px] bg-white/70 p-2 shadow-inner sm:gap-3 sm:p-3">
          {board.map((cell, index) => {
            const highlighted = winningCells.includes(index)
            return (
              <button
                key={index}
                type="button"
                onClick={() => play(index)}
                aria-label={`Casa ${index + 1}${cell ? ` marcada com ${cell}` : ''}`}
                className={cn(
                  'flex min-h-[82px] touch-manipulation items-center justify-center rounded-[24px] text-4xl font-extrabold text-ink transition active:scale-95 sm:min-h-[112px] sm:text-5xl',
                  highlighted ? 'bg-sun shadow-[0_10px_24px_rgba(255,209,102,0.35)]' : 'bg-white hover:bg-sun/60',
                )}
              >
                {cell === 'X' ? '⭐' : cell === 'O' ? '🌙' : '·'}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{statusMessage(winner, 'X')}</GameStatus>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={resetBoard}>
              <RefreshCw className="h-4 w-4" /> Nova rodada
            </Button>
            <Button variant="secondary" size="sm" onClick={resetMatch}>
              Zerar placar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MemoryGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const pairCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8
  const [roundIndex, setRoundIndex] = useState(0)
  const theme = memoryThemes[roundIndex % memoryThemes.length]
  const deck = useMemo(
    () =>
      theme.emojis
        .slice(0, pairCount)
        .flatMap((item) => [item, item])
        .map((emoji, index) => ({ id: `${emoji}-${index}`, emoji })),
    [pairCount, theme],
  )
  const [cards, setCards] = useState(() => shuffle(deck))
  const [opened, setOpened] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [message, setMessage] = useState('Encontre todos os pares para ganhar estrelas.')
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'board-start', currentLevel: 1, maxLevel: pairCount, attemptDelta: 1, meta: { difficulty } })
  }, [difficulty, pairCount])

  const reset = () => {
    setCards(shuffle(deck))
    setOpened([])
    setMatched([])
    setMoves(0)
    setMessage('Encontre todos os pares para ganhar estrelas.')
    onProgress?.({ status: 'started', score: 0, currentPhase: 'board-reset', currentLevel: 1, maxLevel: pairCount, attemptDelta: 1, meta: { difficulty } })
  }

  const nextRound = () => {
    const nextIndex = nextRoundIndex(roundIndex, memoryThemes.length)
    const nextTheme = memoryThemes[nextIndex]
    const nextDeck = nextTheme.emojis
      .slice(0, pairCount)
      .flatMap((item) => [item, item])
      .map((emoji, index) => ({ id: `${emoji}-${index}`, emoji }))

    setRoundIndex(nextIndex)
    setCards(shuffle(nextDeck))
    setOpened([])
    setMatched([])
    setMoves(0)
    setMessage(`Nova rodada: ${nextTheme.name}.`)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'new-memory-round', currentLevel: 1, maxLevel: pairCount, attemptDelta: 1, meta: { difficulty, theme: nextTheme.name } })
  }

  const expireRound = () => {
    if (matched.length >= pairCount) return
    setMessage('O tempo acabou! Tente uma nova rodada com outro tema.')
    onProgress?.({ status: 'started', score: Math.max(5, matched.length * 10), currentPhase: 'time-expired', currentLevel: matched.length, maxLevel: pairCount, meta: { difficulty, theme: theme.name, moves } })
  }

  const reveal = (index: number) => {
    if (opened.includes(index) || matched.includes(cards[index].emoji) || opened.length === 2) return

    const nextOpened = [...opened, index]
    setOpened(nextOpened)

    if (nextOpened.length === 2) {
      const [first, second] = nextOpened
      const same = cards[first].emoji === cards[second].emoji
      const nextMoves = moves + 1
      setMoves(nextMoves)

      window.setTimeout(() => {
        if (same) {
          const nextMatched = [...matched, cards[first].emoji]
          const isDone = nextMatched.length === pairCount
          const perfectMoveLimit = pairCount + (difficulty === 'challenge' ? 3 : 2)
          const score = isDone ? (nextMoves <= perfectMoveLimit ? 100 : nextMoves <= perfectMoveLimit + 4 ? 90 : 75) : Math.min(90, nextMatched.length * 15)
          setMatched(nextMatched)
          setMessage(isDone ? 'Tabuleiro completo! Hora de comemorar.' : 'Par encontrado! Continue assim.')
          onProgress?.({ status: isDone ? 'completed' : 'started', score, currentPhase: isDone ? 'board-complete' : 'pair-found', currentLevel: nextMatched.length, maxLevel: pairCount, successDelta: isDone ? 1 : 0, meta: { difficulty, moves: nextMoves, pairs: nextMatched.length } })
          if (isDone) onComplete(score)
        } else {
          setMessage('Quase! Tente lembrar onde cada figura apareceu.')
          onProgress?.({ status: 'started', score: Math.max(10, 70 - nextMoves * 3), currentPhase: 'pair-miss', currentLevel: matched.length, maxLevel: pairCount, meta: { difficulty, moves: nextMoves, pairs: matched.length } })
        }
        setOpened([])
      }, 520)
    }
  }

  const stars = matched.length >= pairCount ? 3 : matched.length >= Math.ceil(pairCount * 0.66) ? 2 : matched.length >= Math.ceil(pairCount * 0.33) ? 1 : 0

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-[#f7fbff] to-sky/20">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl">
            <Trophy className="h-5 w-5 text-coral" /> Memoria encantada
          </CardTitle>
          <Pill tone="aqua">{theme.name}</Pill>
        </div>
        <CardDescription>Vire duas cartas por vez e tente completar o tabuleiro com poucos movimentos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque em duas cartas" keyboard={['Tab', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f7fbff] p-4">
          <div className="space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Movimentos</p>
            <p className="font-display text-3xl font-extrabold text-ink">{moves}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Estrelas</p>
            <div className="flex gap-1 text-sun">
              {Array.from({ length: 3 }).map((_, index) => (
                <Star key={index} className={cn('h-5 w-5', index < stars ? 'fill-current' : 'text-slate-300')} />
              ))}
            </div>
          </div>
        </div>

        <ProgressStrip value={(matched.length / pairCount) * 100} />

        <div className={cn('grid gap-2 sm:gap-3', pairCount >= 8 ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4')}>
          {cards.map((card, index) => {
            const visible = opened.includes(index) || matched.includes(card.emoji)
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => reveal(index)}
                aria-label={visible ? `Carta ${index + 1}: ${card.emoji}` : `Carta ${index + 1}`}
                className={cn(
                  'flex min-h-[78px] touch-manipulation items-center justify-center rounded-[24px] text-3xl transition active:scale-95 sm:min-h-[96px] sm:text-4xl',
                  visible ? 'bg-white shadow-sm ring-2 ring-sun/30' : 'bg-aqua/25 hover:-translate-y-0.5 hover:bg-aqua/40',
                )}
              >
                {visible ? card.emoji : '✨'}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{message}</GameStatus>
          <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Embaralhar
          </Button>
          <Button variant="secondary" size="sm" onClick={nextRound}>
            Nova rodada
          </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SequenceGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const palette = [
    { color: 'bg-coral', id: 'coral', label: 'Laranja' },
    { color: 'bg-sky', id: 'sky', label: 'Azul' },
    { color: 'bg-aqua', id: 'aqua', label: 'Turquesa' },
    { color: 'bg-sun', id: 'sun', label: 'Amarelo' },
    ...(difficulty === 'challenge' ? [{ color: 'bg-fuchsia-400', id: 'fuchsia', label: 'Roxo' }] : []),
  ]
  const maxLevel = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5
  const maxPatternLength = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 7

  const [level, setLevel] = useState(1)
  const [pattern, setPattern] = useState(['coral', 'sky', 'aqua'])
  const [attempt, setAttempt] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState('Copie a ordem das cores e avance de nivel.')
  const [roundId, setRoundId] = useState(0)
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  const startLevel = (nextLevel: number, countAttempt = false) => {
    const length = Math.min(3 + nextLevel - 1, maxPatternLength)
    setPattern(shuffle(palette.map((item) => item.id)).slice(0, length))
    setAttempt([])
    setCompleted(false)
    setRoundId((current) => current + 1)
    setMessage(nextLevel === 1 ? 'Copie a ordem das cores e avance de nivel.' : `Nivel ${nextLevel}: padrao maior, mais concentracao!`)
    onProgress?.({ status: 'started', score: Math.min(80, nextLevel * 20), currentPhase: 'level-start', currentLevel: nextLevel, maxLevel, attemptDelta: countAttempt ? 1 : 0, meta: { difficulty } })
  }

  const reset = () => {
    setLevel(1)
    startLevel(1, true)
  }

  const expireRound = () => {
    if (completed) return
    setMessage('O tempo acabou! Recomece e tente copiar com calma.')
    onProgress?.({ status: 'started', score: Math.max(5, attempt.length * 10), currentPhase: 'time-expired', currentLevel: level, maxLevel, meta: { difficulty, progressInLevel: attempt.length } })
  }

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'level-start', currentLevel: 1, maxLevel, attemptDelta: 1, meta: { difficulty } })
  }, [difficulty, maxLevel])

  const pick = (value: string) => {
    if (completed) return
    const nextAttempt = [...attempt, value]
    setAttempt(nextAttempt)

    const expected = pattern[nextAttempt.length - 1]
    if (expected !== value) {
      setMessage('Ops! A ordem mudou. Respire e tente de novo.')
      onProgress?.({ status: 'started', score: 20, currentPhase: 'level-miss', currentLevel: level, maxLevel, meta: { difficulty, progressInLevel: nextAttempt.length - 1 } })
      window.setTimeout(() => {
        setAttempt([])
      }, 350)
      return
    }

    if (nextAttempt.length === pattern.length) {
      if (level >= maxLevel) {
        setCompleted(true)
        setMessage('Sequencia perfeita! Missao completa.')
        onProgress?.({ status: 'completed', score: 100, currentPhase: 'all-levels-complete', currentLevel: maxLevel, maxLevel, successDelta: 1, meta: { difficulty } })
        onComplete(100)
        return
      }

      const nextLevel = level + 1
      setLevel(nextLevel)
      setMessage(`Boa! Voce venceu o nivel ${level}.`)
      onProgress?.({ status: 'started', score: 70 + level * 10, currentPhase: 'level-complete', currentLevel: level, maxLevel, meta: { difficulty, nextLevel } })
      window.setTimeout(() => {
        startLevel(nextLevel)
      }, 700)
    }
  }

  const pickFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return
    if (!/^[1-5]$/.test(event.key)) return

    const item = palette[Number(event.key) - 1]
    if (!item) return

    event.preventDefault()
    pick(item.id)
  })

  useEffect(() => {
    window.addEventListener('keydown', pickFromKeyboard)
    return () => window.removeEventListener('keydown', pickFromKeyboard)
  }, [])

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-mint to-sun/20">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl sm:text-3xl">
            <WandSparkles className="h-5 w-5 text-coral" /> Monte a sequencia
          </CardTitle>
          <Pill tone="sun">{`nivel ${level}/${maxLevel}`}</Pill>
        </div>
        <CardDescription>Memorize o padrao, toque nas cores certas e desbloqueie {maxLevel} niveis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque nas cores em ordem" keyboard={palette.map((_, index) => String(index + 1))} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundId}`} difficulty={difficulty} onExpire={expireRound} />

        <ProgressStrip value={(level / maxLevel) * 100} tone="sun" />

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {pattern.map((step, index) => {
            const item = palette.find((entry) => entry.id === step)
            return (
              <div key={`${step}-${index}`} className="space-y-2 text-center">
                <div className={cn('h-14 rounded-[22px] border-4 border-white shadow-sm sm:h-16', item?.color)} />
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">{index + 1}</p>
              </div>
            )
          })}
        </div>

        <div className={cn('grid grid-cols-2 gap-3', difficulty === 'challenge' ? 'sm:grid-cols-5' : 'sm:grid-cols-4')}>
          {palette.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              className={cn('min-h-16 touch-manipulation rounded-[24px] text-sm font-extrabold text-white shadow-sm transition active:scale-95 hover:-translate-y-0.5', item.color)}
            >
              <span className="mr-1 rounded-full bg-white/30 px-2 py-0.5">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <div>
            <p className="font-bold text-ink">{message}</p>
            <p className="mt-1 text-sm text-muted-ink">Acertos nesta rodada: {attempt.length}/{pattern.length}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Recomeçar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function WordSearchGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const round = wordSearchRounds[roundIndex % wordSearchRounds.length]
  const targetWords = round.words.slice(0, difficulty === 'easy' ? 4 : round.words.length)
  const [foundWords, setFoundWords] = useState<string[]>([])
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'word-search-start', currentLevel: 0, maxLevel: targetWords.length, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }, [difficulty, round.theme, targetWords.length])

  const toggleWord = (word: string) => {
    if (foundWords.includes(word)) return
    const next = [...foundWords, word]
    setFoundWords(next)
    const score = Math.min(100, Math.round((next.length / targetWords.length) * (difficulty === 'challenge' ? 100 : 96)))
    const isDone = next.length === targetWords.length
    onProgress?.({ status: isDone ? 'completed' : 'started', score, currentPhase: 'word-found', currentLevel: next.length, maxLevel: targetWords.length, successDelta: isDone ? 1 : 0, meta: { difficulty, theme: round.theme, foundWords: next } })
    if (isDone) onComplete(difficulty === 'challenge' ? 100 : 96)
  }

  const nextRound = () => {
    const nextIndex = nextRoundIndex(roundIndex, wordSearchRounds.length)
    const nextMaxLevel = difficulty === 'easy' ? 4 : wordSearchRounds[nextIndex].words.length
    setRoundIndex(nextIndex)
    setFoundWords([])
    onProgress?.({ status: 'started', score: 0, currentPhase: 'new-word-round', currentLevel: 0, maxLevel: nextMaxLevel, attemptDelta: 1, meta: { difficulty, theme: wordSearchRounds[nextIndex].theme } })
  }

  const expireRound = () => {
    if (foundWords.length >= targetWords.length) return
    onProgress?.({ status: 'started', score: Math.max(5, foundWords.length * 12), currentPhase: 'time-expired', currentLevel: foundWords.length, maxLevel: targetWords.length, meta: { difficulty, theme: round.theme, foundWords } })
  }

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-sand to-sun/20">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Caca-palavras da fazenda</CardTitle>
          <Pill tone="sun">{round.theme}</Pill>
        </div>
        <CardDescription>Observe a grade e toque em cada palavra quando conseguir encontra-la.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="encontre na grade e toque na palavra" keyboard={['Tab', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} />

        <ProgressStrip value={(foundWords.length / targetWords.length) * 100} tone="sun" />

        <div className="rounded-[28px] border border-dashed border-soft-border bg-white/75 p-3 font-display text-base font-black tracking-[0.14em] text-ink shadow-inner sm:p-4 sm:text-lg sm:tracking-[0.18em]">
          {round.rows.map((row) => (
            <div key={row} className="grid grid-cols-8 gap-1 py-1 sm:gap-2">
              {row.split('').map((letter, index) => (
                <span key={`${row}-${index}`} className="rounded-[10px] bg-sand/55 py-1 text-center">{letter}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {targetWords.map((word) => {
            const active = foundWords.includes(word)
            return (
              <button
                key={word}
                type="button"
                onClick={() => toggleWord(word)}
                className={cn(
                  'touch-manipulation rounded-[22px] px-4 py-3 text-sm font-extrabold transition active:scale-95',
                  active ? 'bg-aqua text-white shadow-sm' : 'bg-white text-ink shadow-sm hover:bg-sand',
                )}
              >
                {active ? '✓ ' : ''}{word}
              </button>
            )
          })}
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <GameStatus>{foundWords.length === targetWords.length ? 'Todas encontradas! Agora vale imprimir e resolver de novo no papel.' : `Palavras: ${foundWords.length}/${targetWords.length}. Toque na lista quando encontrar.`}</GameStatus>
            <Button variant="secondary" size="sm" onClick={nextRound}>Nova rodada</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MazeGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const round = mazeRounds[roundIndex % mazeRounds.length]
  const safeCells = new Set(difficulty === 'easy' ? [...round.safe, ...round.easyExtra] : round.safe)
  const goal = round.goal
  const [position, setPosition] = useState<[number, number]>([0, 0])
  const [collisions, setCollisions] = useState(0)
  const [stars, setStars] = useState<string[]>([])
  const [message, setMessage] = useState('Colete estrelas e encontre a saida brilhante.')
  const starCells = round.stars
  const maxLevel = starCells.length + 1
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'maze-start', currentLevel: 1, maxLevel, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }, [difficulty, maxLevel, round.theme])

  const move = (rowDelta: number, colDelta: number) => {
    const next: [number, number] = [position[0] + rowDelta, position[1] + colDelta]
    if (next[0] < 0 || next[0] > 4 || next[1] < 0 || next[1] > 4) return
    const key = `${next[0]}-${next[1]}`

    if (!safeCells.has(key)) {
      const nextCollisions = collisions + 1
      setCollisions(nextCollisions)
      setMessage('Asteroide no caminho! Volte para a trilha clara.')
      const penalty = difficulty === 'challenge' ? 14 : 10
      onProgress?.({ status: 'started', score: Math.max(10, 70 - nextCollisions * penalty), currentPhase: 'maze-bump', currentLevel: stars.length + 1, maxLevel, meta: { difficulty, theme: round.theme, collisions: nextCollisions } })
      return
    }

    setPosition(next)
    const nextStars = starCells.includes(key) && !stars.includes(key) ? [...stars, key] : stars
    if (nextStars !== stars) setStars(nextStars)

    if (key === goal) {
      if (difficulty === 'challenge' && nextStars.length < starCells.length) {
        setMessage('No modo desafio, pegue as duas estrelas antes de pousar.')
        onProgress?.({ status: 'started', score: 72, currentPhase: 'maze-need-stars', currentLevel: nextStars.length + 1, maxLevel, meta: { difficulty, theme: round.theme, stars: nextStars.length, collisions } })
        return
      }

      const score = Math.max(70, 100 - collisions * 8 + nextStars.length * 5)
      setMessage('Pouso perfeito! Missao espacial concluida.')
      onProgress?.({ status: 'completed', score, currentPhase: 'maze-finish', currentLevel: nextStars.length + 1, maxLevel, successDelta: 1, meta: { difficulty, theme: round.theme, stars: nextStars.length, collisions } })
      onComplete(score)
      return
    }

    setMessage(nextStars.length > stars.length ? 'Estrela coletada! Continue pela trilha.' : 'Boa rota! Continue planejando o caminho.')
    onProgress?.({ status: 'started', score: 30 + nextStars.length * 20, currentPhase: 'maze-progress', currentLevel: nextStars.length + 1, maxLevel, meta: { difficulty, theme: round.theme, position: key, collisions } })
  }

  const reset = () => {
    setPosition([0, 0])
    setCollisions(0)
    setStars([])
    setMessage('Colete estrelas e encontre a saida brilhante.')
    onProgress?.({ status: 'started', score: 0, currentPhase: 'maze-reset', currentLevel: 1, maxLevel, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }

  const nextRound = () => {
    const nextIndex = nextRoundIndex(roundIndex, mazeRounds.length)
    setRoundIndex(nextIndex)
    setPosition([0, 0])
    setCollisions(0)
    setStars([])
    setMessage(`Nova missão: ${mazeRounds[nextIndex].theme}.`)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'new-maze-round', currentLevel: 1, maxLevel: mazeRounds[nextIndex].stars.length + 1, attemptDelta: 1, meta: { difficulty, theme: mazeRounds[nextIndex].theme } })
  }

  const expireRound = () => {
    if (position[0] === Number(goal[0]) && position[1] === Number(goal[2])) return
    setMessage('O tempo acabou! Tente uma nova rota espacial.')
    onProgress?.({ status: 'started', score: Math.max(5, stars.length * 20), currentPhase: 'time-expired', currentLevel: stars.length + 1, maxLevel, meta: { difficulty, theme: round.theme, collisions } })
  }

  const moveFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      w: [-1, 0],
      W: [-1, 0],
      ArrowDown: [1, 0],
      s: [1, 0],
      S: [1, 0],
      ArrowLeft: [0, -1],
      a: [0, -1],
      A: [0, -1],
      ArrowRight: [0, 1],
      d: [0, 1],
      D: [0, 1],
    }
    const nextMove = moves[event.key]
    if (!nextMove) return

    event.preventDefault()
    move(nextMove[0], nextMove[1])
  })

  useEffect(() => {
    window.addEventListener('keydown', moveFromKeyboard)
    return () => window.removeEventListener('keydown', moveFromKeyboard)
  }, [])

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-[#f7fbff] to-aqua/20">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Labirinto do foguete</CardTitle>
          <Pill tone="aqua">{round.theme}</Pill>
        </div>
        <CardDescription>Use os botoes para mover o foguete pela trilha segura ate a estrela final.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque nas casas vizinhas ou nos botoes" keyboard={['Setas', 'WASD']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} />

        <ProgressStrip value={((stars.length + (position[0] === 4 && position[1] === 4 ? 1 : 0)) / 3) * 100} />

        <div className="grid grid-cols-5 gap-2 rounded-[28px] bg-white/75 p-3 shadow-inner sm:p-4">
          {Array.from({ length: 25 }).map((_, index) => {
            const row = Math.floor(index / 5)
            const col = index % 5
            const key = `${row}-${col}`
            const isSafe = safeCells.has(key)
            const isActive = position[0] === row && position[1] === col
            const isGoal = key === goal
            const hasStar = stars.includes(key) || starCells.includes(key)
            const isAdjacent = Math.abs(position[0] - row) + Math.abs(position[1] - col) === 1
            return (
              <button
                key={key}
                type="button"
                onClick={() => isAdjacent && move(row - position[0], col - position[1])}
                aria-label={`Casa ${row + 1}-${col + 1}`}
                className={cn(
                  'flex aspect-square touch-manipulation items-center justify-center rounded-[18px] text-lg font-bold transition active:scale-95 sm:text-2xl',
                  isSafe ? 'bg-white' : 'bg-ink/8',
                  isGoal && 'ring-2 ring-sun/60',
                  isActive && 'bg-coral text-white shadow-sm',
                  isAdjacent && isSafe && !isActive && 'ring-2 ring-aqua/25 hover:bg-sand',
                )}
              >
                {isActive ? '🚀' : isGoal ? '⭐' : hasStar && isSafe ? '✨' : ''}
              </button>
            )
          })}
        </div>
        <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
          <div />
          <Button variant="secondary" onClick={() => move(-1, 0)}>Cima</Button>
          <div />
          <Button variant="secondary" onClick={() => move(0, -1)}>Esq</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <Button variant="secondary" onClick={() => move(0, 1)}>Dir</Button>
          <div />
          <Button variant="secondary" onClick={() => move(1, 0)}>Baixo</Button>
          <div />
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <GameStatus>{`Estrelas: ${stars.length}/${starCells.length}. Colisoes: ${collisions}. ${message}`}</GameStatus>
            <Button variant="secondary" size="sm" onClick={nextRound}>Nova rodada</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectDotsGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const points = CONNECT_DOT_POINTS.slice(0, difficulty === 'easy' ? 8 : difficulty === 'medium' ? 12 : 16)
  const [nextExpected, setNextExpected] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [roundId, setRoundId] = useState(0)
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'connect-start', currentLevel: 1, maxLevel: points.length, attemptDelta: 1, meta: { difficulty } })
  }, [difficulty, points.length])

  const clickPoint = (label: string) => {
    const expected = String(nextExpected)
    if (label !== expected) {
      const nextMistakes = mistakes + 1
      setMistakes(nextMistakes)
      onProgress?.({ status: 'started', score: Math.max(5, 60 - nextMistakes * 5), currentPhase: 'connect-miss', currentLevel: nextExpected, maxLevel: points.length, meta: { difficulty, mistakes: nextMistakes } })
      return
    }

    const upcoming = nextExpected + 1
    if (upcoming > points.length) {
      onProgress?.({ status: 'completed', score: Math.max(80, 100 - mistakes * 4), currentPhase: 'connect-complete', currentLevel: points.length, maxLevel: points.length, successDelta: 1, meta: { difficulty, mistakes } })
      onComplete(Math.max(80, 100 - mistakes * 4))
      setNextExpected(upcoming)
      return
    }

    setNextExpected(upcoming)
    onProgress?.({ status: 'started', score: upcoming * 7, currentPhase: 'connect-progress', currentLevel: upcoming, maxLevel: points.length, meta: { difficulty, mistakes } })
  }

  const reset = () => {
    setNextExpected(1)
    setMistakes(0)
    setRoundId((current) => current + 1)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'connect-reset', currentLevel: 1, maxLevel: points.length, attemptDelta: 1, meta: { difficulty } })
  }

  const expireRound = () => {
    if (nextExpected > points.length) return
    onProgress?.({ status: 'started', score: Math.max(5, nextExpected * 5), currentPhase: 'time-expired', currentLevel: nextExpected, maxLevel: points.length, meta: { difficulty, mistakes } })
  }

  const clickFromKeyboard = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault()
      clickPoint(event.key)
      return
    }

    if ((event.key === 'Enter' || event.key === ' ') && target?.tagName !== 'BUTTON') {
      event.preventDefault()
      clickPoint(String(nextExpected))
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', clickFromKeyboard)
    return () => window.removeEventListener('keydown', clickFromKeyboard)
  }, [])

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-sand to-coral/15">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Ligue os pontos do dragao</CardTitle>
          <Pill tone="sun">{`${Math.min(nextExpected - 1, points.length)}/${points.length}`}</Pill>
        </div>
        <CardDescription>Toque nos numeros em ordem. O desenho aparece aos poucos e a etapa final revela o dragao.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque nos numeros em ordem" keyboard={['1-9', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundId}`} difficulty={difficulty} onExpire={expireRound} />

        <ProgressStrip value={(Math.min(nextExpected - 1, points.length) / points.length) * 100} tone="coral" />

        <div className="grid grid-cols-4 gap-3 rounded-[28px] border border-dashed border-soft-border bg-white/75 p-4 text-center text-sm font-bold text-ink shadow-inner sm:gap-6 sm:p-6">
            {points.map((label, index) => {
            const numeric = index + 1
            const done = numeric < nextExpected
            const current = numeric === nextExpected
            return (
              <button
                key={label}
                type="button"
                onClick={() => clickPoint(label)}
                className={cn(
                  'mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 transition',
                  'touch-manipulation active:scale-95 sm:h-12 sm:w-12',
                  done ? 'border-aqua bg-aqua text-white' : current ? 'border-coral bg-white text-coral ring-4 ring-coral/15' : 'border-ink/25 bg-white text-ink hover:bg-[#f7fbff]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{nextExpected > points.length ? 'Dragao revelado! Agora vale imprimir para colorir.' : `Procure o numero ${nextExpected}. Erros ate agora: ${mistakes}.`}</GameStatus>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Recomeçar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuizGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('Escolha a resposta que combina com a pergunta.')
  const round = quizRounds[roundIndex % quizRounds.length]
  const questions = round.questions.slice(0, difficulty === 'easy' ? 2 : 3)
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'quiz-start', currentLevel: 1, maxLevel: questions.length, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }, [difficulty, questions.length, round.theme])

  const answer = (option: string) => {
    const question = questions[currentQuestion]
    const correct = option === question.answer
    const nextScore = score + (correct ? 1 : 0)
    setScore(nextScore)

    if (currentQuestion + 1 >= questions.length) {
      const finalScore = Math.round((nextScore / questions.length) * 100)
      setMessage(correct ? 'Quiz completo com brilho!' : 'Quiz completo. Vale tentar outra rodada!')
      onProgress?.({ status: 'completed', score: finalScore, currentPhase: 'quiz-complete', currentLevel: questions.length, maxLevel: questions.length, successDelta: finalScore >= 70 ? 1 : 0, meta: { difficulty, theme: round.theme } })
      onComplete(finalScore)
      return
    }

    setMessage(correct ? 'Acertou! Próxima pergunta.' : `Quase! A resposta era ${question.answer}.`)
    setCurrentQuestion((current) => current + 1)
    onProgress?.({ status: 'started', score: Math.round((nextScore / questions.length) * 100), currentPhase: correct ? 'quiz-hit' : 'quiz-miss', currentLevel: currentQuestion + 2, maxLevel: questions.length, meta: { difficulty, theme: round.theme } })
  }

  const nextRound = () => {
    setRoundIndex((current) => nextRoundIndex(current, quizRounds.length))
    setCurrentQuestion(0)
    setScore(0)
    setMessage('Nova rodada de perguntas!')
  }

  const expireRound = () => {
    setMessage('O tempo acabou! Comece outra rodada de quiz.')
    onProgress?.({ status: 'started', score: Math.round((score / questions.length) * 100), currentPhase: 'time-expired', currentLevel: currentQuestion + 1, maxLevel: questions.length, meta: { difficulty, theme: round.theme } })
  }

  const question = questions[currentQuestion]

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-sky/15 to-sun/20">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Quiz relampago</CardTitle>
          <Pill tone="aqua">{round.theme}</Pill>
        </div>
        <CardDescription>Leia a pergunta, toque na resposta e avance por uma rodada curtinha.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque na resposta" keyboard={['Tab', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} seconds={difficulty === 'medium' ? 60 : timeLimits[difficulty]} />
        <ProgressStrip value={(currentQuestion / questions.length) * 100} />
        <div className="rounded-[28px] bg-white/85 p-5 shadow-inner">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Pergunta {currentQuestion + 1}/{questions.length}</p>
          <p className="mt-3 font-display text-3xl font-extrabold text-ink">{question.prompt}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {question.options.map((option) => (
            <button key={option} type="button" onClick={() => answer(option)} className="touch-manipulation rounded-[24px] bg-white px-4 py-5 text-lg font-extrabold text-ink shadow-sm transition active:scale-95 hover:bg-sand">
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{message}</GameStatus>
          <Button variant="secondary" size="sm" onClick={nextRound}>Nova rodada</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MathStarsGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [currentProblem, setCurrentProblem] = useState(0)
  const [hits, setHits] = useState(0)
  const [message, setMessage] = useState('Conte os itens e escolha o numero certo.')
  const round = mathRounds[roundIndex % mathRounds.length]
  const problems = round.problems
  const maxOption = difficulty === 'challenge' ? 9 : 7
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'math-start', currentLevel: 1, maxLevel: problems.length, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }, [difficulty, problems.length, round.theme])

  const choose = (value: number) => {
    const problem = problems[currentProblem]
    const correct = value === problem.answer
    const nextHits = hits + (correct ? 1 : 0)
    setHits(nextHits)

    if (currentProblem + 1 >= problems.length) {
      const finalScore = Math.round((nextHits / problems.length) * 100)
      setMessage('Rodada de continhas completa!')
      onProgress?.({ status: 'completed', score: finalScore, currentPhase: 'math-complete', currentLevel: problems.length, maxLevel: problems.length, successDelta: finalScore >= 70 ? 1 : 0, meta: { difficulty, theme: round.theme } })
      onComplete(finalScore)
      return
    }

    setMessage(correct ? 'Boa conta! Mais uma.' : `Quase! O resultado era ${problem.answer}.`)
    setCurrentProblem((current) => current + 1)
    onProgress?.({ status: 'started', score: Math.round((nextHits / problems.length) * 100), currentPhase: correct ? 'math-hit' : 'math-miss', currentLevel: currentProblem + 2, maxLevel: problems.length, meta: { difficulty, theme: round.theme } })
  }

  const nextRound = () => {
    setRoundIndex((current) => nextRoundIndex(current, mathRounds.length))
    setCurrentProblem(0)
    setHits(0)
    setMessage('Nova rodada de continhas!')
  }

  const expireRound = () => {
    setMessage('O tempo acabou! Faça outra rodada com calma.')
    onProgress?.({ status: 'started', score: Math.round((hits / problems.length) * 100), currentPhase: 'time-expired', currentLevel: currentProblem + 1, maxLevel: problems.length, meta: { difficulty, theme: round.theme } })
  }

  const problem = problems[currentProblem]

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-sand to-aqua/15">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Conta estrelinhas</CardTitle>
          <Pill tone="sun">{round.theme}</Pill>
        </div>
        <CardDescription>Resolva continhas simples com apoio visual e resposta grande para tocar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque no resultado" keyboard={['Tab', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} seconds={difficulty === 'medium' ? 75 : timeLimits[difficulty]} />
        <ProgressStrip value={(currentProblem / problems.length) * 100} tone="sun" />
        <div className="rounded-[28px] bg-white/85 p-5 text-center shadow-inner">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Problema {currentProblem + 1}/{problems.length}</p>
          <p className="mt-3 font-display text-5xl font-extrabold text-ink">{problem.prompt}</p>
          <p className="mt-3 text-4xl">{Array.from({ length: problem.answer }).map((_, index) => <span key={index}>{round.items}</span>)}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: maxOption }, (_, index) => index + 1).map((value) => (
            <button key={value} type="button" onClick={() => choose(value)} className="touch-manipulation rounded-[22px] bg-white px-4 py-4 font-display text-2xl font-extrabold text-ink shadow-sm transition active:scale-95 hover:bg-sand">
              {value}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{message}</GameStatus>
          <Button variant="secondary" size="sm" onClick={nextRound}>Nova rodada</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SyllableGame({ onComplete, onProgress, difficulty = 'easy' }: MiniGameProps) {
  const [roundIndex, setRoundIndex] = useState(0)
  const [currentWord, setCurrentWord] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [hits, setHits] = useState(0)
  const [message, setMessage] = useState('Monte a palavra tocando nas silabas em ordem.')
  const round = syllableRounds[roundIndex % syllableRounds.length]
  const words = round.words.slice(0, difficulty === 'easy' ? 2 : 3)
  const word = words[currentWord]
  const options = useMemo(() => shuffle([...word.syllables, ...(difficulty === 'challenge' ? ['LA', 'MI'] : [])]), [difficulty, word])
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'syllable-start', currentLevel: 1, maxLevel: words.length, attemptDelta: 1, meta: { difficulty, theme: round.theme } })
  }, [difficulty, round.theme, words.length])

  const choose = (syllable: string) => {
    const expected = word.syllables[picked.length]
    if (syllable !== expected) {
      setMessage(`Quase! A próxima sílaba era ${expected}.`)
      setPicked([])
      onProgress?.({ status: 'started', score: Math.round((hits / words.length) * 100), currentPhase: 'syllable-miss', currentLevel: currentWord + 1, maxLevel: words.length, meta: { difficulty, theme: round.theme } })
      return
    }

    const nextPicked = [...picked, syllable]
    setPicked(nextPicked)
    if (nextPicked.length < word.syllables.length) {
      setMessage('Boa! Continue a palavra.')
      return
    }

    const nextHits = hits + 1
    setHits(nextHits)
    setPicked([])
    if (currentWord + 1 >= words.length) {
      const finalScore = Math.round((nextHits / words.length) * 100)
      setMessage('Palavras montadas!')
      onProgress?.({ status: 'completed', score: finalScore, currentPhase: 'syllable-complete', currentLevel: words.length, maxLevel: words.length, successDelta: finalScore >= 70 ? 1 : 0, meta: { difficulty, theme: round.theme } })
      onComplete(finalScore)
      return
    }

    setCurrentWord((current) => current + 1)
    setMessage('Palavra formada! Próxima.')
  }

  const nextRound = () => {
    setRoundIndex((current) => nextRoundIndex(current, syllableRounds.length))
    setCurrentWord(0)
    setPicked([])
    setHits(0)
    setMessage('Nova rodada de silabas!')
  }

  const expireRound = () => {
    setMessage('O tempo acabou! Tente montar outra palavra.')
    onProgress?.({ status: 'started', score: Math.round((hits / words.length) * 100), currentPhase: 'time-expired', currentLevel: currentWord + 1, maxLevel: words.length, meta: { difficulty, theme: round.theme } })
  }

  return (
    <Card className="print-card overflow-hidden bg-gradient-to-br from-white via-mint to-coral/10">
      <CardHeader className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl sm:text-3xl">Arrume as silabas</CardTitle>
          <Pill tone="aqua">{round.theme}</Pill>
        </div>
        <CardDescription>Toque nas silabas em ordem para formar palavras curtas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <ControlHint touch="toque nas silabas" keyboard={['Tab', 'Enter']} difficulty={difficulty} />
        <TimerPanel key={`${difficulty}-${roundIndex}`} difficulty={difficulty} onExpire={expireRound} seconds={difficulty === 'medium' ? 75 : timeLimits[difficulty]} />
        <ProgressStrip value={(currentWord / words.length) * 100} />
        <div className="rounded-[28px] bg-white/85 p-5 text-center shadow-inner">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">Palavra {currentWord + 1}/{words.length}</p>
          <p className="mt-3 font-display text-5xl font-extrabold tracking-[0.12em] text-ink">{word.word}</p>
          <p className="mt-3 text-sm font-bold text-muted-ink">Montado: {picked.length > 0 ? picked.join('-') : '...'}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {options.map((syllable, index) => (
            <button key={`${syllable}-${index}`} type="button" onClick={() => choose(syllable)} className="touch-manipulation rounded-[24px] bg-white px-4 py-5 font-display text-2xl font-extrabold text-ink shadow-sm transition active:scale-95 hover:bg-sand">
              {syllable}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-white/85 p-4">
          <GameStatus>{message}</GameStatus>
          <Button variant="secondary" size="sm" onClick={nextRound}>Nova rodada</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorksheetGame({ slug, onComplete, onProgress, difficulty = 'easy' }: MiniGameProps & { slug: WorksheetSlug }) {
  if (slug === 'caca-palavras-da-fazenda') {
    return <WordSearchGame difficulty={difficulty} onComplete={onComplete} onProgress={onProgress} />
  }

  if (slug === 'labirinto-do-foguete') {
    return <MazeGame difficulty={difficulty} onComplete={onComplete} onProgress={onProgress} />
  }

  return <ConnectDotsGame difficulty={difficulty} onComplete={onComplete} onProgress={onProgress} />
}
