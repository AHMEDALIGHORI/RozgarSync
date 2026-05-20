'use client';

import { motion } from 'framer-motion';

interface AgentStatusOrbProps {
  status: 'idle' | 'processing' | 'completed' | 'error';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  idle: {
    color: '#737D78',
    glowColor: 'rgba(115, 125, 120, 0.3)',
    label: 'Idle',
  },
  processing: {
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    label: 'Processing',
  },
  completed: {
    color: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    label: 'Completed',
  },
  error: {
    color: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    label: 'Error',
  },
};

const sizeConfig = {
  sm: { orb: 8, ring: 16 },
  md: { orb: 12, ring: 24 },
  lg: { orb: 16, ring: 32 },
};

export function AgentStatusOrb({
  status,
  label,
  size = 'md',
}: AgentStatusOrbProps) {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: sizes.ring, height: sizes.ring }}>
        {/* Outer breathing ring */}
        {status === 'processing' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: config.glowColor,
            }}
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Secondary ring for processing */}
        {status === 'processing' && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: config.glowColor,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        )}

        {/* Core orb */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: sizes.orb,
            height: sizes.orb,
            backgroundColor: config.color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${sizes.orb}px ${config.glowColor}`,
          }}
          animate={
            status === 'processing'
              ? { scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }
              : status === 'error'
              ? { opacity: [1, 0.4, 1] }
              : {}
          }
          transition={{
            duration: status === 'error' ? 1 : 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {label && (
        <span className="text-xs font-medium text-dark-300">
          {label || config.label}
        </span>
      )}
    </div>
  );
}
