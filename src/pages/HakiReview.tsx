import { useRef, useEffect, useState, useMemo } from "react"
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
} from "lucide-react"
import TourGuide from "../components/TourGuide"
import { chatCompletion } from "../lib/llm"
import { LegalMarkdownRenderer } from "../components/LegalMarkdownRenderer"
import { motion, AnimatePresence } from "framer-motion"
import { FullViewToggleButton } from "../components/FullViewToggleButton"
import { useFullViewToggle } from "../hooks/useFullViewToggle"
import { useProcess } from "../contexts/ProcessContext"
import { LegalBadge } from "../components/LegalBadge"
import { useLegalToast } from "../components/LegalToast"

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
  const MAX_CONTEXT_CHARS = 6000
  const { isFullView, toggleFullView } = useFullViewToggle("hakireview-full-chat")
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null)
  const [annotationDraft, setAnnotationDraft] = useState("")
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

  const uploadedUrlRef = useRef<string | undefined>(reviewState.uploadedFileUrl)

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showTour && <TourGuide onComplete={() => updateProcessState("hakiReview", { showTour: false })} />}
      <LawyerSidebar onTourStart={() => updateProcessState("hakiReview", { showTour: true })} />
      <motion.div className="flex-1 ml-[280px] p-8" layout>
        <div className="max-w-7xl mx-auto">
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

          <motion.div layout className="flex flex-col gap-8">
            <motion.div layout className="flex flex-col lg:flex-row gap-8">
              <AnimatePresence initial={false} mode="sync">
                {!isFullView && (
                  <motion.div
                    key="hakireview-document"
                    layout
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="w-full lg:w-[55%]"
                  >
                    <div className="bg-white rounded-lg shadow-sm p-8">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
                      {uploadedFile ? (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">{uploadedFile}</h3>
                              <p className="text-sm text-gray-500">
                                {reviewState.uploadedFileType || "Document"} ·{" "}
                                {Math.min(uploadedFileContent.length, MAX_CONTEXT_CHARS)} characters indexed
                              </p>
                            </div>
                            <LegalBadge icon={<FileText className="h-3 w-3" />}>
                              Preview
                            </LegalBadge>
                          </div>
                          {reviewState.uploadedFileUrl && reviewState.uploadedFileType?.includes("pdf") ? (
                            <iframe
                              src={reviewState.uploadedFileUrl}
                              title="Document preview"
                              className="w-full h-[420px] rounded-lg border border-gray-200 shadow-inner"
                            />
                          ) : (
                            <div className="border border-gray-200 rounded-lg p-4 h-[420px] overflow-y-auto bg-gray-50">
                              <LegalMarkdownRenderer content={uploadedFileContent} />
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                if (reviewState.uploadedFileUrl) {
                                  URL.revokeObjectURL(reviewState.uploadedFileUrl)
                                }
                                updateProcessState("hakiReview", (prev) => ({
                                  ...prev,
                                  uploadedFile: null,
                                  uploadedFileContent: "",
                                  uploadedFileBuffer: undefined,
                                  uploadedFileType: undefined,
                                  uploadedFileUrl: undefined,
                                }))
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                              Remove File
                            </button>
                            {reviewState.uploadedFileUrl && (
                              <a
                                href={reviewState.uploadedFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                              >
                                Open in new tab
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">Drag and drop your PDF, DOCX, or DOC file here</p>
                          <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                          <label className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer inline-block">
                            Select File
                            <input type="file" accept=".pdf,.docx,.doc" onChange={handleFileUpload} className="hidden" />
                          </label>
                          <p className="text-xs text-gray-500 mt-4">Supported formats: PDF, DOCX, DOC</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key="hakireview-chat"
                layout
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className={`w-full ${isFullView ? "" : "lg:flex-1"}`}
              >
                <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
                  <div className="flex gap-2 mb-4">
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

                  {activeTab === "chat" && (
                    <>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {chatMessages.map((msg) => {
                          const isBotMessage = msg.sender === "bot" && !msg.error
                          const annotation = reviewState.annotations[msg.id]
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
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
                                      <button
                                        onClick={handleAnnotationCancel}
                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                                      >
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
              </motion.div>
              <AnimatePresence initial={false} mode="sync">
                {!isFullView && clauseEntries.length > 0 && (
                  <motion.div
                    key="hakireview-clause-nav"
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="w-full lg:w-64"
                  >
                    <div className="bg-white rounded-lg shadow-sm p-5 h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <ListTree className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Clause Navigator
                        </h3>
                      </div>
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {clauseEntries.map((entry, index) => (
                          <button
                            key={`${entry.id}-${index}`}
                            onClick={() => scrollToClause(entry.id)}
                            className="w-full text-left text-xs bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 rounded-lg px-3 py-2 transition"
                          >
                            <span className="block font-medium text-gray-900 truncate">{entry.title}</span>
                            <span className="text-[11px] text-gray-500">Clause reference • {index + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
