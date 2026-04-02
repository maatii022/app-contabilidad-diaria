import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'App Contabilidad Diaria',
    short_name: 'Contabilidad',
    description: 'Control personal de gastos e ingresos con una experiencia móvil, visual y premium.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050814',
    theme_color: '#050814',
    orientation: 'portrait',
    lang: 'es',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ]
  };
}
