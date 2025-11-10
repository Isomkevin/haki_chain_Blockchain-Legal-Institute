import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw, Globe } from 'lucide-react';
import kenyaLawApi from '../lib/kenyaLawApi';

export default function ApiStatusTab() {
  const [status, setStatus] = useState('checking');
  const [healthData, setHealthData] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkApiHealth = async () => {
    setChecking(true);
    setError(null);
    
    try {
      const health = await kenyaLawApi.checkHealth();
      setHealthData(health);
      setStatus('healthy');
      setLastChecked(new Date());
    } catch (err) {
      setError(err.message);
      setStatus('unhealthy');
      setLastChecked(new Date());
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'unhealthy':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'checking':
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'unhealthy':
        return 'bg-red-50 border-red-200';
      case 'checking':
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return 'API is operational';
      case 'unhealthy':
        return 'API is experiencing issues';
      case 'checking':
      default:
        return 'Checking API status';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Status Overview */}
      <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Kenya Law Researchr API
              </h3>
              <p className={`text-sm ${
                status === 'healthy' ? 'text-green-700' : 
                status === 'unhealthy' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          <button
            onClick={checkApiHealth}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {lastChecked && (
          <div className="text-sm text-gray-600">
            Last checked: {lastChecked.toLocaleString()}
          </div>
        )}
      </div>

      {/* API Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          API Information
        </h4>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Base URL:</span>
            <p className="text-sm text-gray-900 font-mono break-all">
              {kenyaLawApi.baseUrl}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Service:</span>
            <p className="text-sm text-gray-900">
              Kenya Law Document Researchr
            </p>
          </div>
        </div>
      </div>

      {/* Health Data */}
      {healthData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Health Details</h4>
          <pre className="text-sm bg-gray-50 p-4 rounded border overflow-auto">
            {JSON.stringify(healthData, null, 2)}
          </pre>
        </div>
      )}

      {/* Error Information */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h4 className="font-medium text-red-900 mb-2">Connection Error</h4>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* API Endpoints */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Available Endpoints</h4>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">POST</span>
              <span className="font-mono text-sm">/research</span>
            </div>
            <p className="text-sm text-gray-600">
              Research Kenya Law website pages and documents
            </p>
          </div>

          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">POST</span>
              <span className="font-mono text-sm">/chat</span>
            </div>
            <p className="text-sm text-gray-600">
              Chat with researchd documents using AI
            </p>
          </div>

          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">GET</span>
              <span className="font-mono text-sm">/health</span>
            </div>
            <p className="text-sm text-gray-600">
              Check API health status
            </p>
          </div>

          <div className="border border-gray-200 rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">GET</span>
              <span className="font-mono text-sm">/</span>
            </div>
            <p className="text-sm text-gray-600">
              Serve frontend application
            </p>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-medium text-blue-900 mb-4">How to Use HakiLens</h4>
        <div className="space-y-3 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <span className="font-medium">1.</span>
            <span>Go to the <strong>Deep Research</strong> tab and enter a Kenya Law URL to research</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">2.</span>
            <span>After researching, copy the document ID from the results</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">3.</span>
            <span>Use the <strong>AI Assistant</strong> tab to ask questions about the researchd document</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium">4.</span>
            <span>Browse your researchd documents in the <strong>Case Database</strong> tab</span>
          </div>
        </div>
      </div>
    </div>
  );
}