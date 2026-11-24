// ─── DashboardPage.tsx (Job Seeker) ─────────────────────────────────────────
//
// PURPOSE:
//   The job seeker's main dashboard: shows a personalised welcome header with
//   a live job counter, then a full searchable, filterable, paginated/scrollable
//   job listing — reusing the same useJobSearch hook as the landing page.
//
// DESIGN PATTERN:
//   "Hook reuse": useJobSearch encapsulates all fetch, search, paginate and
//   infinite-scroll logic.  The dashboard wires it up without duplicating any
//   of that logic.
//
// USAGE:
//   Route: /dashboard/seeker (protected, JOB_SEEKER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobList from '../../components/jobs/JobList';     // Grid of job cards
import Pagination from '../../components/ui/Pagination'; // Page/scroll controls
import Button from '../../components/ui/Button';
import { useJobSearch } from '../../hooks/useJobSearch'; // Server-side search + pagination hook
import { usePageTitle } from '../../hooks/usePageTitle'; // Sets document.title

export default function JobSeekerDashboard() {
  const { user } = useAuth(); // For the personalised greeting
  const navigate = useNavigate();
  usePageTitle('Dashboard'); // Sets browser tab title to "Dashboard | JobFinder"

  // ── useJobSearch hook ──────────────────────────────────────────────────
  // This hook manages: fetch, debounced search, category filter, pagination,
  // infinite scroll, and loading states — all in one place.
  // We destructure only what we need.
  const {
    search,          // Current search text value
    categoryFilter,  // Currently selected category ('' = all)
    page,            // Current page (1-based)
    pageSize,        // Items per page
    scrollMode,      // true = infinite scroll, false = page buttons
    categories,      // Array of unique category strings from server
    meta,            // { total, totalPages }
    displayJobs,     // Jobs to render (all pages in scroll mode / current page otherwise)
    hasMore,         // Are there more pages beyond the current one?
    loading,         // Initial fetch running?
    loadingMore,     // Loading the next page (infinite scroll)?
    error,           // Error string from failed fetch
    setSearch,       // Update the search text
    setCategoryFilter, // Update the category filter
    setPage,         // Jump to a specific page
    setPageSize,     // Change items per page
    setScrollMode,   // Toggle between scroll / paginate
    loadMore,        // Trigger fetch of next page (used by JobList's sentinel)
  } = useJobSearch();

  return (
    <div className="page hero-gradient">
      <div className="container">

        {/* ── Welcome header ─────────────────────────────────────────── */}
        <div
          className="glass-strong"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',  // Stack vertically on mobile
            gap: '1rem',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div>
            {/*
              user?.name?.split(' ')[0]
                user?.name     → safe access when user is null during load
                .split(' ')    → split "Jane Doe" → ["Jane", "Doe"]
                [0]            → "Jane" (first name only for a friendly greeting)
            */}
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 800 }}>
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Browse the latest opportunities and find your perfect role.
            </p>
          </div>

          {/* Total open jobs stat counter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              className="glass"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}
            >
              {/* meta.total is the total job count returned by the API */}
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {meta.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Open Jobs</div>
            </div>
          </div>
        </div>

        {/* ── Search + filter bar ────────────────────────────────────── */}
        <div
          className="glass"
          style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search input — controlled: value from hook, onChange updates hook */}
          <input
            id="seeker-job-search"
            className="input"
            placeholder="🔍  Search jobs, skills, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }} // Grows to fill available space
          />

          {/* Category dropdown — only shown when at least one category exists */}
          {categories.length > 0 && (
            <select
              id="seeker-category-filter"
              className="input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              <option value="">All Categories</option>
              {/* Render one <option> per unique category from the server */}
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Clear button — only visible when filters are active */}
          {(search || categoryFilter) && (
            <Button
              id="seeker-clear-filters"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* ── Results heading + "Browse All" link ───────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            {/* Ternary + pluralisation */}
            {loading
              ? 'Loading jobs…'
              : `${meta.total} Available Job${meta.total !== 1 ? 's' : ''}`}
          </h2>
          {/* Navigate to landing page which also shows the full public list */}
          <Button id="browse-all-btn" variant="ghost" size="sm" onClick={() => navigate('/')}>
            Browse All →
          </Button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* ── Job grid ──────────────────────────────────────────────── */}
        {/*
          onLoadMore={scrollMode ? loadMore : undefined}
          In scroll mode, JobList attaches an IntersectionObserver to a sentinel
          div at the bottom of the list.  When that div becomes visible, it calls
          loadMore().  In page mode, we pass undefined so no observer is set up.
        */}
        <JobList
          jobs={displayJobs}
          loading={loading}
          emptyMessage="No jobs match your search."
          onLoadMore={scrollMode ? loadMore : undefined}
          loadingMore={loadingMore}
        />

        {/* ── Pagination ────────────────────────────────────────────── */}
        {/* Only render after the initial fetch and when there are results */}
        {!loading && meta.total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            pageSize={pageSize}
            scrollMode={scrollMode}
            totalItems={meta.total}
            hasMore={hasMore}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onScrollModeToggle={setScrollMode}
          />
        )}
      </div>
    </div>
  );
}
