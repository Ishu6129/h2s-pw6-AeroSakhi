import { memo } from 'react';

/**
 * Accessible skip-to-content navigation link for screen readers and keyboard users.
 */
export const SkipLink = memo(function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
});
