import React, { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'copper' | 'neutral' | 'ivory' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium font-sans rounded-md transition-colors select-none';

  const variants = {
    // Verified Badge: clean minimalist neutral surface
    verified:
      'bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]',
    // Copper Badge: mapped to minimalist neutral
    copper:
      'bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]',
    // Neutral Badge: clean subtle off-white
    neutral:
      'bg-[#F7F7F5] text-[#14161A] border border-[#E8E8E6]',
    // Ivory Badge: white surface
    ivory:
      'bg-white text-[#14161A] border border-[#E8E8E6]',
    // Subtle Outline
    outline:
      'bg-transparent text-[#8B8D91] border border-[#E8E8E6]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
