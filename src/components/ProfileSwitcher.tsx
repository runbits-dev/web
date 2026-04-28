"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Check, Plus, Store, User, Layers } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'

function ProfileIcon({ operationType }: { operationType: string }) {
  if (operationType === 'independent') return <User className="w-4 h-4" />
  if (operationType === 'business') return <Store className="w-4 h-4" />
  return <Layers className="w-4 h-4" />
}

export function ProfileSwitcher() {
  const { activeProfile, profiles, switchProfile } = useProfile()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Hidden when user has only 1 profile
  if (!activeProfile || profiles.length <= 1) return null

  return (
    <div ref={ref} className="relative px-4 pt-3 pb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <ProfileIcon operationType={activeProfile.operation_type} />
        </div>
        <span className="flex-1 text-xs font-semibold text-slate-700 truncate">{activeProfile.display_name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => { setOpen(false); if (profile.id !== activeProfile.id) switchProfile(profile.id) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <ProfileIcon operationType={profile.operation_type} />
                </div>
                <span className="flex-1 text-xs font-medium text-slate-700 truncate">{profile.display_name}</span>
                {profile.id === activeProfile.id && (
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100">
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar perfil
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
