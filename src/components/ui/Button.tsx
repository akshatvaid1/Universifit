import React, { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'secondary' | 'outline' | 'sage';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium font-sans rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F7F5] focus-visible:ring-[#3652C4] active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none';

    const variants = {
      primary:
        'bg-[#3652C4] text-white hover:bg-[#2D44A6]',
      ghost:
        'bg-transparent text-[#14161A] hover:bg-black/[0.04] border border-transparent',
      secondary:
        'bg-white text-[#14161A] hover:bg-[#F7F7F5] border border-[#E5E5E3]',
      outline:
        'bg-transparent text-[#14161A] border border-[#8B8D91]/30 hover:border-[#14161A] hover:bg-black/[0.02]',
      sage:
        'bg-[#3652C4] text-white hover:bg-[#2D44A6]',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-5 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
