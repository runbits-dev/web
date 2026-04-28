"use client"
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function StoreRedirect() {
  const searchParams = useSearchParams()
  useEffect(() => {
    const params = searchParams.toString()
    window.location.href = `https://runbits.app/store${params ? '?' + params : ''}`
  }, [searchParams])
  return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm">Redirigiendo...</p></div>
}

export default function StorePage() {
  return <Suspense fallback={<div />}><StoreRedirect /></Suspense>
}
