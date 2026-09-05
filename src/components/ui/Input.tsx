import React, { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'charcoal' | 'ivory' | 'glass';
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'charcoal',
      inputSize = 'md',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const baseInputStyles =
      'w-full font-sans rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B8703F] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      // Charcoal input for dark themes
      charcoal:
        'bg-[#16171A] text-[#F7F4EF] placeholder-white/40 border border-white/15 focus:bg-[#1c1e22] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]',
      // Ivory input for light themes / contrasting sections
      ivory:
        'bg-[#F7F4EF] text-[#1A1A1A] placeholder-[#1A1A1A]/40 border border-black/10 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]',
      // Glass translucent input
      glass:
        'bg-white/5 backdrop-blur-sm text-[#F7F4EF] placeholder-white/30 border border-white/10 focus:bg-white/10',
    };

    const sizes = {
      sm: 'text-xs py-2 px-3',
      md: 'text-sm py-2.5 px-3.5',
      lg: 'text-base py-3.5 px-4',
    };

    const errorStyles = error
      ? 'border-rose-500 focus:ring-rose-500 text-rose-300'
      : '';

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#F7F4EF]/80 tracking-wide select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-white/40 flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={twMerge(
              clsx(
                baseInputStyles,
                variants[variant],
                sizes[inputSize],
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                errorStyles,
                className
              )
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-white/40 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-rose-400 font-medium pl-1">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-white/40 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
