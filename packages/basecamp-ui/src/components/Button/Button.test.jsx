// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button')
  })

  it('stays focusable while loading but ignores clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>
    )
    const button = screen.getByRole('button', { name: 'Save' })

    await user.tab()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('forwards refs and extra props', () => {
    const ref = { current: null }
    render(
      <Button ref={ref} variant="danger" data-testid="danger">
        Delete
      </Button>
    )
    expect(ref.current).toBe(screen.getByTestId('danger'))
    expect(ref.current).toHaveClass('bc-button--danger')
  })
})
