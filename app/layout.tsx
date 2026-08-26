import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import '@/app/globals.css';

import { BottomNav } from '@/components/navigation/bottom-nav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'App Contabilidad Diaria',
  description: 'Control diario de gastos e ingresos',
  applicationName: 'App Contabilidad Diaria',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Contabilidad'
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0e17'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <div className="app-bg min-h-screen text-text">
          <div
            className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)'
            }}
          >
            <div className="relative z-10 flex-1 space-y-5">{children}</div>

            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </div>
        </div>
      </body>
    </html>
  );
}
