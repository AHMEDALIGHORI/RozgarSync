'use client';

// ============================================
// Input Component
// ============================================

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id: userDefinedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = userDefinedId || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block mb-2 text-sm font-medium text-dark-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-dark-400">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              'bg-dark-800/50 border text-dark-50 text-sm rounded-xl block w-full transition-colors',
              'focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-dark-600',
              leftIcon ? 'ps-10' : 'ps-4',
              rightIcon ? 'pe-10' : 'pe-4',
              'py-2.5',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3.5 pointer-events-none text-dark-400">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={cn('mt-2 text-sm', error ? 'text-red-500' : 'text-dark-400')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
