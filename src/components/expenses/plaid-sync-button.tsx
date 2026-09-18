'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { processPlaidTransactions } from '@/lib/plaid-sync';
import { restoreIgnoredTransactions } from '@/lib/db-helpers';

import { useEffect as useReactEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getAllIgnoredTransactions } from '@/lib/db-helpers';
import { RestoreIgnoredDialog } from './restore-ignored-dialog';
import { RefreshCw, Building2 } from 'lucide-react';
import { getPlaidToken, savePlaidToken, clearPlaidToken } from '@/lib/db-helpers';

export function PlaidSyncButton({ refreshKey, onSyncComplete }: { refreshKey?: number, onSyncComplete?: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if we already have an access token in the database
    getPlaidToken().then((token) => {
      if (token) {
        setHasToken(true);
      } else {
        // Generate a link_token just in case they need to connect
        fetch('/api/plaid/create-link-token', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.link_token) setLinkToken(data.link_token);
          })
          .catch(console.error);
      }
    });
  }, []);

  const onSuccess = useCallback(async (public_token: string | null) => {
    if (!public_token) return;
    setIsSyncing(true);
    try {
      // Exchange public token
      const res = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      const data = await res.json();
      
      if (data.access_token) {
        await savePlaidToken(data.access_token);
        setHasToken(true);
        
        // Process the initial batch of transactions
        if (data.transactions) {
          const count = await processPlaidTransactions(data.transactions, data.accounts);
          alert(`Successfully connected bank and imported ${count} new expenses!`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect bank.');
    } finally {
      setIsSyncing(false);
      onSyncComplete?.();
    }
  }, [onSyncComplete]);

  const config = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  const handleSync = async () => {
    if (!hasToken) {
      open();
      return;
    }

    setIsSyncing(true);
    try {
      const access_token = await getPlaidToken();
      if (!access_token) throw new Error('No token found');

      const res = await fetch('/api/plaid/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, days: 90 }),
      });
      const data = await res.json();
      
      if (data.transactions) {
        const count = await processPlaidTransactions(data.transactions, data.accounts);
        alert(`Synced! Imported ${count} new expenses.`);
      } else {
        alert('Failed to fetch transactions. You may need to reconnect your bank.');
        await clearPlaidToken();
        setHasToken(false);
      }
    } catch (err) {
      console.error(err);
      alert('Sync failed.');
    } finally {
      setIsSyncing(false);
      onSyncComplete?.();
    }
  };

  const [restoreOpen, setRestoreOpen] = useState(false);
  const [ignoredCount, setIgnoredCount] = useState(0);
  useReactEffect(() => {
    async function checkIgnored() {
      try {
        const data = await getAllIgnoredTransactions();
        setIgnoredCount(data.length);
      } catch (e) {}
    }
    checkIgnored();
  }, [refreshKey]);

  return (
    <>
      <RestoreIgnoredDialog 
        open={restoreOpen} 
        onOpenChange={setRestoreOpen}
        onRestoreTriggered={async () => {
          const data = await getAllIgnoredTransactions();
          setIgnoredCount(data.length);
          handleSync();
        }}
        refreshKey={refreshKey}
      />
      <div className="flex items-center gap-2">
        {ignoredCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setRestoreOpen(true)}
            disabled={isSyncing}
          >
            Review {ignoredCount} Deleted
          </Button>
        )}
      <Button 
        variant="secondary" 
        onClick={handleSync} 
        disabled={isSyncing || (!hasToken && !ready)}
        className="gap-2"
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : hasToken ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <Building2 className="h-4 w-4" />
        )}
        {isSyncing ? 'Syncing...' : hasToken ? 'Sync Bank' : 'Connect Bank'}
      </Button>
    </div>
    </>
  );
}
