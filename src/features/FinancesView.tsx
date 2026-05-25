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
  const { state, setState, addExpense, addIncome, updateExpense, deleteExpense, deleteIncome } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'overview' | 'income' | 'expenses'>('overview');
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<'income' | 'expense'>('expense');
  
  const monthKey = format(currentMonth, 'yyyy-MM');
  const budget = state.budgets[monthKey] || { id: monthKey, income: [], expenses: [] };

  // Calculate Virtual Recurring Items from previous months
  const resolvedRecurring = useMemo(() => {
    const sortedKeys = Object.keys(state.budgets).sort();
    
    const recIncome: Income[] = [];
    const recExpenses: Expense[] = [];
    
    const existingSourceIds = new Set([
      ...budget.income.map(i => i.sourceId || i.id),
      ...budget.expenses.map(e => e.sourceId || e.id)
    ]);

    for (const key of sortedKeys) {
      if (key >= monthKey) break;
      const b = state.budgets[key];
      
      const monthsDiff = (parseInt(monthKey.split('-')[0]) * 12 + parseInt(monthKey.split('-')[1])) - 
                        (parseInt(key.split('-')[0]) * 12 + parseInt(key.split('-')[1]));

      b.income.forEach(i => {
        if (!i.recurrence) return;
        const isActive = i.recurrence.type === 'indefinite' || 
                        (i.recurrence.type === 'repeat_months' && (i.recurrence.monthsCount || 0) > monthsDiff);
        if (isActive && !existingSourceIds.has(i.id)) {
          recIncome.push({ ...i, id: `v-${i.id}`, sourceId: i.id });
          existingSourceIds.add(i.id);
        }
      });

      b.expenses.forEach(e => {
        if (!e.recurrence) return;
        const isActive = e.recurrence.type === 'indefinite' || 
                        (e.recurrence.type === 'repeat_months' && (e.recurrence.monthsCount || 0) > monthsDiff);
        if (isActive && !existingSourceIds.has(e.id)) {
          recExpenses.push({ ...e, id: `v-${e.id}`, sourceId: e.id, status: 'planned' });
          existingSourceIds.add(e.id);
        }
      });
    }
    return { income: recIncome, expenses: recExpenses };
  }, [state.budgets, monthKey, budget]);

  const allIncome = useMemo(() => [...budget.income, ...resolvedRecurring.income], [budget.income, resolvedRecurring.income]);
  const allExpenses = useMemo(() => [...budget.expenses, ...resolvedRecurring.expenses], [budget.expenses, resolvedRecurring.expenses]);

  const totalIncome = allIncome.reduce((sum, i) => sum + i.amount, 0);
  const plannedTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const paidSoFar = allExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const stillToPay = plannedTotal - paidSoFar;
  const remainingAfterBills = totalIncome - plannedTotal;

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    allExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [allExpenses]);

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#c084fc', '#22d3ee'];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const planThisMonth = () => {
    if (resolvedRecurring.income.length === 0 && resolvedRecurring.expenses.length === 0) {
      setAddingType('income');
      setIsAdding(true);
      return;
    }

    // Materialize all virtual items into the state
    resolvedRecurring.income.forEach(materializeIncome);
    resolvedRecurring.expenses.forEach(e => {
        const { id: _, ...expenseData } = e;
        addExpense(monthKey, { ...expenseData });
    });
  };

  const [newItem, setNewItem] = useState({ 
    name: '', 
    amount: 0, 
    category: 'Other', 
    recurrenceUnit: 'once' as const,
    monthsCount: 12,
    date: format(currentMonth, 'yyyy-MM-dd'),
    notes: ''
  });

  const handleAdd = () => {
    if (!newItem.name || !newItem.amount) return;
    
    const recurrence = newItem.recurrenceUnit === 'once' ? { type: 'once' as const } :
                     newItem.recurrenceUnit === 'indefinite' ? { type: 'indefinite' as const } :
                     { type: 'repeat_months' as const, monthsCount: newItem.monthsCount };

    if (addingType === 'expense') {
      addExpense(monthKey, {
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.category,
        date: newItem.date,
        status: 'planned',
        isFixed: false,
        recurrence,
        notes: newItem.notes
      });
    } else {
      addIncome(monthKey, {
        name: newItem.name,
        amount: newItem.amount,
        category: newItem.category,
        date: newItem.date,
        recurrence,
        notes: newItem.notes
      });
    }
    
    setNewItem({ 
      name: '', 
      amount: 0, 
      category: 'Other', 
      recurrenceUnit: 'once',
      monthsCount: 12,
      date: format(currentMonth, 'yyyy-MM-dd'),
      notes: ''
    });
    setIsAdding(false);
  };

  const toggleStatus = (id: string, currentStatus: 'planned' | 'paid') => {
    const isVirtual = id.startsWith('v-');
    if (isVirtual) {
       // Materialize it first
       const virtual = resolvedRecurring.expenses.find(e => e.id === id);
       if (!virtual) return;
       const newId = Math.random().toString(36).substr(2, 9);
       const { id: _, ...expenseData } = virtual;
       addExpense(monthKey, { ...expenseData, status: 'paid' });
    } else {
       updateExpense(monthKey, id, { status: currentStatus === 'planned' ? 'paid' : 'planned' });
    }
  };

  const materializeIncome = (virtual: Income) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const { id: _, ...incomeData } = virtual;
    addIncome(monthKey, { ...incomeData });
  };

  const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Side job', 'Gifts', 'Refunds', 'Other'];
  const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Bills', 'Transport', 'Entertainment', 'Health', 'Other'];

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

            <div className="flex gap-2">
              <select 
                className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none text-white appearance-none text-xs"
                value={newItem.recurrenceUnit}
                onChange={e => setNewItem({...newItem, recurrenceUnit: e.target.value as any})}
              >
                 <option value="once" className="bg-slate-900">One-time</option>
                 <option value="indefinite" className="bg-slate-900">Every month until stopped</option>
                 <option value="repeat_months" className="bg-slate-900">Repeat for X months</option>
              </select>

              {newItem.recurrenceUnit === 'repeat_months' && (
                <input 
                  type="number"
                  className="w-20 bg-white/5 border border-white/10 p-3 rounded-xl focus:outline-none text-white text-xs"
                  placeholder="Count"
                  value={newItem.monthsCount}
                  onChange={e => setNewItem({...newItem, monthsCount: Number(e.target.value)})}
                />
              )}
            </div>

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

      {view === 'overview' && (
        <div className="flex flex-col gap-6">
          {allIncome.length === 0 && allExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/10 rounded-3xl gap-4">
               <Wallet size={48} className="text-white/10" />
               <p className="text-white/40 text-sm font-medium text-center">Manage your finances for {format(currentMonth, 'MMMM')}.</p>
               <button 
                onClick={planThisMonth}
                className="px-6 py-3 bg-indigo-500 rounded-full font-bold uppercase tracking-widest text-xs"
               >Plan this month</button>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4">
                <GlassCard className="p-5 flex flex-col gap-2" intensity="high">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Remaining After Bills</p>
                  <h2 className={cn("text-3xl font-bold truncate", remainingAfterBills >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    ${remainingAfterBills.toLocaleString()}
                  </h2>
                </GlassCard>
              </section>

              <section className="grid grid-cols-2 gap-4">
                 <GlassCard className="p-4 flex flex-col gap-1 border-emerald-500/10">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-white/40 uppercase font-bold">Exp. Income</p>
                       <ArrowUpRight size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-xl font-semibold">${totalIncome.toLocaleString()}</p>
                 </GlassCard>
                 <GlassCard className="p-4 flex flex-col gap-1 border-rose-500/10">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-white/40 uppercase font-bold">Planned Exp.</p>
                       <ArrowDownRight size={14} className="text-rose-400" />
                    </div>
                    <p className="text-xl font-semibold">${plannedTotal.toLocaleString()}</p>
                 </GlassCard>
              </section>

              <section className="grid grid-cols-2 gap-4 opacity-80">
                 <GlassCard className="p-3 border-emerald-500/5 bg-emerald-500/5">
                    <p className="text-[9px] text-emerald-400/60 uppercase font-bold mb-1">Paid So Far</p>
                    <p className="text-lg font-medium text-emerald-400/90">${paidSoFar.toLocaleString()}</p>
                 </GlassCard>
                 <GlassCard className="p-3 border-rose-500/5 bg-rose-500/5">
                    <p className="text-[9px] text-rose-400/60 uppercase font-bold mb-1">Still To Pay</p>
                    <p className="text-lg font-medium text-rose-400/90">${stillToPay.toLocaleString()}</p>
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
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <TrendingDown size={32} className="text-white/10" />
                    <p className="text-white/20 text-xs italic">No expenses planned for this month yet.</p>
                  </div>
                )}
              </GlassCard>
              
              {allIncome.length === 0 && (
                <p className="text-center text-white/20 text-[10px] uppercase font-bold tracking-widest bg-white/5 py-4 rounded-2xl border border-dashed border-white/5">
                  No income planned for this month yet.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {view === 'income' && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40">Expected Income</h3>
            <span className="text-xs font-bold text-emerald-400">${totalIncome.toLocaleString()}</span>
          </div>
          {allIncome.length === 0 ? (
            <p className="text-center py-20 text-white/20 text-sm italic">No entries.</p>
          ) : (
            allIncome.map(i => (
              <GlassCard key={i.id} className={cn("p-4 flex items-center justify-between border-emerald-500/10", i.id.startsWith('v-') && "opacity-60")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                    <TrendingUp size={20} className="text-emerald-400/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{i.name}</p>
                    <p className="text-[10px] text-white/40 uppercase">{i.category} {i.recurrence?.type !== 'once' && '• Recurring'}</p>
                    <p className="text-[9px] text-emerald-400/60 font-medium">Expected: {format(new Date(i.date), 'MMM d, yyyy')}</p>
                    {i.notes && <p className="text-[10px] text-white/20 mt-1 italic">{i.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   {i.id.startsWith('v-') ? (
                     <button 
                      onClick={() => materializeIncome(i)}
                      className="px-2 py-1 bg-emerald-500 rounded text-[9px] font-bold uppercase"
                     >Add to plan</button>
                   ) : (
                     <button 
                      onClick={() => deleteIncome(monthKey, i.id)}
                      className="p-1 text-white/10 hover:text-rose-400 transition-colors"
                     ><Plus size={14} className="rotate-45" /></button>
                   )}
                   <p className="text-sm font-bold text-emerald-400">+${i.amount.toLocaleString()}</p>
                </div>
              </GlassCard>
            ))
          )}
        </section>
      )}

      {view === 'expenses' && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-white/40">Planned Expenses</h3>
            <span className="text-xs font-bold text-rose-400">-${plannedTotal.toLocaleString()}</span>
          </div>
          {allExpenses.length === 0 ? (
             <p className="text-center py-20 text-white/20 text-sm italic">No entries.</p>
          ) : (
            allExpenses.map(expense => (
              <GlassCard key={expense.id} className={cn("p-4 flex flex-col gap-3 border-rose-500/10 transition-all", expense.status === 'paid' && "opacity-40 grayscale-[0.5]", expense.id.startsWith('v-') && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleStatus(expense.id, expense.status)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                        expense.status === 'paid' ? "bg-emerald-500 border-emerald-400 text-white" : "border-white/10"
                      )}
                    >
                      {expense.status === 'paid' && <Plus size={20} className="rotate-45" />}
                    </button>
                    <div>
                      <p className={cn("text-sm font-medium", expense.status === 'paid' && "line-through")}>{expense.name}</p>
                      <p className="text-[10px] text-white/40 uppercase">{expense.category} {expense.status === 'paid' ? '• PAID' : '• PLANNED'}</p>
                      <p className="text-[9px] text-rose-400/60 font-medium">Due: {format(new Date(expense.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    {!expense.id.startsWith('v-') ? (
                      <button 
                        onClick={() => deleteExpense(monthKey, expense.id)}
                        className="p-1 text-white/10 hover:text-rose-400 transition-colors"
                      ><Plus size={14} className="rotate-45" /></button>
                    ) : (
                      <button 
                        onClick={() => {
                            const { id: _, ...expenseData } = expense;
                            addExpense(monthKey, { ...expenseData });
                        }}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold uppercase"
                      >Add to plan</button>
                    )}
                    <p className="text-sm font-bold text-rose-400">-${expense.amount.toLocaleString()}</p>
                  </div>
                </div>
                {expense.notes && <p className="text-[10px] text-white/20 italic px-1">{expense.notes}</p>}
              </GlassCard>
            ))
          )}
        </section>
      )}
    </div>
  );
};
