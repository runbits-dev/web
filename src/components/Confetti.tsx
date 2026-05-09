"use client"

import { useEffect, useState } from 'react'

/**
 * Lightweight CSS-only confetti — no deps. Renders a fixed full-screen overlay
 * with N animated colored squares that fall + rotate + fade. Auto-unmounts after `duration` ms.
 */
export function Confetti({ count = 80, duration = 2500, onDone }: { count?: number; duration?: number; onDone?: () => void }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false)
      onDone?.()
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  if (!show) return null

  // Generate particle styles deterministically per render (won't reflow on parent updates because it unmounts).
  const colors = ['#4f46e5', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7']
  const particles = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 600
    const fall = 1500 + Math.random() * 1000
    const rotate = (Math.random() * 720 - 360) | 0
    const color = colors[i % colors.length]
    const size = 6 + Math.random() * 8
    return { left, delay, fall, rotate, color, size, key: i }
  })

  return (
    <>
      <style jsx>{`
        @keyframes runbits-confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(var(--r, 360deg)); opacity: 0; }
        }
        .runbits-confetti-piece {
          position: fixed;
          top: 0;
          will-change: transform, opacity;
          animation-name: runbits-confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
          border-radius: 2px;
          pointer-events: none;
        }
      `}</style>
      <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
        {particles.map(p => (
          <span
            key={p.key}
            className="runbits-confetti-piece"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.fall}ms`,
              animationDelay: `${p.delay}ms`,
              ['--r' as any]: `${p.rotate}deg`,
            }}
          />
        ))}
      </div>
    </>
  )
}
