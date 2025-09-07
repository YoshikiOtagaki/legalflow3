'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 6,
}: ResponsiveGridProps) {
  const gridCols = {
    default: `grid-cols-${cols.default || 1}`,
    sm: cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    md: cols.md ? `md:grid-cols-${cols.md}` : '',
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : '',
  };

  const gapClass = `gap-${gap}`;

  return (
    <div
      className={cn(
        'grid',
        gridCols.default,
        gridCols.sm,
        gridCols.md,
        gridCols.lg,
        gridCols.xl,
        gapClass,
        className
      )}
    >
      {children}
    </div>
  );
}
