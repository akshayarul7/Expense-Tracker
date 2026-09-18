export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Education',
  'Travel',
  'Subscriptions',
  'Other'
];

export const RECURRING_FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;

export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
