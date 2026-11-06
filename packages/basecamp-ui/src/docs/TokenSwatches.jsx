const SEMANTIC_TOKENS = [
  ['--bc-color-bg', 'Page and surface background'],
  ['--bc-color-bg-subtle', 'Recessed areas'],
  ['--bc-color-bg-muted', 'Hover fills'],
  ['--bc-color-border', 'Dividers and outlines'],
  ['--bc-color-text', 'Body text'],
  ['--bc-color-text-muted', 'Secondary text'],
  ['--bc-color-accent', 'Primary actions, selection'],
  ['--bc-color-accent-subtle', 'Active option background'],
  ['--bc-color-danger', 'Destructive actions'],
  ['--bc-color-focus', 'Focus rings'],
]

export function TokenSwatches({ theme = 'light' }) {
  return (
    <div
      data-bc-theme={theme}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        background: 'var(--bc-color-bg)',
        color: 'var(--bc-color-text)',
        border: '1px solid var(--bc-color-border)',
      }}
    >
      {SEMANTIC_TOKENS.map(([token, role]) => (
        <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `var(${token})`,
              border: '1px solid var(--bc-color-border)',
            }}
          />
          <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
            <code style={{ fontSize: 12 }}>{token}</code>
            <span style={{ fontSize: 12, color: 'var(--bc-color-text-muted)' }}>{role}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
