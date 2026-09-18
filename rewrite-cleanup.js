const fs = require('fs');

// 1. Strip out handleMigrate and the Migration UI from settings/page.tsx
let settingsCode = fs.readFileSync('src/app/settings/page.tsx', 'utf8');

// Remove import
settingsCode = settingsCode.replace("import { localDb } from '@/lib/db';", "");

// Remove handleMigrate (find the block and slice it out)
const migrateStart = settingsCode.indexOf('const handleMigrate = async () => {');
if (migrateStart !== -1) {
  const backupStart = settingsCode.indexOf('const handleBackup = async () => {');
  settingsCode = settingsCode.substring(0, migrateStart) + settingsCode.substring(backupStart);
}

// Remove the Migrate UI Card
const cardTitleRegex = /<Card className="border-primary\/50 bg-primary\/5">[\s\S]*?<\/Card>/;
settingsCode = settingsCode.replace(cardTitleRegex, "");

// Remove isMigrating state
settingsCode = settingsCode.replace("const [isMigrating, setIsMigrating] = useState(false);", "");

fs.writeFileSync('src/app/settings/page.tsx', settingsCode);


// 2. Strip Dexie completely out of db.ts
let dbTsCode = `
import { RecurringFrequency } from './constants';

export interface Expense {
  id?: string;
  name: string;
  amount: number;
  originalAmount?: number;
  category: string;
  date: Date;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: Date;
  plaidId?: string;
}

export interface Budget {
  id?: string;
  category: string;
  monthlyLimit: number;
}

export interface IgnoredTransaction {
  plaidId: string;
  name?: string;
  amount?: number;
  date?: Date;
  deletedAt: Date;
}
`;

fs.writeFileSync('src/lib/db.ts', dbTsCode);

console.log("Cleanup complete!");
