// ─── SkillsSection.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Wrapper card for the skills section of the job seeker profile.
//   Delegates all rendering and logic to SkillTagInput.
//
// DESIGN PATTERN:
//   "Single-child wrapper" — this component exists purely to provide the
//   glassmorphism card container around SkillTagInput so the parent page
//   (ProfilePage) stays at the same layout abstraction level as the other sections.
//
// USAGE:
//   <SkillsSection
//     skills={skills}
//     editing={editing}
//     onSkillsChange={setSkills}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import SkillTagInput from './SkillTagInput'; // The actual tag-add/remove component

interface SkillsSectionProps {
  skills: string[];                          // Current list of skill strings
  editing: boolean;                          // Show add/remove controls when true
  onSkillsChange: (skills: string[]) => void; // Parent's setSkills state setter
}

export default function SkillsSection({ skills, editing, onSkillsChange }: SkillsSectionProps) {
  return (
    // Glass card with a slightly longer animation delay than AboutSection
    // so the sections appear to cascade in from top to bottom.
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '1.25rem',
        animation: 'slideUp 0.4s ease', // 0.4s delay — after AboutSection (0.35s)
      }}
    >
      {/*
        SkillTagInput handles:
          • Rendering skill tags (badge pills)
          • The add-skill input + Enter / comma keyboard handling
          • The × remove button on each tag (in edit mode)
          • Calling onChange([…newSkills]) to update the parent's state
      */}
      <SkillTagInput skills={skills} editing={editing} onChange={onSkillsChange} />
    </div>
  );
}
