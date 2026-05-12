import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { GlassCard } from '../components/GlassCard';
import { Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Copy, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Expense, Income } from '../types';

export const FinancesView: React.FC = () => {
  const { state, setState, addExpense, addIncome } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'overview' | 'income' | 'expenses'>('overview');
  
  const monthKey = format(currentMonth, 'yyyy-MM');
  const budget = state.budgets[monthKey] || { id: monthKey, income: [], expenses: [] };

  const totalIncome = useMemo(() => budget.income.reduce((sum, i) => sum + i.amount, 0), [budget.income]);
  const totalExpenses = useMemo(() => budget.expenses.reduce((sum, e) => sum + e.amount, 0), [budget.expenses]);
  const balance = totalIncome - totalExpenses;

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    budget.expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [budget.expenses]);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#22d3ee'];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const copyPreviousBudget = () => {
    const prevKey = format(subMonths(currentMonth, 1), 'yyyy-MM');
    const prevBudget = state.budgets[prevKey];
    if (!prevBudget) return alert('No previous budget found');

    const newExpenses = prevBudget.expenses
      .filter(e => e.recurrence?.type === 'indefinite' || (e.recurrence?.monthsCount && e.recurrence.monthsCount > 0))
      .map(e => ({ ...e, id: Math.random().toString(36).substr(2, 9), date: format(currentMonth, 'yyyy-MM-01') }));
    
    const newIncome = prevBudget.income
      .filter(i => i.recurrence?.type === 'indefinite' || (i.recurrence?.monthsCount && i.recurrence.monthsCount > 0))
      .map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9), date: format(currentMonth, 'yyyy-MM-01') }));

    setState(prev => ({
      ...prev,
      budgets: {
        ...prev.budgets,
        [monthKey]: {
          ...budget,
          income: [...budget.income, ...newIncome],
          expenses: [...budget.expenses, ...newExpenses]
        }
      }
    }));
  };

  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<'income' | 'expense'>('expense');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    amount: 0, 
    category: 'Other', 
    recurrence: 'once' as const,
    date: format(currentMonth, 'yyyy-MM-dd'),
    notes: ''
  });

  const handleAdd = () => {
    if (!newItem.name || !newItem.amount) return;
    
    if (addingType === 'expense') {
      addExpense(monthKey, {
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.category,
        date: newItem.date,
        isFixed: false,
        recurrence: { type: newItem.recurrence as any },
        notes: newItem.notes
      });
    } else {
      addIncome(monthKey, {
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.category,
        date: newItem.date,
        recurrence: { type: newItem.recurrence as any },
        notes: newItem.notes
      });
    }
    
    setNewItem({ 
      name: '', 
      amount: 0, 
      category: 'Other', 
      recurrence: 'once',
      date: format(currentMonth, 'yyyy-MM-dd'),
      notes: ''
    });
    setIsAdding(false);
  };

  const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Side job', 'Gifts', 'Refunds', 'Other'];
  const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Bills', 'Transport', 'Entertainment', 'Health', 'Other'];

  const upcomingRisk = totalExpenses > totalIncome * 0.9 && balance > 0;
  const deficit = totalExpenses > totalIncome;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full text-white/40"><ChevronLeft size={20}/></button>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight uppercase">{format(currentMonth, 'MMMM')}</h1>
            <p className="text-white/50 text-[10px] tracking-widest uppercase">{format(currentMonth, 'yyyy')}</p>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full text-white/40"><ChevronRight size={20}/></button>
        </div>
        <div className="flex gap-2">
          <button onClick={copyPreviousBudget} title="Use previous as template" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
            <Copy size={18} className="text-white/60"/>
          </button>
          <button onClick={() => { setAddingType('expense'); setIsAdding(true); }} className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
        {(['overview', 'income', 'expenses'] as const).map(t => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
              view === t ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <GlassCard className="p-6 flex flex-col gap-4 border-indigo-500/30">
            <div className="flex items-center gap-2 mb-2">
               <button 
                onClick={() => setAddingType('expense')}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all", addingType === 'expense' ? "bg-rose-500 border-rose-400 text-white" : "border-white/10 text-white/40")}
               >Expense</button>
               <button 
                onClick={() => setAddingType('income')}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all", addingType === 'income' ? "bg-emerald-500 border-emerald-400 text-white" : "border-white/10 text-white/40")}
               >Income</button>
            </div>
            
            <input 
              className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500/50" 
              placeholder={`${addingType} Name`} 
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            <input 
              type="number"
              className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500/50" 
              placeholder="Amount" 
              value={newItem.amount || ''}
              onChange={e => setNewItem({...newItem, amount: Number(e.target.value)})}
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="date"
                className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none text-white text-xs" 
                value={newItem.date}
                onChange={e => setNewItem({...newItem, date: e.target.value})}
              />
              <select 
                className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none text-white appearance-none text-xs"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
              >
                {(addingType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>

            <textarea 
              className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-indigo-500/50 text-xs resize-none" 
              placeholder="Notes (optional)" 
              rows={2}
              value={newItem.notes}
              onChange={e => setNewItem({...newItem, notes: e.target.value})}
            />

            <select 
              className="bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none text-white appearance-none text-xs"
              value={newItem.recurrence}
              onChange={e => setNewItem({...newItem, recurrence: e.target.value as any})}
            >
               <option value="once" className="bg-slate-900">One-time</option>
               <option value="indefinite" className="bg-slate-900">Indefinitely recurring</option>
            </select>

            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 p-3 rounded-xl font-bold uppercase tracking-widest bg-white/5 text-white/40">Cancel</button>
              <button 
                onClick={handleAdd}
                className={cn("flex-2 p-3 rounded-xl font-bold uppercase tracking-widest active:scale-95 transition-transform", addingType === 'expense' ? "bg-rose-500" : "bg-emerald-500")}
              >
                Save {addingType}
              </button>
            </div>
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Alerts */}
      {deficit && (
        <GlassCard className="p-4 border-rose-500/50 bg-rose-500/10 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-rose-500" />
          <p className="text-xs font-medium text-rose-200">Deficit Alert: Expenses exceed total income for this month.</p>
        </GlassCard>
      )}
      {upcomingRisk && !deficit && (
        <GlassCard className="p-4 border-amber-500/50 bg-amber-500/10 flex items-center gap-3">
          <AlertTriangle className="text-amber-500" />
          <p className="text-xs font-medium text-amber-200">Low Balance Warning: Spending is close to 90% of total income.</p>
        </GlassCard>
      )}

      {view === 'overview' && (
        <>
          <section className="grid grid-cols-2 gap-4">
            <GlassCard className="p-4" intensity="high">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Balance</p>
              <h2 className={cn("text-2xl font-bold truncate", balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                ${balance.toLocaleString()}
              </h2>
            </GlassCard>
            <GlassCard className="p-4" intensity="high">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Total Savings</p>
              <h2 className="text-2xl font-bold text-indigo-400 truncate">
                ${(totalIncome * 0.2).toLocaleString()}*
              </h2>
            </GlassCard>
          </section>

          <section className="grid grid-cols-2 gap-4">
             <GlassCard className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] text-white/40 uppercase font-bold">Income</p>
                   <ArrowUpRight size={14} className="text-emerald-400" />
                </div>
                <p className="text-xl font-semibold">${totalIncome.toLocaleString()}</p>
             </GlassCard>
             <GlassCard className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] text-white/40 uppercase font-bold">Expense</p>
                   <ArrowDownRight size={14} className="text-rose-400" />
                </div>
                <p className="text-xl font-semibold">${totalExpenses.toLocaleString()}</p>
             </GlassCard>
          </section>

          <GlassCard className="p-6 h-[260px]">
            {chartData.length > 0 ? (
              <div className="flex h-full items-center">
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 min-w-[120px]">
                  {chartData.slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] text-white/60 truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white/20 text-sm italic">
                No expense data for this month.
              </div>
            )}
          </GlassCard>
        </>
      )}

      {view === 'income' && (
        <section className="flex flex-col gap-4">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Sources</h3>
          {budget.income.length === 0 ? (
            <p className="text-center py-10 text-white/20 text-sm italic">No income sources listed.</p>
          ) : (
            budget.income.map(i => (
              <GlassCard key={i.id} className="p-4 flex items-center justify-between border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                    <TrendingUp size={20} className="text-emerald-400/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{i.category} • {i.recurrence?.type}</p>
                    {i.notes && <p className="text-[10px] text-indigo-300/60 mt-1 italic line-clamp-1">{i.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">+${i.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-white/40">{format(new Date(i.date), 'MMM d')}</p>
                </div>
              </GlassCard>
            ))
          )}
        </section>
      )}

      {view === 'expenses' && (
        <section className="flex flex-col gap-4">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40 px-1">Recent Expenses</h3>
          {budget.expenses.length === 0 ? (
             <p className="text-center py-10 text-white/20 text-sm italic">No expenses logged.</p>
          ) : (
            budget.expenses.map(expense => (
              <GlassCard key={expense.id} className="p-4 flex items-center justify-between border-rose-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/5 flex items-center justify-center border border-rose-500/10">
                    <TrendingDown size={20} className="text-rose-400/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{expense.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{expense.category} • {expense.recurrence?.type}</p>
                    {expense.notes && <p className="text-[10px] text-indigo-300/60 mt-1 italic line-clamp-1">{expense.notes}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-rose-400">-${expense.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-white/40">{format(new Date(expense.date), 'MMM d')}</p>
                </div>
              </GlassCard>
            ))
          )}
        </section>
      )}
    </div>
  );
};
