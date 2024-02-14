import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/react-rxjs/',
  server: {
    host: '0.0.0.0'
  },
  plugins: [solidPlugin()],
})
