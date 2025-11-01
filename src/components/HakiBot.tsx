"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Minimize2, Maximize2 } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const QUICK_QUESTIONS = [
  "What are my rights as a tenant in Kenya?",
  "How do I file for divorce in Kenya?",
  "What is the process for registering a business?",
  "How do I report domestic violence?",
]

const BOT_RESPONSES: { [key: string]: string } = {
  rights:
    "As a tenant in Kenya, you have rights including the right to a written lease agreement, protection from arbitrary eviction, and the right to safe and habitable housing.",
  divorce:
    "To file for divorce in Kenya, you need to petition the court through a lawyer. The process includes filing documents, attending hearings, and obtaining a decree.",
  business:
    "To register a business in Kenya, visit the DGSB (Directorate of General Services B) office with your ID, complete the registration form, and pay the registration fee.",
  domestic:
    "If you experience domestic violence, you can file for a protection order at the magistrate court, contact the police, or reach out to local organizations like Kenya Red Cross for support.",
  default:
    "Thank you for your question! For more detailed legal advice, please consult with a qualified lawyer on our platform.",
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response delay
    setTimeout(() => {
      let response = BOT_RESPONSES.default

      if (text.toLowerCase().includes("tenant") || text.toLowerCase().includes("rights")) {
        response = BOT_RESPONSES.rights
      } else if (text.toLowerCase().includes("divorce")) {
        response = BOT_RESPONSES.divorce
      } else if (text.toLowerCase().includes("business") || text.toLowerCase().includes("register")) {
        response = BOT_RESPONSES.business
      } else if (text.toLowerCase().includes("domestic") || text.toLowerCase().includes("violence")) {
        response = BOT_RESPONSES.domestic
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    }, 500)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chatbot Window */}
      {isOpen && !isMinimized && (
        <div className="chatbot-enter bg-white rounded-xl shadow-2xl w-96 flex flex-col h-96 mb-4 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">HakiBot</h3>
              <p className="text-sm text-blue-100">Legal AI Assistant</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-blue-500 rounded transition"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-500 rounded transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-100" : "text-gray-600"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-white">
              <p className="text-xs font-semibold text-gray-600 mb-2">Quick questions:</p>
              <div className="space-y-2">
                {QUICK_QUESTIONS.slice(0, 2).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded transition text-gray-700"
                  >
                    {question.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                placeholder="Ask me about Kenyan law..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">For personalized advice, consult a qualified lawyer</p>
          </div>
        </div>
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
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition transform hover:scale-110 animate-pulse-soft"
          title="Open HakiBot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
