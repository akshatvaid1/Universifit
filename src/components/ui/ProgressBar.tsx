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
    // Accent Copper (#B8703F)
    copper: 'bg-gradient-to-r from-[#B8703F] to-[#d48b59]',
    // Accent Sage (#6E8B6F)
    sage: 'bg-gradient-to-r from-[#6E8B6F] to-[#8cb08d]',
    // Default Clean White
    default: 'bg-white',
  };

  return (
    <div className={twMerge('w-full font-sans', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#F7F4EF]/80 mb-1.5">
          <span>{label || 'Course Progress'}</span>
          <span className="font-mono text-[#B8703F]">{percentage}%</span>
        </div>
      )}

      <div
        className={twMerge(
          'w-full rounded-full bg-white/[0.08] overflow-hidden p-0.5 border border-white/[0.06]',
          sizeClasses[size]
        )}
      >
        <div
          className={twMerge(
            'h-full rounded-full transition-all duration-500 ease-out shadow-xs',
            fillVariants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
