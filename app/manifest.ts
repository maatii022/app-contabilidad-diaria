import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'App Contabilidad Diaria',
    short_name: 'Contabilidad',
    description: 'Control diario de gastos e ingresos',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#07111f',
    theme_color: '#07111f',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}