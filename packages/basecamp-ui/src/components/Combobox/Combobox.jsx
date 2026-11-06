import { useEffect, useId, useState } from 'react'
import { cx } from '../../utils/cx'
import { useControllableState } from '../../utils/useControllableState'
import { defaultFilter, normalize } from './filter'
import './Combobox.css'

/**
 * WAI-ARIA 1.2 combobox with list autocomplete. DOM focus never leaves the input;
 * the highlighted option is exposed through aria-activedescendant.
 */
export function Combobox({
  label,
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  emptyMessage = 'No results',
  filter = defaultFilter,
  className,
}) {
  const [selectedValue, setSelectedValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const selectedOption = options.find((option) => option.value === selectedValue) ?? null

  const [query, setQuery] = useState(selectedOption?.label ?? '')
  const [isOpen, setIsOpen] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Keep the input text in sync when the selection changes from outside (controlled usage).
  const [syncedValue, setSyncedValue] = useState(selectedValue)
  if (syncedValue !== selectedValue) {
    setSyncedValue(selectedValue)
    setQuery(selectedOption?.label ?? '')
  }

  const baseId = useId()
  const inputId = `${baseId}-input`
  const listboxId = `${baseId}-listbox`
  const optionId = (index) => `${baseId}-option-${index}`

  const results = isFiltering ? options.filter((option) => filter(option, query)) : options
  const highlighted = Math.min(activeIndex, results.length - 1)
  const activeDescendant = isOpen && highlighted >= 0 ? optionId(highlighted) : undefined

  useEffect(() => {
    if (activeDescendant) document.getElementById(activeDescendant)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeDescendant])

  const open = (index) => {
    setIsOpen(true)
    setActiveIndex(index)
  }

  const close = () => {
    setIsOpen(false)
    setIsFiltering(false)
    setActiveIndex(-1)
  }

  const commit = (option) => {
    setSelectedValue(option.value)
    setQuery(option.label)
    close()
  }

  const selectedIndexIn = (list) => list.findIndex((option) => option.value === selectedValue)

  const handleInputChange = (event) => {
    const nextQuery = event.target.value
    setQuery(nextQuery)
    setIsFiltering(true)
    open(nextQuery ? 0 : -1)
  }

  const handleKeyDown = (event) => {
    const count = results.length
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (event.altKey || !isOpen) open(isOpen ? highlighted : Math.max(0, selectedIndexIn(results)))
        else if (count) setActiveIndex((highlighted + 1) % count)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) open(selectedIndexIn(results) >= 0 ? selectedIndexIn(results) : count - 1)
        else if (count) setActiveIndex(highlighted <= 0 ? count - 1 : highlighted - 1)
        break
      case 'Enter':
        if (isOpen && highlighted >= 0) {
          event.preventDefault()
          commit(results[highlighted])
        }
        break
      case 'Escape':
        if (isOpen) {
          event.preventDefault()
          setQuery(selectedOption?.label ?? '')
          close()
        } else if (query) {
          event.preventDefault()
          setQuery('')
          setSelectedValue(null)
        }
        break
      case 'Tab':
        if (isOpen) close()
        break
      default:
        break
    }
  }

  // Leaving the field reverts free text to the committed selection, so input and value never disagree.
  const handleBlur = () => {
    setQuery(selectedOption?.label ?? '')
    close()
  }

  const handleToggleClick = (event) => {
    event.currentTarget.previousElementSibling.focus()
    if (isOpen) close()
    else open(Math.max(0, selectedIndexIn(options)))
  }

  return (
    <div className={cx('bc-combobox', className)}>
      <label htmlFor={inputId} className="bc-combobox__label">
        {label}
      </label>
      <div className="bc-combobox__control" data-open={isOpen || undefined}>
        <input
          id={inputId}
          type="text"
          role="combobox"
          className="bc-combobox__input"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onClick={() => !isOpen && open(Math.max(0, selectedIndexIn(results)))}
        />
        <button
          type="button"
          className="bc-combobox__toggle"
          tabIndex={-1}
          aria-label={isOpen ? `Close ${label} options` : `Show ${label} options`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleToggleClick}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        className="bc-combobox__listbox"
        hidden={!isOpen}
        onMouseDown={(event) => event.preventDefault()}
      >
        {isOpen &&
          results.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === highlighted}
              data-checked={option.value === selectedValue || undefined}
              className="bc-combobox__option"
              onMouseMove={() => index !== highlighted && setActiveIndex(index)}
              onClick={() => commit(option)}
            >
              <span className="bc-combobox__option-label">
                <Highlight text={option.label} query={isFiltering ? query : ''} />
              </span>
              {option.description && <span className="bc-combobox__option-description">{option.description}</span>}
            </li>
          ))}
        {isOpen && results.length === 0 && (
          <li role="presentation" className="bc-combobox__empty">
            {emptyMessage}
          </li>
        )}
      </ul>

      <div className="bc-visually-hidden" aria-live="polite" aria-atomic="true">
        {isOpen ? `${results.length} ${results.length === 1 ? 'result' : 'results'} available.` : ''}
      </div>
    </div>
  )
}

function Highlight({ text, query }) {
  const needle = normalize(query)
  const start = needle ? text.toLocaleLowerCase().indexOf(needle) : -1
  if (start === -1) return text
  return (
    <>
      {text.slice(0, start)}
      <mark>{text.slice(start, start + needle.length)}</mark>
      {text.slice(start + needle.length)}
    </>
  )
}
