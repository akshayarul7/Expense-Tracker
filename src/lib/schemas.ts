import { z } from 'zod';
import { CATEGORIES, RECURRING_FREQUENCIES } from './constants';

export const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  date: z.coerce.date(),
  notes: z.string().default(''),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(RECURRING_FREQUENCIES).optional(),
}).refine(
  (data) => !data.isRecurring || data.recurringFrequency,
  { message: 'Frequency is required for recurring expenses', path: ['recurringFrequency'] }
);

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.coerce.number().positive('Budget must be greater than 0'),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;
