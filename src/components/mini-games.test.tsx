import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { MemoryGame, TicTacToeGame, WorksheetGame } from './mini-games'

describe('WorksheetGame', () => {
  it('completes the word search online flow when all words are marked', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onProgress = vi.fn()

    render(<WorksheetGame difficulty="medium" slug="caca-palavras-da-fazenda" onComplete={onComplete} onProgress={onProgress} />)

    for (const word of ['VACA', 'GATO', 'PATO', 'OVELHA', 'MILHO', 'TRATOR']) {
      await user.click(screen.getByRole('button', { name: word }))
    }

    expect(onComplete).toHaveBeenCalledWith(96)
    expect(onProgress).toHaveBeenCalled()
    expect(screen.getByText(/Todas encontradas/i)).toBeInTheDocument()
  })

  it('completes the connect dots flow after clicking points in order', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(<WorksheetGame difficulty="medium" slug="ligue-os-pontos-do-dragao" onComplete={onComplete} />)

    for (const point of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']) {
      await user.click(screen.getByRole('button', { name: point }))
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0]).toBeGreaterThanOrEqual(80)
  })

  it('uses more dot points in challenge mode', () => {
    render(<WorksheetGame difficulty="challenge" slug="ligue-os-pontos-do-dragao" onComplete={vi.fn()} />)

    expect(screen.getByRole('button', { name: '16' })).toBeInTheDocument()
  })

  it('moves the maze rocket with arrow keys', async () => {
    const user = userEvent.setup()

    render(<WorksheetGame difficulty="medium" slug="labirinto-do-foguete" onComplete={vi.fn()} />)

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}')

    expect(await screen.findByText(/Estrela coletada/i)).toBeInTheDocument()
  })
})

describe('Mini game difficulty and keyboard controls', () => {
  it('marks a tic tac toe cell with number keys', async () => {
    const user = userEvent.setup()

    render(<TicTacToeGame difficulty="medium" onComplete={vi.fn()} />)

    await user.keyboard('1')

    expect(screen.getByRole('button', { name: /Casa 1 marcada com X/i })).toBeInTheDocument()
  })

  it('adds more memory cards in challenge mode', () => {
    render(<MemoryGame difficulty="challenge" onComplete={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: /^Carta \d+$/i })).toHaveLength(16)
  })
})
