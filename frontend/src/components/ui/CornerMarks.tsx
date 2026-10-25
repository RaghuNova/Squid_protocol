import React from 'react';

export interface CornerMarksProps {
  className?: string;
  size?: number;
}

/**
 * Registration Marks: L-shaped corner brackets (8-10px) on cards and panels.
 * Brightens on hover/focus-within. Hairline 1px borders, flat surfaces.
 */
export const CornerMarks: React.FC<CornerMarksProps> = ({
  className = 'text-border-muted group-hover:text-text-muted group-focus-within:text-text-muted',
  size = 8,
}) => {
  const style = { width: size, height: size };

  return (
    <>
      <span
        style={style}
        className={`absolute -top-px -left-px border-t border-l border-current pointer-events-none transition-colors ${className}`}
        aria-hidden="true"
      />
      <span
        style={style}
        className={`absolute -top-px -right-px border-t border-r border-current pointer-events-none transition-colors ${className}`}
        aria-hidden="true"
      />
      <span
        style={style}
        className={`absolute -bottom-px -left-px border-b border-l border-current pointer-events-none transition-colors ${className}`}
        aria-hidden="true"
      />
      <span
        style={style}
        className={`absolute -bottom-px -right-px border-b border-r border-current pointer-events-none transition-colors ${className}`}
        aria-hidden="true"
      />
    </>
  );
};
