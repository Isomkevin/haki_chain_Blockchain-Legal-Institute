import React, { useState } from 'react'
import { apiClient } from '../lib/api'
import { Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react'

export default function CaseSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    
    try {
      const results = await apiClient.researchSearch({
        query: searchQuery,
        // Add other search parameters as needed
      })
      setSearchResults(Array.isArray(results) ? results : [results])
    } catch (err) {
      setError('Failed to search cases: ' + err.message)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResearchUrl = async (url) => {
    setLoading(true)
    try {
      const result = await apiClient.researchUrl(url)
      console.log('Researchd data:', result)
      // You can add a toast notification here
      alert('URL researchd successfully! Check console for details.')
    } catch (err) {
      setError('Failed to research URL: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Legal Case Search</h2>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for legal cases..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 mt-2">Searching legal cases...</p>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && !loading && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Search Results ({searchResults.length})</h3>
            {searchResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 mb-2">
                      {result.title || result.case_name || `Case Result ${index + 1}`}
                    </h4>
                    <p className="text-gray-600 text-sm mb-2">
                      {result.description || result.summary || 'No description available'}
                    </p>
                    {result.court && (
                      <p className="text-sm text-blue-600 mb-1">Court: {result.court}</p>
                    )}
                    {result.date && (
                      <p className="text-sm text-gray-500 mb-1">Date: {result.date}</p>
                    )}
                    {result.url && (
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        {result.url}
                      </a>
                    )}
                  </div>
                  {result.url && (
                    <button
                      onClick={() => handleResearchUrl(result.url)}
                      disabled={loading}
                      className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Research
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {searchResults.length === 0 && !loading && searchQuery && !error && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No cases found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  )
}