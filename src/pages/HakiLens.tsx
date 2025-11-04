import { useState } from "react"
import LawyerSidebar from "../components/LawyerSidebar"
import { Search, Database, Sparkles } from "lucide-react"
import TourGuide from "../components/TourGuide"

export default function HakiLens() {
  const [activeTab, setActiveTab] = useState("deep-research")
  const [deepResearchMode, setDeepResearchMode] = useState("auto-detect")
  const [searchUrl, setSearchUrl] = useState("")
  const [caseSearchTerm, setCaseSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date_created")
  const [aiQuestion, setAiQuestion] = useState("")
  const [showTour, setShowTour] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState("")

  const handleDeepResearch = () => {
    if (!searchUrl) {
      alert("Please enter a URL to research")
      return
    }
    setSearching(true)
    setTimeout(() => {
      setSearchResult(`Deep Research Results for: ${searchUrl}\n\nMode: ${deepResearchMode}\n\n[This is a placeholder for deep research results. Backend integration pending.]`)
      setSearching(false)
    }, 2000)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showTour && <TourGuide onComplete={() => setShowTour(false)} />}
      <LawyerSidebar onTourStart={() => setShowTour(true)} />
      <div className="flex-1 ml-[280px] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HakiLens - Comprehensive Legal Research Hub</h1>
            </div>
            <p className="text-gray-600">Advanced case deep research, database management, and AI-powered analysis</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <div className="flex gap-1 px-6">
                <button
                  onClick={() => setActiveTab("deep-research")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === "deep-research" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
                >
                  Deep Research
                </button>
                <button
                  onClick={() => setActiveTab("case-database")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === "case-database" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
                >
                  Case Database
                </button>
                <button
                  onClick={() => setActiveTab("ai-assistant")}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition ${activeTab === "ai-assistant" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
                >
                  AI Assistant
                </button>
              </div>
            </div>

            <div className="p-8">
              {activeTab === "deep-research" && (
                <div>
                  <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4">
                    <button
                      onClick={() => setDeepResearchMode("auto-detect")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${deepResearchMode === "auto-detect" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Auto Detect
                    </button>
                    <button
                      onClick={() => setDeepResearchMode("listing-crawl")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${deepResearchMode === "listing-crawl" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Listing Crawl
                    </button>
                    <button
                      onClick={() => setDeepResearchMode("single-case")}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition ${deepResearchMode === "single-case" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Single Case
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL to Deep Research</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={searchUrl}
                        onChange={(e) => setSearchUrl(e.target.value)}
                        placeholder="https://example.com/case-page-or-listing"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleDeepResearch}
                        disabled={searching}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50"
                      >
                        {searching ? "Searching..." : "Deep Research"}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {deepResearchMode === "auto-detect" && "Automatically detects cases or listings"}
                      {deepResearchMode === "listing-crawl" && "Crawls paginated listings"}
                      {deepResearchMode === "single-case" && "Research single case detail page"}
                    </p>
                  </div>

                  {searchResult && (
                    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                      <h3 className="font-medium text-gray-900 mb-3">Research Results</h3>
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{searchResult}</pre>
                      <button
                        onClick={() => setSearchResult("")}
                        className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Clear Results
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "case-database" && (
                <div>
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={caseSearchTerm}
                        onChange={(e) => setCaseSearchTerm(e.target.value)}
                        placeholder="Search cases by title, parties, or content..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="date_created">Date Created</option>
                      <option value="title">Title</option>
                      <option value="court">Court</option>
                      <option value="case_number">Case Number</option>
                    </select>
                  </div>

                  <div className="text-center py-16">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Found</h3>
                    <p className="text-gray-600">Try adjusting your search or load more cases.</p>
                  </div>
                </div>
              )}

              {activeTab === "ai-assistant" && (
                <div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium text-purple-900 mb-1">AI Legal Assistant</h3>
                        <p className="text-sm text-purple-700">
                          Ask questions about your case database. The AI will search through case content and provide answers based on relevant cases.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ask a Legal Question</label>
                    <textarea
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="e.g., What are the key precedents for contract disputes in commercial law?"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    ></textarea>
                    <div className="mt-4 flex justify-end">
                      <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition">
                        Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
