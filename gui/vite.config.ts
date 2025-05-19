import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  base: 'mamba_gui',
  plugins: [react()],
  build: {
    outDir: './dist/index'
  },
  resolve: {
    alias: {
      src: "/src",
    },
  }
})
