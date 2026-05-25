import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { GlassCard } from '../components/GlassCard';
import { Plus, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Expense, Income } from '../types';

export const FinancesView: React.FC = () => {
  const { state, addExpense, addIncome, updateExpense, deleteExpense, deleteIncome } = useAppState();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'overview' | 'income' | 'expenses'>('overview');
  const [isAdding, setIsAdding] = useState(false);
  const [addingType, setAddingType] = useState<'income' | 'expense'>('expense');
  const [currentPlanStep, setCurrentPlanStep] = useState<'idle' | 'income' | 'expenses'>('idle');
  
  const monthKey = format(currentMonth, 'yyyy-MM');
  const budget = state.budgets[monthKey] || { id: monthKey, income: [], expenses: [] };

  // Safe Fallback references for backward compatibility with empty or partial budgets
  const budgetIncome = budget.income || [];
  const budgetExpenses = budget.expenses || [];

  // Calculate Virtual Recurring Items from previous months
  const resolvedRecurring = useMemo(() => {
    const sortedKeys = Object.keys(state.budgets || {}).sort();
    
    const recIncome: Income[] = [];
    const recExpenses: Expense[] = [];
    
    const existingSourceIds = new Set([
      ...budgetIncome.map(i => i.sourceId || i.id),
      ...budgetExpenses.map(e => e.sourceId || e.id)
    ]);

    for (const key of sortedKeys) {
      if (key >= monthKey) break;
      const b = state.budgets[key];
      if (!b) continue;
      
      const prevIncome = b.income || [];
      const prevExpenses = b.expenses || [];
      
      const monthsDiff = (parseInt(monthKey.split('-')[0]) * 12 + parseInt(monthKey.split('-')[1])) - 
                        (parseInt(key.split('-')[0]) * 12 + parseInt(key.split('-')[1]));

      prevIncome.forEach(i => {
        if (!i.recurrence) return;
        const isActive = i.recurrence.type === 'indefinite' || 
                        (i.recurrence.type === 'repeat_months' && (i.recurrence.monthsCount || 0) > monthsDiff);
        if (isActive && !existingSourceIds.has(i.id)) {
          recIncome.push({ ...i, id: `v-${i.id}`, sourceId: i.id });
          existingSourceIds.add(i.id);
        }
      });

      prevExpenses.forEach(e => {
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
  }, [state.budgets, monthKey, budgetIncome, budgetExpenses]);

  const allIncome = useMemo(() => [...budgetIncome, ...resolvedRecurring.income], [budgetIncome, resolvedRecurring.income]);
  const allExpenses = useMemo(() => [...budgetExpenses, ...resolvedRecurring.expenses], [budgetExpenses, resolvedRecurring.expenses]);

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

  // Premium emerald & teal spectrum for Finances
  const COLORS = ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7', '#065f46'];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const planThisMonth = () => {
    // Initiate step-based guided helper
    setView('income');
    setAddingType('income');
    setIsAdding(true);
    setCurrentPlanStep('income');
  };

  const materializeIncome = (virtual: Income) => {
    const { id: _, ...incomeData } = virtual;
    addIncome(monthKey, { ...incomeData });
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
                     { type: 'repeat_months' as const, monthsCount: Math.min(newItem.monthsCount, 24) };

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
       const virtual = resolvedRecurring.expenses.find(e => e.id === id);
       if (!virtual) return;
       const { id: _, ...expenseData } = virtual;
       addExpense(monthKey, { ...expenseData, status: 'paid' });
    } else {
       updateExpense(monthKey, id, { status: currentStatus === 'planned' ? 'paid' : 'planned' });
    }
  };

  const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Side job', 'Gifts', 'Refunds', 'Other'];
  const EXPENSE_CATEGORIES = ['Food', 'Rent', 'Bills', 'Transport', 'Entertainment', 'Health', 'Other'];

  return (
    <div className="flex flex-col gap-6 text-emerald-50">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-emerald-500/10 rounded-full text-white/40 hover:text-emerald-400 transition-colors">
            <ChevronLeft size={20}/>
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight uppercase text-white">{format(currentMonth, 'MMMM')}</h1>
            <p className="text-emerald-400/60 text-[10px] tracking-widest uppercase">{format(currentMonth, 'yyyy')} PLANNER</p>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-emerald-500/10 rounded-full text-white/40 hover:text-emerald-400 transition-colors">
            <ChevronRight size={20}/>
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setAddingType('expense'); setIsAdding(true); }} 
            className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-400"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-[#052e16]/30 backdrop-blur-md rounded-2xl border border-emerald-500/10">
        {(['overview', 'income', 'expenses'] as const).map(t => (
          <button
            key={t}
            onClick={() => setView(t)}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
              view === t 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "text-emerald-300/40 hover:text-emerald-300/70 hover:bg-emerald-500/5"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Planning Steps Banner */}
      {currentPlanStep !== 'idle' && (
        <motion.div 
          className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/80 border border-emerald-500/30 flex items-start gap-3 shadow-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles className="text-emerald-400 mt-0.5 shrink-0 animate-pulse" size={18} />
          <div className="text-xs">
            {currentPlanStep === 'income' ? (
              <>
                <p className="font-bold uppercase text-emerald-300 tracking-wider">Plan Step 1: Expected Income</p>
                <p className="text-emerald-200/80 mt-1">Please enter your expected earnings, paycheck, or other inflows. This acts as your monthly financial base.</p>
              </>
            ) : (
              <>
                <p className="font-bold uppercase text-emerald-300 tracking-wider">Plan Step 2: Planned Expenses</p>
                <p className="text-emerald-200/80 mt-1">Great job! Now add your expected bills, rent, food, and other planned payments to complete the budget plan.</p>
              </>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isAdding && (
          <GlassCard className="p-6 flex flex-col gap-4 border-emerald-500/30 shadow-[0_4px_30px_rgba(16,185,129,0.05)]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs uppercase font-bold tracking-widest text-emerald-300">
                New entry: {addingType}
              </h3>
              <div className="flex items-center gap-1">
                 <button 
                  onClick={() => setAddingType('expense')}
                  className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all", addingType === 'expense' ? "bg-rose-500 border-rose-400 text-white" : "border-emerald-500/10 text-emerald-300/40")}
                 >Expense</button>
                 <button 
                  onClick={() => setAddingType('income')}
                  className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all", addingType === 'income' ? "bg-emerald-500 border-emerald-400 text-white" : "border-emerald-500/10 text-emerald-300/40")}
                 >Income</button>
              </div>
            </div>
            
            <input 
              className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-emerald-500/30 text-sm" 
              placeholder={`${addingType === 'income' ? 'Paycheck, Freelance project...' : 'Rent, Grocery shopping...'}`} 
              value={newItem.name}
              onChange={e => setNewItem({...newItem, name: e.target.value})}
            />
            
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">$</span>
              <input 
                type="number"
                className="w-full bg-emerald-950/30 border border-emerald-500/20 p-3 pl-8 rounded-xl focus:outline-none focus:border-emerald-500 text-white placeholder-emerald-500/30 text-sm" 
                placeholder="0.00" 
                value={newItem.amount || ''}
                onChange={e => setNewItem({...newItem, amount: Number(e.target.value)})}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input 
                type="date"
                className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl focus:outline-none text-white text-xs" 
                value={newItem.date}
                onChange={e => setNewItem({...newItem, date: e.target.value})}
              />
              <select 
                className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl focus:outline-none text-emerald-100 appearance-none text-xs"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value})}
              >
                {(addingType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>

            <textarea 
              className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl focus:outline-none focus:border-emerald-500 text-xs text-white placeholder-emerald-500/30 resize-none" 
              placeholder="Private notes (optional)" 
              rows={2}
              value={newItem.notes}
              onChange={e => setNewItem({...newItem, notes: e.target.value})}
            />

            <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
              <label className="text-[9px] uppercase font-bold tracking-wider text-emerald-400">Recurrence Option</label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl focus:outline-none text-white appearance-none text-xs"
                  value={newItem.recurrenceUnit}
                  onChange={e => setNewItem({...newItem, recurrenceUnit: e.target.value as any})}
                >
                   <option value="once" className="bg-slate-900 text-emerald-100">Only count this month</option>
                   <option value="indefinite" className="bg-slate-900 text-emerald-100">Every month indefinitely</option>
                   <option value="repeat_months" className="bg-slate-900 text-emerald-100">Repeat month-over-month</option>
                </select>

                {newItem.recurrenceUnit === 'repeat_months' && (
                  <div className="flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-2">
                    <input 
                      type="number"
                      min={1}
                      max={24}
                      className="w-12 bg-transparent focus:outline-none text-white text-xs text-center"
                      placeholder="Months"
                      value={newItem.monthsCount}
                      onChange={e => setNewItem({...newItem, monthsCount: Math.min(Number(e.target.value), 24)})}
                    />
                    <span className="text-[9px] text-emerald-400 font-bold uppercase mr-1">mo.</span>
                  </div>
                )}
              </div>
              {newItem.recurrenceUnit === 'repeat_months' && (
                <p className="text-[9px] text-emerald-400/60 font-light mt-0.5">Maximum repeat period is 24 months.</p>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 p-3 rounded-xl font-bold uppercase tracking-widest bg-emerald-950/20 text-emerald-300/40 border border-emerald-500/10 text-xs hover:bg-emerald-500/5 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className={cn(
                  "flex-2 p-3 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-transform text-white shadow-md", 
                  addingType === 'expense' ? "bg-rose-500 hover:bg-rose-400 shadow-rose-500/10" : "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/10"
                )}
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
            <div className="flex flex-col items-center justify-center p-10 border border-dashed border-emerald-500/20 rounded-3xl gap-4 bg-emerald-950/10 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(16,185,129,0.02)]">
               <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                 <Wallet size={32} className="text-emerald-400" />
               </div>
               <div className="text-center max-w-xs">
                 <p className="text-white font-medium text-sm">Monthly Planner Blank</p>
                 <p className="text-emerald-400/50 text-[11px] mt-1 leading-normal">
                   No expected incomes or expenses planned yet. Setup this month's plan.
                 </p>
               </div>
               <button 
                onClick={planThisMonth}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2"
               >
                 Plan this month
               </button>
            </div>
          ) : (
            <>
              {/* Simplified overview cards requested by user */}
              <section className="flex flex-col gap-3">
                {/* Remaining After Bills Card */}
                <GlassCard className="p-5 flex flex-col gap-2 border-emerald-500/15" intensity="high">
                  <p className="text-[10px] text-emerald-400/60 uppercase font-bold tracking-wider">Remaining After Bills</p>
                  <h2 className={cn("text-3xl font-extrabold tracking-tight transition-all", remainingAfterBills >= 0 ? "text-emerald-300" : "text-rose-400")}>
                    ${remainingAfterBills.toLocaleString()}
                  </h2>
                  <p className="text-[9px] text-emerald-300/35 uppercase font-medium mt-0.5">Calculated: Expected Income - Planned Expenses</p>
                </GlassCard>

                {/* Expected Income & Planned Expenses Split */}
                <div className="grid grid-cols-2 gap-3">
                  <GlassCard className="p-4 flex flex-col gap-1 border-emerald-500/10 bg-emerald-950/5">
                     <div className="flex items-center justify-between">
                        <p className="text-[9px] text-emerald-400/50 uppercase font-bold tracking-wider">Expected Income</p>
                        <ArrowUpRight size={14} className="text-emerald-400" />
                     </div>
                     <p className="text-lg font-bold text-emerald-300">${totalIncome.toLocaleString()}</p>
                  </GlassCard>
                  <GlassCard className="p-4 flex flex-col gap-1 border-rose-500/10 bg-rose-950/5">
                     <div className="flex items-center justify-between">
                        <p className="text-[9px] text-rose-400/50 uppercase font-bold tracking-wider">Planned Expenses</p>
                        <ArrowDownRight size={14} className="text-rose-400" />
                     </div>
                     <p className="text-lg font-bold text-rose-300">${plannedTotal.toLocaleString()}</p>
                  </GlassCard>
                </div>

                {/* Paid So Far & Still To Pay status */}
                <div className="grid grid-cols-2 gap-3 opacity-95">
                  <GlassCard className="p-4 border-emerald-500/10 bg-emerald-500/[0.04] flex flex-col gap-1">
                     <p className="text-[9px] text-emerald-400/60 uppercase font-bold tracking-wider">Paid So Far</p>
                     <p className="text-base font-bold text-emerald-400">${paidSoFar.toLocaleString()}</p>
                  </GlassCard>
                  <GlassCard className="p-4 border-rose-500/10 bg-rose-500/[0.04] flex flex-col gap-1">
                     <p className="text-[9px] text-rose-400/60 uppercase font-bold tracking-wider">Still To Pay</p>
                     <p className="text-base font-bold text-rose-400">${stillToPay.toLocaleString()}</p>
                  </GlassCard>
                </div>
              </section>

              {/* Expense Distribution Visual */}
              <GlassCard className="p-6 border-emerald-500/10 bg-[#022c22]/10">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Expense Distribution</h3>
                  {allExpenses.length > 0 && (
                    <span className="text-[9px] font-bold uppercase text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {chartData.length} categories
                    </span>
                  )}
                </div>
                {allExpenses.length > 0 ? (
                  <div className="flex h-[150px] items-center">
                    <div className="flex-grow w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: 'rgba(2,44,34,0.95)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`$${value}`, undefined]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1.5 w-1/2 justify-center pl-2 border-l border-white/5">
                      {chartData.slice(0, 4).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5 justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-[10px] text-emerald-300/70 truncate">{entry.name}</span>
                          </div>
                          <span className="text-[9.5px] font-semibold text-white/50">${entry.value.toLocaleString()}</span>
                        </div>
                      ))}
                      {chartData.length > 4 && (
                        <p className="text-[8px] text-emerald-400/40 italic ml-3">+ {chartData.length - 4} more categories</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] flex flex-col items-center justify-center gap-2">
                    <TrendingDown size={28} className="text-emerald-400/20" />
                    <p className="text-emerald-400/40 text-xs italic">No expenses planned for this month yet.</p>
                  </div>
                )}
              </GlassCard>
              
              {/* Optional Guidance Help Tip */}
              <div className="p-4 rounded-xl border border-dashed border-emerald-500/10 bg-emerald-500/[0.02]">
                <div className="flex items-start gap-2.5">
                  <HelpCircle className="text-emerald-400/50 shrink-0 mt-0.5" size={15} />
                  <div className="text-[10px] text-emerald-300/40 leading-normal">
                    <p className="font-semibold text-emerald-300/60 uppercase tracking-wider">Need to update recurring items?</p>
                    <p className="mt-0.5">Items with a recurrence policy automatically cascade to next month lists as proposed items. Click on the proposed items in Income/Expenses tabs to lock them into current plan.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {view === 'income' && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400/60">Expected Income</h3>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">${totalIncome.toLocaleString()}</span>
          </div>

          {currentPlanStep === 'income' && budgetIncome.length > 0 && (
            <motion.div 
              className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-2 text-[10px] text-emerald-300">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>Base income is locked! Ready to configure bills?</span>
              </div>
              <button 
                onClick={() => {
                  setView('expenses');
                  setAddingType('expense');
                  setIsAdding(true);
                  setCurrentPlanStep('expenses');
                }}
                className="px-2.5 py-1 bg-emerald-500 text-white font-bold uppercase text-[8px] rounded-lg shadow-sm"
              >
                Go to expenses
              </button>
            </motion.div>
          )}

          {allIncome.length === 0 ? (
            <div className="py-12 bg-emerald-950/5 border border-dashed border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center gap-2">
              <TrendingUp size={24} className="text-emerald-400/20" />
              <p className="text-center text-emerald-400/40 text-[11px] font-medium uppercase tracking-wider">No income planned for this month yet.</p>
              <button 
                onClick={() => { setAddingType('income'); setIsAdding(true); }}
                className="mt-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-emerald-300 transition-all"
              >
                + Plan Expected Income
              </button>
            </div>
          ) : (
            allIncome.map(i => (
              <GlassCard key={i.id} className={cn("p-4 flex items-center justify-between border-emerald-500/10", i.id.startsWith('v-') && "opacity-60")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                    <TrendingUp size={20} className="text-emerald-400/80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{i.name}</h4>
                    <p className="text-[10px] text-emerald-400/60 uppercase">{i.category || 'Other'} {i.recurrence?.type !== 'once' && '• Recurring'}</p>
                    <p className="text-[9px] text-emerald-400/40 mt-0.5 font-medium">Expected: {format(new Date(i.date), 'MMM d, yyyy')}</p>
                    {i.notes && <p className="text-[10px] text-emerald-300/30 mt-1 italic leading-normal font-light">💡 {i.notes}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                   {i.id.startsWith('v-') ? (
                     <button 
                      onClick={() => materializeIncome(i)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded text-[8px] font-bold uppercase tracking-wider"
                     >Add to plan</button>
                   ) : (
                     <button 
                      onClick={() => deleteIncome(monthKey, i.id)}
                      className="p-1 text-emerald-500/20 hover:text-rose-400 transition-colors rounded-full"
                     ><Plus size={14} className="rotate-45" /></button>
                   )}
                   <p className="text-sm font-extrabold text-emerald-400">+${i.amount.toLocaleString()}</p>
                </div>
              </GlassCard>
            ))
          )}
        </section>
      )}

      {view === 'expenses' && (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400/60">Planned Expenses</h3>
            <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg">-${plannedTotal.toLocaleString()}</span>
          </div>

          {currentPlanStep === 'expenses' && budgetExpenses.length > 0 && (
            <motion.div 
              className="p-3 bg-teal-500/10 border border-teal-500/25 rounded-xl flex items-center justify-between"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-2 text-[10px] text-teal-300">
                <CheckCircle size={14} className="text-teal-400" />
                <span>Plan is ready to review on Overview screen!</span>
              </div>
              <button 
                onClick={() => {
                  setCurrentPlanStep('idle');
                  setView('overview');
                  setIsAdding(false);
                }}
                className="px-2.5 py-1 bg-teal-500 text-white font-bold uppercase text-[8px] rounded-lg shadow-sm"
              >
                Finish Plan
              </button>
            </motion.div>
          )}

          {allExpenses.length === 0 ? (
            <div className="py-12 bg-emerald-950/5 border border-dashed border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center gap-2">
              <TrendingDown size={24} className="text-rose-400/20" />
              <p className="text-center text-emerald-400/40 text-[11px] font-medium uppercase tracking-wider">No expenses planned for this month yet.</p>
              <button 
                onClick={() => { setAddingType('expense'); setIsAdding(true); }}
                className="mt-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-emerald-300 transition-all"
              >
                + Plan Expected Expense
              </button>
            </div>
          ) : (
            allExpenses.map(expense => (
              <GlassCard key={expense.id} className={cn("p-4 flex flex-col gap-3 border-emerald-500/10 transition-all", expense.status === 'paid' && "opacity-45 grayscale-[0.3]", expense.id.startsWith('v-') && "opacity-60")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleStatus(expense.id, expense.status)}
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center transition-all shrink-0",
                        expense.status === 'paid' ? "bg-emerald-500 border-emerald-400 text-white" : "border-emerald-500/20 bg-emerald-950/20"
                      )}
                    >
                      {expense.status === 'paid' && <Plus size={16} className="rotate-45" />}
                    </button>
                    <div>
                      <h4 className={cn("text-sm font-semibold text-white", expense.status === 'paid' && "line-through text-white/50")}>{expense.name}</h4>
                      <p className="text-[10px] text-emerald-400/60 uppercase">{expense.category || 'Other'} {expense.status === 'paid' ? '• PAID' : '• PLANNED'}</p>
                      <p className="text-[9px] text-rose-400/50 mt-0.5 font-medium">Due: {format(new Date(expense.date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    {!expense.id.startsWith('v-') ? (
                      <button 
                        onClick={() => deleteExpense(monthKey, expense.id)}
                        className="p-1 text-emerald-500/20 hover:text-rose-400 transition-colors rounded-full"
                      ><Plus size={14} className="rotate-45" /></button>
                    ) : (
                      <button 
                        onClick={() => {
                            const { id: _, ...expenseData } = expense;
                            addExpense(monthKey, { ...expenseData });
                        }}
                        className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-500/20 text-white rounded text-[8px] font-bold uppercase tracking-wider hover:bg-emerald-500/10"
                      >Add to plan</button>
                    )}
                    <p className="text-sm font-extrabold text-rose-400">-${expense.amount.toLocaleString()}</p>
                  </div>
                </div>
                {expense.notes && <p className="text-[10px] text-emerald-300/35 leading-relaxed italic px-1">💡 {expense.notes}</p>}
              </GlassCard>
            ))
          )}
        </section>
      )}
    </div>
  );
};
