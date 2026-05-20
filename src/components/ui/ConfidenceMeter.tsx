'use client';

import { motion } from 'framer-motion';

interface ConfidenceMeterProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function ConfidenceMeter({
  value,
  size = 80,
  strokeWidth = 4,
  label,
  className = '',
}: ConfidenceMeterProps) {
  const clampedValue = Math.min(1, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedValue);

  // Color from red → yellow → green based on value
  const getColor = (v: number): string => {
    if (v >= 0.75) return '#34D399';
    if (v >= 0.5) return '#10B981';
    if (v >= 0.25) return '#FBBF24';
    return '#EF4444';
  };

  const color = getColor(clampedValue);
  const percentage = Math.round(clampedValue * 100);

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Animated progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-sm font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>

      {label && (
        <span className="mt-1.5 text-2xs text-dark-400 font-medium text-center">
          {label}
        </span>
      )}
    </div>
  );
}
