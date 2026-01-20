import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Salient KPIs Dashboard',
  description: 'Client KPI visualization dashboard with daily, weekly, and monthly views',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

