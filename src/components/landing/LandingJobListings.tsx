// ─── LandingJobListings.tsx ──────────────────────────────────────────────────
//
// PURPOSE:
//   The job-listings section of the landing page.  Wires the useJobSearch hook
//   to JobFilterBar, JobList, and Pagination so the landing page composition
//   component (LandingPage) doesn't have to know about their internal props.
//
// DESIGN PATTERN:
//   "Prop-down hook slice" — LandingPage creates the hook with useJobSearch(),
//   then passes the entire return value here.  This component destructures it
//   and distributes pieces to child components.
//
//   The key type: ReturnType<typeof useJobSearch>
//   ──────────────────────────────────────────────
//   ReturnType<T> is a TypeScript utility type that extracts the return type
//   of a function.  Instead of manually defining an interface that mirrors
//   useJobSearch's return object (and keeping it in sync), we let TypeScript
//   infer it automatically.
//
//   Example:
//     const hook = useJobSearch();   // { search, setSearch, page, … }
//     <LandingJobListings hook={hook} />
//
// USAGE:
//   const hook = useJobSearch();
//   <LandingJobListings hook={hook} />
// ─────────────────────────────────────────────────────────────────────────────

import JobList from '../jobs/JobList';          // Renders a grid of job cards
import JobFilterBar from '../jobs/JobFilterBar'; // Search + category filter inputs
import Pagination from '../ui/Pagination';       // Page controls / scroll-mode toggle
import { useJobSearch } from '../../hooks/useJobSearch'; // Import just for the type

// ── Props ───────────────────────────────────────────────────────────────────
interface LandingJobListingsProps {
  /*
    ReturnType<typeof useJobSearch> automatically matches the full object
    that useJobSearch returns — including all its state values and setters.
    If the hook adds or renames a property, this type updates automatically.
  */
  hook: ReturnType<typeof useJobSearch>;
}

export default function LandingJobListings({ hook }: LandingJobListingsProps) {
  // Destructure every value from the hook object for use in JSX.
  // This is equivalent to: const search = hook.search; const page = hook.page; …
  const {
    search,          // Current search text
    categoryFilter,  // Currently selected category ('' = all)
    page,            // Current page number (1-based)
    pageSize,        // Items per page
    scrollMode,      // true = infinite scroll, false = page buttons
    categories,      // Array of unique category strings from the API
    meta,            // { total, totalPages } — pagination metadata
    displayJobs,     // Jobs to show (all pages so far in scroll mode, current page otherwise)
    hasMore,         // true if more pages exist (used by infinite scroll sentinel)
    loading,         // true while initial fetch is running
    loadingMore,     // true while loading more jobs (infinite scroll)
    error,           // Error string from failed fetch, '' if none
    setSearch,       // Setter for search text
    setCategoryFilter, // Setter for category filter
    setPage,         // Setter for page number
    setPageSize,     // Setter for page size
    setScrollMode,   // Toggle between scroll / paginate mode
    loadMore,        // Function to fetch the next page (infinite scroll)
  } = hook;

  return (
    // <section> semantically groups the job listings portion of the page
    <section style={{ paddingBottom: '4rem' }}>
      <div className="container">

        {/* ── Filter bar: search input + category dropdown + Clear ── */}
        <JobFilterBar
          search={search}
          categoryFilter={categoryFilter}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={(c) => {
            setCategoryFilter(c);
            setPage(1); // Reset to page 1 whenever the category changes
          }}
          onClear={() => {
            setSearch('');
            setCategoryFilter('');
            // Page resets automatically via the hook's internal effect
          }}
        />

        {/* ── Results count heading ─────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
            {/*
              Ternary: show "Loading…" during the initial fetch, then show the count.
              meta.total !== 1 ? 's' : ''  → pluralise "Job" / "Jobs"
              Example: 1 → "1 Job Found", 42 → "42 Jobs Found"
            */}
            {loading ? 'Loading jobs…' : `${meta.total} Job${meta.total !== 1 ? 's' : ''} Found`}
          </h2>
        </div>

        {/* ── Error message ─────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {/* ── Job grid ──────────────────────────────────────────── */}
        {/*
          JobList renders a CSS grid of JobCard components.
          onLoadMore is only provided in scroll mode — JobList uses it with
          IntersectionObserver to call loadMore() when the bottom sentinel
          div enters the viewport.
        */}
        <JobList
          jobs={displayJobs}
          loading={loading}
          emptyMessage="No jobs match your search."
          onLoadMore={scrollMode ? loadMore : undefined}
          loadingMore={loadingMore}
        />

        {/* ── Pagination controls ───────────────────────────────── */}
        {/*
          Only render Pagination when: initial load is done AND there are results.
          !loading && meta.total > 0 uses short-circuit evaluation.
        */}
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
    </section>
  );
}
