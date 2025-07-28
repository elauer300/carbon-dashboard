import './globals.css'
import { metadata } from './head'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href="/paliot-logo.png" />
      </head>
      <body>
        {/* Top bar with logo */}
        <header className="topbar">
          <div className="container flex items-center justify-between">
            <img
              src="/paliot-logo.png"
              alt="PALIoT Solutions Logo"
              className="logo"
            />
          </div>
        </header>

        {/* Dashboard content */}
        <main>{children}</main>

        {/* Global footer */}
        <footer className="footer">
          <div className="container">
            © 2025 PALIoT Solutions. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  )
}
