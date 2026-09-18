'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect } from 'react';

import { Expense } from '@/lib/db';
import { addExpense, updateExpense } from '@/lib/db-helpers';
import { CATEGORIES, RECURRING_FREQUENCIES, formatCurrency } from '@/lib/constants';
import { expenseSchema, ExpenseFormValues } from '@/lib/schemas';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseForm({ open, onOpenChange, expense }: ExpenseFormProps) {
  const form = useForm({
    resolver: zodResolver(expenseSchema) as any,
      defaultValues: {
        name: '',
        amount: 0,
        category: '',
        date: new Date(),
        notes: '',
        isRecurring: false,
        recurringFrequency: undefined as any,
      },
    });
  
    useEffect(() => {
      if (expense) {
        form.reset({
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          notes: expense.notes || '',
          isRecurring: expense.isRecurring,
          recurringFrequency: expense.recurringFrequency,
        });
      } else {
        form.reset({
          name: '',
          amount: 0,
          category: '',
          date: new Date(),
          notes: '',
          isRecurring: false,
          recurringFrequency: undefined,
        });
      }
    }, [expense, form, open]);
  
    async function onSubmit(data: any) {
      if (expense && expense.id) {
        await updateExpense(expense.id, data);
      } else {
        await addExpense(data);
      }
      onOpenChange(false);
    }
  
    const isRecurring = form.watch('isRecurring');
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {expense
                ? 'Update the details of your expense below.'
                : 'Enter the details of your new expense.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              <FormField
                control={form.control as any}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Starbucks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="amount"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Amount</FormLabel>
                    {expense?.plaidId && expense?.originalAmount !== undefined && Number(field.value) !== expense.originalAmount && (
                      <button
                        type="button"
                        onClick={() => form.setValue('amount', expense.originalAmount!)}
                        className="text-xs text-blue-500 hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val || '')} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger render={
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      />
                    }>
                      <FormControl>
                        <div className="w-full flex items-center justify-between">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="h-4 w-4 opacity-50" />
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!!expense && (
              <FormField
                control={form.control as any}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any notes here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control as any}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Recurring Expense</FormLabel>
                    <FormDescription>
                      Is this a repeating expense?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {isRecurring && (
              <FormField
                control={form.control as any}
                name="recurringFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val || undefined)} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECURRING_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Expense</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
// FormDescription isn't in imports yet, let's just omit it or add it
