import { cx } from '../../utils/cx'
import './Button.css'

/**
 * While `loading`, the button stays focusable (aria-disabled, not disabled) so keyboard
 * users don't lose their place, and clicks are swallowed instead of resubmitting.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  className,
  onClick,
  children,
  ref,
  ...rest
}) {
  const handleClick = (event) => {
    if (loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cx('bc-button', `bc-button--${variant}`, `bc-button--${size}`, loading && 'bc-button--loading', className)}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className="bc-button__label">{children}</span>
      {loading && <span className="bc-button__spinner" aria-hidden="true" />}
    </button>
  )
}
