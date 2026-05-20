'use client';

// ============================================
// Badge Component
// ============================================

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors';

  const variants = {
    default: 'bg-dark-800 text-dark-200 border border-dark-700',
    success: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  const sizes = {
    sm: 'text-2xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const dotColors = {
    default: 'bg-dark-400',
    success: 'bg-brand-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 me-1.5">
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColors[variant])}></span>
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dotColors[variant])}></span>
        </span>
      )}
      {children}
    </span>
  );
}
