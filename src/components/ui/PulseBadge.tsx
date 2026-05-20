'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import clsx from 'clsx';

interface PulseBadgeProps {
  status: 'active' | 'idle' | 'error' | 'processing';
  label?: string;
  className?: string;
}

export function PulseBadge({ status, label, className }: PulseBadgeProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Haptic feedback on status change if supported
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      if (status === 'active') {
        window.navigator.vibrate([10, 30, 10]);
      } else if (status === 'processing') {
        window.navigator.vibrate([5]);
      } else if (status === 'error') {
        window.navigator.vibrate([20, 10, 20]);
      }
    }
  }, [status]);

  const getStatusColors = () => {
    switch (status) {
      case 'active':
        return 'bg-brand-500 text-brand-50 border-brand-400';
      case 'processing':
        return 'bg-blue-500 text-blue-50 border-blue-400';
      case 'error':
        return 'bg-red-500 text-red-50 border-red-400';
      case 'idle':
      default:
        return 'bg-dark-700 text-dark-200 border-dark-600';
    }
  };

  const getPulseColor = () => {
    switch (status) {
      case 'active':
        return 'bg-brand-400';
      case 'processing':
        return 'bg-blue-400';
      case 'error':
        return 'bg-red-400';
      case 'idle':
      default:
        return 'bg-dark-500';
    }
  };

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium',
        getStatusColors(),
        className
      )}
    >
      <div className="relative flex h-2 w-2 items-center justify-center">
        {status !== 'idle' && !shouldReduceMotion && (
          <motion.span
            className={clsx('absolute inline-flex h-full w-full rounded-full opacity-75', getPulseColor())}
            animate={{ scale: [1, 2, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: status === 'processing' ? 1 : 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {status !== 'idle' && shouldReduceMotion && (
          <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-50', getPulseColor())} />
        )}
        <span className={clsx('relative inline-flex rounded-full h-1.5 w-1.5', getPulseColor())} />
      </div>
      {label && <span>{label}</span>}
    </div>
  );
}
