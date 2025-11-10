import type { LucideIcon } from "lucide-react"
import { Database, Search, Sparkles } from "lucide-react"

import AiAssistantTab from "../components/AiAssistantTab"
import CaseDatabaseTab from "../components/CaseDatabaseTab"
import DeepResearchTab from "../components/DeepResearchTab"
import LawyerSidebar from "../components/LawyerSidebar"
import TourGuide from "../components/TourGuide"
import { useProcess } from "../contexts/ProcessContext"
import { useFullViewToggle } from "../hooks/useFullViewToggle"
import { FullViewToggleButton } from "../components/FullViewToggleButton"

type HakiLensTab = "deep-research" | "case-database" | "ai-assistant"

interface TabDefinition {
  id: HakiLensTab
  label: string
  icon: LucideIcon
}

const TAB_DEFINITIONS: TabDefinition[] = [
  { id: "deep-research", label: "Deep Research", icon: Search },
  { id: "case-database", label: "Case Database", icon: Database },
  { id: "ai-assistant", label: "AI Assistant", icon: Sparkles },
]

export default function HakiLens() {
  const { getProcessState, updateProcessState } = useProcess()
  const { showTour, activeTab, deepResearchMode, searchUrl, lastDocumentId } = getProcessState("hakiLens")
  const { isFullView, toggleFullView } = useFullViewToggle("hakilens-full-view")

  const setActiveTab = (tab: HakiLensTab) => {
    updateProcessState("hakiLens", { activeTab: tab })
  }

  const handleModeChange = (mode: typeof deepResearchMode) => {
    updateProcessState("hakiLens", { deepResearchMode: mode })
  }

  const handleUrlChange = (url: string) => {
    updateProcessState("hakiLens", { searchUrl: url })
  }

  const handleResearchComplete = (result: { document_id: string }) => {
    updateProcessState("hakiLens", { lastDocumentId: result.document_id })
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "case-database":
        return <CaseDatabaseTab />
      case "ai-assistant":
        return <AiAssistantTab defaultDocumentId={lastDocumentId ?? undefined} />
      case "deep-research":
      default:
        return (
          <DeepResearchTab
            initialMode={deepResearchMode}
            initialUrl={searchUrl}
            onModeChange={handleModeChange}
            onUrlChange={handleUrlChange}
            onResearchComplete={handleResearchComplete}
          />
        )
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showTour && <TourGuide onComplete={() => updateProcessState("hakiLens", { showTour: false })} />}
      <LawyerSidebar onTourStart={() => updateProcessState("hakiLens", { showTour: true })} />
      <div className="ml-[280px] flex-1 p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">HakiLens – Kenya Law Research Hub</h1>
                <p className="text-sm text-gray-600">Comprehensive legal research with Kenya Law ingestion, AI analysis, and document management.</p>
              </div>
            </div>
            <FullViewToggleButton isFullView={isFullView} onToggle={toggleFullView} />
          </header>

          <section className="overflow-hidden rounded-lg bg-white shadow-sm">
            <nav className="border-b border-gray-200">
              <div className="flex gap-1 overflow-x-auto px-6">
                {TAB_DEFINITIONS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-medium transition ${
                        isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </nav>

            <div className="p-6 sm:p-8">{renderActiveTab()}</div>
          </section>
        </div>
      </div>
    </div>
  )
}