// Question mark icon used to open help dialogs.
import React from 'react';

const HelpIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9a3 3 0 0 1 6 0c0 1.5-2 2-2 2" />
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);

export default HelpIcon;
