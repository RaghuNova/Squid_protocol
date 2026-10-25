import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Shared neutral Skeleton component.
 * Uses transform/opacity shimmer only. Hidden under prefers-reduced-motion.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-surface-elevated border border-border-subtle rounded ${className}`}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer bg-white/[0.04] motion-reduce:hidden pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
