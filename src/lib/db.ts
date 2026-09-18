import Dexie, { Table } from 'dexie';
import { RecurringFrequency } from './constants';

export interface Expense {
  id?: number;
  name: string;
  amount: number;
  originalAmount?: number;
  category: string;
  date: Date;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: Date;
  plaidId?: string;
}

export interface Budget {
  category: string;
  monthlyLimit: number;
}

export interface IgnoredTransaction {
  plaidId: string;
  name?: string;
  amount?: number;
  date?: Date;
  deletedAt: Date;
}

export class ExpenseTrackerDB extends Dexie {
  expenses!: Table<Expense, number>;
  budgets!: Table<Budget, string>;
  ignoredTransactions!: Table<IgnoredTransaction, string>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(1).stores({
      expenses: '++id, category, date, isRecurring',
      budgets: 'category'
    });
    this.version(2).stores({
      expenses: '++id, category, date, isRecurring, plaidId',
      budgets: 'category',
      ignoredTransactions: 'plaidId'
    });
    this.version(3).stores({
      expenses: '++id, category, date, isRecurring, plaidId',
      budgets: 'category',
      ignoredTransactions: 'plaidId, deletedAt'
    });
  }
}

export const db = new ExpenseTrackerDB();
