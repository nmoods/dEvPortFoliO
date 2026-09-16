import './MoodToggle.css'

const MOOD_OPTIONS = [
  { id: 'overcast', icon: '☁️', label: 'Overcast morning' },
  { id: 'golden', icon: '🌇', label: 'Golden hour' },
  { id: 'dusk', icon: '🌆', label: 'Dusk' },
]

function MoodToggle({ mood, onChange }) {
  return (
    <div className="mood-toggle" role="group" aria-label="Trail lighting mood">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`mood-toggle__btn${mood === option.id ? ' mood-toggle__btn--active' : ''}`}
          aria-pressed={mood === option.id}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.id)}
        >
          <span aria-hidden="true">{option.icon}</span>
        </button>
      ))}
    </div>
  )
}

export default MoodToggle
