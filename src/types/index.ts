// ─── types/index.ts — Shared TypeScript Types ────────────────────────────────
//
// This file is the single source of truth for all data shapes used across
// the app. Keeping types in one place makes refactoring safer: change here
// and TypeScript will flag every file that breaks.
//
// No runtime code lives here — only type/interface definitions.
// They disappear entirely after the TypeScript compiler runs.

// ─── Enums ────────────────────────────────────────────────────────────────────

// Role: the three types of users in the system.
// A union type (|) means a value must be EXACTLY one of these strings.
//
// Example:
//   const role: Role = 'JOB_SEEKER'; // ✅
//   const role: Role = 'GUEST';      // ❌ TypeScript error
export type Role = 'JOB_SEEKER' | 'RECRUITER' | 'ADMIN';

// ApplicationStatus: the lifecycle of a job application.
// submitted → under_review → shortlisted or rejected
export type ApplicationStatus = 'submitted' | 'shortlisted' | 'rejected' | 'under_review';

// ─── Domain Models ────────────────────────────────────────────────────────────
// These interfaces mirror what the backend API returns.

// User: the authenticated person.
// Every field is required (no ? suffix) unless marked optional.
export interface User {
  id: string;             // UUID from the database
  name: string;           // display name
  email: string;
  roles: Role[];          // a user can have multiple roles in the future
  isActive: boolean;
  createdAt: string;      // ISO 8601 date string, e.g. "2024-01-15T10:30:00Z"
  updatedAt: string;
}

// JobSeekerProfile: extra info about a job-seeker user.
// Fields marked with ? are optional (they might not be set yet).
export interface JobSeekerProfile {
  id: string;
  userId: string;         // foreign key to User.id
  bio?: string;           // short "about me" text
  location?: string;
  skills: string[];       // list of skill tags, e.g. ["React", "TypeScript"]
  education?: string;
  experience?: string;
  resumeUrl?: string;     // link to hosted resume PDF
  /** Included by the backend in GET /jobseeker/profile responses */
  user?: Pick<User, 'id' | 'name' | 'email'>;
  // Pick<User, 'id' | 'name' | 'email'> creates a type with ONLY those 3 fields.
  // It's a TypeScript utility type — handy for embedding partial related objects.
}

// RecruiterProfile: extra info about a recruiter user.
export interface RecruiterProfile {
  id: string;
  userId: string;
  companyName: string;    // required for recruiters
  companyWebsite?: string;
  description?: string;
  industry?: string;      // e.g. "Technology", "Finance"
  /** Included by the backend in GET /recruiter/profile responses */
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

// Job: a job posting created by a recruiter.
export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange?: string;   // e.g. "$80,000 – $120,000"
  category?: string;      // e.g. "Engineering", "Design"
  isActive: boolean;      // false = job is closed, no longer accepting applications
  createdAt: string;
  updatedAt: string;
  /** Partial recruiter info returned by the API (not the full RecruiterProfile) */
  recruiter?: {
    companyName: string;
    industry?: string;
    companyWebsite?: string;
  };
}

// Application: a job seeker's application to a job.
export interface Application {
  id: string;
  jobId: string;
  jobSeekerId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  /** Populated by GET /jobseeker/applications — the job details embedded in the response */
  job?: {
    id: string;
    title: string;
    location: string;
    salaryRange?: string;
    category?: string;
    recruiter?: { companyName: string };
  };
}

// SavedJob: a bookmark — a job seeker bookmarks a job to revisit later.
export interface SavedJob {
  id: string;
  jobId: string;
  jobSeekerId: string;
  savedAt: string;
  /** Populated by GET /jobseeker/saved */
  job?: {
    id: string;
    title: string;
    location: string;
    salaryRange?: string;
    category?: string;
    isActive: boolean;
    recruiter?: { companyName: string };
  };
}

// ─── Queue ────────────────────────────────────────────────────────────────────
// The backend uses a job queue (BullMQ) for async operations like applying to
// a job or saving a job. These types represent the queue job lifecycle.

// QueueJobStatus: all possible states of a background queue job.
export type QueueJobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

// QueueJobResponse: what GET /queue/job/:id returns.
export interface QueueJobResponse {
  id: string | number;      // queue-assigned job ID (not a UUID)
  type: string;             // e.g. "apply", "save-job"
  status: QueueJobStatus;
  attemptsMade: number;     // how many times the worker tried
  createdAt: string;
  result?: unknown;         // present when status === 'completed'
  failedReason?: string;    // present when status === 'failed'
}

// ─── API Request/Response Types ───────────────────────────────────────────────
// These are the shapes we SEND to the API (request bodies).

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JobSeekerSignupRequest {
  name: string;
  email: string;
  password: string;
}

// RecruiterSignupRequest extends the base signup with company info.
export interface RecruiterSignupRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;        // required for recruiters
  companyWebsite?: string;
  description?: string;
  industry?: string;
}

// JobFormData: the data a recruiter fills in when creating/editing a job posting.
export interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  salaryRange?: string;
  category?: string;
}

// ─── API Wrapper ──────────────────────────────────────────────────────────────

// ApiError: the standard error shape our backend always returns.
// Example response body: { "error": "Invalid credentials" }
export interface ApiError {
  error: string;
}
