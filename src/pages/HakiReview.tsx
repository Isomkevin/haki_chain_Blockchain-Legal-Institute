import { useRef, useEffect, useState, useMemo, type FormEvent } from "react"
import LawyerSidebar from "../components/LawyerSidebar"
import {
  Eye,
  Upload,
  MessageSquare,
  FileText,
  Edit,
  FileSignature,
  Send,
  AlertCircle,
  StickyNote,
  ListTree,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Download,
  PanelRightOpen,
  PanelLeftOpen,
  PanelsTopLeft,
  Sparkles,
  X,
} from "lucide-react"
import TourGuide from "../components/TourGuide"
import { chatCompletion } from "../lib/llm"
import { LegalMarkdownRenderer } from "../components/LegalMarkdownRenderer"
import { motion } from "framer-motion"
import { FullViewToggleButton } from "../components/FullViewToggleButton"
import { useFullViewToggle } from "../hooks/useFullViewToggle"
import { useProcess } from "../contexts/ProcessContext"
import { useLegalToast } from "../components/LegalToast"
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { Document as PDFDocument, Page, pdfjs } from "react-pdf"

if (pdfWorker) {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
}

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  error?: boolean
}

export default function HakiReview() {
  const { state: processState, updateProcessState } = useProcess()
  const reviewState = processState.hakiReview
  const notify = useLegalToast()
  const { showTour, message, activeTab, uploadedFile, uploadedFileContent, chatMessages, isLoading } = reviewState
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const MAX_CONTEXT_CHARS = 6000
  const { isFullView, toggleFullView } = useFullViewToggle("hakireview-full-chat")
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null)
  const [annotationDraft, setAnnotationDraft] = useState("")
  const [pdfScale, setPdfScale] = useState(1)
  const [fitToWidth, setFitToWidth] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [viewerWidth, setViewerWidth] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showThumbnails, setShowThumbnails] = useState(false)
  const uploadedUrlRef = useRef<string | undefined>(reviewState.uploadedFileUrl)
  const clauseEntries = useMemo(() => {
    const entries: { id: string; title: string }[] = []
    chatMessages.forEach((chatMessage) => {
      if (chatMessage.sender !== "bot" || !chatMessage.text) return
      const lines = chatMessage.text.split("\n")
      lines.forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed) return
        const normalized = trimmed.replace(/^#+\s*/, "")
        if (/^(clause|section|article)/i.test(normalized) || /^[0-9]+(\.[0-9]+)*\s/.test(normalized)) {
          entries.push({ id: chatMessage.id, title: normalized.slice(0, 120) })
        }
      })
    })
    return entries
  }, [chatMessages])

  const pdfSource = useMemo(() => {
    if (reviewState.uploadedFileUrl) return reviewState.uploadedFileUrl
    if (reviewState.uploadedFileBuffer) return { data: new Uint8Array(reviewState.uploadedFileBuffer) }
    return null
  }, [reviewState.uploadedFileUrl, reviewState.uploadedFileBuffer])

  const isPdfDocument = Boolean(reviewState.uploadedFileType?.toLowerCase().includes("pdf") && pdfSource)
  const effectiveWidth = Math.max(viewerWidth - (isFullScreen ? 32 : 48), 320)
  const computedPageWidth = effectiveWidth * (fitToWidth ? 1 : pdfScale)

  useEffect(() => {
    console.log("[HakiReview] mounted")
    return () => {
      console.log("[HakiReview] unmounted")
    }
  }, [])

  useEffect(() => {
    console.log("[HakiReview] state updated", reviewState)
  }, [reviewState])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  useEffect(() => {
    uploadedUrlRef.current = reviewState.uploadedFileUrl
  }, [reviewState.uploadedFileUrl])

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) {
        URL.revokeObjectURL(uploadedUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const node = viewerContainerRef.current
    if (!node) return

    if (typeof ResizeObserver === "undefined") {
      setViewerWidth(node.clientWidth)
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      setViewerWidth(entry.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [isFullScreen])

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isFullScreen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullScreen) {
        setIsFullScreen(false)
        setIsChatDrawerOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullScreen])

  const handleZoomIn = () => {
    setFitToWidth(false)
    setPdfScale((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setFitToWidth(false)
    setPdfScale((prev) => Math.max(prev - 0.2, 0.6))
  }

  const handleFitWidth = () => {
    setFitToWidth(true)
    setPdfScale(1)
  }

  const toggleFullScreenMode = () => {
    setIsFullScreen((prev) => {
      const next = !prev
      if (!next) {
        setIsChatDrawerOpen(false)
      }
      return next
    })
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }

  const handlePageInput = (value: number) => {
    if (Number.isNaN(value)) return
    const clamped = Math.min(Math.max(1, value), numPages)
    setCurrentPage(clamped)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    notify({
      title: "PDF search coming soon",
      description: `We'll highlight matches for "${searchQuery.trim()}" in an upcoming release.`,
    })
  }

  const handleHighlightClauses = () => {
    notify({
      title: "AI highlighting is on the roadmap",
      description: "We'll automatically flag key clauses in a future update.",
    })
  }

  const toggleThumbnails = () => {
    setShowThumbnails((prev) => !prev)
  }

  const toggleChatPanel = () => {
    setIsChatCollapsed((prev) => !prev)
  }

  const openChatDrawer = () => {
    setIsChatDrawerOpen(true)
  }

  const closeChatDrawer = () => {
    setIsChatDrawerOpen(false)
  }

  const handleDownloadDocument = () => {
    if (!reviewState.uploadedFileUrl) {
      notify({
        title: "Download unavailable",
        description: "Upload a PDF document to enable downloads.",
        variant: "warning",
      })
      return
    }

    const link = document.createElement("a")
    link.href = reviewState.uploadedFileUrl
    link.download = reviewState.uploadedFile || "hakireview-document.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const extractTextFromFile = async (file: File, arrayBuffer: ArrayBuffer) => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfjs = (await import("pdfjs-dist/build/pdf")) as any
      const workerSrc = await import("pdfjs-dist/build/pdf.worker?url")
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc.default || workerSrc

      const uint8Array = new Uint8Array(arrayBuffer)
      const pdf = await pdfjs.getDocument({ data: uint8Array }).promise
      let extracted = ""

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        extracted += content.items.map((item: any) => item.str).join(" ") + "\n"

        if (extracted.length >= MAX_CONTEXT_CHARS * 1.2) {
          break
        }
      }

      return extracted
    }

    if (file.name.toLowerCase().endsWith(".docx")) {
      const mammoth = (await import("mammoth")) as any
      const { value } = await mammoth.extractRawText({ arrayBuffer }) 
      return value
    }

    const decoder = new TextDecoder("utf-8")
    return decoder.decode(arrayBuffer)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const blob = new Blob([arrayBuffer], { type: file.type || "application/octet-stream" })
      const content = await extractTextFromFile(file, arrayBuffer)
      const objectUrl = URL.createObjectURL(blob)

      setCurrentPage(1)
      setNumPages(1)
      setFitToWidth(true)
      setPdfScale(1)
      setShowThumbnails(false)

      if (reviewState.uploadedFileUrl) {
        URL.revokeObjectURL(reviewState.uploadedFileUrl)
      }

      updateProcessState("hakiReview", (prev) => {
        const fileMessage: ChatMessage = {
          id: Date.now().toString(),
          text: `I've ingested "${file.name}". Ask me anything about it.`,
          sender: "bot",
          timestamp: new Date(),
        }

        return {
          ...prev,
          uploadedFile: file.name,
          uploadedFileContent: content.slice(0, MAX_CONTEXT_CHARS),
          uploadedFileBuffer: arrayBuffer,
          uploadedFileType: file.type,
          uploadedFileUrl: objectUrl,
          chatMessages: [...prev.chatMessages, fileMessage],
        }
      })
    } catch (error) {
      updateProcessState("hakiReview", (prev) => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          {
            id: Date.now().toString(),
            text: `Failed to read "${file.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
            sender: "bot",
            timestamp: new Date(),
            error: true,
          },
        ],
      }))
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    }

    updateProcessState("hakiReview", (prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage],
      message: "",
      isLoading: true,
    }))

    const loadingMessageId = (Date.now() + 1).toString()

    updateProcessState("hakiReview", (prev) => ({
      ...prev,
      chatMessages: [
        ...prev.chatMessages,
        {
          id: loadingMessageId,
          text: "Analyzing...",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    }))

    try {
      const systemPrompt = `You are an AI document review assistant specializing in legal documents. 
You help lawyers review, analyze, and understand legal documents. 
${uploadedFile ? `The user has uploaded a document: ${uploadedFile}.` : "No document has been uploaded yet."}
Provide clear, accurate analysis and suggestions for legal documents. Base your responses only on the provided context and user messages.`

      const documentContext = uploadedFileContent
        ? `Here is the document context (truncated to ${MAX_CONTEXT_CHARS} characters):\n${uploadedFileContent}`
        : ""

      const response = await chatCompletion(
        documentContext
          ? `${documentContext}\n\nUser question:\n${userMessage.text}`
          : userMessage.text,
        systemPrompt
      )

      updateProcessState("hakiReview", (prev) => {
        const filteredMessages = prev.chatMessages.filter((msg) => msg.id !== loadingMessageId)

        if (response.error) {
          return {
            ...prev,
            chatMessages: [
              ...filteredMessages,
              {
                id: (Date.now() + 2).toString(),
                text: `Error: ${response.error}\n\nPlease check your API configuration.`,
                sender: "bot",
                timestamp: new Date(),
                error: true,
              },
            ],
            isLoading: false,
          }
        }

        return {
          ...prev,
          chatMessages: [
            ...filteredMessages,
            {
              id: (Date.now() + 2).toString(),
              text: response.content?.trim() || "I apologize, but I couldn't generate a response. Please try again.",
              sender: "bot",
              timestamp: new Date(),
            },
          ],
          isLoading: false,
        }
      })
    } catch (error) {
      updateProcessState("hakiReview", (prev) => {
        const filteredMessages = prev.chatMessages.filter((msg) => msg.id !== loadingMessageId)

        return {
          ...prev,
          chatMessages: [
            ...filteredMessages,
            {
              id: (Date.now() + 2).toString(),
              text: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
              sender: "bot",
              timestamp: new Date(),
              error: true,
            },
          ],
          isLoading: false,
        }
      })
    }
  }

  const openAnnotationEditor = (messageId: string) => {
    setActiveAnnotationId(messageId)
    setAnnotationDraft(reviewState.annotations[messageId] || "")
  }

  const handleAnnotationSave = () => {
    if (!activeAnnotationId) return
    const value = annotationDraft.trim()

    updateProcessState("hakiReview", (prev) => {
      const nextAnnotations = { ...prev.annotations }
      if (value) {
        nextAnnotations[activeAnnotationId] = value
      } else {
        delete nextAnnotations[activeAnnotationId]
      }
      return {
        ...prev,
        annotations: nextAnnotations,
      }
    })

    notify({
      title: value ? "Annotation saved" : "Annotation removed",
      description: value ? "Your note is now pinned to this clause." : "The note has been cleared.",
      variant: value ? "success" : "warning",
    })

    setActiveAnnotationId(null)
    setAnnotationDraft("")
  }

  const handleAnnotationCancel = () => {
    setActiveAnnotationId(null)
    setAnnotationDraft("")
  }

  const scrollToClause = (messageId: string) => {
    const target = document.getElementById(`message-${messageId}`)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
      target.classList.add("ring-2", "ring-teal-500/70", "ring-offset-2")
      window.setTimeout(() => {
        target.classList.remove("ring-2", "ring-teal-500/70", "ring-offset-2")
      }, 1600)
    }
  }

  useEffect(() => {
    try {
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString()
      }
    } catch (error) {
      console.warn("Failed to configure pdf.js worker", error)
    }
  }, [])

  const handleDocumentError = (error: Error) => {
    console.error("Failed to load PDF", error)
    setNumPages(1)
    setCurrentPage(1)
    notify({
      title: "Unable to load PDF",
      description: error.message || "The viewer could not render this file.",
      variant: "error",
    })
  }

  const chatContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => updateProcessState("hakiReview", { activeTab: "chat" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === "chat" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => updateProcessState("hakiReview", { activeTab: "edit" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === "edit" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => updateProcessState("hakiReview", { activeTab: "esign" })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === "esign" ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FileSignature className="w-4 h-4" />
            E-Sign
          </button>
        </div>
        <button
          onClick={toggleChatPanel}
          className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:border-teal-400 hover:text-teal-600"
        >
          {isChatCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          {isChatCollapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {activeTab === "chat" && (
        <>
          <div className="flex flex-1 flex-col lg:flex-row gap-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((msg) => {
                const isBotMessage = msg.sender === "bot" && !msg.error
                const annotation = reviewState.annotations[msg.id]
                return (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      id={`message-${msg.id}`}
                      className={`max-w-[85%] px-4 py-3 rounded-lg transition ring-offset-2 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : msg.error
                          ? "bg-red-100 text-red-800 rounded-bl-none border border-red-300"
                          : "bg-gray-100 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      {msg.error ? (
                        <>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3" />
                            <p className="text-xs font-semibold">Error</p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </>
                      ) : msg.sender === "bot" ? (
                        <LegalMarkdownRenderer content={msg.text} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      )}
                      <p
                        className={`text-xs mt-2 opacity-70 ${
                          msg.sender === "user" ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>

                      {isBotMessage && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {annotation && (
                            <div className="inline-flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
                              <StickyNote className="h-3.5 w-3.5" />
                              Note attached
                            </div>
                          )}
                          <button
                            onClick={() => openAnnotationEditor(msg.id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 focus:outline-none"
                          >
                            <StickyNote className="h-3.5 w-3.5" />
                            {annotation ? "Edit note" : "Add note"}
                          </button>
                        </div>
                      )}

                      {annotation && (
                        <div className="mt-2 rounded-lg border border-teal-200 bg-white/70 px-3 py-2 text-xs text-teal-900">
                          {annotation}
                        </div>
                      )}

                      {activeAnnotationId === msg.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={annotationDraft}
                            onChange={(e) => setAnnotationDraft(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-teal-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                            placeholder="Add your legal analysis, follow-up, or to-do..."
                          />
                          <div className="flex justify-end gap-2 text-sm">
                            <button onClick={handleAnnotationCancel} className="px-3 py-1.5 text-gray-600 hover:text-gray-800">
                              Cancel
                            </button>
                            <button
                              onClick={handleAnnotationSave}
                              className="px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            >
                              Save note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <aside className="hidden shrink-0 lg:flex w-56 flex-col gap-2 border-l border-gray-200 pl-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <ListTree className="h-3.5 w-3.5" />
                Clause Navigator
              </div>
              <div className="space-y-2 overflow-y-auto pr-1">
                {clauseEntries.length === 0 ? (
                  <p className="text-xs text-gray-500">Responses will surface clause summaries here.</p>
                ) : (
                  clauseEntries.map((entry, index) => (
                    <button
                      key={`${entry.id}-${index}`}
                      onClick={() => scrollToClause(entry.id)}
                      className="w-full text-left rounded-lg border border-gray-200 px-3 py-2 text-xs hover:border-teal-300 hover:bg-teal-50"
                    >
                      <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                      <p className="text-[11px] text-gray-500">Clause reference • {index + 1}</p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>

          {clauseEntries.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-3 lg:hidden">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                <ListTree className="h-3.5 w-3.5" />
                Clause Navigator
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {clauseEntries.map((entry, index) => (
                  <button
                    key={`${entry.id}-mobile-${index}`}
                    onClick={() => scrollToClause(entry.id)}
                    className="min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-left text-xs hover:border-teal-300 hover:bg-teal-50"
                  >
                    <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                    <p className="text-[11px] text-gray-500">Clause {index + 1}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => updateProcessState("hakiReview", { message: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me about your document..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "edit" && (
        <div className="text-center py-12">
          <Edit className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Document Editor</h3>
          <p className="text-sm text-gray-600">Upload a document to start editing</p>
        </div>
      )}

      {activeTab === "esign" && (
        <div className="text-center py-12">
          <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Electronic Signature</h3>
          <p className="text-sm text-gray-600">Upload a document to add signatures</p>
        </div>
      )}
    </div>
  )

  const pageWidth = computedPageWidth > 0 ? computedPageWidth : 720
  const toolbarButtonBase =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2"
  const toolbarButtonScheme = isFullScreen
    ? "border-slate-700 text-slate-200 hover:border-slate-500 hover:text-white focus:ring-slate-500/40"
    : "border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-600 focus:ring-teal-500/20"
  const toolbarButtonClass = `${toolbarButtonBase} ${toolbarButtonScheme} disabled:cursor-not-allowed disabled:opacity-40`
  const toolbarIconButtonClass = `${toolbarButtonClass} px-2`
  const secondaryTextClass = isFullScreen ? "text-slate-300" : "text-gray-500"

  return (
    <div className={`flex min-h-screen bg-gray-50 ${isFullScreen ? "overflow-hidden" : ""}`}>
      {showTour && <TourGuide onComplete={() => updateProcessState("hakiReview", { showTour: false })} />}
      <LawyerSidebar onTourStart={() => updateProcessState("hakiReview", { showTour: true })} />
      <motion.div className={`flex-1 ${isFullScreen ? "ml-0 p-0" : "ml-[280px] p-6 lg:p-8"}`} layout>
        <div className={`${isFullScreen ? "w-full max-w-full" : "max-w-7xl mx-auto"} w-full`}>
          {!isFullScreen && (
            <div className="mb-8 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">HakiReview</h1>
                  <p className="text-gray-600">AI-powered document analysis and legal review</p>
                </div>
              </div>
              <FullViewToggleButton isFullView={isFullView} onToggle={toggleFullView} />
            </div>
          )}

          <div className={`relative flex w-full flex-col gap-6 ${isFullScreen ? "h-screen" : "lg:flex-row"}`}>
            <div
              className={`${
                isFullScreen
                  ? "fixed inset-0 z-[60] flex flex-col bg-slate-900/95 px-4 py-6 text-slate-100 lg:px-12 lg:py-10"
                  : "flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm lg:flex-1 lg:basis-2/3"
              }`}
            >
              <div className={`${isFullScreen ? "mx-auto flex h-full w-full max-w-6xl flex-col" : "flex h-full flex-col"}`}>
                <div
                  className={`sticky top-0 z-10 backdrop-blur ${
                    isFullScreen
                      ? "border-b border-slate-700 bg-slate-900/80 text-slate-100"
                      : "border-b border-gray-200 bg-white/95 text-gray-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${secondaryTextClass}`}>Document Controls</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleZoomOut}
                        disabled={!isPdfDocument || pdfScale <= 0.6}
                        className={toolbarIconButtonClass}
                        title="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleZoomIn}
                        disabled={!isPdfDocument || pdfScale >= 3}
                        className={toolbarIconButtonClass}
                        title="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={handleFitWidth}
                      disabled={!isPdfDocument}
                      className={toolbarButtonClass}
                    >
                      {fitToWidth ? "Fit to width" : "Fit page"}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={goToPreviousPage}
                        disabled={!isPdfDocument || currentPage <= 1}
                        className={toolbarIconButtonClass}
                        title="Previous page"
                      >
                        <PanelLeftOpen className="h-4 w-4" />
                      </button>
                      <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${secondaryTextClass} ${isFullScreen ? "border-slate-700" : "border-gray-200"}`}>
                        <input
                          type="number"
                          min={1}
                          max={numPages}
                          value={currentPage}
                          onChange={(e) => handlePageInput(Number(e.target.value))}
                          className={`w-12 rounded border px-1 py-0.5 text-center text-xs outline-none ${
                            isFullScreen ? "border-slate-700 bg-slate-800 text-slate-100" : "border-gray-200"
                          }`}
                          disabled={!isPdfDocument}
                        />
                        <span>/ {numPages}</span>
                      </div>
                      <button
                        onClick={goToNextPage}
                        disabled={!isPdfDocument || currentPage >= numPages}
                        className={toolbarIconButtonClass}
                        title="Next page"
                      >
                        <PanelRightOpen className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={toggleFullScreenMode}
                      disabled={!isPdfDocument}
                      className={toolbarButtonClass}
                    >
                      {isFullScreen ? (
                        <>
                          <Minimize2 className="h-4 w-4" />
                          Exit Full Screen
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-4 w-4" />
                          Full Screen
                        </>
                      )}
                    </button>
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                          isFullScreen ? "border-slate-700 bg-slate-900/60" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Search className={`h-3.5 w-3.5 ${secondaryTextClass}`} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search document"
                          className={`w-32 bg-transparent text-xs outline-none ${
                            isFullScreen ? "text-slate-100 placeholder:text-slate-400" : "text-gray-700 placeholder:text-gray-400"
                          }`}
                          disabled={!isPdfDocument}
                        />
                      </div>
                      <button type="submit" disabled={!isPdfDocument || !searchQuery.trim()} className={toolbarButtonClass}>
                        Search
                      </button>
                    </form>
                    <button
                      onClick={handleDownloadDocument}
                      disabled={!isPdfDocument}
                      className={toolbarButtonClass}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                  <div className={`flex flex-wrap items-center gap-2 px-4 pb-3 text-xs ${secondaryTextClass}`}>
                    {uploadedFile && (
                      <span className={`${isFullScreen ? "text-slate-200" : "text-gray-600"}`}>
                        Reviewing: <span className="font-semibold">{uploadedFile}</span>
                      </span>
                    )}
                    <label className={`${toolbarButtonClass} cursor-pointer`}
                    >
                      <Upload className="h-4 w-4" />
                      {uploadedFile ? "Replace Document" : "Upload Document"}
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {uploadedFile && (
                      <button onClick={handleHighlightClauses} className={toolbarButtonClass}>
                        <Sparkles className="h-4 w-4" />
                        Highlight Key Clauses
                      </button>
                    )}
                    {isPdfDocument && (
                      <button onClick={toggleThumbnails} className={toolbarButtonClass}>
                        <PanelsTopLeft className="h-4 w-4" />
                        {showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
                      </button>
                    )}
                    <button
                      onClick={toggleChatPanel}
                      className={`${toolbarButtonClass} hidden lg:inline-flex`}
                    >
                      {isChatCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                      {isChatCollapsed ? "Open Chat" : "Collapse Chat"}
                    </button>
                  </div>
                </div>

                <div ref={viewerContainerRef} className="flex-1 overflow-hidden">
                  {isPdfDocument ? (
                    <div className="h-full overflow-y-auto px-4 pb-6">
                      <PDFDocument
                        file={pdfSource as string | { data: Uint8Array }}
                        onLoadSuccess={({ numPages: nextNumPages }) => {
                          setNumPages(nextNumPages)
                          setCurrentPage((prev) => Math.min(prev, nextNumPages))
                        }}
                        onLoadError={handleDocumentError}
                        loading={<div className="py-20 text-center text-sm text-gray-500">Preparing PDF…</div>}
                      >
                        <Page
                          pageNumber={currentPage}
                          width={pageWidth}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                          className="mx-auto shadow-lg"
                        />
                      </PDFDocument>
                    </div>
                  ) : uploadedFile ? (
                    <div className="h-full overflow-y-auto px-6 py-8">
                      <LegalMarkdownRenderer content={uploadedFileContent} />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-gray-500">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="text-sm font-medium">Upload a PDF, DOCX, or DOC to begin reviewing</p>
                      <p className="text-xs text-gray-400">
                        Use the controls below to bring in pleadings, contracts, or filings for analysis.
                      </p>
                      <label className="mt-2 inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-teal-700 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Upload Document
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {showThumbnails && numPages > 1 && (
                  <div className={`border-t px-4 py-3 ${isFullScreen ? "border-slate-700" : "border-gray-200"}`}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <PanelsTopLeft className="h-3.5 w-3.5" />
                      Page Thumbnails
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {Array.from({ length: numPages }).map((_, index) => (
                        <button
                          key={`thumb-${index}`}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`flex h-20 w-14 items-center justify-center rounded-md border text-xs ${
                            currentPage === index + 1
                              ? "border-teal-500 bg-teal-50 text-teal-700"
                              : isFullScreen
                              ? "border-slate-700 bg-slate-800 text-slate-300"
                              : "border-gray-200 bg-white text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isFullScreen && (
              <div
                className={`${
                  isChatCollapsed ? "hidden" : "hidden lg:flex"
                } lg:basis-1/3 lg:max-w-[420px] flex-col rounded-xl border border-gray-200 bg-white shadow-sm`}
              >
                {chatContent}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {!isFullScreen && (
        <button
          onClick={openChatDrawer}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 lg:hidden"
        >
          <MessageSquare className="h-4 w-4" />
          Open Chat
        </button>
      )}

      {isFullScreen && (
        <>
          <button
            onClick={toggleFullScreenMode}
            className="fixed top-4 right-4 z-[70] inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 shadow-lg hover:bg-slate-700"
          >
            <Minimize2 className="h-4 w-4" />
            Exit Full Screen
          </button>
          <button
            onClick={openChatDrawer}
            className="fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-teal-700 lg:hidden"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
        </>
      )}

      {isChatDrawerOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">HakiReview Assistant</h4>
              <button
                onClick={closeChatDrawer}
                className="rounded-full border border-gray-200 p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[70vh] overflow-y-auto">{chatContent}</div>
          </div>
        </div>
      )}
    </div>
  )
}
