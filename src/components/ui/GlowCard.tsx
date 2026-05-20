'use client';

import { motion } from 'framer-motion';
import { ReactNode, useRef, useState, useCallback } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hoverLift?: boolean;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.15)',
  hoverLift = true,
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={hoverLift ? { y: -6, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `conic-gradient(from 0deg at 50% 50%, #0F5E38, #10B981, #34D399, #10B981, #0F5E38)`,
          animation: 'rotateGradient 4s linear infinite',
        }}
      />

      {/* Inner card content area */}
      <div className="absolute inset-[1.5px] rounded-2xl bg-dark-900/95 backdrop-blur-xl z-[1]" />

      {/* Mouse-following glow */}
      <div
        className="absolute w-64 h-64 rounded-full blur-[80px] transition-opacity duration-300 z-[2] pointer-events-none"
        style={{
          left: mousePosition.x - 128,
          top: mousePosition.y - 128,
          background: glowColor,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Subtle inner glow */}
      <div
        className="absolute inset-0 rounded-2xl z-[2] pointer-events-none transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 0 30px ${glowColor}`,
          opacity: isHovered ? 0.5 : 0.15,
        }}
      />

      {/* Static border when not hovered */}
      <div
        className="absolute inset-0 rounded-2xl border border-white/[0.06] z-[2] pointer-events-none transition-opacity duration-500"
        style={{ opacity: isHovered ? 0 : 1 }}
      />

      {/* Content */}
      <div className="relative z-[3]">{children}</div>
    </motion.div>
  );
}
