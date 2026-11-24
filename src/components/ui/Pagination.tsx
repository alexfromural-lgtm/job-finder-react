// ─── components/ui/Pagination.tsx — Pagination Controls ──────────────────────
//
// A full-featured pagination bar combining:
//   • Item count display ("1–10 of 150")
//   • Per-page selector (10 / 25 / 50)
//   • Page number pills with ellipsis for large ranges
//   • Mode toggle: paginated pages ↔ infinite scroll
//
// This component is "presentation only" — it receives all state and callbacks
// as props. All logic lives in useJobSearch or usePaginatedJobs.
// This follows the "dumb component" / "controlled component" pattern.
//
// Usage:
//   <Pagination
//     currentPage={page} totalPages={meta.totalPages}
//     pageSize={pageSize} scrollMode={scrollMode}
//     totalItems={meta.total} hasMore={hasMore}
//     onPageChange={setPage} onPageSizeChange={setPageSize}
//     onScrollModeToggle={setScrollMode}
//   />

import type { CSSProperties } from 'react';
import { PAGE_SIZES } from '../../hooks/usePagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  scrollMode: boolean;
  totalItems: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onScrollModeToggle: (v: boolean) => void;
}

// ── Page Number Algorithm ──────────────────────────────────────────────────────
// Builds an array of page numbers with '…' ellipsis for large page ranges.
// Always shows 7 items maximum to keep the UI compact.
//
// Examples:
//   total=5, current=3  → [1, 2, 3, 4, 5]        (all pages fit)
//   total=20, current=1 → [1, 2, 3, 4, 5, '…', 20] (near start)
//   total=20, current=10→ [1, '…', 9, 10, 11, '…', 20] (middle)
//   total=20, current=20→ [1, '…', 16, 17, 18, 19, 20] (near end)
function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  scrollMode,
  totalItems,
  hasMore,
  onPageChange,
  onPageSizeChange,
  onScrollModeToggle,
}: PaginationProps) {
  // Calculate which items are shown on the current page.
  // e.g. page=2, pageSize=10, totalItems=35:
  //   startItem = (2-1)*10+1 = 11
  //   endItem   = Math.min(2*10, 35) = 20
  // Display: "11–20 of 35"
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginTop: '1.75rem',
        padding: '0.875rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* ── Left section: item count + per-page selector ───────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Item count text — different formats for scroll vs page mode */}
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {scrollMode
            ? hasMore
              ? `Showing ${endItem} of ${totalItems}` // scroll: "Showing 20 of 150"
              : `All ${totalItems} jobs loaded`        // scroll end: "All 150 jobs loaded"
            : totalItems === 0
              ? 'No results'
              : `${startItem}–${endItem} of ${totalItems}`} {/* page: "1–10 of 150" */}
        </span>

        {/* Per-page selector: <select> with options from PAGE_SIZES [10, 25, 50] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Per page:</span>
          <select
            id="page-size-selector"
            className="input"
            value={pageSize}
            // e.target.value is a string → Number() converts to number
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.82rem', marginBottom: 0 }}
          >
            {/* Map over [10, 25, 50] to create <option> elements */}
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Center section: page number pills (page mode only) ─────────────── */}
      {/* Only show page numbers when NOT in scroll mode and there are multiple pages */}
      {!scrollMode && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          {/* Previous button — disabled on first page */}
          <PageBtn
            id="pagination-prev"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            ‹
          </PageBtn>

          {/* Page number pills — built by buildPageNumbers() */}
          {buildPageNumbers(currentPage, totalPages).map((p, i) =>
            p === '…' ? (
              // Ellipsis separator — not clickable
              <span key={`ell-${i}`} style={{ color: 'var(--color-text-muted)', padding: '0 0.1rem', lineHeight: '32px' }}>
                …
              </span>
            ) : (
              // Numbered page button — highlighted when active (current page)
              <PageBtn
                key={p}
                id={`pagination-page-${p}`}
                onClick={() => onPageChange(p as number)}
                active={p === currentPage}
                aria-label={`Page ${p}`}
              >
                {p}
              </PageBtn>
            )
          )}

          {/* Next button — disabled on last page */}
          <PageBtn
            id="pagination-next"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            ›
          </PageBtn>
        </div>
      )}

      {/* ── Right section: mode toggle (Pages ↔ Scroll) ────────────────────── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 3, gap: 3 }}>
        <ModeBtn id="mode-pagination" active={!scrollMode} onClick={() => onScrollModeToggle(false)} title="Pagination mode">
          ☰ Pages
        </ModeBtn>
        <ModeBtn id="mode-infinite-scroll" active={scrollMode} onClick={() => onScrollModeToggle(true)} title="Infinite scroll mode">
          ↓ Scroll
        </ModeBtn>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
// These are small helper components defined in the same file because they're
// only ever used by Pagination. Keeping them here avoids creating extra files.

interface PageBtnProps {
  id?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;         // true = this is the current page (highlighted)
  children: React.ReactNode;
  'aria-label'?: string;
}

// PageBtn: a styled numeric page button (1, 2, 3, …, ‹, ›)
function PageBtn({ id, onClick, disabled, active, children, 'aria-label': ariaLabel }: PageBtnProps) {
  const style: CSSProperties = {
    minWidth: 32, height: 32, padding: '0 0.4rem',
    border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-sm)',
    // Active page: solid primary background. Disabled: faded. Normal: subtle bg.
    background: active ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    fontWeight: active ? 700 : 400,
    fontSize: '0.9rem',
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s ease',
    lineHeight: '1',
  };
  return (
    <button id={id} onClick={onClick} disabled={disabled} aria-label={ariaLabel} style={style}>
      {children}
    </button>
  );
}

interface ModeBtnProps {
  id?: string;
  active: boolean;      // true = currently selected mode
  onClick: () => void;
  title?: string;       // tooltip on hover
  children: React.ReactNode;
}

// ModeBtn: one of the two toggle buttons ("☰ Pages" / "↓ Scroll")
function ModeBtn({ id, active, onClick, title, children }: ModeBtnProps) {
  const style: CSSProperties = {
    padding: '0.3rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    // Active mode: solid primary. Inactive: transparent.
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 400,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  };
  return <button id={id} onClick={onClick} title={title} style={style}>{children}</button>;
}
