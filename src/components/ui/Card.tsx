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
      'rounded-lg transition-colors duration-150 overflow-hidden';

    const variants = {
      charcoal:
        'bg-[#14161A] text-white border border-[#26282E]',
      ivory:
        'bg-white text-[#14161A] border border-[#E8E8E6]',
      glass:
        'bg-white text-[#14161A] border border-[#E8E8E6]',
      outline:
        'bg-transparent text-[#14161A] border border-[#E8E8E6] hover:border-[#14161A]',
    };

    const interactiveStyles = interactive
      ? 'hover:border-[#3652C4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3652C4] cursor-pointer'
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
      className={twMerge('text-lg sm:text-xl font-sans font-semibold tracking-tight text-[#14161A]', className)}
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
