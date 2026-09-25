'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addExpense } from '@/lib/db-helpers';

interface PasteExpensesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PasteExpensesDialog({ open, onOpenChange, onSuccess }: PasteExpensesDialogProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let count = 0;

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length < 4) continue;
        
        const dateStr = parts[0]; // e.g. 06/02
        if (!/^\d{2}\/\d{2}$/.test(dateStr)) continue; // basic validation

        const amountStr = parts[parts.length - 1];
        const amount = parseFloat(amountStr.replace(/,/g, '').replace('$', ''));
        if (isNaN(amount)) continue;
        
        // Clean up description
        let descParts = parts.slice(2, parts.length - 1);
        if (descParts.length > 0 && /^\d{4}$/.test(descParts[descParts.length - 1])) {
          descParts.pop(); // Pop card suffix (e.g. 0249)
        }
        if (descParts.length > 0 && /^\d{4}$/.test(descParts[descParts.length - 1])) {
          descParts.pop(); // Pop random code
        }
        
        const name = descParts.join(' ');
        const [month, day] = dateStr.split('/');
        
        // Use current year
        const currentYear = new Date().getFullYear();
        let date = new Date(currentYear, parseInt(month) - 1, parseInt(day), 12, 0, 0);

        // If the date is in the future (e.g., parsing Dec statement in Jan), roll back a year
        if (date > new Date()) {
          date = new Date(currentYear - 1, parseInt(month) - 1, parseInt(day), 12, 0, 0);
        }

        await addExpense({
          name,
          amount,
          category: 'Other', // Default category, user can edit later
          date,
          isRecurring: false,
          notes: 'Imported from text',
        });
        count++;
      }

      alert(`Successfully imported ${count} expenses!`);
      setText('');
      onOpenChange(false);
      onSuccess();
    } catch(err: any) {
      alert("Error importing expenses: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Paste Statement Text</DialogTitle>
          <DialogDescription>
            Copy and paste lines directly from your bank statement PDF. Each line should have the date first and the amount last.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea 
            placeholder={"06/02 06/03 UCSD TRITON SVCES windcave.com CA 3448 0249 5.00\n06/08 06/10 RALPHS #0108 LA JOLLA CA 7680 0249 20.62"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[250px] font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleProcess} disabled={!text.trim() || isProcessing}>
            {isProcessing ? 'Importing...' : 'Import Expenses'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
