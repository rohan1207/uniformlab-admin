import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub missing three.js inspector (used by @react-three/fiber; not in all three versions)
      'three/addons/inspector/Inspector.js': path.resolve(__dirname, './src/stub-three-inspector.js'),
    },
  },

  server: {
    port: 5174, // Only used for local dev
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    cssMinify: true,
    cssCodeSplit: true,
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    copyPublicDir: true,
    // Ensure index.html and 404.html are handled properly
    emptyOutDir: true
  },
})
