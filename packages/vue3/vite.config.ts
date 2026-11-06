import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpeedCollaborationVue3',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [
        'vue',
        'yjs',
        '@hocuspocus/provider',
        '@speed-collaboration/core',
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})

