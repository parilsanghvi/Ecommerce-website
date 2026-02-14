import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import path from 'path';

export default defineConfig({
    plugins: [react(), envCompatible()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                secure: false,
            },
            // Proxy other unknown requests to backend if needed, mimicking CRA proxy behavior roughly
        },
    },
    build: {
        outDir: 'build',
        chunkSizeWarningLimit: 700, // vendor-geo (country-state-city) is ~651KB of pure data, irreducible
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Redux state management
                    'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
                    // Emotion (CSS-in-JS engine for MUI)
                    'vendor-emotion': ['@emotion/react', '@emotion/styled'],
                    // MUI core components
                    'vendor-mui': ['@mui/material'],
                    // MUI icons (tree-shaken)
                    'vendor-mui-icons': ['@mui/icons-material'],
                    // MUI DataGrid
                    'vendor-datagrid': ['@mui/x-data-grid'],
                    // Chart.js
                    'vendor-charts': ['chart.js', 'react-chartjs-2'],
                    // Country/state data (~651KB, lazy-loaded via Shipping page)
                    'vendor-geo': ['country-state-city'],
                    // Animation library
                    'vendor-motion': ['framer-motion'],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    optimizeDeps: {
        include: [
            '@mui/material/Tooltip',
            '@emotion/styled',
            '@emotion/react',
            '@mui/icons-material'
        ],
    },
});
