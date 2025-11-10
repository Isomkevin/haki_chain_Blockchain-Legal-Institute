const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hakilens-v77g.onrender.com'

class HakiLensApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = null
  }

  setToken(token) {
    this.token = token
  }

  clearToken() {
    this.token = null
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 
        Authorization: `Bearer ${this.token}` 
      }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle different content types
      const contentType = response.headers.get('content-type')
      let responseData

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else if (contentType && contentType.includes('application/pdf')) {
        responseData = await response.blob()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP error! status: ${response.status}`)
      }

      return responseData
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error)
      throw error
    }
  }

  // Health check
  async getHealth() {
    return this.request('/health')
  }

  // Researching methods
  async researchUrl(url) {
    return this.request('/research/url', {
      method: 'POST',
      body: JSON.stringify({ url })
    })
  }

  async researchListing(listingData) {
    return this.request('/research/listing', {
      method: 'POST',
      body: JSON.stringify(listingData)
    })
  }

  async researchCase(caseData) {
    return this.request('/research/case', {
      method: 'POST',
      body: JSON.stringify(caseData)
    })
  }

  async researchSearch(searchData) {
    return this.request('/research/search', {
      method: 'POST',
      body: JSON.stringify(searchData)
    })
  }

  // Case management methods
  async getAllCases() {
    return this.request('/cases')
  }

  async getCase(caseId) {
    return this.request(`/cases/${caseId}`)
  }

  async getCaseDocuments(caseId) {
    return this.request(`/cases/${caseId}/documents`)
  }

  async getCaseImages(caseId) {
    return this.request(`/cases/${caseId}/images`)
  }

  // AI methods
  async summarizeCase(caseId) {
    return this.request(`/ai/summarize/${caseId}`, {
      method: 'POST'
    })
  }

  async askAI(question) {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    })
  }

  async chatWithCase(caseId, message) {
    return this.request(`/ai/chat/${caseId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  async chatbot(message) {
    return this.request('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
  }

  // File serving methods
  async getPdf(filename) {
    return this.request(`/files/pdf/${filename}`)
  }

  async getImage(filename) {
    return this.request(`/files/image/${filename}`)
  }

  // Utility method to get file URL
  getPdfUrl(filename) {
    return `${this.baseURL}/files/pdf/${filename}`
  }

  getImageUrl(filename) {
    return `${this.baseURL}/files/image/${filename}`
  }
}

export const apiClient = new HakiLensApiClient()