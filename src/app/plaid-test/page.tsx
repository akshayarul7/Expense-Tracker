'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate a link_token when the page loads
    const generateToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        const data = await response.json();
        if (data.link_token) {
          setLinkToken(data.link_token);
        } else {
          setError(data.error || 'Failed to generate link token');
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    generateToken();
  }, []);

  const onSuccess = useCallback(async (public_token: string, metadata: any) => {
    setLoading(true);
    setError(null);
    try {
      // Send the public_token to our backend
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      const data = await response.json();
      
      if (data.transactions) {
        setTransactions(data.transactions);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const config = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Plaid Sandbox Testing</h1>
        <p className="text-muted-foreground mt-2">
          Click the button below to open Plaid Link. Since you are using production keys, this will connect to a real bank.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Connect Bank</CardTitle>
          <CardDescription>Launch Plaid Link to authenticate with your bank.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => open()} 
            disabled={!ready || !linkToken || loading}
          >
            {loading ? 'Fetching Data...' : 'Connect a Bank Account'}
          </Button>
          {error && <div className="text-destructive mt-4 p-4 bg-destructive/10 rounded-md text-sm">{error}</div>}
        </CardContent>
      </Card>

      {transactions && (
        <Card>
          <CardHeader>
            <CardTitle>2. Transactions Data</CardTitle>
            <CardDescription>Raw JSON returned directly from Plaid's API.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[500px]">
              <pre className="text-xs">{JSON.stringify(transactions, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
