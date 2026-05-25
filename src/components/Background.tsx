import React from 'react';
import { NavTab } from './Navigation';
import { motion, AnimatePresence } from 'motion/react';

interface BackgroundProps {
  activeTab: NavTab;
}

const THEMES: Record<NavTab, { primary: string; secondary: string; accent: string; highlight: string }> = {
  tasks: {
    primary: '#2e1065',    // Violet
    secondary: '#4c1d95',
    accent: '#1e1b4b',
    highlight: '#6366f1'
  },
  today: {
    primary: '#312e81',    // Indigo
    secondary: '#1e1b4b',
    accent: '#0f172a',
    highlight: '#818cf8'
  },
  finances: {
    primary: '#064e3b',    // Emerald
    secondary: '#065f46',
    accent: '#022c22',
    highlight: '#34d399'
  },
  debts: {
    primary: '#1e3a8a',    // Blue
    secondary: '#172554',
    accent: '#082f49',
    highlight: '#60a5fa'
  },
  settings: {
    primary: '#1f2937',    // Gray
    secondary: '#111827',
    accent: '#030712',
    highlight: '#9ca3af'
  }
};

export const Background: React.FC<BackgroundProps> = ({ activeTab }) => {
  const theme = THEMES[activeTab];

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0514]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* Atmosphere Background Brushes */}
          <div 
            className="absolute inset-0 z-0 bg-no-repeat w-full h-full"
            style={{ 
              background: `
                radial-gradient(circle at 20% 30%, ${theme.primary} 0%, transparent 60%),
                radial-gradient(circle at 80% 70%, ${theme.secondary} 0%, transparent 60%),
                radial-gradient(circle at 50% 50%, ${theme.accent} 0%, #0a0514 100%)
              ` 
            }}
          />
          
          {/* Subtle light accents */}
          <div 
            className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full opacity-10 blur-[120px]"
            style={{ background: `radial-gradient(circle, ${theme.highlight} 0%, transparent 70%)` }}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
