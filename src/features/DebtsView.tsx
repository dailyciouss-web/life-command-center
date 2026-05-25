import React, { useMemo, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { GlassCard } from '../components/GlassCard';
import { Plus, User, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export const DebtsView: React.FC = () => {
  const { state, setState, addDebt } = useAppState();
  const [isAdding, setIsAdding] = useState(false);
  const [newDebt, setNewDebt] = useState({ personName: '', amount: 0, direction: 'they_owe' as const });

  const metrics = useMemo(() => {
    let iOwe = 0;
    let theyOwe = 0;
    state.debts.forEach(d => {
      if (d.status === 'paid') return;
      const totalPaid = d.payments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = d.amount - totalPaid;
      if (d.direction === 'i_owe') iOwe += remaining;
      else theyOwe += remaining;
    });
    return { iOwe, theyOwe, net: theyOwe - iOwe };
  }, [state.debts]);

  const markAsPaid = (debtId: string) => {
    setState(prev => ({
      ...prev,
      debts: prev.debts.map(d => d.id === debtId ? { ...d, status: 'paid' } : d)
    }));
  };

  const handleAdd = () => {
    if (!newDebt.personName || !newDebt.amount) return;
    addDebt(newDebt);
    setNewDebt({ personName: '', amount: 0, direction: 'they_owe' });
    setIsAdding(false);
  };

  const activeDebts = state.debts.filter(d => d.status !== 'paid');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase">Financial Pulse</h1>
          <p className="text-white/50 text-[10px] tracking-widest uppercase">Debts & Receivables</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform text-white"
        >
          <Plus size={24} className={cn("transition-transform", isAdding && "rotate-45")} />
        </button>
      </header>

      {isAdding && (
        <GlassCard className="p-6 flex flex-col gap-4 border-blue-500/30">
          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-300">New Entry</h3>
          <input 
            className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-blue-500/50 text-white" 
            placeholder="Person Name" 
            value={newDebt.personName}
            onChange={e => setNewDebt({...newDebt, personName: e.target.value})}
          />
          <input 
            type="number"
            className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-blue-500/50 text-white" 
            placeholder="Amount" 
            value={newDebt.amount || ''}
            onChange={e => setNewDebt({...newDebt, amount: Number(e.target.value)})}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => setNewDebt({...newDebt, direction: 'they_owe'})}
              className={cn(
                "flex-1 p-3 rounded-xl text-xs font-bold uppercase transition-all",
                newDebt.direction === 'they_owe' ? "bg-emerald-500 text-white" : "bg-white/5 text-white/40"
              )}
            >
              They Owe Me
            </button>
            <button 
              onClick={() => setNewDebt({...newDebt, direction: 'i_owe'})}
              className={cn(
                "flex-1 p-3 rounded-xl text-xs font-bold uppercase transition-all",
                newDebt.direction === 'i_owe' ? "bg-rose-500 text-white" : "bg-white/5 text-white/40"
              )}
            >
              I Owe Them
            </button>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-xl font-bold uppercase tracking-widest"
          >
            Add Registry
          </button>
        </GlassCard>
      )}

      <GlassCard className="p-6 relative overflow-hidden" intensity="high">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <LandmarkLargeIcon className="w-24 h-24" />
         </div>
         <div className="relative z-10">
            <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-4">Net Balance</p>
            <h2 className={cn("text-5xl font-light", metrics.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {metrics.net >= 0 ? '+' : ''}${metrics.net.toLocaleString()}
            </h2>
            
            <div className="flex gap-8 mt-8">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Owed to me</p>
                <p className="text-lg font-semibold text-emerald-400">${metrics.theyOwe.toLocaleString()}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">I owe</p>
                <p className="text-lg font-semibold text-rose-400">${metrics.iOwe.toLocaleString()}</p>
              </div>
            </div>
         </div>
      </GlassCard>

      <section className="flex flex-col gap-4">
        <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Active Entries</h3>
        {activeDebts.length === 0 ? (
          <div className="py-20 text-center text-white/20 italic text-sm">
            No active debts or receivables.
          </div>
        ) : (
          activeDebts.map(debt => {
            const totalPaid = debt.payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = debt.amount - totalPaid;
            const progress = (totalPaid / debt.amount) * 100;

            return (
              <GlassCard key={debt.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center",
                      debt.direction === 'they_owe' ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )}>
                      {debt.direction === 'they_owe' ? (
                        <ArrowDownLeft size={20} className="text-emerald-400" />
                      ) : (
                        <ArrowUpRight size={20} className="text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-medium">{debt.personName}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wide">
                        {debt.direction === 'they_owe' ? 'Owes me' : 'I owe'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-lg font-bold", debt.direction === 'they_owe' ? "text-emerald-400" : "text-rose-400")}>
                      ${remaining.toLocaleString()}
                    </p>
                    <button 
                      onClick={() => markAsPaid(debt.id)}
                      className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 justify-end ml-auto"
                    >
                      <CheckCircle2 size={12} /> Mark Paid
                    </button>
                  </div>
                </div>
                
                {debt.payments.length > 0 && (
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-white/40 transition-all duration-500" style={{ width: `${progress}%` }} />
                   </div>
                )}
              </GlassCard>
            );
          })
        )}
      </section>
    </div>
  );
};

const LandmarkLargeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7 12 2" />
  </svg>
);
