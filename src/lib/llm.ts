/**
 * LLM Service - Unified interface for multiple LLM providers
 * Supports: OpenAI, Anthropic, OpenRouter, Gemini, and local model endpoints
 */

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter' | 'gemini' | 'local'

export interface LLMConfig {
  provider: LLMProvider
  apiKey?: string
  baseURL?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  error?: string
  retryable?: boolean // Indicates if the error is retryable (rate limit, overload, etc.)
}

// Default configuration from environment variables
const getDefaultConfig = (): LLMConfig => {
  const provider = (import.meta.env.VITE_LLM_PROVIDER || 'openai') as LLMProvider
  
  return {
    provider,
    apiKey: import.meta.env.VITE_LLM_API_KEY || '',
    baseURL: import.meta.env.VITE_LLM_BASE_URL || undefined,
    model: import.meta.env.VITE_LLM_MODEL || getDefaultModel(provider),
    temperature: parseFloat(import.meta.env.VITE_LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(import.meta.env.VITE_LLM_MAX_TOKENS || '2000'),
  }
}

const getDefaultModel = (provider: LLMProvider): string => {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini'
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022'
    case 'openrouter':
      return 'openai/gpt-4o-mini' // OpenRouter uses model format: provider/model-name
    case 'gemini':
      return 'gemini-pro'
    case 'local':
      return 'llama2'
    default:
      return 'gpt-4o-mini'
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: LLMMessage[],
  config: LLMConfig,
  signal?: AbortSignal
): Promise<LLMResponse> {
  if (!config.apiKey) {
    return {
      content: '',
      error: 'OpenAI API key is required. Please set VITE_LLM_API_KEY in your .env file.',
    }
  }

  const baseURL = config.baseURL || 'https://api.openai.com/v1'
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
      const isRetryable = isRetryableError(errorMessage, response.status)
      
      return {
        content: '',
        error: errorMessage,
        retryable: isRetryable,
      }
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to call OpenAI API',
      retryable: false,
    }
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  messages: LLMMessage[],
  config: LLMConfig,
  signal?: AbortSignal
): Promise<LLMResponse> {
  if (!config.apiKey) {
    return {
      content: '',
      error: 'Anthropic API key is required. Please set VITE_LLM_API_KEY in your .env file.',
    }
  }

  const baseURL = config.baseURL || 'https://api.anthropic.com/v1'
  
  // Anthropic API requires system message to be separate
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')

  try {
    const response = await fetch(`${baseURL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal,
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: config.maxTokens || 2000,
        temperature: config.temperature || 0.7,
        system: systemMessage?.content || undefined,
        messages: conversationMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `Anthropic API error: ${response.status} ${response.statusText}`
      const isRetryable = isRetryableError(errorMessage, response.status)
      
      return {
        content: '',
        error: errorMessage,
        retryable: isRetryable,
      }
    }

    const data = await response.json()
    return {
      content: data.content[0]?.text || '',
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to call Anthropic API',
      retryable: false,
    }
  }
}

/**
 * Helper function to check if error is retryable
 */
function isRetryableError(errorMessage: string, statusCode?: number): boolean {
  const retryableKeywords = [
    'overloaded',
    'rate limit',
    'too many requests',
    'service unavailable',
    'temporarily unavailable',
    '503',
    '429',
    'quota',
    'throttle',
  ]
  
  const lowerMessage = errorMessage.toLowerCase()
  return (
    retryableKeywords.some(keyword => lowerMessage.includes(keyword)) ||
    statusCode === 429 ||
    statusCode === 503
  )
}

/**
 * Call OpenRouter API (unified gateway for multiple models)
 */
async function callOpenRouter(
  messages: LLMMessage[],
  config: LLMConfig,
  signal?: AbortSignal
): Promise<LLMResponse> {
  if (!config.apiKey) {
    return {
      content: '',
      error: 'OpenRouter API key is required. Please set VITE_LLM_API_KEY in your .env file.',
      retryable: false,
    }
  }

  const baseURL = config.baseURL || 'https://openrouter.ai/api/v1'
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': window.location.origin, // Optional: for analytics
        'X-Title': 'HakiChain BLI Web App', // Optional: for analytics
      },
      signal,
      body: JSON.stringify({
        model: config.model || 'openai/gpt-4o-mini',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
      const isRetryable = isRetryableError(errorMessage, response.status)
      
      // Provide user-friendly error messages
      let userMessage = errorMessage
      if (errorMessage.toLowerCase().includes('overloaded')) {
        userMessage = 'The model is currently overloaded. Please wait a moment and try again. If the issue persists, try switching to a different model in your .env file.'
      } else if (errorMessage.toLowerCase().includes('rate limit') || response.status === 429) {
        userMessage = 'Rate limit exceeded. Please wait a few moments before trying again, or check your OpenRouter account for usage limits.'
      } else if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('credits')) {
        userMessage = 'Insufficient credits/quota. Please add credits to your OpenRouter account at https://openrouter.ai/credits'
      }
      
      return {
        content: '',
        error: userMessage,
        retryable: isRetryable,
      }
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to call OpenRouter API',
      retryable: false,
    }
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(
  messages: LLMMessage[],
  config: LLMConfig,
  signal?: AbortSignal
): Promise<LLMResponse> {
  if (!config.apiKey) {
    return {
      content: '',
      error: 'Gemini API key is required. Please set VITE_LLM_API_KEY in your .env file.',
    }
  }

  const model = config.model || 'gemini-pro'
  const baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta'
  
  // Gemini API requires system instruction to be separate and uses different message format
  const systemMessage = messages.find(m => m.role === 'system')
  const conversationMessages = messages.filter(m => m.role !== 'system')
  
  // Convert messages to Gemini format
  const contents = conversationMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  // Build request body
  const requestBody: any = {
    contents: contents,
    generationConfig: {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 2000,
    },
  }

  // Add system instruction if available (supported in gemini-pro models)
  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    }
  }

  try {
    const url = `${baseURL}/models/${model}:generateContent?key=${config.apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `Gemini API error: ${response.status} ${response.statusText}`
      const isRetryable = isRetryableError(errorMessage, response.status)
      
      // User-friendly Gemini error messages
      let userMessage = errorMessage
      if (errorMessage.toLowerCase().includes('quota') || response.status === 429) {
        userMessage = 'Gemini API quota exceeded. Please check your quota in Google Cloud Console or wait before retrying.'
      }
      
      return {
        content: '',
        error: userMessage,
        retryable: isRetryable,
      }
    }

    const data = await response.json()
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Failed to call Gemini API',
      retryable: false,
    }
  }
}

