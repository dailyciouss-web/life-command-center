import React from 'react';
import { CheckSquare, Calendar, Wallet, Landmark, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export type NavTab = 'tasks' | 'today' | 'finances' | 'debts' | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const TABS = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'today', label: 'Today', icon: Calendar },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'debts', label: 'Debts', icon: Landmark },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-2">
      <div className="mx-auto max-w-lg bg-white/[0.06] backdrop-blur-[24px] border border-white/[0.12] rounded-full flex items-center justify-around p-2 shadow-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-300 relative',
              'min-w-[64px]',
              activeTab === id ? 'text-white' : 'text-white/40 hover:text-white/60'
            )}
          >
            {activeTab === id && (
              <div className={cn(
                "absolute inset-0 rounded-full blur-md -z-10",
                id === 'tasks' && "bg-violet-500/25",
                id === 'today' && "bg-violet-500/25",
                id === 'finances' && "bg-emerald-500/35",
                id === 'debts' && "bg-blue-500/25",
                id === 'settings' && "bg-white/10"
              )} />
            )}
            <Icon size={22} className={cn(
              'transition-transform duration-300',
              activeTab === id && 'scale-110',
              activeTab === id && id === 'tasks' && "text-violet-400",
              activeTab === id && id === 'today' && "text-violet-400",
              activeTab === id && id === 'finances' && "text-emerald-400",
              activeTab === id && id === 'debts' && "text-blue-400",
              activeTab === id && id === 'settings' && "text-slate-400"
            )} />
            <span className={cn(
              "text-[10px] mt-1 font-medium tracking-tight uppercase transition-colors duration-300",
              activeTab === id && id === 'tasks' && "text-violet-300",
              activeTab === id && id === 'today' && "text-violet-300",
              activeTab === id && id === 'finances' && "text-emerald-300",
              activeTab === id && id === 'debts' && "text-blue-300",
              activeTab === id && id === 'settings' && "text-slate-300",
              activeTab !== id && "text-white/40"
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
