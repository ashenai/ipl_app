import React, { useState } from 'react';
import MinimalApp from './MinimalApp.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// Lazy load your App component
const LazyApp = React.lazy(() => import('./App.jsx'));

export default function AppWrapper() {
  const [useOriginalApp, setUseOriginalApp] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        {!useOriginalApp && (
          <>
            <div className="bg-blue-500/30 mb-6 p-4 rounded-lg text-center">
              <p className="mb-2">Currently showing the simplified version of the app.</p>
              <button 
                onClick={() => setUseOriginalApp(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
              >
                Try Loading Original App
              </button>
            </div>
            <MinimalApp />
          </>
        )}
        
        {useOriginalApp && (
          <ErrorBoundary>
            <React.Suspense fallback={<div className="text-center p-6">Loading App...</div>}>
              <LazyApp />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
