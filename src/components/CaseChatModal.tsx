import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Loader2, MessageSquare, Send, User, X } from "lucide-react"

import kenyaLawApi from "../lib/kenyaLawApi"
import type { KenyaLawDocument } from "../types/hakiLens"

interface CaseChatModalProps {
  isOpen: boolean
  onClose: () => void
  caseData: KenyaLawDocument | null
  documentId?: string
}

type ChatRole = "system" | "user" | "assistant" | "error"

interface ChatMessage {
  id: number
  role: ChatRole
  content: string
  timestamp: Date
}

interface KenyaLawChatResponse {
  response?: string
  message?: string
}

export default function CaseChatModal({ isOpen, onClose, caseData, documentId }: CaseChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const modalTitle = useMemo(() => caseData?.title ?? "Legal Document Chat", [caseData?.title])

  useEffect(() => {
    if (!isOpen || !caseData) {
      return
    }

    const welcomeMessage: ChatMessage = {
      id: Date.now(),
      role: "system",
      content: `I'm ready to discuss "${modalTitle}". Ask about key issues, legal implications, or procedural posture.`,
      timestamp: new Date(),
    }

    setMessages([welcomeMessage])
    setInputMessage("")
    setIsLoading(false)
  }, [caseData, isOpen, modalTitle])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!isOpen) {
    return null
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) {
      return
    }

    if (!documentId) {
      const errorMessage: ChatMessage = {
        id: Date.now(),
        role: "error",
        content: "This document is missing a reference ID from the Kenya Law research results.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response: KenyaLawChatResponse = await kenyaLawApi.chatWithDocument({
        message: inputMessage,
        document_id: documentId,
        context: [
          `Document: ${caseData?.title ?? "Legal Document"}`,
          caseData?.url ? `URL: ${caseData.url}` : undefined,
          caseData?.content ? `Excerpt: ${caseData.content.slice(0, 500)}` : undefined,
        ]
          .filter(Boolean)
          .join("\n"),
      })

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.response?.trim() || response.message?.trim() || "I couldn't generate a response for that question.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const assistantError: ChatMessage = {
        id: Date.now() + 1,
        role: "error",
        content:
          error instanceof Error
            ? `Sorry, I ran into a problem: ${error.message}`
            : "Sorry, I ran into an unexpected problem.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantError])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const formatTimestamp = (timestamp: Date) =>
    timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  const renderAvatar = (role: ChatRole) => {
    if (role === "user") {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
          <User className="h-4 w-4 text-white" />
        </div>
      )
    }

    return (
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          role === "error" ? "bg-red-100" : "bg-blue-100"
        }`}
      >
        <Bot className={`h-4 w-4 ${role === "error" ? "text-red-600" : "text-blue-600"}`} />
      </div>
    )
  }

  const getBubbleStyles = (role: ChatRole) => {
    switch (role) {
      case "user":
        return "bg-blue-600 text-white"
      case "assistant":
        return "bg-gray-100 text-gray-900"
      case "system":
        return "bg-gray-50 text-gray-700 border border-gray-200"
      case "error":
        return "bg-red-50 text-red-800 border border-red-200"
      default:
        return "bg-gray-100 text-gray-900"
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Case Discussion</h2>
              <p className="max-w-md truncate text-sm text-gray-600">{modalTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition hover:bg-gray-100" aria-label="Close case chat">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              role="log"
              aria-live="polite"
            >
              {message.role !== "user" && renderAvatar(message.role)}
              <div className={`max-w-[70%] rounded-lg p-4 ${getBubbleStyles(message.role)}`}>
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={`mt-2 text-xs ${
                    message.role === "user" ? "text-blue-100" : message.role === "assistant" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
              {message.role === "user" && renderAvatar(message.role)}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex max-w-[70%] items-center gap-2 rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing case content…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this case… (Enter to send, Shift+Enter for a new line)"
              rows={2}
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Powered by AI analysis of the researched case content.</p>
        </div>
      </div>
    </div>
  )
}


