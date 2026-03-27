import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { WorksheetGame } from './mini-games'

describe('WorksheetGame', () => {
  it('completes the word search online flow when all words are marked', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    const onProgress = vi.fn()

    render(<WorksheetGame slug="caca-palavras-da-fazenda" onComplete={onComplete} onProgress={onProgress} />)

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

    render(<WorksheetGame slug="ligue-os-pontos-do-dragao" onComplete={onComplete} />)

    for (const point of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']) {
      await user.click(screen.getByRole('button', { name: point }))
    }

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0]).toBeGreaterThanOrEqual(80)
  })
})
