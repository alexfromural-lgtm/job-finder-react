// ─── LandingHero.tsx ─────────────────────────────────────────────────────────
//
// PURPOSE:
//   The hero section at the top of the landing page.  Contains:
//     • An animated "⚡ Your career starts here" badge
//     • A large headline with a gradient-coloured word
//     • A subheading paragraph
//     • Two CTA buttons (Get Hired → / Post a Job)
//     • A statistics strip (Active Jobs, Companies, Hired This Month)
//
// DESIGN PATTERN:
//   Presentational component: receives `totalJobs` and uses `useNavigate` for
//   routing.  All layout is inline styles; no external CSS beyond global classes.
//
// USAGE:
//   <LandingHero totalJobs={meta.total} />
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'; // Hook for client-side navigation
import Button from '../ui/Button';               // Reusable button component

// Props: only the total job count is needed
interface LandingHeroProps {
  totalJobs: number; // Live count fetched from the API, displayed in the stats strip
}

export default function LandingHero({ totalJobs }: LandingHeroProps) {
  // useNavigate() returns a function that programmatically changes the URL.
  // Example: navigate('/signup?role=seeker') pushes that path onto the history stack.
  const navigate = useNavigate();

  // ── Stats data ──────────────────────────────────────────────────────────
  // An array of objects; each becomes one stat block in the strip.
  // Template literal `${totalJobs}+` converts the number to a string and appends "+".
  // Example: totalJobs=142  →  value="142+"
  const stats = [
    { label: 'Active Jobs', value: `${totalJobs}+` },
    { label: 'Companies', value: '50+' },
    { label: 'Hired This Month', value: '200+' },
  ];

  return (
    // <section> is a semantic HTML5 element for a thematic grouping of content.
    <section style={{ paddingTop: '5rem', paddingBottom: '4rem' }}>
      {/* .container is a global CSS class that sets max-width and centers horizontally */}
      <div className="container" style={{ textAlign: 'center' }}>

        {/* ── Floating badge ─────────────────────────────────────── */}
        <div
          style={{
            display: 'inline-flex',  // Sized to its content, lays out children in a row
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(79, 142, 247, 0.1)',              // 10% opacity primary blue
            border: '1px solid rgba(79, 142, 247, 0.25)',       // 25% opacity border
            borderRadius: 999,                                   // Large value → pill shape
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            marginBottom: '2rem',
            animation: 'float 3s ease-in-out infinite', // Defined in global CSS: gentle bob
          }}
        >
          ⚡ Your career starts here
        </div>

        {/* ── Main headline ──────────────────────────────────────── */}
        <h1
          style={{
            /*
              clamp(MIN, PREFERRED, MAX) is a CSS function:
                - MIN      = 2.2rem  → minimum size (small screens)
                - PREFERRED= 5vw    → scales with viewport width
                - MAX      = 3.8rem  → maximum size (large screens)

              This makes the font size fluid — responsive without media queries.
              Example: on a 1200px screen: 5vw = 60px ≈ 3.75rem (capped at 3.8rem)
                       on a  400px screen: 5vw = 20px ≈ 1.25rem (floored at 2.2rem)
            */
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.02em', // Tight letter-spacing for large display type
            margin: '0 auto 1.25rem', // Center block + bottom spacing
            maxWidth: 780,            // Prevents over-long lines on ultra-wide screens
          }}
        >
          Find the Job That <span className="gradient-text">Ignites</span> Your Career
          {/*
            .gradient-text applies a CSS background gradient clipped to the text:
              background: linear-gradient(…)
              -webkit-background-clip: text
              -webkit-text-fill-color: transparent
            Result: the word "Ignites" appears in a blue-to-purple gradient.
          */}
        </h1>

        {/* ── Subheading ─────────────────────────────────────────── */}
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--color-text-muted)',
            maxWidth: 560,
            margin: '0 auto 2.5rem', // Center + bottom gap before CTA buttons
            lineHeight: 1.7,         // Generous line height for readability
          }}
        >
          Discover thousands of opportunities from top companies. Connect with recruiters and land
          your dream role — faster.
        </p>

        {/* ── CTA buttons ────────────────────────────────────────── */}
        {/* flexWrap: 'wrap' lets buttons stack vertically on narrow screens */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Primary CTA: navigates to /signup with role=seeker pre-selected */}
          <Button
            id="hero-signup-seeker"
            variant="primary"
            size="lg"
            onClick={() => navigate('/signup?role=seeker')}
          >
            Get Hired →
          </Button>

          {/* Secondary CTA: navigates to /signup with role=recruiter pre-selected */}
          <Button
            id="hero-signup-recruiter"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/signup?role=recruiter')}
          >
            Post a Job
          </Button>
        </div>

        {/* ── Stats strip ────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',         // Wide spacing between stats on desktop
            marginTop: '4rem',
            flexWrap: 'wrap',    // Wrap to two rows on mobile
          }}
        >
          {/*
            stats.map() iterates the array and renders one block per stat.
            key={stat.label} is required by React — it identifies each element
            in the list so React can efficiently update the DOM.
          */}
          {stats.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              {/*
                Gradient number:
                  background: linear-gradient(135deg, --color-primary, --color-secondary)
                  WebkitBackgroundClip: 'text'   → clip bg to character shapes
                  WebkitTextFillColor: 'transparent' → make text transparent so gradient shows

                WebkitBackgroundClip is camelCase in React inline styles.
                The 'Webkit' prefix ensures it works in Chrome/Safari.
              */}
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value} {/* e.g. "142+" */}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '0.25rem',
                }}
              >
                {stat.label} {/* e.g. "Active Jobs" */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
