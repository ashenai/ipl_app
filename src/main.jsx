import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppWrapper from './AppWrapper.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

console.log('main.jsx is running');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

// We no longer need to define mockIplData in window since App.jsx has its own mockIplData
// The App component already has its built-in mock data

if (rootElement) {
  try {
    console.log('Attempting to render AppWrapper component');
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <AppWrapper />
        </ErrorBoundary>
      </StrictMode>,
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering App:', error);
  }
} else {
  console.error('Root element not found!');
}