/**
 * Call local model endpoint (e.g., Ollama, local server)
 */
async function callLocal(
  messages: LLMMessage[],
  config: LLMConfig,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const baseURL = config.baseURL || 'http://localhost:11434/v1'
  
  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      signal,
      body: JSON.stringify({
        model: config.model || 'llama2',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const errorMessage = `Local API error: ${response.status} ${response.statusText}. ${errorText}`
      const isRetryable = isRetryableError(errorMessage, response.status)
      
      return {
        content: '',
        error: errorMessage,
        retryable: isRetryable,
      }
    }

    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error 
        ? `Failed to connect to local model: ${error.message}. Make sure your local LLM server is running.`
        : 'Failed to call local model API',
      retryable: false,
    }
  }
}

/**
 * Main function to call LLM with unified interface and automatic retry
 */
export async function callLLM(
  messages: LLMMessage[],
  customConfig?: Partial<LLMConfig>,
  retryCount: number = 0,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const config: LLMConfig = {
    ...getDefaultConfig(),
    ...customConfig,
  }

  // Validate messages
  if (!messages || messages.length === 0) {
    return {
      content: '',
      error: 'No messages provided',
      retryable: false,
    }
  }

  const maxRetries = 2
  const retryDelay = 2000 // 2 seconds base delay

  // Route to appropriate provider
  let response: LLMResponse
  switch (config.provider) {
    case 'openai':
      response = await callOpenAI(messages, config, signal)
      break
    case 'anthropic':
      response = await callAnthropic(messages, config, signal)
      break
    case 'openrouter':
      response = await callOpenRouter(messages, config, signal)
      break
    case 'gemini':
      response = await callGemini(messages, config, signal)
      break
    case 'local':
      response = await callLocal(messages, config, signal)
      break
    default:
      return {
        content: '',
        error: `Unsupported provider: ${config.provider}. Supported providers: openai, anthropic, openrouter, gemini, local`,
        retryable: false,
      }
  }

  // Retry logic for retryable errors
  if (response.error && response.retryable && retryCount < maxRetries && !(signal?.aborted)) {
    // Exponential backoff: wait longer for each retry
    const delay = retryDelay * Math.pow(2, retryCount)
    await new Promise(resolve => setTimeout(resolve, delay))
    return callLLM(messages, customConfig, retryCount + 1, signal)
  }

  return response
}

/**
 * Convenience function for simple chat completion
 */
export async function chatCompletion(
  userMessage: string,
  systemPrompt?: string,
  customConfig?: Partial<LLMConfig>,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const messages: LLMMessage[] = []
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  
  messages.push({ role: 'user', content: userMessage })
  
  return callLLM(messages, customConfig, 0, signal)
}

/**
 * Convenience function for document generation
 */
export async function generateDocument(
  prompt: string,
  customConfig?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const systemPrompt = `You are a professional legal document generator specializing in Kenyan law and legal practices. 
Generate comprehensive, accurate, and professionally formatted legal documents based on user requirements.
Ensure all documents follow proper legal formatting, include necessary clauses, and comply with relevant jurisdiction requirements.`

  return chatCompletion(prompt, systemPrompt, {
    ...customConfig,
    temperature: customConfig?.temperature ?? 0.5, // Lower temperature for more consistent legal documents
    maxTokens: customConfig?.maxTokens ?? 4000, // More tokens for longer documents
  })
}

/**
 * Convenience function for legal research and analysis
 */
export async function legalResearch(
  query: string,
  context?: string,
  customConfig?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const systemPrompt = `You are a legal research assistant specializing in Kenyan law, case law, and legal precedents.
Provide comprehensive, accurate legal research and analysis. When relevant, cite specific laws, regulations, or case precedents.
Focus on practical, actionable legal guidance.`

  const userMessage = context
    ? `Context: ${context}\n\nQuestion: ${query}`
    : query

  return chatCompletion(userMessage, systemPrompt, customConfig)
}

