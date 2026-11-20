import { Button } from '@nmoods/basecamp-ui'
import { CHUNK_SIZES } from '../pipeline/chunk'
import { MAX_SOURCES } from '../pipeline/prompt'
import { RETRIEVAL_MODES, SCOPES } from '../pipeline/search'

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="rag-tune__field">
      <span className="rag-tune__label" id={`rag-tune-${label.replaceAll(' ', '-')}`}>
        {label}
      </span>
      <div className="rag-segmented" role="group" aria-labelledby={`rag-tune-${label.replaceAll(' ', '-')}`}>
        {Object.entries(options).map(([key, option]) => (
          <Button
            key={key}
            size="sm"
            variant={value === key ? 'primary' : 'secondary'}
            aria-pressed={value === key}
            title={option.hint}
            onClick={() => onChange(key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

const sizeOptions = Object.fromEntries(
  Object.entries(CHUNK_SIZES).map(([key, size]) => [key, { label: `${size.label} · ~${size.words}w`, hint: `${size.overlap}-word overlap` }])
)

export function TunePanel({ settings, onChange }) {
  const set = (key) => (value) => onChange({ ...settings, [key]: value })
  return (
    <section className="rag-tune" aria-labelledby="rag-tune-title">
      <h2 id="rag-tune-title" className="rag-panel-title">
        Tune it
      </h2>
      <p className="rag-tune__hint">Changes re-rank instantly from the same question vector. No new embedding, no API call.</p>
      <Segmented label="Search in" options={SCOPES} value={settings.scope} onChange={set('scope')} />
      <Segmented label="Chunk size" options={sizeOptions} value={settings.size} onChange={set('size')} />
      <Segmented label="Retrieval" options={RETRIEVAL_MODES} value={settings.mode} onChange={set('mode')} />
      <div className="rag-tune__field">
        <label className="rag-tune__label" htmlFor="rag-k">
          Top k: <strong>{settings.k}</strong> chunks sent to the model
        </label>
        <input
          id="rag-k"
          type="range"
          min={1}
          max={MAX_SOURCES}
          value={settings.k}
          onChange={(event) => set('k')(Number(event.target.value))}
        />
      </div>
      <p className="rag-tune__mode">{RETRIEVAL_MODES[settings.mode].hint}</p>
    </section>
  )
}
