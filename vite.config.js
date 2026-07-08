import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn } from 'child_process'
import path from 'path'

// Vite plugin to launch the zero-dependency SQLite backend server automatically
function backendServerPlugin() {
  return {
    name: 'backend-server',
    configureServer(server) {
      const serverPath = path.resolve(process.cwd(), 'server', 'server.js')
      console.log(`[Vite Backend] Launching SQLite server: ${serverPath}`)
      
      // Spawn node backend with experimental SQLite module enabled
      const child = spawn('node', ['--experimental-sqlite', serverPath], {
        stdio: 'inherit',
        shell: true
      })

      child.on('error', (err) => {
        console.error('[Vite Backend] Failed to start backend server:', err)
      })

      process.on('exit', () => {
        child.kill()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    backendServerPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
