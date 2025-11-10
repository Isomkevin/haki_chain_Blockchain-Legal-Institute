import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react"

import kenyaLawApi from "../lib/kenyaLawApi"
import type { KenyaLawDocument, KenyaLawResearchResponse, ResearchMode, SuggestedUrl } from "../types/hakiLens"
import { LegalMarkdownRenderer } from "./LegalMarkdownRenderer"
import CaseChatModal from "./CaseChatModal"

const sanitizeMathExpression = (expr: string) => {
  return expr
    .replace(/\\(mathrm|mathbf|mathsf|pmb|boldsymbol)\s*\{([^}]*)\}/gi, "$2")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\^/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const sanitizeLegalContent = (content: string) => {
  if (!content) {
    return content
  }

  return content
    .replace(/\$([^$]+)\$/g, (_, expr: string) => {
      const cleaned = sanitizeMathExpression(expr)
      return cleaned ? ` ${cleaned} ` : " "
    })
    .replace(/[\uE000-\uF8FF]/g, "")
    .replace(/ {2,}/g, " ")
}

interface ChatModalState {
  isOpen: boolean
  caseData: KenyaLawDocument | null
}

const MODES: Array<{ key: ResearchMode; label: string; description: string }> = [
  {
    key: "auto-detect",
    label: "Auto Detect",
    description: "Automatically detects and researches cases or document listings.",
  },
  {
    key: "listing-crawl",
    label: "Listing Crawl",
    description: "Crawls through paginated case listings and document collections.",
  },
  {
    key: "single-case",
    label: "Single Document",
    description: "Research a single case or document page in detail.",
  },
]

const MODE_LIMITS: Record<ResearchMode, number> = {
  "auto-detect": 10,
  "listing-crawl": 10,
  "single-case": 1,
}

interface DeepResearchTabProps {
  initialMode?: ResearchMode
  initialUrl?: string
  onModeChange?: (mode: ResearchMode) => void
  onUrlChange?: (url: string) => void
  onResearchComplete?: (result: KenyaLawResearchResponse) => void
}

