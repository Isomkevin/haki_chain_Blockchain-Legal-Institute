import { useMemo, useState } from "react"
import { Calendar, Database, ExternalLink, FileText, Search } from "lucide-react"

interface CaseRecord {
  id: number
  title: string
  court: string
  case_number: string
  date_created: string
  parties: string[]
  summary: string
  document_type: string
  url: string
  content_preview: string
}

type SortKey = "date_created" | "title" | "court" | "case_number"

const MOCK_CASES: CaseRecord[] = [
  {
    id: 1,
    title: "African Charter on Maritime Security and Safety",
    court: "African Union",
    case_number: "AU/Charter/2016",
    date_created: "2016-10-15",
    parties: ["African Union Member States"],
    summary: "Charter establishing framework for maritime security and safety in Africa.",
    document_type: "Charter",
    url: "https://new.kenyalaw.org/akn/aa-au/act/charter/2016/maritime-security-and-safety-and-development-in-africa/eng@2016-10-15",
    content_preview:
      "The African Charter on Maritime Security and Safety and Development in Africa, also known as the Lomé Charter, establishes a comprehensive framework…",
  },
]

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

export default function CaseDatabaseTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("date_created")
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null)
  const [loading] = useState(false)

  const filteredCases = useMemo(() => {
    if (!searchTerm.trim()) {
      return MOCK_CASES
    }

    const lowerTerm = searchTerm.toLowerCase()

    return MOCK_CASES.filter(
      (record) =>
        record.title.toLowerCase().includes(lowerTerm) ||
        record.case_number.toLowerCase().includes(lowerTerm) ||
        record.parties.some((party) => party.toLowerCase().includes(lowerTerm)),
    )
  }, [searchTerm])

  const sortedCases = useMemo(() => {
    const copy = [...filteredCases]

    copy.sort((a, b) => {
      if (sortBy === "date_created") {
        return new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      }

      return a[sortBy].localeCompare(b[sortBy])
    })

    return copy
  }, [filteredCases, sortBy])

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search cases by title, parties, or case number…"
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortKey)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_created">Date Created</option>
            <option value="title">Title</option>
            <option value="court">Court</option>
            <option value="case_number">Case Number</option>
          </select>
        </div>
        <p className="text-sm text-gray-600">
          Showing {sortedCases.length} of {MOCK_CASES.length} case{MOCK_CASES.length === 1 ? "" : "s"}
        </p>
      </section>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-4 w-1/4 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-2">
            <div className="mx-auto h-4 w-5/6 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ) : sortedCases.length === 0 ? (
        <div className="py-16 text-center">
          <Database className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">{searchTerm ? "No Cases Found" : "No Cases Available"}</h3>
          <p className="text-gray-600">
            {searchTerm ? "Try adjusting your search terms or filters." : "Run a deep research to populate your personal database."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedCases.map((record) => (
            <article
              key={record.id}
              onClick={() => setSelectedCase(record)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-medium text-gray-900 transition hover:text-blue-600">{record.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {record.document_type}
                    </span>
                    <span>{record.court}</span>
                    <span>{record.case_number}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {formatDate(record.date_created)}
                </div>
              </header>

              <p className="mb-3 line-clamp-2 text-sm text-gray-700">{record.content_preview}</p>

              <footer className="flex items-center justify-between text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">Parties:</span>
                  <span className="text-gray-700">{record.parties.join(", ")}</span>
                </div>
                <a
                  href={record.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
                  onClick={(event) => event.stopPropagation()}
                >
                  View Source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </footer>
            </article>
          ))}
        </div>
      )}

      {selectedCase && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900">Case Details</h2>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close case details"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-120px)] space-y-6 overflow-y-auto p-6">
              <section>
                <h3 className="mb-2 text-lg font-medium text-gray-900">{selectedCase.title}</h3>
                <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-700">Court</dt>
                    <dd className="text-gray-900">{selectedCase.court}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Case Number</dt>
                    <dd className="text-gray-900">{selectedCase.case_number}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Date</dt>
                    <dd className="text-gray-900">{formatDate(selectedCase.date_created)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-700">Document Type</dt>
                    <dd className="text-gray-900">{selectedCase.document_type}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h4 className="mb-2 font-medium text-gray-700">Parties</h4>
                <p className="text-gray-900">{selectedCase.parties.join(", ")}</p>
              </section>

              <section>
                <h4 className="mb-2 font-medium text-gray-700">Summary</h4>
                <p className="text-gray-900">{selectedCase.summary}</p>
              </section>

              <section>
                <h4 className="mb-2 font-medium text-gray-700">Content Preview</h4>
                <div className="rounded-lg bg-gray-50 p-4 text-gray-700">{selectedCase.content_preview}</div>
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Close
              </button>
              <a
                href={selectedCase.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                View Full Document
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


