import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'danger' | 'warning' | 'cyan' | 'purple';
  size?: 'sm' | 'md';
  hasDot?: boolean;
  pulseDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  hasDot = false,
  pulseDot = false,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md font-mono tracking-wider',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg font-mono tracking-wide',
  }[size];

  const variantClasses = {
    neutral: 'bg-[#151922] border border-[#2c3447] text-gray-300',
    success: 'bg-[#00e676]/10 border border-[#00e676]/40 text-[#00e676]',
    danger: 'bg-red-950/40 border border-red-800/80 text-red-400',
    warning: 'bg-[#f59e0b]/10 border border-[#f59e0b]/40 text-[#f59e0b]',
    cyan: 'bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff]',
    purple: 'bg-[#a855f7]/10 border border-[#a855f7]/40 text-[#a855f7]',
  }[variant];

  const dotColorClasses = {
    neutral: 'bg-gray-400',
    success: 'bg-[#00e676]',
    danger: 'bg-[#ff004f]',
    warning: 'bg-[#f59e0b]',
    cyan: 'bg-[#00f0ff]',
    purple: 'bg-[#a855f7]',
  }[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold uppercase select-none transition-colors',
        sizeClasses,
        variantClasses,
        className
      )}
      {...props}
    >
      {hasDot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColorClasses,
            pulseDot && 'animate-ping motion-reduce:animate-none'
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
