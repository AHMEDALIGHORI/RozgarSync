// @ts-nocheck
﻿// @ts-nocheck
'use client';

// ============================================
// StatCard Component (Dashboard)
// ============================================

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'brand' | 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
}

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  icon: Icon,
  trend,
  color = 'brand',
}: StatCardProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    // Format number with commas (e.g., 1,234,567)
    const formatted = Math.round(latest).toLocaleString();
    return `${prefix ? prefix + ' ' : ''}${formatted}${suffix ? ' ' + suffix : ''}`;
  });

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: 'easeOut',
      onComplete: () => setHasAnimated(true),
    });

    return controls.stop;
  }, [value, count]);

  const colorStyles = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <Card variant="glass" padding="lg" glow className="group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-dark-300 group-hover:text-dark-200 transition-colors">
          {title}
        </h3>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border transition-colors', colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <motion.h4 className="text-2xl lg:text-3xl font-display font-bold text-dark-50">
            {rounded}
          </motion.h4>
        </div>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg',
              trend.isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
    </Card>
  );
}

