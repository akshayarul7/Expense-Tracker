import { db, Expense, Budget } from './db';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<number> {
  return await db.expenses.add({
    ...data,
    createdAt: new Date(),
  });
}

export async function updateExpense(id: number, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  await db.expenses.update(id, data);
}

export async function deleteExpense(id: number): Promise<void> {
  const expense = await db.expenses.get(id);
  if (expense?.plaidId) {
    await db.ignoredTransactions.put({ 
      plaidId: expense.plaidId, 
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      deletedAt: new Date() 
    });
  }
  return db.expenses.delete(id);
}

export async function restoreIgnoredTransactions(): Promise<void> {
  await db.ignoredTransactions.clear();
}

export async function getExpensesByDateRange(start: Date, end: Date): Promise<Expense[]> {
  return await db.expenses.where('date').between(start, end, true, true).toArray();
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  // Note: month is 0-indexed (0 = January, 11 = December)
  const date = new Date(year, month);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return await db.expenses.where('date').between(start, end, true, true).toArray();
}

export async function getExpensesByCategory(category: string): Promise<Expense[]> {
  return await db.expenses.where('category').equals(category).toArray();
}

export async function setBudget(category: string, monthlyLimit: number): Promise<void> {
  await db.budgets.put({ category, monthlyLimit });
}

export async function deleteBudget(category: string): Promise<void> {
  await db.budgets.delete(category);
}

export async function getAllBudgets(): Promise<Budget[]> {
  return await db.budgets.toArray();
}

export async function getBudgetForCategory(category: string): Promise<Budget | undefined> {
  return await db.budgets.get(category);
}
