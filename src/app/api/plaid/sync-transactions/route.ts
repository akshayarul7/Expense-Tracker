import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { format, subDays } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { access_token, days = 30 } = await req.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });
    }

    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    const response = await plaidClient.transactionsGet({
      access_token,
      start_date: startDate,
      end_date: endDate,
    });

    return NextResponse.json({ 
      transactions: response.data.transactions,
      accounts: response.data.accounts
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error.response?.data || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
