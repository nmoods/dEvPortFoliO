import { INK_COLORS, TOOLS, Tool } from './tools'

function Toolbar({ tool, onToolChange, color, onColorChange, undo, onClear }) {
  return (
    <div className="tb-toolbar" role="toolbar" aria-label="Board tools">
      <div className="tb-toolbar__group">
        {TOOLS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className="tb-button tb-button--icon"
            aria-pressed={tool === id}
            aria-label={label}
            title={label}
            onClick={() => onToolChange(id)}
          >
            <span aria-hidden="true">{icon}</span>
          </button>
        ))}
      </div>

      <div className="tb-toolbar__group" role="group" aria-label="Ink color">
        {INK_COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className="tb-swatch"
            style={{ '--swatch': swatch }}
            aria-pressed={color === swatch}
            aria-label={`Ink ${swatch}`}
            onClick={() => {
              onColorChange(swatch)
              onToolChange(Tool.PEN)
            }}
          />
        ))}
      </div>

      <div className="tb-toolbar__group">
        <button type="button" className="tb-button" onClick={undo.undo} disabled={!undo.canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button type="button" className="tb-button" onClick={undo.redo} disabled={!undo.canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        <button type="button" className="tb-button tb-button--danger" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  )
}

export default Toolbar
