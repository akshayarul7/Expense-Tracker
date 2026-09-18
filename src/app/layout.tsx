import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/app-shell"
import { cn } from "@/lib/utils"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

import type { Viewport } from "next"

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses with ease",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expenses",
  },
}

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={cn(
          "min-h-full bg-background font-sans antialiased",
          inter.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="expense-tracker-theme"
        >
          <AppShell>
            {props.children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
