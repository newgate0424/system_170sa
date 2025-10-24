"use client"

import { ReactNode } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { LanguageProvider } from '@/contexts/language-context'
import { LoadingProvider } from '@/hooks/use-loading'
import { ThemeApplier } from './theme-applier'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <ThemeApplier />
      <LanguageProvider>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </LanguageProvider>
    </NextThemesProvider>
  )
}
