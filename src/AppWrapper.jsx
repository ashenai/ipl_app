import React from 'react';
import ErrorBoundary from './ErrorBoundary.jsx';
import App from './App.jsx';

export default function AppWrapper() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </div>
    </div>
  );
}
