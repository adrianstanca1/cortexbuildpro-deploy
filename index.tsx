import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error listener for debugging white screen
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; font-family: monospace; margin: 20px;">
      <h1 style="margin-top: 0;">Critical Load Error</h1>
      <p><strong>Error:</strong> ${message}</p>
      <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
      <pre style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow: auto; max-height: 300px;">${error?.stack || 'No stack trace available'}</pre>
      <p style="font-size: 0.8em; color: #666;">This error occurred before the React app could mount. Check console for more details.</p>
    </div>`;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);