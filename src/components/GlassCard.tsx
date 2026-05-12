import React from 'react';
import { cn } from '../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  intensity = 'medium',
  ...props 
}) => {
  const intensityMap = {
    low: 'bg-white/[0.04] backdrop-blur-xl border-white/[0.08]',
    medium: 'bg-white/[0.06] backdrop-blur-2xl border-white/[0.12]',
    high: 'bg-white/[0.12] backdrop-blur-3xl border-white/[0.20]',
  };

  return (
    <motion.div
      className={cn(
        'rounded-3xl border shadow-2xl overflow-hidden',
        intensityMap[intensity],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
