import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/rx-nostr-tl/',
  server: {
    host: '0.0.0.0'
  },
  plugins: [solidPlugin()],
})
