"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  AlertCircle,
  Loader2,
  FileDown,
  FileText,
  Copy,
  Pin,
  PinOff,
  CircleStop,
} from "lucide-react"
import { chatCompletion } from "../lib/llm"
import { LegalMarkdownRenderer } from "./LegalMarkdownRenderer"
import { FullViewToggleButton } from "./FullViewToggleButton"
import { useFullViewToggle } from "../hooks/useFullViewToggle"
import { exportToPDF, exportToDocx } from "../lib/exporters"
import { useLegalToast } from "./LegalToast"
import { useProcess } from "../contexts/ProcessContext"
import { LegalBadge } from "./LegalBadge"
import { useMatter } from "../contexts/MatterContext"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  error?: boolean
}

const QUICK_QUESTIONS = [
  "What are my rights as a tenant in Kenya?",
  "How do I file for divorce in Kenya?",
  "What is the process for registering a business?",
  "How do I report domestic violence?",
]

export default function HakiBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm HakiBot, your AI legal assistant. I can help you understand Kenyan law, legal processes, and guide you to the right resources. What legal question can I help you with today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showReferences, setShowReferences] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { isFullView, toggleFullView } = useFullViewToggle("hakibot-full-view", false, {
    shouldHandleShortcut: () => isOpen,
  })
  const { state: processState, updateProcessState } = useProcess()
  const botState = processState.hakiBot
  const { activeMatter } = useMatter()
  const notify = useLegalToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!activeMatter) return
    updateProcessState("hakiBot", (prev) => ({
      ...prev,
      contextChips: [{ id: activeMatter.id, label: `Matter: ${activeMatter.name}` }],
    }))
  }, [activeMatter?.id])

  const pinnedMessages = useMemo(
    () => messages.filter((message) => botState.pinnedMessageIds.includes(message.id)),
    [botState.pinnedMessageIds, messages]
  )

  const transcriptContent = useMemo(
    () =>
      messages
        .map(
          (message) =>
            `[${message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${
              message.sender === "user" ? "Lawyer" : "HakiBot"
            }: ${message.text}`
        )
        .join("\n\n"),
    [messages]
  )

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: "Thinking...",
      sender: "bot",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const systemPrompt = `You are HakiBot, a helpful AI legal assistant specializing in Kenyan law. 
Provide clear, accurate, and practical legal guidance. Always remind users that for personalized legal advice, 
they should consult with a qualified lawyer. Be concise but thorough in your responses.`

      const controller = new AbortController()
      abortControllerRef.current = controller
      const response = await chatCompletion(text, systemPrompt, undefined, controller.signal)

      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      if (response.error) {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: `Error: ${response.error}\n\nPlease check your API configuration in the .env file.`,
          sender: "bot",
          timestamp: new Date(),
          error: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      } else {
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: response.content?.trim() || "I apologize, but I couldn't generate a response. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botMessage])
      }
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMessageId))

      if (error instanceof DOMException && error.name === "AbortError") {
        const cancelledMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: "Request cancelled.",
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, cancelledMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
          sender: "bot",
          timestamp: new Date(),
          error: true,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
    }
  }

  const handleSaveTranscript = async (format: "pdf" | "docx") => {
    if (!messages.length) {
      notify({ title: "Nothing to export", description: "Start a conversation first.", variant: "warning" })
      return
    }

    const timestamp = new Date()
    const filenameBase = `HakiBot Transcript ${timestamp.toISOString().split("T")[0]}`
    const transcriptRecord = {
      id: timestamp.getTime().toString(),
      title: filenameBase,
      createdAt: timestamp.toISOString(),
      messages: messages.map((msg) => ({ ...msg })),
    }

    if (format === "pdf") {
      exportToPDF(transcriptContent, `${filenameBase}.pdf`)
    } else {
      await exportToDocx(transcriptContent, `${filenameBase}.docx`)
    }

    updateProcessState("hakiBot", (prev) => ({
      ...prev,
      transcripts: [...prev.transcripts, transcriptRecord],
    }))

    notify({
      title: "Transcript saved",
      description: `A ${format.toUpperCase()} copy has been downloaded.`,
      variant: "success",
    })
  }

  const handleCopyLatest = async () => {
    const latestBotMessage = [...messages]
      .reverse()
      .find((message) => message.sender === "bot" && !message.error && message.text.trim().length > 0)

    if (!latestBotMessage) {
      notify({ title: "No response to copy", description: "Ask a question to get a response first.", variant: "warning" })
      return
    }

    try {
      await navigator.clipboard.writeText(latestBotMessage.text)
      notify({ title: "Copied", description: "Latest HakiBot answer copied to clipboard.", variant: "success" })
    } catch (error) {
      notify({
        title: "Copy failed",
        description: error instanceof Error ? error.message : "Clipboard access denied.",
        variant: "error",
      })
    }
  }

  const togglePin = (messageId: string) => {
    const isCurrentlyPinned = botState.pinnedMessageIds.includes(messageId)
    updateProcessState("hakiBot", (prev) => ({
      ...prev,
      pinnedMessageIds: isCurrentlyPinned
        ? prev.pinnedMessageIds.filter((id) => id !== messageId)
        : [...prev.pinnedMessageIds, messageId],
    }))

    notify({
      title: isCurrentlyPinned ? "Pin removed" : "Message pinned",
      description: isCurrentlyPinned
        ? "The message has been removed from your pinned list."
        : "Find this message in your matter notes later.",
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chatbot Window */}
      {isOpen && !isMinimized && (
        <motion.div
          layout
          key="hakibot-window"
          initial={false}
          animate={{ width: isFullView ? 600 : 384, height: isFullView ? 640 : 420 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="chatbot-enter bg-white rounded-xl shadow-2xl flex flex-col mb-4 border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">HakiBot</h3>
              <p className="text-xs text-blue-100">Legal AI Assistant</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {botState.contextChips.map((chip) => (
                  <LegalBadge key={chip.id}>{chip.label}</LegalBadge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FullViewToggleButton
                isFullView={isFullView}
                onToggle={toggleFullView}
                variant="ghost"
                hideLabelOnSmallScreens
                className="inline-flex border-white/30"
              />
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-blue-500/70 rounded transition"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-500/70 rounded transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <motion.section
            key="hakibot-conversation"
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col bg-white"
          >
            <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap items-center gap-2 text-sm bg-gray-50">
              <button
                onClick={() => handleSaveTranscript("pdf")}
                className="inline-flex items-center gap-2 rounded-lg border border-legal-border px-3 py-1.5 text-legal-muted hover:border-legal-accent hover:text-legal-accent focus:outline-none focus:ring-2 focus:ring-legal-accent/40"
              >
                <FileDown className="h-4 w-4" />
                Save PDF
              </button>
              <button
                onClick={() => handleSaveTranscript("docx")}
                className="inline-flex items-center gap-2 rounded-lg border border-legal-border px-3 py-1.5 text-legal-muted hover:border-legal-accent hover:text-legal-accent focus:outline-none focus:ring-2 focus:ring-legal-accent/40"
              >
                <FileText className="h-4 w-4" />
                Save DOCX
              </button>
              <button
                onClick={handleCopyLatest}
                className="inline-flex items-center gap-2 rounded-lg border border-legal-border px-3 py-1.5 text-legal-muted hover:border-legal-accent hover:text-legal-accent focus:outline-none focus:ring-2 focus:ring-legal-accent/40"
              >
                <Copy className="h-4 w-4" />
                Copy Answer
              </button>
              {pinnedMessages.length > 0 && (
                <div className="ml-auto text-xs text-legal-muted">
                  {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? "s" : ""}
                </div>
              )}
            </div>

            <AnimatePresence initial={false}>
              {isLoading && (
                <motion.div
                  key="hakibot-progress"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-sm text-blue-800 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Kenyan case law…
                  </span>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
                  >
                    <CircleStop className="h-4 w-4" />
                    Stop
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isPinned = botState.pinnedMessageIds.includes(message.id)
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : message.error
                          ? "bg-red-100 text-red-800 rounded-bl-none border border-red-300"
                          : isPinned
                          ? "bg-legal-accent/10 text-legal-base border border-legal-accent/40 rounded-bl-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          {message.sender === "user" ? "You" : "HakiBot"}
                        </p>
                        <button
                          onClick={() => togglePin(message.id)}
                          className="text-xs text-gray-500 hover:text-legal-accent focus:outline-none"
                          title={isPinned ? "Unpin message" : "Pin message"}
                        >
                          {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {message.error ? (
                        <>
                          <div className="flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3" />
                            <p className="text-xs font-semibold">Error</p>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </>
                      ) : message.sender === "bot" ? (
                        <LegalMarkdownRenderer content={message.text} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      )}
                      <p className={`text-[11px] mt-2 opacity-70 ${message.sender === "user" ? "text-blue-100" : "text-gray-600"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <AnimatePresence initial={false} mode="sync">
              {showReferences && (
                <motion.div
                  key="hakibot-quickrefs"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-blue-100/60 bg-blue-50/70 px-4 py-3 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Quick References</h4>
                      <p className="text-[11px] text-blue-900/70">
                        Common Kenyan legal queries you can explore instantly.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReferences(false)}
                      className="text-xs text-blue-700 hover:text-blue-900"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {QUICK_QUESTIONS.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        className="text-left text-xs bg-white hover:bg-white/90 p-2 rounded border border-blue-100 text-blue-700 transition"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                  placeholder="Ask me about Kenyan law..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-2">For personalized advice, consult a qualified lawyer.</p>
            </div>
          </motion.section>
        </motion.div>
      )}

      {/* Minimized View */}
      {isOpen && isMinimized && (
        <div
          className="chatbot-enter bg-blue-600 text-white rounded-lg shadow-lg p-3 mb-4 w-64 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">HakiBot</p>
              <p className="text-xs text-blue-100">Click to expand</p>
            </div>
            <Minimize2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setShowReferences(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition transform hover:scale-110 animate-pulse-soft"
          title="Open HakiBot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
