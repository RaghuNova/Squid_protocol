import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
      sm: 'px-3.5 py-1.5 text-xs font-medium rounded-lg gap-2',
      md: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
      lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
    }[size];

    const variantClasses = {
      primary:
        'bg-[#ff004f] hover:bg-[#e00045] active:bg-[#c7003c] text-white shadow-red-sm border border-transparent focus-visible:ring-[#ff004f]',
      secondary:
        'bg-[#151922] hover:bg-[#1e2432] active:bg-[#12151c] text-gray-200 border border-[#2c3447] hover:border-gray-500 hover:text-white focus-visible:ring-gray-400',
      outline:
        'bg-transparent hover:bg-[#151922] text-gray-300 hover:text-white border border-[#2c3447] hover:border-gray-500 focus-visible:ring-gray-400',
      danger:
        'bg-red-950/60 hover:bg-red-900/80 active:bg-red-950 text-red-200 border border-red-800/80 hover:border-red-600 focus-visible:ring-red-500',
      ghost:
        'bg-transparent hover:bg-[#151922] text-gray-400 hover:text-white border border-transparent focus-visible:ring-gray-400',
      success:
        'bg-[#00e676]/15 hover:bg-[#00e676]/25 active:bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/40 hover:border-[#00e676]/70 shadow-green-sm focus-visible:ring-[#00e676]',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-mono select-none tracking-wide cursor-pointer transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08090d]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]',
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
