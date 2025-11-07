import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

console.log("[ProcessContext] module evaluated")

type ProcessKey = "hakiDraft" | "hakiLens" | "hakiReview"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  error?: boolean
}

interface HakiDraftState {
  showTour: boolean
  category: string
  documentType: string
  clientName: string
  caseType: string
  description: string
  jurisdiction: string[]
  generating: boolean
  generatedDoc: string
  error: string | null
}

interface HakiLensState {
  showTour: boolean
  activeTab: string
  deepResearchMode: string
  searchUrl: string
  caseSearchTerm: string
  sortBy: string
  aiQuestion: string
  searching: boolean
  searchResult: string
  searchError: string | null
  aiAnswer: string
  aiLoading: boolean
  aiError: string | null
}

interface HakiReviewState {
  showTour: boolean
  message: string
  activeTab: string
  uploadedFile: string | null
  uploadedFileContent: string
  chatMessages: ChatMessage[]
  isLoading: boolean
}

type ProcessStore = {
  hakiDraft: HakiDraftState
  hakiLens: HakiLensState
  hakiReview: HakiReviewState
}

const createInitialState = (): ProcessStore => ({
  hakiDraft: {
    showTour: false,
    category: "",
    documentType: "",
    clientName: "",
    caseType: "",
    description: "",
    jurisdiction: ["Kenya"],
    generating: false,
    generatedDoc: "",
    error: null,
  },
  hakiLens: {
    showTour: false,
    activeTab: "deep-research",
    deepResearchMode: "auto-detect",
    searchUrl: "",
    caseSearchTerm: "",
    sortBy: "date_created",
    aiQuestion: "",
    searching: false,
    searchResult: "",
    searchError: null,
    aiAnswer: "",
    aiLoading: false,
    aiError: null,
  },
  hakiReview: {
    showTour: false,
    message: "",
    activeTab: "chat",
    uploadedFile: null,
    uploadedFileContent: "",
    chatMessages: [
      {
        id: "1",
        text: "Hi! I'm your AI document assistant. I can help you review, analyze, edit, and sign your legal documents. Upload a document to get started!",
        sender: "bot",
        timestamp: new Date(),
      },
    ],
    isLoading: false,
  },
})

type ProcessContextType = {
  state: ProcessStore
  getProcessState: <K extends ProcessKey>(key: K) => ProcessStore[K]
  updateProcessState: <K extends ProcessKey>(
    key: K,
    updater: Partial<ProcessStore[K]> | ((prev: ProcessStore[K]) => ProcessStore[K])
  ) => void
  resetProcessState: (key?: ProcessKey) => void
}

const ProcessContext = createContext<ProcessContextType | undefined>(undefined)

export function ProcessProvider({ children }: { children: ReactNode }) {
  console.log("[ProcessContext] provider render")
  const [state, setState] = useState<ProcessStore>(() => createInitialState())

  useEffect(() => {
    console.log("[ProcessContext] mounted")
    return () => {
      console.log("[ProcessContext] unmounted")
    }
  }, [])

  useEffect(() => {
    console.log("[ProcessContext] state change", state)
  }, [state])

  const getProcessState = <K extends ProcessKey>(key: K): ProcessStore[K] => {
    console.log("[ProcessContext] getProcessState", key)
    return state[key]
  }

  const updateProcessState = <K extends ProcessKey>(
    key: K,
    updater: Partial<ProcessStore[K]> | ((prev: ProcessStore[K]) => ProcessStore[K])
  ) => {
    setState((prev) => {
      const previous = prev[key]
      const nextState =
        typeof updater === "function"
          ? (updater as (prev: ProcessStore[K]) => ProcessStore[K])(previous)
          : { ...previous, ...updater }

      console.log("[ProcessContext] updateProcessState", key, nextState)

      return {
        ...prev,
        [key]: nextState,
      }
    })
  }

  const resetProcessState = (key?: ProcessKey) => {
    setState((prev) => {
      if (key) {
        console.log("[ProcessContext] resetProcessState", key)
        return {
          ...prev,
          [key]: createInitialState()[key],
        }
      }

      console.log("[ProcessContext] resetProcessState ALL")
      return createInitialState()
    })
  }

  const value = useMemo(
    () => ({
      state,
      getProcessState,
      updateProcessState,
      resetProcessState,
    }),
    [state]
  )

  return <ProcessContext.Provider value={value}>{children}</ProcessContext.Provider>
}

export function useProcess() {
  const context = useContext(ProcessContext)
  if (!context) {
    throw new Error("useProcess must be used within a ProcessProvider")
  }
  return context
}

export type { ProcessKey, ProcessStore, HakiDraftState, HakiLensState, HakiReviewState, ChatMessage }
