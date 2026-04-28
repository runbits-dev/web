"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, type Profile } from '@/lib/api'

type ProfileContextValue = {
  activeProfile: Profile | null
  profiles: Profile[]
  switchProfile: (id: string) => Promise<void>
  refreshProfiles: () => Promise<void>
  loading: boolean
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  profiles: [],
  switchProfile: async () => {},
  refreshProfiles: async () => {},
  loading: true,
})

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const refreshProfiles = useCallback(async () => {
    try {
      const user = await api.me()
      const fetchedProfiles = user.profiles ?? []
      setProfiles(fetchedProfiles)
      setActiveProfile(user.activeProfile ?? fetchedProfiles.find(p => p.is_default) ?? fetchedProfiles[0] ?? null)
    } catch {
      // Silently fail — auth error handled by request()
    }
  }, [])

  useEffect(() => {
    refreshProfiles().finally(() => setLoading(false))
  }, [refreshProfiles])

  const switchProfile = useCallback(async (id: string) => {
    const result = await api.switchProfile(id)
    localStorage.setItem('token', result.token)
    setActiveProfile(result.activeProfile)
    window.location.reload()
  }, [])

  return (
    <ProfileContext.Provider value={{ activeProfile, profiles, switchProfile, refreshProfiles, loading }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
