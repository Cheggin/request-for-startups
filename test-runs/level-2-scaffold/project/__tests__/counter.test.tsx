import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CounterPage from '../app/page'

describe('Counter', () => {
  it('displays 0 initially', () => {
    render(<CounterPage />)
    const display = screen.getByTestId('count-display')
    expect(display.textContent).toBe('0')
  })

  it('increments to 1 on first click', () => {
    render(<CounterPage />)
    const button = screen.getByTestId('increment-button')
    fireEvent.click(button)
    const display = screen.getByTestId('count-display')
    expect(display.textContent).toBe('1')
  })

  it('increments to 2 on second click', () => {
    render(<CounterPage />)
    const button = screen.getByTestId('increment-button')
    fireEvent.click(button)
    fireEvent.click(button)
    const display = screen.getByTestId('count-display')
    expect(display.textContent).toBe('2')
  })
})
