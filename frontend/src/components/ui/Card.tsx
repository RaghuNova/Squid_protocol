import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  cornerAccents?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, variant = 'default', cornerAccents = false, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[#0f1218] border border-[#1e2432]',
      elevated: 'bg-[#151922] border border-[#2c3447] shadow-card',
      interactive:
        'bg-[#0f1218] border border-[#1e2432] hover:border-[#2c3447] hover:bg-[#141822] transition-colors duration-150',
      bordered: 'bg-transparent border border-[#2c3447]',
    }[variant];

    return (
      <div
        ref={ref}
        className={clsx('relative rounded-2xl p-6 transition-all', variantClasses, className)}
        {...props}
      >
        {cornerAccents && (
          <>
            <span
              className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#ff004f]/60 rounded-tl-lg pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#ff004f]/60 rounded-tr-lg pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#ff004f]/60 rounded-bl-lg pointer-events-none"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#ff004f]/60 rounded-br-lg pointer-events-none"
              aria-hidden="true"
            />
          </>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
