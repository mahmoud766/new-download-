import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Safely catch unhandled third-party script errors & rejections (e.g., AdSense TagError, adblocker blocks)
window.onerror = function (message, _source, _lineno, _colno, error) {
  const msg = String(message || '') + String(error?.message || '');
  if (
    msg.includes('adsbygoogle') ||
    msg.includes('TagError') ||
    msg.includes('availableWidth') ||
    msg.includes('No slot size') ||
    msg.includes('Fluid responsive ads')
  ) {
    return true; // Suppress uncaught third-party script errors
  }
  return false;
};

window.addEventListener(
  'error',
  (event) => {
    const msg = String(event.message || '') + String(event.error?.message || '');
    if (
      msg.includes('adsbygoogle') ||
      msg.includes('TagError') ||
      msg.includes('availableWidth') ||
      msg.includes('No slot size') ||
      msg.includes('Fluid responsive ads')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  },
  true
);

window.addEventListener('unhandledrejection', (event) => {
  const reasonMsg = String(event.reason?.message || event.reason || '');
  if (
    reasonMsg.includes('adsbygoogle') ||
    reasonMsg.includes('TagError') ||
    reasonMsg.includes('availableWidth') ||
    reasonMsg.includes('No slot size') ||
    reasonMsg.includes('Fluid responsive ads') ||
    reasonMsg.includes('Google Tag') ||
    reasonMsg.includes('Script error')
  ) {
    event.preventDefault();
    event.stopImmediatePropagation?.();
  }
});

// Register Service Worker for offline video processing & app caching
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Quietly ignore registration errors in automated test sandboxes
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
