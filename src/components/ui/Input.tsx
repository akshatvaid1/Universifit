import React, { type InputHTMLAttributes, forwardRef, useId } from 'react';
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
      variant = 'ivory',
      inputSize = 'md',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `input-${generatedId}`);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const baseInputStyles =
      'w-full font-sans rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#3652C4] focus:ring-offset-1 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed';

    const variants = {
      // Ivory / Light Minimalist surface (default)
      ivory:
        'bg-white text-[#14161A] placeholder-[#5A5D62] border border-[#E8E8E6] focus:border-[#3652C4]',
      // Charcoal input for dark accents
      charcoal:
        'bg-[#14161A] text-white placeholder-[#8B8D91] border border-[#26282E] focus:bg-[#1c1e22]',
      // Glass translucent input
      glass:
        'bg-white text-[#14161A] placeholder-[#5A5D62] border border-[#E8E8E6] focus:border-[#3652C4]',
    };

    const sizes = {
      sm: 'text-xs py-2 px-3',
      md: 'text-sm py-2.5 px-3.5',
      lg: 'text-base py-3 px-4',
    };

    const errorStyles = error
      ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
      : '';

    return (
      <div className="w-full space-y-1.5 font-sans">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#14161A] select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 pointer-events-none text-[#5A5D62] flex items-center justify-center" aria-hidden="true">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : (helperText ? helperId : undefined)}
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
            <div className="absolute right-3.5 text-[#5A5D62] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-rose-600 font-medium pl-1">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-[#5A5D62] pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
