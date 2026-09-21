import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Safely register PWA Service Worker without crashing on iOS Safari or insecure origins
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker) {
  try {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            if (typeof updateSW === 'function') {
              updateSW(true);
            }
          },
          onOfflineReady() {
            console.log('Uygulama çevrimdışı kullanıma hazır.');
          },
        });
      })
      .catch(err => {
        console.warn('PWA registration skipped or failed:', err);
      });
  } catch (e) {
    console.warn('PWA initialization error:', e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
