import { useEffect, useState } from 'react'

function SessionBar({ session, peers, connection, botEnabled, onBotToggle }) {
  const { user, provider } = session
  const stats = useProviderStats(provider)

  return (
    <div className="tb-session">
      <ul className="tb-presence" aria-label={`${peers.length + 1} people on this board`}>
        <li className="tb-avatar" style={{ '--avatar-color': user.color }} title={`${user.name} (you)`}>
          {initials(user.name)}
        </li>
        {peers.map(({ clientID, user: peer }) => (
          <li key={clientID} className="tb-avatar" style={{ '--avatar-color': peer.color }} title={peer.name}>
            {initials(peer.name)}
          </li>
        ))}
      </ul>

      <button type="button" className="tb-button" aria-pressed={botEnabled} onClick={onBotToggle}>
        {botEnabled ? 'Dismiss bot' : 'Invite bot teammate'}
      </button>

      <button
        type="button"
        className={`tb-button tb-status ${connection.connected ? 'tb-status--online' : 'tb-status--offline'}`}
        onClick={connection.toggle}
        title={connection.connected ? 'Simulate a network drop' : 'Reconnect and merge offline edits'}
      >
        <span className="tb-status__dot" aria-hidden="true" />
        {connection.connected ? 'Online' : 'Offline · edits queued'}
      </button>

      <a className="tb-button" href={window.location.href} target="_blank" rel="noreferrer">
        Open 2nd tab ↗
      </a>

      <p className="tb-stats" aria-live="off">
        ↑ {stats.sent} msgs · {formatBytes(stats.bytesSent)} &nbsp; ↓ {stats.received} msgs ·{' '}
        {formatBytes(stats.bytesReceived)}
      </p>
    </div>
  )
}

function useProviderStats(provider) {
  const [stats, setStats] = useState(() => ({ ...provider.stats }))
  useEffect(() => {
    const interval = setInterval(() => setStats({ ...provider.stats }), 1000)
    return () => clearInterval(interval)
  }, [provider])
  return stats
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`
}

export default SessionBar
