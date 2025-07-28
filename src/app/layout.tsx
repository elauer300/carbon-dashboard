// src/app/layout.tsx

import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'PALIoT Solutions – Voluntary Carbon Credit Dashboard',
  description: 'Track your pallets, miles, fuel & CO₂ removal in real time',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  )
}
