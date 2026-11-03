// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Combobox } from './Combobox'

const TRAILS = [
  { value: 'tmb', label: 'Tour du Mont Blanc' },
  { value: 'gr20', label: 'GR20' },
  { value: 'w-trek', label: 'W Trek' },
  { value: 'kungsleden', label: 'Kungsleden' },
]

const setup = (props = {}) => {
  const user = userEvent.setup()
  const onValueChange = vi.fn()
  render(<Combobox label="Trail" options={TRAILS} onValueChange={onValueChange} {...props} />)
  return { user, onValueChange, input: screen.getByRole('combobox', { name: 'Trail' }) }
}

describe('Combobox', () => {
  it('is collapsed and wired to its listbox by default', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-controls', screen.getByRole('listbox', { hidden: true }).id)
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('filters as you type and highlights the first match', async () => {
    const { user, input } = setup()
    await user.type(input, 'tre')

    const options = screen.getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['W Trek'])
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(screen.getByText('1 result available.')).toBeInTheDocument()
  })

  it('moves the active option with the arrow keys, wrapping at the ends, while focus stays in the input', async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.keyboard('{ArrowUp}')

    const options = screen.getAllByRole('option')
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-activedescendant', options.at(-1).id)

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('commits the active option with Enter', async () => {
    const { user, input, onValueChange } = setup()
    await user.type(input, 'gr{Enter}')

    expect(onValueChange).toHaveBeenCalledWith('gr20')
    expect(input).toHaveValue('GR20')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('commits an option on click', async () => {
    const { user, input, onValueChange } = setup()
    await user.click(input)
    await user.click(screen.getByRole('option', { name: 'Kungsleden' }))

    expect(onValueChange).toHaveBeenCalledWith('kungsleden')
    expect(input).toHaveValue('Kungsleden')
  })

  it('Escape closes and restores the selection; a second Escape clears it', async () => {
    const { user, input, onValueChange } = setup({ defaultValue: 'tmb' })
    await user.clear(input)
    await user.type(input, 'xyz')
    expect(screen.getByText('No results')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(input).toHaveValue('Tour du Mont Blanc')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    await user.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(onValueChange).toHaveBeenCalledWith(null)
  })

  it('reverts unfinished text on blur', async () => {
    const { user, input } = setup({ defaultValue: 'gr20' })
    await user.clear(input)
    await user.type(input, 'Kung')
    await user.tab()

    expect(input).toHaveValue('GR20')
  })

  it('follows a controlled value', () => {
    const { rerender } = render(<Combobox label="Controlled" options={TRAILS} value="tmb" />)
    expect(screen.getByRole('combobox', { name: 'Controlled' })).toHaveValue('Tour du Mont Blanc')

    rerender(<Combobox label="Controlled" options={TRAILS} value="w-trek" />)
    expect(screen.getByRole('combobox', { name: 'Controlled' })).toHaveValue('W Trek')
  })
})
