import { useRef, useEffect } from "react"
import LawyerSidebar from "../components/LawyerSidebar"
import { Eye, Upload, MessageSquare, FileText, Edit, FileSignature, Send, AlertCircle } from "lucide-react"
import TourGuide from "../components/TourGuide"
import { chatCompletion } from "../lib/llm"
import { formatAnalysisResponse } from "../lib/legalFormatter"
import { useProcess } from "../contexts/ProcessContext"

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  error?: boolean
}

export default function HakiReview() {
  const { getProcessState, updateProcessState } = useProcess()
  const reviewState = getProcessState("hakiReview")
  const { showTour, message, activeTab, uploadedFile, uploadedFileContent, chatMessages, isLoading } = reviewState
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const MAX_CONTEXT_CHARS = 6000

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

  const extractTextFromFile = async (file: File) => {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfjs = (await import("pdfjs-dist/build/pdf")) as any
      const workerSrc = await import("pdfjs-dist/build/pdf.worker?url")
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc.default || workerSrc

      const uint8Array = new Uint8Array(await file.arrayBuffer())
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
      const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
      return value
    }

    return await file.text()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const content = await extractTextFromFile(file)

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
              text: formatAnalysisResponse(response.content || "I apologize, but I couldn't generate a response. Please try again."),
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
              text: formatAnalysisResponse(
                `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`
              ),
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showTour && <TourGuide onComplete={() => updateProcessState("hakiReview", { showTour: false })} />}
      <LawyerSidebar onTourStart={() => updateProcessState("hakiReview", { showTour: true })} />
      <div className="flex-1 ml-[280px] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">HakiReview</h1>
            </div>
            <p className="text-gray-600">AI-powered document analysis and legal review</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Preview</h2>
              {uploadedFile ? (
                <div className="border border-gray-300 rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">{uploadedFile}</h3>
                  <p className="text-sm text-gray-600 mb-4">Document uploaded successfully</p>
                  <button
                    onClick={() =>
                      updateProcessState("hakiReview", (prev) => ({
                        ...prev,
                        uploadedFile: null,
                        uploadedFileContent: "",
                      }))
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Remove File
                  </button>
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

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">HakiReview Assistant</h2>
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
                  <div className="flex-1 overflow-y-auto max-h-[400px] mb-4 space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-br-none"
                              : msg.error
                              ? "bg-red-100 text-red-800 rounded-bl-none border border-red-300"
                              : "bg-gray-100 text-gray-800 rounded-bl-none"
                          }`}
                        >
                          {msg.error && (
                            <div className="flex items-center gap-1 mb-1">
                              <AlertCircle className="w-3 h-3" />
                              <p className="text-xs font-semibold">Error</p>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.sender === "user" ? "text-blue-100" : "text-gray-600"}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => updateProcessState("hakiReview", { message: e.target.value })}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
                </>
              )}

              {activeTab === "edit" && (
                <div className="text-center py-8">
                  <Edit className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Document Editor</h3>
                  <p className="text-sm text-gray-600">Upload a document to start editing</p>
                </div>
              )}

              {activeTab === "esign" && (
                <div className="text-center py-8">
                  <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Electronic Signature</h3>
                  <p className="text-sm text-gray-600">Upload a document to add signatures</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
