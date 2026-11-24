// ─── App.tsx — Root Router ────────────────────────────────────────────────────
//
// This component defines every URL route in the application.
// It is the second file that executes after main.tsx.
//
// React Router v6 concepts used here:
//   BrowserRouter — provides the HTML5 history API (clean URLs, no hash)
//   Routes        — a container that renders only the FIRST matching <Route>
//   Route         — maps a URL path to a React component (the "page")
//
// Example mental model:
//   URL /login → renders <LoginPage />
//   URL /jobs/42 → renders <JobDetailPage /> with params.id === "42"

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout components rendered on every page
import Navbar from './components/layout/Navbar';

// ProtectedRoute wraps a page and redirects unauthenticated users to /login.
// It also enforces role-based access (JOB_SEEKER vs RECRUITER).
import ProtectedRoute from './components/layout/ProtectedRoute';

// ── Page imports ──────────────────────────────────────────────────────────────
// Each "page" is a full-screen React component rendered when the URL matches.

import LandingPage from './pages/LandingPage';           // / — public home
import LoginPage from './pages/LoginPage';               // /login
import SignupPage from './pages/SignupPage';             // /signup
import JobDetailPage from './pages/JobDetailPage';       // /jobs/:id
import NotFoundPage from './pages/NotFoundPage';         // catch-all 404

import JobSeekerDashboard from './pages/jobseeker/DashboardPage';     // /dashboard/seeker
import RecruiterDashboard from './pages/recruiter/DashboardPage';     // /dashboard/recruiter
import RecruiterProfilePage from './pages/recruiter/ProfilePage';     // /profile/recruiter
import JobSeekerProfilePage from './pages/jobseeker/ProfilePage';     // /profile/seeker
import ApplicationsPage from './pages/jobseeker/ApplicationsPage';   // /dashboard/seeker/applications
import SavedJobsPage from './pages/jobseeker/SavedJobsPage';         // /dashboard/seeker/saved

function App() {
  return (
    // BrowserRouter enables React Router for the whole app.
    // All <Link>, <NavLink>, useNavigate(), useParams() calls only work inside it.
    <BrowserRouter>
      {/*
        Navbar sits OUTSIDE <Routes> so it renders on every page.
        This is the persistent top navigation bar.
      */}
      <Navbar />

      {/*
        <Routes> renders the first <Route> whose path matches the current URL.
        Order matters: more specific paths should come before wildcard paths.
      */}
      <Routes>
        {/* ── Public routes — no login required ──────────────────────── */}

        {/* Home page: lists all jobs, search, filter */}
        <Route path="/" element={<LandingPage />} />

        {/* Login form */}
        <Route path="/login" element={<LoginPage />} />

        {/* Signup form (tabs: job seeker / recruiter) */}
        <Route path="/signup" element={<SignupPage />} />

        {/* Job detail page — :id is a URL parameter (e.g. /jobs/abc123) */}
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* ── Protected: Job Seeker ───────────────────────────────────── */}
        {/*
          ProtectedRoute checks:
            1. Is the user authenticated? If not → redirect to /login
            2. Does the user have the required role? If not → redirect to /
          requiredRole="JOB_SEEKER" means only job seekers can access this.
        */}
        <Route
          path="/dashboard/seeker"
          element={
            <ProtectedRoute requiredRole="JOB_SEEKER">
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Job Seeker Applications */}
        <Route
          path="/dashboard/seeker/applications"
          element={
            <ProtectedRoute requiredRole="JOB_SEEKER">
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />

        {/* Protected: Job Seeker Saved Jobs */}
        <Route
          path="/dashboard/seeker/saved"
          element={
            <ProtectedRoute requiredRole="JOB_SEEKER">
              <SavedJobsPage />
            </ProtectedRoute>
          }
        />

        {/* ── Protected: Recruiter ────────────────────────────────────── */}
        <Route
          path="/dashboard/recruiter"
          element={
            <ProtectedRoute requiredRole="RECRUITER">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: Recruiter Profile */}
        <Route
          path="/profile/recruiter"
          element={
            <ProtectedRoute requiredRole="RECRUITER">
              <RecruiterProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected: Job Seeker Profile */}
        <Route
          path="/profile/seeker"
          element={
            <ProtectedRoute requiredRole="JOB_SEEKER">
              <JobSeekerProfilePage />
            </ProtectedRoute>
          }
        />

        {/*
          Catch-all route — path="*" matches any URL that didn't match above.
          This renders the proper 404 page instead of a blank screen.
        */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
