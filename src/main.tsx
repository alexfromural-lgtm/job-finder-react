import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { useAuthStore } from './store/useAuthStore.ts';

// Restore the session once at startup, outside the React tree.
// AbortController mirrors the old AuthContext useEffect pattern:
// React 18 StrictMode double-mounts cancel the first in-flight request
// so only the second (real) mount clears isLoading.
const sessionController = new AbortController();
useAuthStore.getState().restoreSession(sessionController.signal);

// Wire the axios interceptor's "refresh failed" signal directly to the store.
// Must be set up before any component mounts so no 401 is missed.
window.addEventListener('auth:unauthorized', () => {
  useAuthStore.getState().logout();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
