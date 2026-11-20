import './MoodToggle.css'

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 16,
  height: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const MOOD_OPTIONS = [
  {
    id: 'overcast',
    label: 'Overcast morning',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 18h10a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.1 11.1 3.5 3.5 0 0 0 7 18Z" />
      </svg>
    ),
  },
  {
    id: 'golden',
    label: 'Golden hour',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 18h18M7.5 18a4.5 4.5 0 0 1 9 0M12 7.5V9.5M5.6 11.6l1.4 1.4M18.4 11.6 17 13" />
      </svg>
    ),
  },
  {
    id: 'dusk',
    label: 'Dusk',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
      </svg>
    ),
  },
]

function MoodToggle({ mood, onChange }) {
  return (
    <div className="mood-toggle" role="group" aria-label="Lighting mood">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className="mood-toggle__btn"
          aria-pressed={mood === option.id}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.id)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}

export default MoodToggle
