import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/health', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    status: 'UP',
    service: 'sunflower-backend',
    timestamp: '2026-03-11T12:00:00+08:00',
  }),
}))

import App from '@/App'

describe('App', () => {
  it('renders the workspace shell', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Sunflower Admin Web',
      }),
    ).toBeInTheDocument()
    expect(await screen.findByText('UP')).toBeInTheDocument()
  })
})
