/** The exact prompt the server will send: same `buildPrompt` on both sides. */
export function PromptView({ prompt }) {
  if (!prompt) return <p className="rag-empty">The assembled prompt appears here after retrieval.</p>
  return (
    <div className="rag-prompt">
      <p className="rag-legend-note">
        This is the whole trick of RAG: the model never searches anything. It just reads these sources, pasted above your question.
      </p>
      <h3 className="rag-subtitle">System prompt</h3>
      <pre className="rag-prompt__block">{prompt.system}</pre>
      <h3 className="rag-subtitle">User message · {prompt.user.length.toLocaleString()} characters</h3>
      <pre className="rag-prompt__block">{prompt.user}</pre>
    </div>
  )
}
