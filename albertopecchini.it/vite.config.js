import { defineConfig } from 'vite'
import sitePages from './plugins/site-pages.js'
import apiDev from './plugins/api-dev.js'

// Il sito è statico: le pagine HTML sono generate da `src/templates` a partire
// dai dati in `src/data`. Vite si occupa solo di JS, CSS e font; in sviluppo
// serve anche le funzioni di api/ (vedi plugins/api-dev.js).
export default defineConfig({
  plugins: [apiDev(), sitePages()],
  build: {
    target: 'es2022',
    cssMinify: true,
    assetsInlineLimit: 0,
  },
  server: { port: 5173, strictPort: false },
})
