import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const basePath = process.env.BASE_PATH || '/RFN-Controle_Ponto/';

export default defineConfig({
  base: basePath,
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
        lang: 'pt-BR',
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: 'logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    }),
  ],
});
