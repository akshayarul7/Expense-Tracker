import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { format, subDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { public_token } = await req.json();

    // 1. Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    
    const accessToken = exchangeResponse.data.access_token;
    
    // 2. Fetch the last 30 days of transactions
    const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    return NextResponse.json({
      access_token: accessToken, // DO NOT return this in production! Returning for testing purposes.
      transactions: transactionsResponse.data.transactions,
      accounts: transactionsResponse.data.accounts,
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error.response?.data || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
