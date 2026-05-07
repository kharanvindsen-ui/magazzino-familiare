import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Magazzino Familiare',
    short_name: 'Magazzino',
    description: 'Gestione scorte materiali di casa e lavoro',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#3B82F6',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    categories: ['utilities', 'productivity'],
  }
}
