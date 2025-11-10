/**
 * Kenya Law Researchr API Client
 * Integrates with https://firecrawlscrape.onrender.com/
 */

const API_BASE_URL = import.meta.env.VITE_KENYA_LAW_API_URL || 'https://firecrawlscrape.onrender.com';

class KenyaLawApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Research Kenya Law website
   * @param {Object} params - Researching parameters
   * @param {string} params.url - Kenya Law URL to research
   * @param {number} [params.limit=10] - Number of pages to research
   * @param {boolean} [params.research_links=true] - Whether to research linked pages
   * @returns {Promise<Object>} Researching results
   */
  async researchKenyaLaw(params) {
    try {
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: params.url,
          limit: params.limit || 10,
          scrape_links: params.scrape_links !== undefined ? params.scrape_links : true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error researching Kenya Law:', error);
      throw new Error(`Failed to research: ${error.message}`);
    }
  }

  /**
   * Chat with a researchd document
   * @param {Object} params - Chat parameters
   * @param {string} params.message - User message/question
   * @param {string} params.document_id - Document ID from researching results
   * @param {string} [params.context] - Additional context
   * @returns {Promise<Object>} Chat response
   */
  async chatWithDocument(params) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: params.message,
          document_id: params.document_id,
          context: params.context || ''
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error chatting with document:', error);
      throw new Error(`Failed to chat: ${error.message}`);
    }
  }

  /**
   * Check API health status
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Get frontend (serve static files)
   * @returns {Promise<Response>} Frontend response
   */
  async getFrontend() {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET'
      });

      return response;
    } catch (error) {
      console.error('Error getting frontend:', error);
      throw error;
    }
  }

  /**
   * Utility function to extract Kenya Law URL patterns
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is a valid Kenya Law URL
   */
  isValidKenyaLawUrl(url) {
    const kenyaLawPatterns = [
      /^https?:\/\/(www\.)?kenyalaw\.org/,
      /^https?:\/\/new\.kenyalaw\.org/,
      /^https?:\/\/.*\.kenyalaw\.org/
    ];
    
    return kenyaLawPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Get suggested Kenya Law URLs for testing
   * @returns {Array<Object>} Array of suggested URLs with descriptions
   */
  getSuggestedUrls() {
    return [
      {
        url: 'https://new.kenyalaw.org/akn/ke/judgment/kehc/2023/',
        description: 'High Court Judgments 2023',
        type: 'listing'
      },
      {
        url: 'https://new.kenyalaw.org/akn/ke/act/2010/',
        description: 'Acts of Parliament 2010',
        type: 'listing'
      },
      {
        url: 'https://new.kenyalaw.org/akn/aa-au/act/charter/2016/maritime-security-and-safety-and-development-in-africa/eng@2016-10-15',
        description: 'African Charter on Maritime Security',
        type: 'single'
      },
      {
        url: 'https://new.kenyalaw.org/akn/ke/judgment/kehc/',
        description: 'All High Court Judgments',
        type: 'listing'
      }
    ];
  }
}

// Create singleton instance
const kenyaLawApi = new KenyaLawApiClient();

export default kenyaLawApi;
export { KenyaLawApiClient };