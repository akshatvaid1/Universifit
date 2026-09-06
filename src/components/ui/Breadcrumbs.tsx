import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  showHomeIcon = true,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs font-medium text-[#F7F4EF]/60 ${className}`}
    >
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex items-center flex-wrap gap-1.5 sm:gap-2"
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.isCurrent;
          const position = index + 1;

          return (
            <li
              key={`${item.label}-${index}`}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              className="inline-flex items-center gap-1.5 sm:gap-2"
            >
              {index > 0 && (
                <ChevronRight
                  className="w-3 h-3 text-[#F7F4EF]/30 shrink-0 select-none"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  itemProp="name"
                  aria-current="page"
                  className="text-white font-semibold truncate max-w-[200px] sm:max-w-[320px]"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  itemProp="item"
                  onClick={item.onClick}
                  className="inline-flex items-center gap-1 text-[#F7F4EF]/65 hover:text-[#E29A68] transition-colors cursor-pointer outline-none focus-visible:underline focus-visible:text-[#E29A68] rounded"
                  title={item.label}
                >
                  {index === 0 && showHomeIcon && (
                    <Home className="w-3.5 h-3.5 text-[#B8703F] shrink-0" aria-hidden="true" />
                  )}
                  <span itemProp="name" className="truncate max-w-[140px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </button>
              ) : (
                <a
                  href={item.href || '#'}
                  itemProp="item"
                  className="inline-flex items-center gap-1 text-[#F7F4EF]/65 hover:text-[#E29A68] transition-colors outline-none focus-visible:underline focus-visible:text-[#E29A68] rounded"
                  title={item.label}
                >
                  {index === 0 && showHomeIcon && (
                    <Home className="w-3.5 h-3.5 text-[#B8703F] shrink-0" aria-hidden="true" />
                  )}
                  <span itemProp="name" className="truncate max-w-[140px] sm:max-w-[200px]">
                    {item.label}
                  </span>
                </a>
              )}

              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
