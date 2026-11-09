import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App shell', () => {
  it('renders the app shell and route navigation', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /e\.d\.i\.t\.h\./i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /apps/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /simple/i })).toBeInTheDocument()
  })
})
