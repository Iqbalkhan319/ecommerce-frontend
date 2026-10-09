import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@ecom/ui';
import { publicEnv } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${publicEnv.siteName} administration`, template: `%s · ${publicEnv.siteName} admin` },
  description: `Operations console for the ${publicEnv.siteName} commerce platform.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#14584a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
