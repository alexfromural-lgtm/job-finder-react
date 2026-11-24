// ─── api/auth.api.ts — Authentication API Functions ──────────────────────────
//
// All authentication-related HTTP calls live here.
// Every function is a thin wrapper over axiosClient — no business logic,
// just the network request + return value shape.
//
// All auth in this app uses HTTP-only cookies (not localStorage).
// That means the browser manages the token storage — JS never sees the token value.
// This is safer against XSS attacks.

import axiosClient from './axiosClient';
import type { LoginRequest, JobSeekerSignupRequest, RecruiterSignupRequest, User } from '../types';

// ── Signup ────────────────────────────────────────────────────────────────────

// signupJobSeeker — creates a new job seeker account.
// Returns void because the backend just sets the auth cookies;
// we call getMe() afterwards to get the user object.
//
// Example:
//   await signupJobSeeker({ name: 'Alice', email: 'alice@test.com', password: 'pass123' });
export const signupJobSeeker = async (data: JobSeekerSignupRequest): Promise<void> => {
  await axiosClient.post('/auth/signup/jobseeker', data);
};

// signupRecruiter — creates a new recruiter account with company info.
//
// Example:
//   await signupRecruiter({ name: 'Bob', email: 'bob@corp.com', password: '...', companyName: 'Acme' });
export const signupRecruiter = async (data: RecruiterSignupRequest): Promise<void> => {
  await axiosClient.post('/auth/signup/recruiter', data);
};

// ── Login / Logout ────────────────────────────────────────────────────────────

// login — sends credentials to the backend.
// On success: backend sets accessToken + refreshToken HTTP-only cookies.
// On failure: axios throws an AxiosError (caught by callers).
//
// Example:
//   try {
//     await login({ email: 'alice@test.com', password: 'pass123' });
//   } catch (err) {
//     setError(extractApiError(err, 'Invalid credentials'));
//   }
export const login = async (data: LoginRequest): Promise<void> => {
  await axiosClient.post('/auth/login', data);
};

// logout — tells the backend to clear the auth cookies.
// Always call setUser(null) after this (done in AuthContext).
export const logout = async (): Promise<void> => {
  await axiosClient.post('/auth/logout');
};

// ── Current User ──────────────────────────────────────────────────────────────

// getMe — fetches the currently authenticated user's profile.
// The browser automatically sends the accessToken cookie (withCredentials: true).
// If the token is expired, axiosClient's interceptor will transparently refresh it.
//
// signal?: AbortSignal — lets the caller cancel the request if the component
// unmounts before the response arrives. This prevents "setState on unmounted
// component" warnings in development.
//
// Example:
//   const user = await getMe();
//   // user = { id: "abc", name: "Alice", email: "...", roles: ["JOB_SEEKER"], ... }
//
// Generic type syntax: axiosClient.get<{ user: User }>
// This tells TypeScript what shape to expect from response.data.
// The <> syntax is a TypeScript generic — a "type parameter".
export const getMe = async (signal?: AbortSignal): Promise<User> => {
  const {
    // Destructuring: response.data.user → user (renamed via the generic type)
    data: { user },
  } = await axiosClient.get<{ user: User }>('/auth/me', { signal });
  return user;
};

// ── Token Refresh ─────────────────────────────────────────────────────────────

// refreshToken — manually triggers a token refresh.
// Usually called automatically by axiosClient's interceptor, not directly.
// The browser sends the refreshToken cookie automatically.
// The backend responds by setting a new accessToken cookie.
export const refreshToken = async (): Promise<void> => {
  // refreshToken cookie is sent automatically via withCredentials
  // backend sets a fresh accessToken cookie in the response
  await axiosClient.post('/auth/refresh');
};
