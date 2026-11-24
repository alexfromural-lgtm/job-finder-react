// ─── api/profile.api.ts — Profile API Functions ───────────────────────────────
//
// Handles reading and updating user profiles for both roles.
// Recruiter profile: company info (name, website, industry, description).
// Job Seeker profile: bio, location, skills, education, experience, resumeUrl.

import axiosClient from './axiosClient';
import type { RecruiterProfile, JobSeekerProfile } from '../types';

// ─── Recruiter Profile ────────────────────────────────────────────────────────
// Response shape: { profile: RecruiterProfile }

// getRecruiterProfile — fetches the logged-in recruiter's profile.
// signal allows cancellation (see auth.api.ts for explanation).
//
// Example:
//   const profile = await getRecruiterProfile();
//   profile.companyName  // 'Acme Corp'
//   profile.industry     // 'Technology'
//   profile.user?.email  // 'recruiter@acme.com'  (embedded user info)
export const getRecruiterProfile = async (signal?: AbortSignal): Promise<RecruiterProfile> => {
  const {
    data: { profile },
  } = await axiosClient.get<{ profile: RecruiterProfile }>('/recruiter/profile', { signal });
  return profile;
};

// updateRecruiterProfile — PATCH update (partial — only send changed fields).
// Pick<RecruiterProfile, 'companyName' | ...> creates a type with only those keys.
// Partial<> makes all those keys optional — callers can update just one field.
//
// Example:
//   await updateRecruiterProfile({ industry: 'FinTech' });  // only updates industry
//   await updateRecruiterProfile({ companyName: 'NewName', description: 'We build...' });
//
// PATCH vs PUT:
//   PUT = replace the entire resource
//   PATCH = merge partial changes into the existing resource (what we use here)
export const updateRecruiterProfile = async (
  data: Partial<
    Pick<RecruiterProfile, 'companyName' | 'companyWebsite' | 'description' | 'industry'>
  >
): Promise<RecruiterProfile> => {
  const {
    data: { profile },
  } = await axiosClient.patch<{ profile: RecruiterProfile }>('/recruiter/profile', data);
  return profile;
};

// ─── Job Seeker Profile ───────────────────────────────────────────────────────
// Response shape: { profile: JobSeekerProfile }

// getJobSeekerProfile — fetches the logged-in job seeker's profile.
//
// Example:
//   const profile = await getJobSeekerProfile();
//   profile.skills  // ['React', 'TypeScript', 'Node.js']
//   profile.bio     // 'Full-stack developer with 5 years experience...'
export const getJobSeekerProfile = async (signal?: AbortSignal): Promise<JobSeekerProfile> => {
  const {
    data: { profile },
  } = await axiosClient.get<{ profile: JobSeekerProfile }>('/jobseeker/profile', { signal });
  return profile;
};

// updateJobSeekerProfile — PATCH update (partial).
// Only the fields you pass will be updated on the server.
//
// Example:
//   await updateJobSeekerProfile({ skills: ['React', 'TypeScript', 'GraphQL'] });
//   await updateJobSeekerProfile({ bio: 'New bio', location: 'Austin, TX' });
export const updateJobSeekerProfile = async (
  data: Partial<
    Pick<JobSeekerProfile, 'bio' | 'location' | 'skills' | 'education' | 'experience' | 'resumeUrl'>
  >
): Promise<JobSeekerProfile> => {
  const {
    data: { profile },
  } = await axiosClient.patch<{ profile: JobSeekerProfile }>('/jobseeker/profile', data);
  return profile;
};
