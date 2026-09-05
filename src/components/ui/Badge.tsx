import React, { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2 } from 'lucide-react';

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
    'inline-flex items-center font-medium font-sans rounded-full transition-colors select-none';

  const variants = {
    // Verified Badge: accent-sage (#6E8B6F)
    verified:
      'bg-[#6E8B6F]/15 text-[#6E8B6F] border border-[#6E8B6F]/30 dark:bg-[#6E8B6F]/20 dark:text-[#8cb08d] dark:border-[#6E8B6F]/40',
    // Copper Badge: accent-copper (#B8703F)
    copper:
      'bg-[#B8703F]/15 text-[#B8703F] border border-[#B8703F]/30 dark:bg-[#B8703F]/20 dark:text-[#d48b59]',
    // Neutral Dark Charcoal Badge
    neutral:
      'bg-[#16171A] text-[#F7F4EF] border border-white/10',
    // Ivory Badge: bg-ivory (#F7F4EF) with ink text (#1A1A1A)
    ivory:
      'bg-[#F7F4EF] text-[#1A1A1A] border border-black/5 shadow-xs',
    // Subtle Outline
    outline:
      'bg-transparent text-white/80 border border-white/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {variant === 'verified' && !icon && (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#6E8B6F]" />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
