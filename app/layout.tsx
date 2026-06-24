import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aiya Kareem',
  description: 'A modern 70s artist landing page for Aiya Kareem',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
