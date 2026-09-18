const fs = require('fs');
let code = fs.readFileSync('src/lib/db-helpers.ts', 'utf8');

// Fix addExpense
const oldAdd = `export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const userId = await getUserId();
  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert([{ ...data, user_id: userId, created_at: new Date().toISOString() }])
    .select('id')
    .single();
    
  if (error) throw error;
  return inserted.id;
}`;

const newAdd = `export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
  const userId = await getUserId();
  const payload = {
    user_id: userId,
    name: data.name,
    amount: data.amount,
    original_amount: data.originalAmount,
    category: data.category,
    date: new Date(data.date).toISOString(),
    notes: data.notes,
    is_recurring: data.isRecurring,
    recurring_frequency: data.recurringFrequency,
    plaid_id: data.plaidId,
    created_at: new Date().toISOString()
  };
  
  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert([payload])
    .select('id')
    .single();
    
  if (error) { console.error('Add Expense Error:', error); throw error; }
  return inserted.id;
}`;

// Fix updateExpense
const oldUpdate = `export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase
    .from('expenses')
    .update(data)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}`;

const newUpdate = `export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<void> {
  const userId = await getUserId();
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.amount !== undefined) payload.amount = data.amount;
  if (data.originalAmount !== undefined) payload.original_amount = data.originalAmount;
  if (data.category !== undefined) payload.category = data.category;
  if (data.date !== undefined) payload.date = new Date(data.date).toISOString();
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.isRecurring !== undefined) payload.is_recurring = data.isRecurring;
  if (data.recurringFrequency !== undefined) payload.recurring_frequency = data.recurringFrequency;
  if (data.plaidId !== undefined) payload.plaid_id = data.plaidId;
  
  const { error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) { console.error('Update Expense Error:', error); throw error; }
}`;

// Fix deleteExpense logic for ignored_transactions upsert
// Actually deleteExpense already uses `expense.name`, etc. wait, `expense` from DB is SNAKE CASE!
const oldDelete = `  if (expense?.plaid_id) {
    await supabase.from('ignored_transactions').upsert({
      plaid_id: expense.plaid_id,
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      deleted_at: new Date().toISOString()
    });
  }`;
  
const newDelete = `  if (expense?.plaid_id) {
    await supabase.from('ignored_transactions').upsert({
      plaid_id: expense.plaid_id,
      user_id: userId,
      name: expense.name,
      amount: expense.amount,
      date: expense.date,
      deleted_at: new Date().toISOString()
    });
  }`;

code = code.replace(oldAdd, newAdd);
code = code.replace(oldUpdate, newUpdate);
code = code.replace(oldDelete, newDelete);

fs.writeFileSync('src/lib/db-helpers.ts', code);
console.log("Fixed CRUD operations");
