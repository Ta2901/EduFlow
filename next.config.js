const fs = require('fs')
const path = require('path')

function loadLocalEnvFiles() {
  const files = ['.env.production.local', '.env.local', '.env.production', '.env']
  for (const name of files) {
    const file = path.join(__dirname, name)
    if (!fs.existsSync(file)) continue
    for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq < 1) continue
      const key = line.slice(0, eq).trim()
      const val = line
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

loadLocalEnvFiles()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Polling avoids EMFILE on macOS when native file watchers exhaust limits.
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      }
    }
    return config
  },
}

module.exports = nextConfig
