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
