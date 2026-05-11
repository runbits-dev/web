"use client"

// OptimizedImage - thin <img> wrapper that pipes the src through Cloudflare
// Image Resizing for on-the-fly WebP/AVIF + responsive sizes.
//
// data: / blob: URLs (FileReader previews, etc.) bypass the resizer.

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { optimizedImageUrl, responsiveSrcSet } from '@/lib/image'

type Props = {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
  sizes?: string
  fit?: 'cover' | 'contain' | 'scale-down' | 'crop' | 'pad'
  quality?: number
  widths?: number[]
  fallbackClassName?: string
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading,
  priority,
  sizes,
  fit,
  quality,
  widths,
  fallbackClassName,
}: Props) {
  const [error, setError] = useState(false)

  if (error || !src) {
    return (
      <div
        className={
          fallbackClassName ??
          `bg-slate-200 flex items-center justify-center ${className ?? ''}`
        }
        role="img"
        aria-label={alt}
      >
        <ImageIcon className="w-1/3 h-1/3 text-slate-400" />
      </div>
    )
  }

  const resolvedWidth = width ?? 800
  const srcSet = responsiveSrcSet(src, widths ?? [400, 800, 1200, 1600], { fit, quality })

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedImageUrl(src, { width: resolvedWidth, fit, quality })}
      srcSet={srcSet || undefined}
      sizes={sizes ?? '(max-width: 640px) 100vw, 800px'}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : (loading ?? 'lazy')}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onError={() => setError(true)}
      className={className}
    />
  )
}
