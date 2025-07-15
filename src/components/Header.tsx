'use client'

export default function Header() {
  return (
    <header className="flex items-center gap-4 mb-6">
      {/* Make sure this file is in /public */}
      <img src="/paliot-logo.png" alt="Paliot" className="h-10 w-auto" />
      <h1 className="text-2xl font-semibold">Pallet — Carbon Dashboard</h1>
    </header>
  )
}
