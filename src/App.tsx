/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Background } from './components/Background';
import { Navigation, NavTab } from './components/Navigation';
import { useAppState } from './hooks/useAppState';
import { AnimatePresence, motion } from 'motion/react';
import { TasksView } from './features/TasksView';
import { TodayView } from './features/TodayView';
import { FinancesView } from './features/FinancesView';
import { DebtsView } from './features/DebtsView';
import { SettingsView } from './features/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('tasks');

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks': return <TasksView />;
      case 'today': return <TodayView />;
      case 'finances': return <FinancesView />;
      case 'debts': return <DebtsView />;
      case 'settings': return <SettingsView />;
    }
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <Background activeTab={activeTab} />
      
      <main className="pb-32 pt-6 px-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}


