import React, { type HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'charcoal' | 'ivory' | 'glass' | 'outline';
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'charcoal', interactive = false, children, ...props }, ref) => {
    const baseStyles =
      'rounded-xl transition-all duration-200 overflow-hidden';

    const variants = {
      charcoal:
        'bg-[#16171A] text-[#F7F4EF] border border-white/10 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]',
      ivory:
        'bg-[#F7F4EF] text-[#1A1A1A] border border-black/5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]',
      glass:
        'bg-[#16171A]/85 backdrop-blur-md text-[#F7F4EF] border border-white/10 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)]',
      outline:
        'bg-transparent text-[#F7F4EF] border border-white/15 hover:border-white/30',
    };

    const interactiveStyles = interactive
      ? 'hover:-translate-y-1 hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.7)] hover:border-[#B8703F]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8703F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121315] cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], interactiveStyles, className))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={twMerge('p-5 sm:p-6 pb-2', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={twMerge('text-lg sm:text-xl font-display font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={twMerge('p-5 sm:p-6 pt-2', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge('p-5 sm:p-6 pt-0 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};
