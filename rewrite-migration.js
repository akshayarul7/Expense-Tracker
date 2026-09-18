const fs = require('fs');
let code = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

code = code.replace("import { backupToDrive, restoreFromDrive, getBackupMetadata } from '@/lib/drive-sync';", "import { backupToDrive, restoreFromDrive, getBackupMetadata } from '@/lib/drive-sync';\nimport { supabase } from '@/lib/supabase';\nimport { localDb } from '@/lib/db';");

// Add handleMigrate state
code = code.replace("const [isRestoring, setIsRestoring] = useState(false);", "const [isRestoring, setIsRestoring] = useState(false);\n  const [isMigrating, setIsMigrating] = useState(false);");

const handleMigrate = `  const handleMigrate = async () => {
    if (!window.confirm('This will upload all your local Mac data to the Supabase Cloud. Proceed?')) return;
    try {
      setIsMigrating(true);
      setError(null);
      setSuccess(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('You must be logged in to migrate data.');
      const userId = session.user.id;
      
      const expenses = await localDb.expenses.toArray();
      const budgets = await localDb.budgets.toArray();
      const ignored = await localDb.ignoredTransactions.toArray();
      
      if (expenses.length > 0) {
        const expPayload = expenses.map(e => ({
          user_id: userId,
          plaid_id: e.plaidId || null,
          amount: e.amount,
          category: e.category,
          date: new Date(e.date).toISOString(),
          name: e.name || e.category,
          notes: e.notes || null,
          is_recurring: e.isRecurring ? true : false,
          recurring_frequency: e.recurringFrequency || null,
          created_at: new Date(e.createdAt).toISOString()
        }));
        const { error: eErr } = await supabase.from('expenses').insert(expPayload);
        if (eErr) throw eErr;
      }
      
      if (budgets.length > 0) {
        const budPayload = budgets.map(b => ({
          user_id: userId,
          category: b.category,
          monthly_limit: b.monthlyLimit
        }));
        const { error: bErr } = await supabase.from('budgets').upsert(budPayload, { onConflict: 'category,user_id' });
        if (bErr) throw bErr;
      }
      
      if (ignored.length > 0) {
        const igPayload = ignored.map(i => ({
          user_id: userId,
          plaid_id: i.plaidId,
          name: i.name,
          amount: i.amount,
          date: i.date ? new Date(i.date).toISOString() : null,
          deleted_at: new Date(i.deletedAt).toISOString()
        }));
        const { error: iErr } = await supabase.from('ignored_transactions').upsert(igPayload, { onConflict: 'plaid_id' });
        if (iErr) throw iErr;
      }
      
      setSuccess('Successfully migrated all local data to the Cloud!');
    } catch(e: any) {
      setError(e.message || 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };`;

code = code.replace("const handleBackup = async () => {", handleMigrate + "\n\n  const handleBackup = async () => {");

// Add Migration UI Card
const migrateCard = `      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Migrate to Cloud Database (Supabase)
          </CardTitle>
          <CardDescription>
            Click this to securely push all the data currently living in this Mac's hard drive up to your new Supabase cloud database. 
            Once you do this, your iPhone will instantly sync!
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-6 py-4">
          <Button onClick={handleMigrate} disabled={isMigrating} className="w-full sm:w-auto bg-primary">
            {isMigrating ? 'Migrating...' : 'Migrate Data to Cloud'}
          </Button>
        </CardFooter>
      </Card>
`;

code = code.replace("<Card>", migrateCard + "\n      <Card>");

fs.writeFileSync('src/app/settings/page.tsx', code);
console.log("Rewrote settings with migration");
