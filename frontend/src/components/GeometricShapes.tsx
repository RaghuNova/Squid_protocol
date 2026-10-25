import React from 'react';

export interface ShapeProps {
  className?: string;
  size?: number;
  color?: string;
  strokeWidth?: number | string;
}

export const CircleShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} className={className}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const TriangleShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" className={className}>
    <polygon points="12,3.5 21,19.5 3,19.5" />
  </svg>
);

export const SquareShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
  </svg>
);

export const UmbrellaShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2C6.5 2 2 6.5 2 12h20c0-5.5-4.5-10-10-10z" />
    <path d="M12 12v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2" />
  </svg>
);

export const StarShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

export const DiamondShape: React.FC<ShapeProps> = ({ className = '', size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" className={className}>
    <polygon points="12,2 22,12 12,22 2,12" />
  </svg>
);

export const SymbolMap: Record<string, { label: string; component: React.FC<ShapeProps>; color: string }> = {
  S: { label: 'Square', component: SquareShape, color: '#ff004f' },
  T: { label: 'Triangle', component: TriangleShape, color: '#ff2e7e' },
  C: { label: 'Circle', component: CircleShape, color: '#00f0ff' },
  U: { label: 'Umbrella', component: UmbrellaShape, color: '#ffd166' },
  A: { label: 'Star', component: StarShape, color: '#a855f7' },
  D: { label: 'Diamond', component: DiamondShape, color: '#00e676' },
};
