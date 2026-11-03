import { useEffect, useId, useRef } from 'react'
import { cx } from '../../utils/cx'
import './Dialog.css'

/**
 * Built on the native <dialog> + showModal(): the browser provides the focus trap, inert background,
 * top-layer stacking and Escape handling. React stays the source of truth through `open`/`onOpenChange`.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  dismissOnBackdrop = true,
  className,
  children,
}) {
  const dialogRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => () => dialogRef.current?.open && dialogRef.current.close(), [])

  const requestClose = () => onOpenChange(false)

  // Escape fires `cancel`: keep the dialog open until the parent agrees to close it.
  const handleCancel = (event) => {
    event.preventDefault()
    requestClose()
  }

  const handleClose = () => {
    const returnTarget = returnFocusRef.current
    returnFocusRef.current = null
    if (returnTarget?.isConnected && document.activeElement === document.body) returnTarget.focus()
    if (open) requestClose()
  }

  // A click whose target is the <dialog> itself landed on the backdrop, outside the surface.
  const handleClick = (event) => {
    if (dismissOnBackdrop && event.target === event.currentTarget) requestClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className={cx('bc-dialog', className)}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClose={handleClose}
      onClick={handleClick}
    >
      {open && (
        <div className="bc-dialog__surface">
          <header className="bc-dialog__header">
            <h2 id={titleId} className="bc-dialog__title">
              {title}
            </h2>
            <button type="button" className="bc-dialog__close" aria-label="Close dialog" onClick={requestClose}>
              ×
            </button>
          </header>
          {description && (
            <p id={descriptionId} className="bc-dialog__description">
              {description}
            </p>
          )}
          {children && <div className="bc-dialog__body">{children}</div>}
          {footer && <footer className="bc-dialog__footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  )
}
