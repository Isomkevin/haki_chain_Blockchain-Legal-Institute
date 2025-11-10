import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Loader2, MessageCircle, Send, Sparkles } from "lucide-react"

import kenyaLawApi from "../lib/kenyaLawApi"

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: number
  role: ChatRole
  content: string
  timestamp: Date
  references?: string[]
  confidence?: number
}

interface AiAssistantTabProps {
  defaultDocumentId?: string
}

interface KenyaLawChatResponse {
  response?: string
  document_references?: string[]
  confidence?: number
}

const SUGGESTED_QUESTIONS: Array<{ text: string; category: string }> = [
  { text: "What are the key provisions of this maritime charter?", category: "Legal Analysis" },
  { text: "How many countries have signed this charter?", category: "Factual" },
  { text: "What are the objectives of maritime security mentioned in the document?", category: "Content Summary" },
  { text: "Explain the definitions of piracy and armed robbery against ships.", category: "Legal Definitions" },
  { text: "What cooperation mechanisms are established by this charter?", category: "Legal Framework" },
  { text: "What are the monitoring and control provisions?", category: "Compliance" },
]

export default function AiAssistantTab({ defaultDocumentId }: AiAssistantTabProps) {
  const [documentId, setDocumentId] = useState(defaultDocumentId ?? "")
  const [question, setQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (defaultDocumentId) {
      setDocumentId(defaultDocumentId)
    }
  }, [defaultDocumentId])

  const conversationContext = useMemo(
    () =>
      chatHistory
        .map((entry) => `${entry.role === "user" ? "User" : "AI"}: ${entry.content}`)
        .join("\n")
        .trim(),
    [chatHistory],
  )

  const handleSendMessage = async () => {
    if (!question.trim() || !documentId.trim() || loading) {
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: question,
      timestamp: new Date(),
    }

    setChatHistory((prev) => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      const response = (await kenyaLawApi.chatWithDocument({
        message: question,
        document_id: documentId,
        context: conversationContext,
      })) as KenyaLawChatResponse

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.response?.trim() || "I couldn't find an answer to that question in the document.",
        references: response.document_references,
        confidence: response.confidence,
        timestamp: new Date(),
      }

      setChatHistory((prev) => [...prev, assistantMessage])
      setQuestion("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while contacting the AI assistant.")
      setChatHistory((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (value: string) => {
    setQuestion(value)
  }

  const clearChat = () => {
    setChatHistory([])
    setError(null)
  }

  const formatTimestamp = (timestamp: Date) =>
    timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-6 w-6 shrink-0 text-purple-600" />
          <div>
            <h3 className="mb-2 font-medium text-purple-900">AI Legal Assistant</h3>
            <p className="mb-4 text-sm text-purple-700">
              Ask questions about researched legal documents. The assistant references the scraped content to build grounded responses.
            </p>

            <div className="max-w-md">
              <label htmlFor="hakilens-doc-id" className="mb-2 block text-sm font-medium text-purple-700">
                Document ID (from research results)
              </label>
              <input
                id="hakilens-doc-id"
                type="text"
                value={documentId}
                onChange={(event) => setDocumentId(event.target.value)}
                placeholder="e.g., doc_1762627721"
                className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </section>

      {chatHistory.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <header className="flex items-center justify-between border-b border-gray-200 p-4">
            <h4 className="flex items-center gap-2 font-medium text-gray-900">
              <MessageCircle className="h-5 w-5" />
              Chat History
            </h4>
            <button type="button" onClick={clearChat} className="text-sm text-gray-500 transition hover:text-gray-700">
              Clear Chat
            </button>
          </header>

          <div className="max-h-96 space-y-4 overflow-y-auto p-4">
            {chatHistory.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs rounded-lg px-4 py-3 text-sm lg:max-w-md ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`mt-2 text-xs ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>{formatTimestamp(message.timestamp)}</p>

                  {message.role === "assistant" && message.references?.length ? (
                    <div className="mt-3 border-t border-gray-200 pt-2">
                      <p className="mb-1 text-xs text-gray-500">References:</p>
                      <ul className="space-y-1">
                        {message.references.slice(0, 3).map((reference, index) => (
                          <li key={reference}>
                            <a
                              href={reference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block truncate text-xs text-blue-600 transition hover:text-blue-800"
                            >
                              {index + 1}. {reference}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI is thinking…
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Chat Error</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <section>
        <label htmlFor="hakilens-question" className="mb-2 block text-sm font-medium text-gray-700">
          Ask a Legal Question
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea
            id="hakilens-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g., What are the key provisions for maritime security cooperation?"
            rows={4}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.ctrlKey) {
                event.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={loading || !question.trim() || !documentId.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Sending…" : "Ask AI"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Press Ctrl+Enter to send quickly.</p>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-medium text-gray-700">Suggested Questions</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => handleSuggestedQuestion(item.text)}
              className="group rounded-lg border border-gray-200 p-4 text-left transition hover:bg-gray-50"
            >
              <span className="mb-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{item.category}</span>
              <p className="text-sm text-gray-900 transition group-hover:text-purple-600">{item.text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">💡 Tips for Better Results</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Enter the document ID from your most recent research session.</li>
          <li>• Ask focused, specific questions tied to the document content.</li>
          <li>• Reference sections, articles, or provisions when possible.</li>
          <li>• Use follow-up questions to dive deeper into nuanced issues.</li>
        </ul>
      </section>
    </div>
  )
}