export default function DeepResearchTab({
  initialMode = "auto-detect",
  initialUrl = "",
  onModeChange,
  onUrlChange,
  onResearchComplete,
}: DeepResearchTabProps) {
  const [searchMode, setSearchMode] = useState<ResearchMode>(initialMode)
  const [searchUrl, setSearchUrl] = useState(initialUrl)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<KenyaLawResearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedCases, setExpandedCases] = useState<Record<number, boolean>>({})
  const [chatModal, setChatModal] = useState<ChatModalState>({ isOpen: false, caseData: null })

  const suggestedUrls = useMemo<SuggestedUrl[]>(() => kenyaLawApi.getSuggestedUrls(), [])

  useEffect(() => {
    if (initialMode !== searchMode) {
      setSearchMode(initialMode)
    }
  }, [initialMode, searchMode])

  useEffect(() => {
    if (initialUrl !== searchUrl) {
      setSearchUrl(initialUrl)
    }
  }, [initialUrl, searchUrl])

  const handleModeSelect = (mode: ResearchMode) => {
    setSearchMode(mode)
    onModeChange?.(mode)
  }

  const handleUrlChange = (url: string) => {
    setSearchUrl(url)
    onUrlChange?.(url)
  }

  const handleSearch = useCallback(async () => {
    if (!searchUrl.trim()) {
      setError("Please enter a valid URL.")
      return
    }

    if (!kenyaLawApi.isValidKenyaLawUrl(searchUrl)) {
      setError("Please enter a valid Kenya Law URL (kenyalaw.org).")
      return
    }

    setSearching(true)
    setError(null)
    setResults(null)
    setExpandedCases({})

    try {
      const response = (await kenyaLawApi.researchKenyaLaw({
        url: searchUrl,
        limit: MODE_LIMITS[searchMode],
        research_links: searchMode !== "single-case",
      })) as KenyaLawResearchResponse

      setResults(response)
      onResearchComplete?.(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while researching the URL.")
    } finally {
      setSearching(false)
    }
  }, [onResearchComplete, searchMode, searchUrl])

  const handleSuggestedUrl = (url: string) => {
    handleUrlChange(url)
    setError(null)
  }

  const toggleCaseExpansion = (index: number) => {
    setExpandedCases((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const openChatModal = (caseData: KenyaLawDocument) => {
    setChatModal({ isOpen: true, caseData })
  }

  const closeChatModal = () => {
    setChatModal({ isOpen: false, caseData: null })
  }

  const durationText = results?.duration ? `${results.duration.toFixed(2)}s` : "—"

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-4 text-lg font-medium text-gray-900">Research Mode</h3>
        <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => handleModeSelect(mode.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                searchMode === mode.key ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">{MODES.find((mode) => mode.key === searchMode)?.description}</p>
      </section>

      <section>
        <label htmlFor="hakilens-url" className="mb-2 block text-sm font-medium text-gray-700">
          Kenya Law URL
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            id="hakilens-url"
            type="url"
            value={searchUrl}
            onChange={(event) => handleUrlChange(event.target.value)}
            placeholder="https://new.kenyalaw.org/akn/..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchUrl.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Start Research
              </>
            )}
          </button>
        </div>
      </section>

      <section>
        <h4 className="mb-3 text-sm font-medium text-gray-700">Suggested URLs</h4>
        <div className="grid gap-2 md:grid-cols-2">
          {suggestedUrls.map((item) => (
            <button
              key={item.url}
              type="button"
              onClick={() => handleSuggestedUrl(item.url)}
              className="group flex items-start justify-between rounded-lg border border-gray-200 p-3 text-left transition hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1 pr-4">
                <div className="font-medium text-gray-900 transition group-hover:text-blue-600">{item.description}</div>
                <div className="mt-1 break-all text-sm text-gray-500">{item.url}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    item.type === "listing" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {item.type}
                </span>
                <ExternalLink className="h-4 w-4 text-gray-400 transition group-hover:text-blue-600" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Research Failed</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Research Completed</h4>
                <p className="text-sm text-green-700">
                  Successfully researched {results.total_pages} page{results.total_pages === 1 ? "" : "s"} in {durationText}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div>
                <dt className="font-medium text-gray-700">Total Pages</dt>
                <dd className="text-gray-900">{results.total_pages}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Duration</dt>
                <dd className="text-gray-900">{durationText}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-700">Document ID</dt>
                <dd className="font-mono text-xs text-gray-900">{results.document_id}</dd>
              </div>
            </dl>

            {results.results?.length ? (
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Researched Documents</h5>
                {results.results.map((doc, index) => {
                  const isExpanded = Boolean(expandedCases[index])
                  const sanitizedContent = doc.content ? sanitizeLegalContent(doc.content) : ""
                  const contentLength = doc.content_length ?? sanitizedContent.length

                  return (
                    <article key={doc.url ?? index} className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="p-4">
                        <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1">
                            <h6 className="mb-1 text-base font-medium text-gray-900">{doc.title || `Document ${index + 1}`}</h6>
                            {doc.url && <p className="break-all text-sm text-gray-600">{doc.url}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openChatModal(doc)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                            >
                              <MessageSquare className="h-3 w-3" />
                              Chat with Case
                            </button>
                            {doc.url && (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 transition hover:text-blue-800"
                                aria-label="Open original document"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </header>

                        {sanitizedContent && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Content ({contentLength.toLocaleString()} characters)</span>
                              <button
                                type="button"
                                onClick={() => toggleCaseExpansion(index)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-800"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-4 w-4" />
                                    Show Full Content
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
                              {isExpanded ? (
                                <LegalMarkdownRenderer content={sanitizedContent} className="prose-sm max-w-none" />
                              ) : (
                                <>
                                  <p className="mb-2 text-sm font-medium text-gray-700">Content Preview:</p>
                                  <LegalMarkdownRenderer
                                    content={`${sanitizedContent.slice(0, 500)}${sanitizedContent.length > 500 ? "…" : ""}`}
                                    className="prose-sm max-w-none"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No detailed documents were returned for this search.</p>
            )}
          </div>
        </div>
      )}

      <CaseChatModal isOpen={chatModal.isOpen} onClose={closeChatModal} caseData={chatModal.caseData} documentId={results?.document_id} />
    </div>
  )
}


