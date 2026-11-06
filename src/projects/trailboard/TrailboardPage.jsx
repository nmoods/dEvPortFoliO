import { useEffect, useState } from 'react'
import Board from './components/Board'
import Toolbar from './components/Toolbar'
import SessionBar from './components/SessionBar'
import { INK_COLORS, Tool } from './components/tools'
import { clearBoard } from './collab/board'
import { startSimulatedPeer } from './collab/simulatedPeer'
import { useCollabSession } from './hooks/useCollabSession'
import { useShapes } from './hooks/useShapes'
import { usePeers } from './hooks/usePeers'
import { useConnection } from './hooks/useConnection'
import { useUndo } from './hooks/useUndo'
import './Trailboard.css'

const ROOM_NAME = 'trailboard-demo'

const HIGHLIGHTS = [
  {
    title: 'CRDT data model',
    body: 'The board is one Yjs map. Strokes stream their points into a Y.Array so peers watch lines being drawn; sticky notes hold a Y.Text so two people typing in the same note merge character by character.',
  },
  {
    title: 'Hand-written sync protocol',
    body: 'A ~150-line provider over BroadcastChannel: peers exchange state vectors, send only the missing diff, then stream incremental updates. Same handshake a WebSocket or WebRTC transport would use.',
  },
  {
    title: 'Presence & live cursors',
    body: 'Ephemeral state (cursor, name, color) lives in the awareness protocol, outside the document history. Cursor updates are rAF-throttled and positioned in board space so they line up at any window size.',
  },
  {
    title: 'Offline-first',
    body: 'Edits persist to IndexedDB and keep working with the network off. On reconnect the sync handshake replays and merges, with no conflict dialogs and no lost work. Try it with the bot running.',
  },
  {
    title: 'Per-user undo',
    body: 'A scoped UndoManager tracks only transactions tagged with this tab’s origin, so Ctrl+Z reverts your work and never a teammate’s, even when edits interleave.',
  },
  {
    title: 'Render performance',
    body: 'A snapshot store rebuilds only the shapes a change touched, so memoized strokes skip re-rendering while someone else draws. The whole feature is lazy-loaded and stays out of the portfolio bundle.',
  },
]

const NEXT_STEPS = [
  'Swap the transport for y-websocket to collaborate across devices (the provider interface stays the same).',
  'Viewport panning & zoom with a camera transform instead of a fixed board.',
  'Path smoothing (Catmull-Rom) and pressure-sensitive pen input.',
  'Playwright test driving two browser contexts to assert convergence end to end.',
]

function TrailboardPage() {
  const session = useCollabSession(ROOM_NAME)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Trailboard · Real-time collaborative whiteboard'
  }, [])

  return (
    <div className="tb-page">
      <header className="tb-header">
        <a href="#projects" className="tb-back">
          ← Back to portfolio
        </a>
        <p className="section-eyebrow">Project 01 · Real-time collaboration</p>
        <h1 className="tb-title">Trailboard</h1>
        <p className="tb-lede">
          A multiplayer whiteboard built on CRDTs. Open this page in a second tab, or invite the bot, and watch edits,
          cursors and sticky-note typing sync live. Then go offline, keep drawing, and reconnect.
        </p>
      </header>

      {session ? <Workspace session={session} /> : <div className="tb-card tb-card--loading">Connecting…</div>}

      <section className="tb-case" aria-labelledby="tb-case-title">
        <h2 id="tb-case-title" className="tb-case__title">
          How it works
        </h2>
        <div className="tb-case__grid">
          {HIGHLIGHTS.map(({ title, body }) => (
            <article key={title} className="tb-case__item">
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>

        <h2 className="tb-case__title">Next steps</h2>
        <ul className="tb-case__list">
          {NEXT_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>

        <ul className="tb-case__tags" aria-label="Tech stack">
          {['React 19', 'Yjs', 'y-protocols', 'IndexedDB', 'BroadcastChannel', 'Vitest'].map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Workspace({ session }) {
  const shapes = useShapes(session.store)
  const peers = usePeers(session.awareness)
  const connection = useConnection(session.provider)
  const undo = useUndo(session.undoManager)
  const [tool, setTool] = useState(Tool.PEN)
  const [color, setColor] = useState(INK_COLORS[0])
  const [botEnabled, setBotEnabled] = useState(false)

  useEffect(() => {
    if (!botEnabled) return undefined
    const bot = startSimulatedPeer({ roomName: ROOM_NAME })
    return () => bot.stop()
  }, [botEnabled])

  const handleClear = () => {
    if (window.confirm('Clear the board for everyone? (You can undo.)')) clearBoard(session.board)
  }

  return (
    <div className="tb-card">
      <div className="tb-card__bar">
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          color={color}
          onColorChange={setColor}
          undo={undo}
          onClear={handleClear}
        />
        <SessionBar
          session={session}
          peers={peers}
          connection={connection}
          botEnabled={botEnabled}
          onBotToggle={() => setBotEnabled((enabled) => !enabled)}
        />
      </div>
      <Board session={session} shapes={shapes} peers={peers} tool={tool} color={color} />
    </div>
  )
}

export default TrailboardPage
