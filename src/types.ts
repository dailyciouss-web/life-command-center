export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Task {
  id: string;
  parentId: string | null;
  name: string;
  isCompleted: boolean;
  color: string;
  notes?: string;
  dueDate?: string;
  estimatedTime?: string; // e.g. "1h", "30m"
  recurrence?: {
    type: RecurrenceType;
    interval?: number;
  };
  childrenIds: string[];
}

export type ExpenseCategory = 
  | 'Rent' 
  | 'Health insurance' 
  | 'Phone' 
  | 'Food' 
  | 'Transport' 
  | 'Subscriptions' 
  | 'Entertainment' 
  | 'Savings' 
  | 'Other';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory | string;
  date: string;
  notes?: string;
  recurrence?: {
    type: 'once' | 'repeat_months' | 'indefinite';
    monthsCount?: number; // max 24
  };
  isFixed: boolean;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
  recurrence?: {
    type: 'once' | 'repeat_months' | 'indefinite';
    monthsCount?: number; // max 24
  };
}

export interface MonthlyBudget {
  id: string; // YYYY-MM
  income: Income[];
  expenses: Expense[];
}

export type DebtStatus = 'active' | 'partially_paid' | 'paid';
export type DebtDirection = 'i_owe' | 'they_owe';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  direction: DebtDirection;
  dueDate?: string;
  notes?: string;
  status: DebtStatus;
  payments: Payment[];
  reminderDate?: string;
  createdAt: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  data: AppState;
}

export interface AppState {
  tasks: Record<string, Task>;
  rootTaskIds: string[];
  budgets: Record<string, MonthlyBudget>; // key: YYYY-MM
  debts: Debt[];
  settings?: {
    lastBackup?: string;
    autoBackupEnabled?: boolean;
  };
}
