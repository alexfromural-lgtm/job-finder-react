// ─── Entry Point: main.tsx ────────────────────────────────────────────────────
//
// This is the very first file that runs when the browser loads the app.
// Vite (our build tool) uses this as its "entry" — think of it as the
// front door of the whole React application.

// Import StrictMode from React.
// StrictMode is a development-only helper that intentionally double-invokes
// your components and hooks to surface side-effect bugs early.
// In production builds it is a no-op (adds zero overhead).
//
// Example of what it catches:
//   useEffect(() => { fetchUser(); }, []); // runs TWICE in dev ← StrictMode
import { StrictMode } from 'react';

// createRoot is the React 18 API for rendering a React tree into the DOM.
// The older ReactDOM.render() is deprecated in React 18.
//
// Example comparison:
//   // Old (React 17):  ReactDOM.render(<App />, document.getElementById('root'));
//   // New (React 18):  createRoot(el).render(<App />);
import { createRoot } from 'react-dom/client';

// Global CSS — imported here so it applies to every component in the app.
import './index.css';

// The root component that defines all routes and the app shell.
import App from './App.tsx';

// AuthProvider wraps the entire tree with authentication state (user, login, logout).
// Any component below it can call useAuth() to access that state.
import { AuthProvider } from './context/AuthContext.tsx';

// ErrorBoundary catches render-time JavaScript errors (thrown during rendering)
// and shows a fallback UI instead of a blank, broken page.
import ErrorBoundary from './components/ErrorBoundary.tsx';

// document.getElementById('root')! — the "!" is a TypeScript non-null assertion.
// It tells TypeScript "trust me, this element exists" (defined in index.html).
//
// createRoot(el).render(...) mounts the React component tree into that DOM node.
createRoot(document.getElementById('root')!).render(
  // StrictMode wraps everything — catches subtle bugs in development.
  <StrictMode>
    {/*
      ErrorBoundary is the outermost safety net.
      If ANY child crashes during rendering, the boundary catches it
      and shows a friendly "Something went wrong" message.
    */}
    <ErrorBoundary>
      {/*
        AuthProvider makes auth state (user, isAuthenticated, login, logout …)
        available to every component in the tree via React Context.

        Think of it like a global store just for authentication:
          const { user } = useAuth(); // works anywhere below AuthProvider
      */}
      <AuthProvider>
        {/* App renders the router, navbar, and all page routes. */}
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
