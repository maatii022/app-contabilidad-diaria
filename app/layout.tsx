import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'App Contabilidad Diaria',
  description: 'Web app móvil de control personal de gastos e ingresos.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
