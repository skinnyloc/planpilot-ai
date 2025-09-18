import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting to optimize loading
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'clerk-vendor': ['@clerk/clerk-react'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          'ui-vendor': ['lucide-react', 'date-fns', 'react-markdown'],

          // App chunks
          'app-pages': [
            './src/pages/BusinessPlans.jsx',
            './src/pages/Documents.jsx',
            './app/grant-proposals/page.jsx'
          ]
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@clerk/clerk-react',
        'lucide-react',
        'date-fns',
        'react-markdown'
      ]
    }
  }
}) 