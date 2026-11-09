// Vercel Function: POST /api/answer -> streams Claude's grounded answer as Server-Sent Events.
// Every file in /api becomes a function, so the logic (and its tests) live in src/.
import { createAnswerHandler } from '../src/projects/rag-glassbox/server/answerHandler.js'

export const POST = createAnswerHandler()
