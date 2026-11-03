import { BOARD_HEIGHT, BOARD_WIDTH } from '../collab/board'

function PeerCursors({ peers }) {
  return (
    <div className="tb-cursors" aria-hidden="true">
      {peers
        .filter((peer) => peer.cursor)
        .map(({ clientID, user, cursor }) => (
          <div
            key={clientID}
            className="tb-cursor"
            style={{
              left: `${(cursor.x / BOARD_WIDTH) * 100}%`,
              top: `${(cursor.y / BOARD_HEIGHT) * 100}%`,
              '--cursor-color': user.color,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M1 1 L1 15 L5 11 L8 17 L10.5 16 L7.5 10 L13 10 Z" />
            </svg>
            <span className="tb-cursor__label">{user.name}</span>
          </div>
        ))}
    </div>
  )
}

export default PeerCursors
