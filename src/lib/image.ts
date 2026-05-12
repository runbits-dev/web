// Image optimization helpers via Cloudflare Image Resizing.
//
// CF Image Resizing is enabled on the runbits.app zone. The /cdn-cgi/image/
// endpoint serves on-the-fly WebP/AVIF + responsive sizes. Source images can
// be R2 assets (runbits-storage) or any HTTPS URL on Runbits domains.
//
// Only Runbits-hosted images and HTTPS URLs from runbits.dev / R2 are routed
// through the resizer. data: URLs (FileReader previews), blob: URLs, and
// other origins pass through unchanged.

export type ImageOptions = {
  width?: number
  height?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpeg'
  quality?: number
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
}

const RESIZER_HOST = 'https://runbits.app'
const R2_PUBLIC_BASE = 'https://runbits-storage.r2.dev'
// Same-zone proxy implemented by runbits-app /functions/r2/[[path]].ts.
const R2_PROXY_PREFIX = `${RESIZER_HOST}/r2/`

function isRunbitsAsset(src: string): boolean {
  if (src.startsWith('data:') || src.startsWith('blob:')) return false
  return (
    src.includes('runbits.dev') ||
    src.includes('runbits.app') ||
    src.includes('runbits-storage.r2.dev') ||
    src.startsWith('/')
  )
}

function toSameZoneSource(src: string): string {
  if (src.startsWith(R2_PUBLIC_BASE + '/')) {
    return R2_PROXY_PREFIX + src.slice(R2_PUBLIC_BASE.length + 1)
  }
  return src
}

export function optimizedImageUrl(src: string, opts: ImageOptions = {}): string {
  if (!src) return src
  if (!isRunbitsAsset(src)) return src

  const params: string[] = [
    `width=${opts.width ?? 800}`,
    `format=${opts.format ?? 'auto'}`,
    `quality=${opts.quality ?? 80}`,
  ]
  if (opts.height) params.push(`height=${opts.height}`)
  if (opts.fit) params.push(`fit=${opts.fit}`)
  const cdnPath = params.join(',')

  const source = toSameZoneSource(src)
  if (source.startsWith('http')) {
    return `${RESIZER_HOST}/cdn-cgi/image/${cdnPath}/${source}`
  }
  return `/cdn-cgi/image/${cdnPath}${source.startsWith('/') ? source : '/' + source}`
}

export function responsiveSrcSet(
  src: string,
  widths: number[] = [400, 800, 1200, 1600],
  opts: Omit<ImageOptions, 'width'> = {}
): string {
  if (!src || !isRunbitsAsset(src)) return ''
  return widths
    .map(w => `${optimizedImageUrl(src, { ...opts, width: w })} ${w}w`)
    .join(', ')
}
