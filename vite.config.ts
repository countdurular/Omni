import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Instructs the HMR client to map securely to the proxy layer in cloud environments
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        protocol: 'wss',
        clientPort: 443,
      },
      // Helps with file syncing in cloud container environments
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        usePolling: true,
      },
    },
  };
});
