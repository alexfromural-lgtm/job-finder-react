// ─── components/ui/Modal.tsx — Accessible Dialog Modal ───────────────────────
//
// A modal (dialog) that overlays the page content. Used for:
//   • Apply to Job dialog (ApplyModal)
//   • Any future confirmation dialogs
//
// Accessibility features:
//   • role="dialog" + aria-modal="true" — tells screen readers it's a modal
//   • aria-labelledby links the modal to its title (screen readers announce it)
//   • Escape key closes the modal
//   • Body scroll is locked while the modal is open
//
// Usage:
//   <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply">
//     <p>Modal content goes here</p>
//   </Modal>

import { useEffect, type ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;      // whether the modal is visible
  onClose: () => void;  // called when user wants to close (Escape, overlay click, × button)
  title: string;        // shown in the modal header + read by screen readers
  children: ReactNode;  // the modal body content
  maxWidth?: string;    // CSS max-width of the modal box (default: '560px')
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '560px',
}: ModalProps) {
  // ── Effect 1: Close on Escape key ─────────────────────────────────────────
  useEffect(() => {
    // Create a keyboard event handler.
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(); // close when Escape is pressed
    };

    // Only attach the listener when the modal is open.
    // If we always listen, we'd block Escape on other UI elements.
    if (isOpen) document.addEventListener('keydown', handler);

    // Cleanup: always remove the listener when the effect re-runs or unmounts.
    // If we didn't remove it, every time isOpen changed we'd add ANOTHER listener.
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Effect 2: Lock body scroll while modal is open ─────────────────────────
  // When a modal is open, the user shouldn't be able to scroll the page behind it.
  useEffect(() => {
    if (isOpen) {
      // 'hidden' prevents the scrollbar from showing and disables scrolling.
      document.body.style.overflow = 'hidden';
    } else {
      // '' resets overflow to its default (auto/scroll).
      document.body.style.overflow = '';
    }

    // Cleanup: always restore scrolling when the effect cleans up.
    // This ensures scroll is restored even if the component unmounts unexpectedly.
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Early return: render nothing when closed ───────────────────────────────
  // This is cleaner than conditionally toggling a CSS display property.
  // The modal simply doesn't exist in the DOM when closed.
  if (!isOpen) return null;

  return (
    // The overlay: a full-screen dark background.
    // Clicking it calls onClose (dismiss by clicking outside the modal).
    <div
      className="modal-overlay"
      onClick={onClose}         // click overlay → close
      role="dialog"
      aria-modal="true"         // tells screen readers: everything behind is inert
      aria-labelledby="modal-title" // links to the <h2 id="modal-title"> below
    >
      {/* The modal box: the actual visible card.
          e.stopPropagation() prevents clicks inside the box from reaching
          the overlay (which would close the modal). */}
      <div className="modal-box" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {/* Modal header: title + close button */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          {/* ✕ close button in top-right corner */}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>

        {/* Modal body — whatever is passed as children */}
        {children}
      </div>
    </div>
  );
}
