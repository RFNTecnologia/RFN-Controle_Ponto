import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/RFN-Controle_Ponto/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-rfn.svg', 'logo.png'],
      manifest: {
        name: 'PontoFacil - RFNTecnologia',
        short_name: 'PontoFacil',
        description: 'Sistema de controle de ponto',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/RFN-Controle_Ponto/',
        scope: '/RFN-Controle_Ponto/',
        icons: [
          { src: 'logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    }),
  ],
});
