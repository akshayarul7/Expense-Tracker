'use client';

import { useState } from 'react';
import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getAllIgnoredTransactions, restoreIgnoredTransactions } from '@/lib/db-helpers';
import { IgnoredTransaction } from '@/lib/db';
import { format } from 'date-fns';

import { formatCurrency } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RestoreIgnoredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreTriggered: () => void;
  refreshKey?: number;
}

export function RestoreIgnoredDialog({ open, onOpenChange, onRestoreTriggered, refreshKey }: RestoreIgnoredDialogProps) {
  const [ignored, setIgnored] = useState<IgnoredTransaction[]>([]);

  const fetchIgnored = useCallback(async () => {
    try {
      const data = await getAllIgnoredTransactions();
      setIgnored(data);
    } catch(e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchIgnored();
    }
  }, [fetchIgnored, open, refreshKey]);

  const [restoringId, setRestoringId] = useState<string | null>(null);

  const handleRestore = async (plaidId: string) => {
    setRestoringId(plaidId);
    try {
      await supabase.from('ignored_transactions').delete().eq('plaid_id', plaidId);
      setIgnored((prev) => prev.filter((item) => item.plaidId !== plaidId));
      onRestoreTriggered();
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreAll = async () => {
    if (window.confirm('Restore all ignored transactions?')) {
      await restoreIgnoredTransactions();
      onRestoreTriggered();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Restore Deleted Expenses</DialogTitle>
          <DialogDescription>
            These are Plaid transactions you previously deleted. Restore them to bring them back on your next sync.
          </DialogDescription>
        </DialogHeader>

        {ignored.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No deleted transactions found.
          </div>
        ) : (
          <>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <div className="p-4 space-y-4">
                {ignored.map((item) => (
                  <div key={item.plaidId} className="flex items-center justify-between gap-4">
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium truncate">
                        {(item as any).name || 'Unknown Transaction'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(item as any).amount ? formatCurrency((item as any).amount) : 'Unknown Amount'} 
                        {(item as any).date ? ` • ${format(new Date((item as any).date), 'MMM d, yyyy')}` : ''}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestore(item.plaidId)}
                      disabled={restoringId === item.plaidId}
                    >
                      {restoringId === item.plaidId ? 'Restoring...' : 'Restore'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-muted-foreground">{ignored.length} items hidden</span>
              <Button variant="secondary" size="sm" onClick={handleRestoreAll}>
                Restore All
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
