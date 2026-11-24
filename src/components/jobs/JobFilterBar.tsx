// ─── components/jobs/JobFilterBar.tsx — Search + Category Filter Bar ─────────
//
// A horizontally laid-out filter bar with:
//   • A text search input (searches job title, location, description)
//   • A category dropdown (All Categories | Engineering | Design | etc.)
//   • A "Clear" button that appears when any filter is active
//
// This is a "controlled component" — it owns no internal state.
// All state lives in the parent (via useJobSearch or usePaginatedJobs).
// The parent passes the current values AND the setter functions as props.
// This pattern makes the component simple and easy to test.
//
// Usage:
//   <JobFilterBar
//     search={search} categoryFilter={categoryFilter} categories={categories}
//     onSearchChange={setSearch} onCategoryChange={handleCategory} onClear={handleClear}
//   />

import Button from '../ui/Button';

interface JobFilterBarProps {
  search: string;                       // current search text
  categoryFilter: string;               // current selected category ('' = all)
  categories: string[];                 // list of available categories for the dropdown
  onSearchChange: (s: string) => void;  // called on each keystroke in the search input
  onCategoryChange: (c: string) => void;// called when the category dropdown changes
  onClear: () => void;                  // resets both filters to ''
}

export default function JobFilterBar({
  search,
  categoryFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onClear,
}: JobFilterBarProps) {
  // hasActiveFilters: true if either filter has a value.
  // Boolean('') = false, Boolean('react') = true
  const hasActiveFilters = Boolean(search || categoryFilter);

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        flexWrap: 'wrap',      // wraps to next line on small screens
        alignItems: 'center',
      }}
    >
      {/* Search input — flex: 1 makes it take up all available space */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <input
          id="job-search"
          className="input"
          placeholder="🔍  Search jobs, locations..."
          value={search}
          // e.target.value is the new value typed by the user.
          // We pass it up to the parent via onSearchChange.
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Category dropdown — <select> with options from the categories array */}
      <select
        id="category-filter"
        className="input"
        value={categoryFilter}      // controlled — value is from parent state
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{ width: 'auto', minWidth: 160 }}
      >
        {/* Default "All Categories" option — value="" means no filter */}
        <option value="">All Categories</option>
        {/* Map over the categories array to create <option> elements.
            key={c} — required by React for list rendering performance */}
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Clear button — only shown when at least one filter is active.
          Short-circuit: hasActiveFilters && <Button ...> */}
      {hasActiveFilters && (
        <Button id="clear-filters" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
