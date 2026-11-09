import { useEffect, useMemo, useState } from 'react'
import { Tab, TabList, TabPanel, Tabs } from '@nmoods/basecamp-ui'
import { AnswerView } from './components/AnswerView'
import { ChunkList } from './components/ChunkList'
import { EmbeddingMap } from './components/EmbeddingMap'
import { PromptView } from './components/PromptView'
import { QuestionBar } from './components/QuestionBar'
import { StageRail } from './components/StageRail'
import { TunePanel } from './components/TunePanel'
import { DECISIONS } from './content'
import { useAnswerStream } from './hooks/useAnswerStream'
import { useEmbedder } from './hooks/useEmbedder'
import { computeRetrieval, useRagQuery } from './hooks/useRagQuery'
import { chunkDomId } from './pipeline/chunk'
import { buildPrompt } from './pipeline/prompt'
import './RagPage.css'

const initialTheme = () => (document.documentElement.dataset.mood === 'dusk' ? 'dark' : 'light')
const sameIds = (a, b) => a.length === b.length && a.every((id, i) => id === b[i])

function RagPage() {
  const [theme] = useState(initialTheme)
  const [settings, setSettings] = useState({ size: 'medium', k: 4, mode: 'hybrid' })
  const [tab, setTab] = useState('chunks')
  const embedder = useEmbedder()
  const { index, query, retrieval, embedding, error, ask } = useRagQuery({ embed: embedder.embed, ...settings })
  const { answer, start } = useAnswerStream()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'RAG Glass Box · Retrieval-augmented generation, step by step'
  }, [])

  const sources = useMemo(() => (retrieval && index ? retrieval.top.map((result) => index.chunks[result.index]) : null), [retrieval, index])
  const prompt = useMemo(() => (query && sources ? buildPrompt(query.question, sources) : null), [query, sources])
  const sourceIds = sources?.map((chunk) => chunk.id) ?? []
  const stale =
    Boolean(answer.request && sources) &&
    answer.status !== 'streaming' &&
    (answer.request.question !== query?.question || answer.request.size !== settings.size || !sameIds(answer.request.chunkIds, sourceIds))

  async function handleAsk(question) {
    const next = await ask(question)
    if (!next || !index) return
    const { top } = computeRetrieval(index, next, settings)
    start({ question, size: settings.size, chunkIds: top.map((result) => index.chunks[result.index].id) })
  }

  function handleCite(n) {
    const chunkId = answer.request?.chunkIds[n - 1]
    if (!chunkId) return
    setTab('chunks')
    requestAnimationFrame(() => {
      const card = document.getElementById(chunkDomId(chunkId))
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      card?.focus({ preventScroll: true })
    })
  }

  const ready = embedder.status === 'ready' && Boolean(index)

  return (
    <div className="rag-page">
      <header className="rag-header">
        <a href="#projects" className="rag-back">
          ← Back to portfolio
        </a>
        <p className="section-eyebrow">Project 03 · AI</p>
        <h1 className="rag-title">RAG Glass Box</h1>
        <p className="rag-lede">
          Retrieval-augmented generation, with the lid off. A language model only knows what it was trained on, so RAG{' '}
          <strong>retrieves</strong> the passages most relevant to your question from your own documents and pastes them into the prompt,
          and the model answers from those, citing them. Ask the eight trail guides below and watch every stage: the chunks, the
          vectors, the scores, the exact prompt and the streamed answer.
        </p>
      </header>

      <div className="rag-app" data-bc-theme={theme}>
        <QuestionBar onAsk={handleAsk} busy={embedding || answer.status === 'streaming'} ready={ready} />
        {(error || embedder.error) && <p className="rag-note rag-note--error">{error ?? embedder.error}</p>}
        <StageRail
          index={index}
          embedder={embedder}
          query={query}
          retrieval={retrieval}
          embedding={embedding}
          answer={answer}
          promptChars={prompt ? prompt.system.length + prompt.user.length : 0}
        />

        <div className="rag-grid">
          <div className="rag-main">
            <Tabs value={tab} onValueChange={setTab}>
              <TabList label="Pipeline details">
                <Tab value="chunks">Retrieved chunks</Tab>
                <Tab value="map">Embedding map</Tab>
                <Tab value="prompt">Prompt</Tab>
              </TabList>
              <TabPanel value="chunks">
                <ChunkList index={index} retrieval={retrieval} mode={settings.mode} question={query?.question ?? ''} />
              </TabPanel>
              <TabPanel value="map">
                <EmbeddingMap index={index} retrieval={retrieval} />
              </TabPanel>
              <TabPanel value="prompt">
                <PromptView prompt={prompt} />
              </TabPanel>
            </Tabs>
          </div>
          <aside className="rag-side">
            <AnswerView
              answer={answer}
              stale={stale}
              canGenerate={answer.status !== 'disabled' && Boolean(sources)}
              onGenerate={() => start({ question: query.question, size: settings.size, chunkIds: sourceIds })}
              onCite={handleCite}
            />
            <TunePanel settings={settings} onChange={setSettings} />
          </aside>
        </div>
      </div>

      <section className="rag-case" aria-labelledby="rag-case-title">
        <h2 id="rag-case-title" className="rag-case__title">
          Engineering decisions
        </h2>
        <div className="rag-case__grid">
          {DECISIONS.map(({ title, body }) => (
            <article key={title} className="rag-case__item">
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <ul className="rag-case__tags" aria-label="Tech stack">
          {['RAG', 'transformers.js', 'Web Workers', 'BM25', 'Reciprocal Rank Fusion', 'PCA', 'Claude API', 'Server-Sent Events', 'Vercel Functions'].map(
            (tag) => (
              <li key={tag}>{tag}</li>
            )
          )}
        </ul>
      </section>
    </div>
  )
}

export default RagPage
