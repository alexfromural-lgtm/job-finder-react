// ─── api/axiosClient.ts — Shared HTTP Client ──────────────────────────────────
//
// Instead of calling fetch() or creating a new axios instance in every file,
// we configure ONE shared instance here. All API files import this.
//
// Benefits:
//   • baseURL set once — no duplicated "/api" prefix everywhere
//   • Credentials (cookies) sent automatically — authentication "just works"
//   • Token refresh handled transparently — components never see 401 errors

import axios from 'axios';

// axios.create() returns a new axios instance with preset defaults.
// Think of it as a "pre-configured fetch wrapper".
//
// Example without axiosClient:
//   await fetch('/api/jobs', { credentials: 'include', headers: {...} })
//
// Example with axiosClient:
//   await axiosClient.get('/jobs')  ← much cleaner
const axiosClient = axios.create({
  // VITE_API_BASE_URL is an environment variable (defined in .env or docker).
  // The ?? '/api' fallback is used in development when the env var is not set.
  // This means all requests go to /api/... relative to the current origin.
  //
  // Example: baseURL = "http://localhost:4000/api"
  //   axiosClient.get('/jobs') → GET http://localhost:4000/api/jobs
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',

  // withCredentials: true — the browser sends HTTP-only cookies (accessToken,
  // refreshToken) with every request automatically.
  // Required for cookie-based authentication to work cross-origin.
  withCredentials: true,

  // timeout: abort the request if the server doesn't respond within 10 seconds.
  // 10_000 is the same as 10000 — underscores are just a readability separator.
  timeout: 10_000,

  headers: {
    // Tell the server we're sending JSON in the request body.
    'Content-Type': 'application/json',
  },
});

// ─── Response Interceptor: Silent Token Refresh + Retry ──────────────────────
//
// Here's the problem this solves:
//   1. User loads the page — their accessToken cookie is about to expire.
//   2. They click something — a request goes out and gets a 401 Unauthorized.
//   3. Without this interceptor: the user sees an error and must log in again.
//   4. WITH this interceptor:  we silently call /auth/refresh, get a new cookie,
//      and replay the failed request. The user never notices.
//
// This is called the "silent refresh" pattern.

axiosClient.interceptors.response.use(
  // Success path: just pass the response through unchanged.
  (response) => response,

  // Error path: runs when any request gets an error response (4xx, 5xx).
  async (error) => {
    // Augment the original request config with a custom _retry flag.
    // This prevents infinite loops: if the retried request also gets a 401,
    // we DON'T try to refresh again.
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // We only attempt the refresh under THREE conditions:
    //   1. The status is 401 (Unauthorized) — access token expired/missing
    //   2. We haven't already retried this request (_retry is falsy)
    //   3. The failing request isn't /auth/refresh itself (would cause infinite loop)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // Mark this request so a second 401 won't trigger another refresh.
      originalRequest._retry = true;

      try {
        // POST /auth/refresh — the backend reads the refreshToken cookie,
        // validates it, and sets a NEW accessToken cookie in the response.
        // No JSON body needed — the cookie is sent automatically (withCredentials).
        await axiosClient.post('/auth/refresh');

        // The browser now has the new accessToken cookie.
        // Replay the original request — it will succeed this time.
        return axiosClient(originalRequest);
      } catch {
        // The refresh token is also expired/invalid → the user must log in again.
        // We dispatch a custom DOM event that AuthContext listens to.
        // This avoids a circular import (axiosClient doesn't import AuthContext).
        //
        // Example listener (in AuthContext):
        //   window.addEventListener('auth:unauthorized', () => setUser(null));
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(error);
      }
    }

    // For all other errors (400, 404, 500, etc.) — just reject normally.
    return Promise.reject(error);
  }
);

export default axiosClient;
