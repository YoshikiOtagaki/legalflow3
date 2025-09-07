'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

interface ResponsiveTableHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableHeader({
  children,
  className,
}: ResponsiveTableHeaderProps) {
  return <thead className={cn('bg-gray-50', className)}>{children}</thead>;
}

interface ResponsiveTableBodyProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableBody({
  children,
  className,
}: ResponsiveTableBodyProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
}

interface ResponsiveTableRowProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableRow({
  children,
  className,
}: ResponsiveTableRowProps) {
  return <tr className={cn('hover:bg-gray-50', className)}>{children}</tr>;
}

interface ResponsiveTableCellProps {
  children: ReactNode;
  className?: string;
  isHeader?: boolean;
}

export function ResponsiveTableCell({
  children,
  className,
  isHeader = false,
}: ResponsiveTableCellProps) {
  const Component = isHeader ? 'th' : 'td';

  return (
    <Component
      className={cn(
        isHeader
          ? 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
          : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
        className
      )}
    >
      {children}
    </Component>
  );
}
