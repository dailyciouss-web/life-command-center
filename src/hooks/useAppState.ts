import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, MonthlyBudget, Debt, Expense, Income } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const STORAGE_KEY = 'life_command_center_data';
const SNAPSHOTS_KEY = 'life_command_center_snapshots';

const INITIAL_TASKS: Record<string, Task> = {
  't1': {
    id: 't1',
    parentId: null,
    name: 'Home Management',
    isCompleted: false,
    color: '#3b82f6',
    childrenIds: ['t2', 't3'],
  },
  't2': {
    id: 't2',
    parentId: 't1',
    name: 'Kitchen',
    isCompleted: false,
    color: '#10b981',
    childrenIds: ['t4'],
  },
  't3': {
    id: 't3',
    parentId: 't1',
    name: 'Living Room',
    isCompleted: false,
    color: '#f59e0b',
    childrenIds: [],
  },
  't4': {
    id: 't4',
    parentId: 't2',
    name: 'Clean oven',
    isCompleted: false,
    color: '#10b981',
    childrenIds: [],
    dueDate: format(new Date(), 'yyyy-MM-dd'),
  }
};

const INITIAL_STATE: AppState = {
  tasks: INITIAL_TASKS,
  rootTaskIds: ['t1'],
  budgets: {},
  debts: [
    {
      id: 'd1',
      personName: 'Alex Smith',
      amount: 50,
      direction: 'they_owe',
      status: 'active',
      payments: [],
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      notes: 'Lunch last Friday'
    }
  ],
  settings: {
    autoBackupEnabled: true,
    lastBackup: new Date().toISOString()
  }
};

export function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return INITIAL_STATE;
  });

  const [snapshots, setSnapshots] = useState<any[]>(() => {
    const saved = localStorage.getItem(SNAPSHOTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const addTask = useCallback((task: Partial<Task> & { parentId: string | null }) => {
    const id = uuidv4();
    const newTask: Task = {
      id,
      parentId: task.parentId,
      name: task.name || 'New Task',
      isCompleted: false,
      color: task.color || '#3b82f6',
      childrenIds: [],
      ...task
    };

    setState(prev => {
      const nextTasks = { ...prev.tasks, [id]: newTask };
      let nextRootIds = [...prev.rootTaskIds];

      if (task.parentId && prev.tasks[task.parentId]) {
        nextTasks[task.parentId] = {
          ...prev.tasks[task.parentId],
          childrenIds: [...prev.tasks[task.parentId].childrenIds, id]
        };
      } else {
        nextRootIds = [...nextRootIds, id];
      }

      return { ...prev, tasks: nextTasks, rootTaskIds: nextRootIds };
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState(prev => {
      if (!prev.tasks[id]) return prev;
      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [id]: { ...prev.tasks[id], ...updates }
        }
      };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => {
      const task = prev.tasks[id];
      if (!task) return prev;

      const nextTasks = { ...prev.tasks };
      delete nextTasks[id];

      // Remove from parent
      if (task.parentId && nextTasks[task.parentId]) {
        nextTasks[task.parentId] = {
          ...nextTasks[task.parentId],
          childrenIds: nextTasks[task.parentId].childrenIds.filter(cid => cid !== id)
        };
      }

      const nextRootIds = prev.rootTaskIds.filter(rid => rid !== id);

      return { ...prev, tasks: nextTasks, rootTaskIds: nextRootIds };
    });
  }, []);

  const addExpense = useCallback((monthKey: string, expense: Omit<Expense, 'id'>) => {
    const id = uuidv4();
    setState(prev => {
      const budget = prev.budgets[monthKey] || { id: monthKey, income: [], expenses: [] };
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            expenses: [...budget.expenses, { ...expense, id }]
          }
        }
      };
    });
  }, []);

  const updateExpense = useCallback((monthKey: string, id: string, updates: Partial<Expense>) => {
    setState(prev => {
      const budget = prev.budgets[monthKey];
      if (!budget) return prev;
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            expenses: budget.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
          }
        }
      };
    });
  }, []);

  const deleteExpense = useCallback((monthKey: string, id: string) => {
    setState(prev => {
      const budget = prev.budgets[monthKey];
      if (!budget) return prev;
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            expenses: budget.expenses.filter(e => e.id !== id)
          }
        }
      };
    });
  }, []);

  const addIncome = useCallback((monthKey: string, income: Omit<Income, 'id'>) => {
    const id = uuidv4();
    setState(prev => {
      const budget = prev.budgets[monthKey] || { id: monthKey, income: [], expenses: [] };
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            income: [...budget.income, { ...income, id }]
          }
        }
      };
    });
  }, []);

  const updateIncome = useCallback((monthKey: string, id: string, updates: Partial<Income>) => {
    setState(prev => {
      const budget = prev.budgets[monthKey];
      if (!budget) return prev;
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            income: budget.income.map(i => i.id === id ? { ...i, ...updates } : i)
          }
        }
      };
    });
  }, []);

  const deleteIncome = useCallback((monthKey: string, id: string) => {
    setState(prev => {
      const budget = prev.budgets[monthKey];
      if (!budget) return prev;
      return {
        ...prev,
        budgets: {
          ...prev.budgets,
          [monthKey]: {
            ...budget,
            income: budget.income.filter(i => i.id !== id)
          }
        }
      };
    });
  }, []);

  const addDebt = useCallback((debt: Omit<Debt, 'id' | 'createdAt' | 'payments' | 'status'>) => {
    const id = uuidv4();
    setState(prev => ({
      ...prev,
      debts: [
        ...prev.debts,
        {
          ...debt,
          id,
          createdAt: format(new Date(), 'yyyy-MM-dd'),
          payments: [],
          status: 'active'
        }
      ]
    }));
  }, []);

  const createSnapshot = useCallback((name?: string) => {
    const newSnapshot = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      name: name || `Auto Backup ${format(new Date(), 'MMM d, HH:mm')}`,
      data: state
    };
    setSnapshots(prev => {
      const next = [newSnapshot, ...prev].slice(0, 10);
      return next;
    });
    
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        lastBackup: new Date().toISOString()
      }
    }));
  }, [state]);

  // Auto snapshot logic
  useEffect(() => {
    if (!state.settings?.autoBackupEnabled) return;

    const lastBackup = state.settings?.lastBackup ? new Date(state.settings.lastBackup).getTime() : 0;
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastBackup > oneDay) {
      createSnapshot();
    }
  }, [state.settings?.autoBackupEnabled, state.settings?.lastBackup, createSnapshot]);

  const restoreSnapshot = useCallback((snapshotData: AppState) => {
    if (window.confirm("Restore this snapshot? This will overwrite your current data.")) {
      setState(snapshotData);
    }
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);

  const importData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (window.confirm("Import this backup? This will overwrite your current data.")) {
        setState(parsed);
      }
    } catch (e) {
      alert('Invalid backup file');
    }
  }, []);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life-command-center-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  }, [state]);

  return {
    state,
    snapshots,
    addTask,
    updateTask,
    deleteTask,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    addDebt,
    importData,
    exportData,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    setState
  };
}
