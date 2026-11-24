// ─── hooks/usePageTitle.ts — Document Title Updater ──────────────────────────
//
// Sets the browser tab title (document.title) for the current page.
// Automatically appends " | Job Finder" for consistent branding.
//
// Without this hook, every page would need:
//   useEffect(() => { document.title = 'Dashboard | Job Finder'; return () => {} }, []);
// This hook encapsulates that pattern.
//
// Usage:
//   export default function DashboardPage() {
//     usePageTitle('Dashboard');  // → "Dashboard | Job Finder"
//     // ...
//   }

import { useEffect } from 'react';

/**
 * Updates document.title for the current page.
 * Automatically appends the app name for consistent branding.
 *
 * Usage:
 *   usePageTitle('Job Details');  // sets "Job Details | Job Finder"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    // Save the previous title so we can restore it when the component unmounts.
    // This matters for a SPA where you navigate between pages without full reload.
    const prev = document.title;

    // Template literal: `${title} | Job Finder`
    // Examples:
    //   usePageTitle('Login')    → "Login | Job Finder"
    //   usePageTitle('My Jobs')  → "My Jobs | Job Finder"
    document.title = `${title} | Job Finder`;

    // Cleanup: restore the previous title when the page unmounts.
    // This ensures the title is correct when navigating back.
    return () => {
      document.title = prev;
    };
  }, [title]); // Re-run if the title prop changes.
}
