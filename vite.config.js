import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { splitVendorChunkPlugin } from 'vite';


export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // Split vendor chunks for better caching
      splitVendorChunkPlugin(),
      // Generate compressed versions of assets
      isProduction && compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024, // Only compress files larger than 1KB
      }),
      // Generate brotli compressed versions
      isProduction && compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
      }),
      // Visualize bundle size in production
      isProduction && visualizer({
        open: false,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
    ].filter(Boolean),

    resolve: {
      alias: [{ find: "@", replacement: "/src" }],
    },

    build: {
      // Generate source maps in production for debugging
      sourcemap: isProduction ? 'hidden' : true,
      // Minify the output
      minify: isProduction ? 'terser' : false,
      // Terser options for better minification
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Rollup options
      rollupOptions: {
        output: {
          // Chunk naming strategy
          manualChunks: (id) => {
            // Create separate chunks for large dependencies
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@material-tailwind')) {
                return 'vendor-material-tailwind';
              }
              if (id.includes('slick-carousel') || id.includes('react-slick')) {
                return 'vendor-carousel';
              }
              if (id.includes('bootstrap')) {
                return 'vendor-bootstrap';
              }
              return 'vendor'; // all other packages
            }
          },
        },
      },
      // Optimize dependencies
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@material-tailwind/react'],
      },
    },

    // Development server options
    server: {
      hmr: true,
      port: 5173,
      host: true,
    },
  };
});
