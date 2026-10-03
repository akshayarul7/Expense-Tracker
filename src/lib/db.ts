
import { RecurringFrequency } from './constants';

export interface Expense {
  id?: string;
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
  id?: string;
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

export interface WishlistItem {
  id?: string;
  name: string;
  price: number;
  url?: string;
  imageUrl?: string;
  status: 'want' | 'bought';
  createdAt?: Date;
}
