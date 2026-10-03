"use client"


import * as React from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { ChatWidget } from "@/components/chat/chat-widget"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)


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

      <div className="flex flex-1 flex-col overflow-hidden safe-top">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 safe-bottom md:p-6 relative">
          {children}
          <ChatWidget />
        </main>
      </div>
    </div>
  )
}
