import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Agent",
  description: "Internal SEO services platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              SEO Agent
            </Link>
            <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              <Link href="/clients" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                Clients
              </Link>
              <Link href="/settings" className="hover:text-neutral-900 dark:hover:text-neutral-100">
                Settings
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
