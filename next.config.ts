import type { NextConfig } from 'next'

// Static export is used for Cloudflare Pages production deploy.
// During tests (Playwright) we need a real Next.js server (next start),
// so we disable static export when NEXT_STATIC_EXPORT is not set.
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true'

const nextConfig: NextConfig = {
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
  }),
  images: { unoptimized: true },
}

export default nextConfig
