import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { Products, CountryCode } from 'plaid';

export async function POST(req: Request) {
  try {
    const request = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: 'user-id-testing-123',
      },
      client_name: 'Expense Tracker Local',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating link token:', error.response?.data || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
