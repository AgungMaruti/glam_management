import type { Metadata } from 'next'
import './globals.css'
import { RootLayoutClient } from '@/components/layout/RootLayoutClient'

export const metadata: Metadata = {
  title: 'Glam Suite',
  description: 'Kelola bisnis parfum kamu dari hulu ke hilir',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
