'use client';

// ============================================
// Card Component
// ============================================

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hover = true,
      glow = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-2xl overflow-hidden';

    const variants = {
      default: 'bg-dark-900/80 border border-dark-700/50',
      elevated: 'bg-dark-800/90 border border-dark-600/50 shadow-elevated',
      glass: 'glass',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6 sm:p-8',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          glow && 'hover:border-brand-500/50 hover:shadow-glow transition-all duration-300',
          className
        )}
        whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
