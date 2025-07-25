// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PALIoT Solutions – Voluntary Carbon Credit Analysis",
  description: "Track pallets, miles, fuel & CO₂ removal in real time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* --- Topbar / Header --- */}
        <header className="topbar">
          <div className="container">
            <img
              src="/paliot-logo.png"
              alt="PALIoT Solutions Logo"
              className="logo"
            />
          </div>
        </header>

        {/* --- Hero --- */}
        <section className="hero">
          <div className="container">
            <h1>Voluntary Carbon Credit Analysis</h1>
            <p className="tagline">
              Turning pallets into data through technology
            </p>
          </div>
        </section>

        {/* --- Page content --- */}
        <main className="container">{children}</main>

        {/* --- Footer --- */}
        <footer className="footer">
          <div className="container">
            © 2025 PALIoT Solutions. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
