
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global polyfill for process to prevent reference errors during initialization
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Fatal: Root element #root not found in document.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    // StrictMode disabled - causes AbortErrors with Supabase auth locks
    // See: https://github.com/supabase/auth-js/issues/873
    root.render(<App />);
  } catch (err) {
    console.error("Failed to render React application:", err);
    // The error will be caught by the window listener in index.html and displayed
  }
}
