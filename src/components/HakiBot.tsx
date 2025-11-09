"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Minimize2, AlertCircle } from "lucide-react"
import { chatCompletion } from "../lib/llm"
import { LegalMarkdownRenderer } from "./LegalMarkdownRenderer"
import { FullViewToggleButton } from "./FullViewToggleButton"
import { useFullViewToggle } from "../hooks/useFullViewToggle"

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
  const { isFullView, toggleFullView } = useFullViewToggle("hakibot-full-view", false, {
    shouldHandleShortcut: () => isOpen,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

      const response = await chatCompletion(text, systemPrompt)

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

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
        error: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && !isMinimized && (
        <motion.div
          layout
          key="hakibot-window"
          initial={false}
          animate={{ width: isFullView ? 600 : 384, height: isFullView ? 640 : 420 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="chatbot-enter bg-white rounded-xl shadow-2xl flex flex-col mb-4 border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">HakiBot</h3>
              <p className="text-xs text-blue-100">Legal AI Assistant</p>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-lg ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : message.error
                        ? "bg-red-100 text-red-800 rounded-bl-none border border-red-300"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
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
              ))}
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
