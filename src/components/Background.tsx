import React from 'react';

export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0514]">
      {/* Atmosphere Background Brushes */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat w-full h-full"
        style={{ 
          background: `
            radial-gradient(circle at 20% 30%, #2e1065 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, #4c1d95 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0a0514 100%)
          ` 
        }}
      />
      
      {/* Subtle light accents */}
      <div 
        className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full opacity-20 blur-[100px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />

      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay" />
    </div>
  );
};
