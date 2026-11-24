// ─── utils/apiError.ts — Centralised Error Extractor ─────────────────────────
//
// Every API call can fail in three ways:
//   1. The server responds with an error (e.g. 400, 401, 500) + a JSON body
//   2. A network problem (no internet, DNS failure) — no response at all
//   3. A timeout (the request took too long)
//
// This utility function handles all three cases and returns a plain string
// that is safe to show to the user.
//
// Usage in a component:
//   try {
//     await login(email, password);
//   } catch (err) {
//     setError(extractApiError(err, 'Login failed.')); // shows the right message
//   }

import axios from 'axios';

/**
 * Extracts a human-readable error message from an axios error or any unknown error.
 *
 * @param err     - the caught error (typed as `unknown` because catch blocks in
 *                  TypeScript always give you `unknown`)
 * @param fallback - message to show if we can't determine a specific one
 */
export const extractApiError = (
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string => {
  // axios.isAxiosError is a type guard — it narrows `err` from `unknown` to
  // an AxiosError object so we can safely access .response, .code, etc.
  //
  // Example:
  //   axios.isAxiosError(new Error('oops'))  // false
  //   axios.isAxiosError(axiosErr)           // true
  if (axios.isAxiosError(err)) {
    // err.response?.data?.error — optional chaining (?.) means "if it exists".
    // Our backend ALWAYS sends { error: "message" } in error responses.
    // Example server response body: { "error": "Email already in use" }
    const serverMessage = err.response?.data?.error;

    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      // We got a clean server error message → show it directly.
      return serverMessage;
    }

    // Network / timeout errors — no .response exists.
    // err.code is set by axios for these special cases:
    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (!err.response) return 'Network error. Please check your connection.';
  }

  // Not an axios error at all (e.g. a programming bug threw something unexpected).
  // Fall back to the caller-provided message.
  return fallback;
};
