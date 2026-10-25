import React from 'react';

export interface ProtocolShapeProps {
  type: 'circle' | 'triangle' | 'square';
  size?: number;
  className?: string;
  drawOn?: boolean;
  strokeWidth?: number;
}

/**
 * Reusable ProtocolShape SVG Component.
 * Employs 1.5px stroke, currentColor, and optional stroke-dashoffset draw-on.
 * Adheres to generic geometric shapes (circle, triangle, square).
 */
export const ProtocolShape: React.FC<ProtocolShapeProps> = ({
  type,
  size = 14,
  className = '',
  drawOn = false,
  strokeWidth = 1.5,
}) => {
  const drawClass = drawOn ? 'animate-draw-shape' : '';

  if (type === 'circle') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={`${drawClass} ${className}`.trim()}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }

  if (type === 'triangle') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className={`${drawClass} ${className}`.trim()}
        aria-hidden="true"
      >
        <polygon points="12,3.5 21,19.5 3,19.5" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      className={`${drawClass} ${className}`.trim()}
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
    </svg>
  );
};
