/** @type {import('next').NextConfig} */
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // ensure Next.js resolves the correct project root when multiple lockfiles exist
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
