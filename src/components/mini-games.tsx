import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { RefreshCw, Sparkles, Star, Trophy, WandSparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
}

type WorksheetSlug = 'caca-palavras-da-fazenda' | 'labirinto-do-foguete' | 'ligue-os-pontos-do-dragao'
const FARM_WORDS = ['VACA', 'GATO', 'PATO', 'OVELHA', 'MILHO', 'TRATOR']
const CONNECT_DOT_POINTS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

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
  return <p className="max-w-md text-sm font-bold text-ink">{children}</p>
}

function statusMessage(winner: string | null, player: string) {
  if (winner === player) return 'Voce venceu esta rodada!'
  if (winner === 'draw') return 'Empate divertido!'
  if (winner) return 'A Luna ganhou desta vez. Tente outra estrategia!'
  return 'Sua vez!'
}

export function TicTacToeGame({ onComplete, onProgress }: MiniGameProps) {
  const [board, setBoard] = useState(Array(9).fill(''))
  const [winner, setWinner] = useState<string | null>(null)
  const [winningCells, setWinningCells] = useState<number[]>([])
  const [roundScore, setRoundScore] = useState({ child: 0, luna: 0, draws: 0 })
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

  const resetBoard = () => {
    setBoard(Array(9).fill(''))
    setWinner(null)
    setWinningCells([])
    onProgress?.({ status: 'started', score: 0, currentPhase: 'new-round', currentLevel: 1, maxLevel: 1, attemptDelta: 1, meta: { roundScore } })
  }

  const resetMatch = () => {
    setBoard(Array(9).fill(''))
    setWinner(null)
    setWinningCells([])
    setRoundScore({ child: 0, luna: 0, draws: 0 })
    onProgress?.({ status: 'started', score: 0, currentPhase: 'match-reset', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
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

  const play = (index: number) => {
    if (board[index] || winner) return
    const next = [...board]
    next[index] = 'X'
    const result = checkWinner(next)
    if (result) {
      finishRound(result, next)
      return
    }

    const available = next.map((value, idx) => (value ? null : idx)).filter((value): value is number => value !== null)
    const center = available.includes(4) ? 4 : null
    const rivalIndex = center ?? available[0]

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

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-coral" /> Jogo da velha colorido
          </CardTitle>
          <Pill tone="coral">duelo rapido</Pill>
        </div>
        <CardDescription>Jogue contra a Luna, vença rodadas e descubra novas estrategias.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => {
            const highlighted = winningCells.includes(index)
            return (
              <button
                key={index}
                type="button"
                onClick={() => play(index)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-[24px] text-3xl font-extrabold text-ink transition hover:-translate-y-0.5',
                  highlighted ? 'bg-sun shadow-[0_10px_24px_rgba(255,209,102,0.35)]' : 'bg-sand hover:bg-sun/60',
                )}
              >
                {cell || '·'}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f7fbff] p-4">
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

export function MemoryGame({ onComplete, onProgress }: MiniGameProps) {
  const deck = useMemo(
    () =>
      ['🦊', '🐳', '🌈', '🚀', '🍎', '🎈']
        .flatMap((item) => [item, item])
        .map((emoji, index) => ({ id: `${emoji}-${index}`, emoji })),
    [],
  )
  const [cards, setCards] = useState(() => shuffle(deck))
  const [opened, setOpened] = useState<number[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [message, setMessage] = useState('Encontre todos os pares para ganhar estrelas.')

  useEffect(() => {
    onProgress?.({ status: 'started', score: 0, currentPhase: 'board-start', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
  }, [onProgress])

  const reset = () => {
    setCards(shuffle(deck))
    setOpened([])
    setMatched([])
    setMoves(0)
    setMessage('Encontre todos os pares para ganhar estrelas.')
    onProgress?.({ status: 'started', score: 0, currentPhase: 'board-reset', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
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
          const isDone = nextMatched.length === 6
          const score = isDone ? (nextMoves <= 8 ? 100 : nextMoves <= 12 ? 90 : 75) : Math.min(90, nextMatched.length * 15)
          setMatched(nextMatched)
          setMessage(isDone ? 'Tabuleiro completo! Hora de comemorar.' : 'Par encontrado! Continue assim.')
          onProgress?.({ status: isDone ? 'completed' : 'started', score, currentPhase: isDone ? 'board-complete' : 'pair-found', currentLevel: nextMatched.length, maxLevel: 6, successDelta: isDone ? 1 : 0, meta: { moves: nextMoves, pairs: nextMatched.length } })
          if (isDone) onComplete(score)
        } else {
          setMessage('Quase! Tente lembrar onde cada figura apareceu.')
          onProgress?.({ status: 'started', score: Math.max(10, 70 - nextMoves * 3), currentPhase: 'pair-miss', currentLevel: matched.length, maxLevel: 6, meta: { moves: nextMoves, pairs: matched.length } })
        }
        setOpened([])
      }, 520)
    }
  }

  const stars = matched.length >= 6 ? 3 : matched.length >= 4 ? 2 : matched.length >= 2 ? 1 : 0

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-5 w-5 text-coral" /> Memoria encantada
          </CardTitle>
          <Pill tone="aqua">pares magicos</Pill>
        </div>
        <CardDescription>Vire duas cartas por vez e tente completar o tabuleiro com poucos movimentos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="grid grid-cols-4 gap-3">
          {cards.map((card, index) => {
            const visible = opened.includes(index) || matched.includes(card.emoji)
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => reveal(index)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-[24px] text-3xl transition',
                  visible ? 'bg-white shadow-sm ring-2 ring-sun/30' : 'bg-aqua/25 hover:-translate-y-0.5 hover:bg-aqua/40',
                )}
              >
                {visible ? card.emoji : '✨'}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f7fbff] p-4">
          <GameStatus>{message}</GameStatus>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Embaralhar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SequenceGame({ onComplete, onProgress }: MiniGameProps) {
  const palette = [
    { color: 'bg-coral', id: 'coral', label: 'Laranja' },
    { color: 'bg-sky', id: 'sky', label: 'Azul' },
    { color: 'bg-aqua', id: 'aqua', label: 'Turquesa' },
    { color: 'bg-sun', id: 'sun', label: 'Amarelo' },
  ]

  const [level, setLevel] = useState(1)
  const [pattern, setPattern] = useState(['coral', 'sky', 'aqua'])
  const [attempt, setAttempt] = useState<string[]>([])
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState('Copie a ordem das cores e avance de nivel.')
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  const startLevel = (nextLevel: number, countAttempt = false) => {
    const length = Math.min(3 + nextLevel - 1, 6)
    setPattern(shuffle(palette.map((item) => item.id)).slice(0, length))
    setAttempt([])
    setCompleted(false)
    setMessage(nextLevel === 1 ? 'Copie a ordem das cores e avance de nivel.' : `Nivel ${nextLevel}: padrao maior, mais concentracao!`)
    onProgress?.({ status: 'started', score: Math.min(80, nextLevel * 20), currentPhase: 'level-start', currentLevel: nextLevel, maxLevel: 3, attemptDelta: countAttempt ? 1 : 0 })
  }

  const reset = () => {
    setLevel(1)
    startLevel(1, true)
  }

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'level-start', currentLevel: 1, maxLevel: 3, attemptDelta: 1 })
  }, [])

  const pick = (value: string) => {
    if (completed) return
    const nextAttempt = [...attempt, value]
    setAttempt(nextAttempt)

    const expected = pattern[nextAttempt.length - 1]
    if (expected !== value) {
      setMessage('Ops! A ordem mudou. Respire e tente de novo.')
      onProgress?.({ status: 'started', score: 20, currentPhase: 'level-miss', currentLevel: level, maxLevel: 3, meta: { progressInLevel: nextAttempt.length - 1 } })
      window.setTimeout(() => {
        setAttempt([])
      }, 350)
      return
    }

    if (nextAttempt.length === pattern.length) {
      if (level >= 3) {
        setCompleted(true)
        setMessage('Sequencia perfeita! Missao completa.')
        onProgress?.({ status: 'completed', score: 100, currentPhase: 'all-levels-complete', currentLevel: 3, maxLevel: 3, successDelta: 1 })
        onComplete(100)
        return
      }

      const nextLevel = level + 1
      setLevel(nextLevel)
      setMessage(`Boa! Voce venceu o nivel ${level}.`)
      onProgress?.({ status: 'started', score: 70 + level * 10, currentPhase: 'level-complete', currentLevel: level, maxLevel: 3, meta: { nextLevel } })
      window.setTimeout(() => {
        startLevel(nextLevel)
      }, 700)
    }
  }

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <WandSparkles className="h-5 w-5 text-coral" /> Monte a sequencia
          </CardTitle>
          <Pill tone="sun">{`nivel ${level}`}</Pill>
        </div>
        <CardDescription>Memorize o padrao, toque nas cores certas e desbloqueie tres niveis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {pattern.map((step, index) => {
            const item = palette.find((entry) => entry.id === step)
            return (
              <div key={`${step}-${index}`} className="space-y-2 text-center">
                <div className={cn('h-16 rounded-[24px] shadow-sm', item?.color)} />
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted-ink">{index + 1}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {palette.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              className={cn('h-16 rounded-[24px] text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5', item.color)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f7fbff] p-4">
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

function WordSearchGame({ onComplete, onProgress }: MiniGameProps) {
  const [foundWords, setFoundWords] = useState<string[]>([])
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'word-search-start', currentLevel: 0, maxLevel: FARM_WORDS.length, attemptDelta: 1 })
  }, [])

  const toggleWord = (word: string) => {
    if (foundWords.includes(word)) return
    const next = [...foundWords, word]
    setFoundWords(next)
    const score = Math.min(100, next.length * 16)
    const isDone = next.length === FARM_WORDS.length
    onProgress?.({ status: isDone ? 'completed' : 'started', score, currentPhase: 'word-found', currentLevel: next.length, maxLevel: FARM_WORDS.length, successDelta: isDone ? 1 : 0, meta: { foundWords: next } })
    if (isDone) onComplete(96)
  }

  const rows = ['VACAOQTR', 'GATOBMIL', 'MILHOPAZ', 'PATOREIS', 'TRATORUZ', 'OVELHAQC']

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl">Caca-palavras da fazenda</CardTitle>
          <Pill tone="sun">{`${foundWords.length}/${FARM_WORDS.length} palavras`}</Pill>
        </div>
        <CardDescription>Observe a grade e toque em cada palavra quando conseguir encontra-la.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[24px] border border-dashed border-soft-border bg-sand/35 p-4 font-display text-lg font-bold tracking-[0.18em] text-ink">
          {rows.map((row) => (
            <div key={row} className="grid grid-cols-8 gap-2 py-1">
              {row.split('').map((letter, index) => (
                <span key={`${row}-${index}`} className="text-center">{letter}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {FARM_WORDS.map((word) => {
            const active = foundWords.includes(word)
            return (
              <button
                key={word}
                type="button"
                onClick={() => toggleWord(word)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-extrabold transition',
                  active ? 'bg-aqua text-white shadow-sm' : 'bg-[#f7fbff] text-ink hover:bg-sand',
                )}
              >
                {word}
              </button>
            )
          })}
        </div>
        <GameStatus>{foundWords.length === FARM_WORDS.length ? 'Todas encontradas! Agora vale imprimir e resolver de novo no papel.' : 'Toque nas palavras a medida que voce as encontra na grade.'}</GameStatus>
      </CardContent>
    </Card>
  )
}

function MazeGame({ onComplete, onProgress }: MiniGameProps) {
  const safeCells = new Set(['0-0', '1-0', '2-0', '2-1', '2-2', '3-2', '4-2', '4-3', '4-4'])
  const goal = '4-4'
  const [position, setPosition] = useState<[number, number]>([0, 0])
  const [collisions, setCollisions] = useState(0)
  const [stars, setStars] = useState<string[]>([])
  const starCells = ['2-1', '4-3']
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'maze-start', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
  }, [])

  const move = (rowDelta: number, colDelta: number) => {
    const next: [number, number] = [position[0] + rowDelta, position[1] + colDelta]
    if (next[0] < 0 || next[0] > 4 || next[1] < 0 || next[1] > 4) return
    const key = `${next[0]}-${next[1]}`

    if (!safeCells.has(key)) {
      const nextCollisions = collisions + 1
      setCollisions(nextCollisions)
      onProgress?.({ status: 'started', score: Math.max(10, 70 - nextCollisions * 10), currentPhase: 'maze-bump', currentLevel: stars.length, maxLevel: 3, meta: { collisions: nextCollisions } })
      return
    }

    setPosition(next)
    const nextStars = starCells.includes(key) && !stars.includes(key) ? [...stars, key] : stars
    if (nextStars !== stars) setStars(nextStars)

    if (key === goal) {
      const score = Math.max(70, 100 - collisions * 8 + nextStars.length * 5)
      onProgress?.({ status: 'completed', score, currentPhase: 'maze-finish', currentLevel: nextStars.length + 1, maxLevel: 3, successDelta: 1, meta: { stars: nextStars.length, collisions } })
      onComplete(score)
      return
    }

    onProgress?.({ status: 'started', score: 30 + nextStars.length * 20, currentPhase: 'maze-progress', currentLevel: nextStars.length + 1, maxLevel: 3, meta: { position: key, collisions } })
  }

  const reset = () => {
    setPosition([0, 0])
    setCollisions(0)
    setStars([])
    onProgress?.({ status: 'started', score: 0, currentPhase: 'maze-reset', currentLevel: 1, maxLevel: 1, attemptDelta: 1 })
  }

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl">Labirinto do foguete</CardTitle>
          <Pill tone="aqua">{`${stars.length}/2 estrelas`}</Pill>
        </div>
        <CardDescription>Use os botoes para mover o foguete pela trilha segura ate a estrela final.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-5 gap-2 rounded-[24px] bg-[#f7fbff] p-4">
          {Array.from({ length: 25 }).map((_, index) => {
            const row = Math.floor(index / 5)
            const col = index % 5
            const key = `${row}-${col}`
            const isSafe = safeCells.has(key)
            const isActive = position[0] === row && position[1] === col
            const isGoal = key === goal
            const hasStar = stars.includes(key) || starCells.includes(key)
            return (
              <div
                key={key}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-[18px] text-lg font-bold',
                  isSafe ? 'bg-white' : 'bg-ink/8',
                  isGoal && 'ring-2 ring-sun/60',
                  isActive && 'bg-coral text-white shadow-sm',
                )}
              >
                {isActive ? '🚀' : isGoal ? '⭐' : hasStar && isSafe ? '✨' : ''}
              </div>
            )
          })}
        </div>
        <div className="grid max-w-xs grid-cols-3 gap-2">
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
        <GameStatus>{`Colisoes: ${collisions}. Colete estrelas e encontre a saida brilhante.`}</GameStatus>
      </CardContent>
    </Card>
  )
}

function ConnectDotsGame({ onComplete, onProgress }: MiniGameProps) {
  const [nextExpected, setNextExpected] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const reportProgress = useEffectEvent((payload: ProgressPayload) => {
    onProgress?.(payload)
  })

  useEffect(() => {
    reportProgress({ status: 'started', score: 0, currentPhase: 'connect-start', currentLevel: 1, maxLevel: CONNECT_DOT_POINTS.length, attemptDelta: 1 })
  }, [])

  const clickPoint = (label: string) => {
    const expected = String(nextExpected)
    if (label !== expected) {
      const nextMistakes = mistakes + 1
      setMistakes(nextMistakes)
      onProgress?.({ status: 'started', score: Math.max(5, 60 - nextMistakes * 5), currentPhase: 'connect-miss', currentLevel: nextExpected, maxLevel: CONNECT_DOT_POINTS.length, meta: { mistakes: nextMistakes } })
      return
    }

    const upcoming = nextExpected + 1
    if (upcoming > CONNECT_DOT_POINTS.length) {
      onProgress?.({ status: 'completed', score: Math.max(80, 100 - mistakes * 4), currentPhase: 'connect-complete', currentLevel: CONNECT_DOT_POINTS.length, maxLevel: CONNECT_DOT_POINTS.length, successDelta: 1, meta: { mistakes } })
      onComplete(Math.max(80, 100 - mistakes * 4))
      setNextExpected(upcoming)
      return
    }

    setNextExpected(upcoming)
    onProgress?.({ status: 'started', score: upcoming * 7, currentPhase: 'connect-progress', currentLevel: upcoming, maxLevel: CONNECT_DOT_POINTS.length, meta: { mistakes } })
  }

  const reset = () => {
    setNextExpected(1)
    setMistakes(0)
    onProgress?.({ status: 'started', score: 0, currentPhase: 'connect-reset', currentLevel: 1, maxLevel: CONNECT_DOT_POINTS.length, attemptDelta: 1 })
  }

  return (
    <Card className="print-card bg-white/90">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-2xl">Ligue os pontos do dragao</CardTitle>
          <Pill tone="sun">{`${Math.min(nextExpected - 1, CONNECT_DOT_POINTS.length)}/${CONNECT_DOT_POINTS.length}`}</Pill>
        </div>
        <CardDescription>Toque nos numeros em ordem. O desenho aparece aos poucos e a etapa final revela o dragao.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-4 gap-6 rounded-[24px] border border-dashed border-soft-border bg-sand/30 p-6 text-center text-sm font-bold text-ink">
            {CONNECT_DOT_POINTS.map((label, index) => {
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
                  done ? 'border-aqua bg-aqua text-white' : current ? 'border-coral bg-white text-coral' : 'border-ink/25 bg-white text-ink hover:bg-[#f7fbff]',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-[#f7fbff] p-4">
          <GameStatus>{nextExpected > CONNECT_DOT_POINTS.length ? 'Dragao revelado! Agora vale imprimir para colorir.' : `Procure o numero ${nextExpected}. Erros ate agora: ${mistakes}.`}</GameStatus>
          <Button variant="secondary" size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" /> Recomeçar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorksheetGame({ slug, onComplete, onProgress }: MiniGameProps & { slug: WorksheetSlug }) {
  if (slug === 'caca-palavras-da-fazenda') {
    return <WordSearchGame onComplete={onComplete} onProgress={onProgress} />
  }

  if (slug === 'labirinto-do-foguete') {
    return <MazeGame onComplete={onComplete} onProgress={onProgress} />
  }

  return <ConnectDotsGame onComplete={onComplete} onProgress={onProgress} />
}
