import { useState } from 'react'
import { Button } from '@nmoods/basecamp-ui'
import { SAMPLE_QUESTIONS } from '../content'
import { MAX_QUESTION_LENGTH } from '../pipeline/prompt'

export function QuestionBar({ onAsk, busy, ready }) {
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0].question)
  const [lesson, setLesson] = useState(SAMPLE_QUESTIONS[0].lesson)

  const submit = (text) => {
    const trimmed = text.trim()
    if (trimmed && ready && !busy) onAsk(trimmed)
  }

  return (
    <div className="rag-ask">
      <form
        className="rag-ask__form"
        onSubmit={(event) => {
          event.preventDefault()
          submit(question)
        }}
      >
        <label htmlFor="rag-question" className="rag-ask__label">
          Ask the trail guides
        </label>
        <div className="rag-ask__row">
          <input
            id="rag-question"
            className="rag-ask__input"
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => {
              setQuestion(event.target.value)
              setLesson(null)
            }}
            placeholder="e.g. When does the Laugavegur open?"
            autoComplete="off"
          />
          <Button type="submit" loading={busy} disabled={!ready}>
            {ready ? 'Ask' : 'Loading model…'}
          </Button>
        </div>
      </form>
      <div className="rag-ask__samples" role="group" aria-label="Sample questions">
        {SAMPLE_QUESTIONS.map((sample) => (
          <button
            key={sample.question}
            type="button"
            className="rag-chip"
            aria-pressed={question === sample.question}
            disabled={!ready || busy}
            onClick={() => {
              setQuestion(sample.question)
              setLesson(sample.lesson)
              submit(sample.question)
            }}
          >
            {sample.question}
          </button>
        ))}
      </div>
      {lesson && <p className="rag-ask__lesson">💡 {lesson}</p>}
    </div>
  )
}
