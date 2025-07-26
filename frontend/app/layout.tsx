import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plantation Management System',
  description: 'Manage your agricultural operations with modern digital tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
