import { useState, useEffect, useCallback } from 'react';
import { AppState, Task, MonthlyBudget, Debt, Expense, Income } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const STORAGE_KEY = 'life_command_center_data';

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
  budgets: {
    [format(new Date(), 'yyyy-MM')]: {
      id: format(new Date(), 'yyyy-MM'),
      income: [{ id: 'i1', name: 'Salary', amount: 5000, date: format(new Date(), 'yyyy-MM-01'), category: 'Salary', recurrence: { type: 'indefinite' } }],
      expenses: [
        { id: 'e1', name: 'Rent', amount: 1500, category: 'Rent', date: format(new Date(), 'yyyy-MM-01'), recurrence: { type: 'indefinite' }, isFixed: true },
        { id: 'e2', name: 'Groceries', amount: 400, category: 'Food', date: format(new Date(), 'yyyy-MM-05'), isFixed: false }
      ]
    }
  },
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
  ]
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  const importData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      // Basic validation could be added here
      setState(parsed);
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
    addTask,
    updateTask,
    deleteTask,
    addExpense,
    addIncome,
    addDebt,
    importData,
    exportData,
    setState
  };
}
