import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-inter',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Luminex Configurator',
  description: 'Professional Luminex switch configuration tool for live production',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
      </body>
    </html>
  );
}
