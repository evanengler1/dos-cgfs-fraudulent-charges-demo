import type { Metadata } from "next"
import type React from "react"
import { AppHeader } from "@/components/app-header"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { APP_TITLE, LOGO_SRC } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import "./globals.css"

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "Cross-system fraud detection and financial impact analysis for Department of State CGFS",
  icons: { icon: LOGO_SRC },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            <div className="w-full bg-amber-500 text-amber-950 text-center py-1 text-xs font-medium">
              Demo Environment — Synthetic Data
            </div>
            <AppHeader />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
