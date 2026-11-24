// ─── SkillTagInput.tsx ────────────────────────────────────────────────────────
//
// PURPOSE:
//   An interactive tag/chip input for managing a list of skill strings.
//   • Displays existing skills as coloured badge pills
//   • In edit mode: shows an <input> where the user can type a skill name
//     and add it by pressing Enter, comma, or clicking "Add"
//   • In edit mode: each pill has a × button to remove it
//
// DESIGN PATTERN:
//   "Controlled tag list" — the parent (ProfilePage via SkillsSection) owns the
//   `skills` array state.  This component receives it as a prop and calls
//   onChange([…newArray]) whenever the array changes, letting the parent update
//   its state.  The input field's text is local state (only needed here).
//
// USAGE EXAMPLE:
//   <SkillTagInput
//     skills={['React', 'TypeScript', 'Node.js']}
//     editing={true}
//     onChange={(updated) => setSkills(updated)}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import Button from '../../../components/ui/Button';

export interface SkillTagInputProps {
  skills: string[];                          // Current skills array from parent
  editing: boolean;                          // Show add/remove controls?
  onChange: (skills: string[]) => void;      // Called with the new array when skills change
}

export default function SkillTagInput({ skills, editing, onChange }: SkillTagInputProps) {
  // Local state for the text currently typed in the input box.
  // This doesn't need to live in the parent — it's purely UI state.
  const [input, setInput] = useState('');

  // ── addSkill ────────────────────────────────────────────────────────
  // Processes the raw input string and adds new unique skills to the list.
  const addSkill = (raw: string) => {
    // .trim()       → remove leading/trailing spaces
    // .replace(/,$/, '') → remove a trailing comma if the user typed one
    const trimmed = raw.trim().replace(/,$/, '');
    if (!trimmed) return; // Do nothing if the input is empty

    /*
      Support comma-separated input: "React, TypeScript, Node.js"
      .split(',')          → ["React", " TypeScript", " Node.js"]
      .map((s) => s.trim()) → ["React", "TypeScript", "Node.js"]
      .filter((s) => s && !skills.includes(s))
        → keep only non-empty strings that aren't already in the list
        → prevents duplicates
    */
    const newSkills = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !skills.includes(s));

    if (newSkills.length) {
      /*
        [...skills, ...newSkills]
        Spread operator creates a NEW array (never mutates `skills`).
        React requires new array references to detect state changes.

        Example:
          skills    = ['React', 'TypeScript']
          newSkills = ['Node.js']
          result    = ['React', 'TypeScript', 'Node.js']
      */
      onChange([...skills, ...newSkills]);
    }
    setInput(''); // Clear the text input after adding
  };

  // ── removeSkill ─────────────────────────────────────────────────────
  // Removes a skill by filtering it out of the array.
  // .filter((s) => s !== skill) keeps every element except the removed one.
  const removeSkill = (skill: string) => onChange(skills.filter((s) => s !== skill));

  return (
    <div>
      {/* Section label — styled like an input label */}
      <p className="input-label" style={{ marginBottom: '0.5rem' }}>
        Skills
      </p>

      {/* ── Tag pills row ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',       // Allow tags to wrap to multiple lines
          gap: '0.5rem',
          marginBottom: editing ? '0.75rem' : 0, // Extra space below when editing
          minHeight: '2rem',      // Prevents layout jump when skills array is empty
        }}
      >
        {/* Empty-state hint in view mode */}
        {skills.length === 0 && !editing && (
          <em style={{ color: 'var(--color-text-muted)', opacity: 0.5, fontSize: '0.9rem' }}>
            No skills added yet
          </em>
        )}

        {/* Render one pill per skill */}
        {skills.map((skill) => (
          <span
            key={skill}            // React key — must be unique in the list
            className="badge badge-teal" // Global CSS: teal-coloured pill
            style={{ gap: '0.4rem', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
          >
            {skill}

            {/*
              × remove button — only shown in edit mode.
              type="button" prevents accidental form submission.
              aria-label gives screen readers meaningful context.
            */}
            {editing && (
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                onClick={() => removeSkill(skill)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'inherit',  // Inherits the badge's text colour
                  padding: 0,
                  lineHeight: 1,
                  fontSize: '0.85rem',
                  opacity: 0.7,      // Slightly de-emphasised vs the skill text
                }}
              >
                × {/* × is the HTML entity for the multiplication sign used as a close icon */}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* ── Add skill input (only shown in edit mode) ─────────────── */}
      {editing && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            id="skill-tag-input"
            className="input"
            placeholder="Add skill and press Enter (or separate by comma)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              /*
                onKeyDown fires on every key press.
                We intercept Enter and comma to add the skill without typing
                the separator character into the input.

                e.preventDefault() stops the default action:
                  - For Enter: prevents form submission if inside a <form>
                  - For comma: prevents the ',' character from being typed
              */
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addSkill(input); // Add whatever is currently in the input
              }
            }}
            onBlur={() => addSkill(input)}
            // onBlur fires when the input loses focus (user clicks elsewhere).
            // This auto-adds any partially typed skill if the user tabs away.
          />
          {/* Manual "Add" button — alternative to pressing Enter */}
          <Button id="skill-add-btn" variant="secondary" size="sm" onClick={() => addSkill(input)}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
