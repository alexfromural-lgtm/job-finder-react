// ─── pages/LandingPage.tsx — Public Home Page ─────────────────────────────────
//
// The root page ("/") — the first thing users see.
// Composed of two section components:
//   LandingHero     — headline, CTA buttons, stats strip
//   LandingJobListings — search bar + job grid + pagination
//
// This page owns the useJobSearch hook and passes it down to both children.
// This is the "lift state up" pattern — shared state lives at the common ancestor.
// LandingHero needs meta.total (for "X+ Active Jobs").
// LandingJobListings needs everything else.

import LandingHero from '../components/landing/LandingHero';
import LandingJobListings from '../components/landing/LandingJobListings';
import { useJobSearch } from '../hooks/useJobSearch';

export default function LandingPage() {
  // Create one instance of useJobSearch and share it.
  // This ensures both sections see the same search state.
  const jobSearch = useJobSearch();

  return (
    // hero-gradient — a CSS class that applies the page background gradient
    <div className="hero-gradient" style={{ minHeight: '100vh' }}>
      {/* Pass only totalJobs to the hero (meta.total from the hook) */}
      <LandingHero totalJobs={jobSearch.meta.total} />

      {/* Pass the entire hook result so LandingJobListings can use all of it */}
      <LandingJobListings hook={jobSearch} />
    </div>
  );
}
