import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/serviceb/', // Si votre repo s'appelle "serviceb"
  build: {
    outDir: 'dist'
  }
});