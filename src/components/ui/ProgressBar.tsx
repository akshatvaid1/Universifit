import React, { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'copper' | 'sage' | 'default';
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'copper',
  showLabel = false,
  label,
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const fillVariants = {
    // Primary Near-Black (#14161A)
    copper: 'bg-[#14161A]',
    // Signal-Blue (#3652C4)
    sage: 'bg-[#3652C4]',
    // Minimalist Near-Black Default
    default: 'bg-[#14161A]',
  };

  return (
    <div className={twMerge('w-full font-sans', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-medium text-[#14161A] mb-1.5">
          <span>{label || 'Course Progress'}</span>
          <span className="font-semibold text-[#14161A]">{percentage}%</span>
        </div>
      )}

      <div
        className={twMerge(
          'w-full rounded-full bg-[#E8E8E6] overflow-hidden',
          sizeClasses[size]
        )}
      >
        <div
          className={twMerge(
            'h-full rounded-full transition-all duration-300 ease-out',
            fillVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
