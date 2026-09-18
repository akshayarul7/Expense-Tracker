const fs = require('fs');

// Fix Dashboard Grid
let dashboard = fs.readFileSync('src/app/page.tsx', 'utf8');
dashboard = dashboard.replace('<Card className="col-span-4">', '<Card className="lg:col-span-4">');
dashboard = dashboard.replace('<Card className="col-span-3">', '<Card className="lg:col-span-3">');
fs.writeFileSync('src/app/page.tsx', dashboard);

// Fix Expenses Page Layout
let expenses = fs.readFileSync('src/app/expenses/page.tsx', 'utf8');
// Remove p-8 pt-6 since AppShell already provides padding
expenses = expenses.replace('className="flex-1 space-y-4 p-8 pt-6"', 'className="flex-1 space-y-4"');
// Make the header wrap on mobile
expenses = expenses.replace('className="flex items-center justify-between space-y-2"', 'className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"');
// Make the buttons wrap
expenses = expenses.replace('className="flex items-center space-x-2"', 'className="flex flex-wrap items-center gap-2"');
fs.writeFileSync('src/app/expenses/page.tsx', expenses);

console.log("Fixed layouts");
