"use client"

import * as React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { processPlaidTransactions } from '@/lib/plaid-sync'
import { getPlaidToken } from '@/lib/db-helpers'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    getPlaidToken().then((token) => {
      if (token) {
        // Background auto-sync on launch
        fetch('/api/plaid/sync-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: token, days: 30 }), // fetch last 30 days for quick sync
        })
          .then(res => res.json())
          .then(data => {
            if (data.transactions) processPlaidTransactions(data.transactions, data.accounts);
          })
          .catch(console.error);
      }
    });
  }, []);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden border-r md:block md:w-64 md:shrink-0">
        <Sidebar className="h-full" />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Menu for navigating the application</SheetDescription>
          <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 safe-pb md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
