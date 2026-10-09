import type { Metadata, Viewport } from 'next';
import { ToastProvider } from '@ecom/ui';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { publicEnv } from '@/lib/env';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${publicEnv.siteName} — considered goods for work and travel`,
    template: `%s · ${publicEnv.siteName}`,
  },
  description:
    'A small catalogue of audio, workspace, travel and lighting pieces chosen for how long they last, not how quickly they sell.',
  openGraph: {
    type: 'website',
    siteName: publicEnv.siteName,
    title: `${publicEnv.siteName} — considered goods for work and travel`,
    description: 'Audio, workspace, travel and lighting pieces chosen for how long they last.',
    url: publicEnv.siteUrl,
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f6' },
    { media: '(prefers-color-scheme: dark)', color: '#121316' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Applies the stored theme before paint so the page never flashes the wrong one. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aurelia-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&m))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <ToastProvider>
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1 pb-16">
            {children}
          </main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
