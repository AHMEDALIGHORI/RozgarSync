'use client';

import { useMemo } from 'react';

interface ParticleBackgroundProps {
  dotCount?: number;
  className?: string;
}

export function ParticleBackground({
  dotCount = 80,
  className = '',
}: ParticleBackgroundProps) {
  const dots = useMemo(() => {
    return Array.from({ length: dotCount }, (_, i) => ({
      id: i,
      left: `${(i % 10) * 10 + Math.random() * 5}%`,
      top: `${Math.floor(i / 10) * 12.5 + Math.random() * 5}%`,
      delay: (i * 0.15) % 6,
      duration: 4 + Math.random() * 4,
      size: 1.5 + Math.random() * 1.5,
      opacity: 0.15 + Math.random() * 0.2,
    }));
  }, [dotCount]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            backgroundColor: '#10B981',
            opacity: dot.opacity,
            animation: `particlePulse ${dot.duration}s ease-in-out ${dot.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes particlePulse {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.1;
          }
          50% {
            transform: translateY(-8px) scale(1.5);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
