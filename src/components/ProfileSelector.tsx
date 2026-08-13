"use client"

import { type Profile } from '@/lib/api'
import { Store, User, Layers, ChevronRight, Plus } from 'lucide-react'

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  food: 'Comida',
  appointment: 'Turnos',
  task: 'Servicios',
  realtime: 'Viajes',
  'food+appointment': 'Comida + Turnos',
}

const BUSINESS_TYPE_COLORS: Record<string, string> = {
  food: 'bg-orange-100 text-orange-700',
  appointment: 'bg-purple-100 text-purple-700',
  task: 'bg-teal-100 text-teal-700',
  realtime: 'bg-sky-100 text-sky-700',
  'food+appointment': 'bg-pink-100 text-pink-700',
}

function ProfileIcon({ operationType }: { operationType: string }) {
  if (operationType === 'independent') return <User className="w-6 h-6 text-indigo-500" />
  if (operationType === 'business') return <Store className="w-6 h-6 text-indigo-500" />
  return <Layers className="w-6 h-6 text-indigo-500" />
}

type Props = {
  profiles: Profile[]
  onSelect: (id: string) => void
  onCreateNew: () => void
}

export function ProfileSelector({ profiles, onSelect, onCreateNew }: Props) {
  return (
    <div className="fixed inset-0 bg-white z-[80] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">¿Con qué perfil querés operar?</h1>
          <p className="text-sm text-gray-500 mt-2">Seleccioná el perfil para continuar al panel.</p>
        </div>

        <div className="space-y-3">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <ProfileIcon operationType={profile.operation_type} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{profile.display_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BUSINESS_TYPE_COLORS[profile.business_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {BUSINESS_TYPE_LABELS[profile.business_type] ?? profile.business_type}
                  </span>
                  <span className="text-[10px] text-gray-400 capitalize">
                    {profile.operation_type === 'independent' ? 'Independiente' : 'Negocio / Empresa'}
                  </span>
                  {profile.is_default && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
                      Principal
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>

        <button
          onClick={onCreateNew}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Crear nuevo perfil
        </button>
      </div>
    </div>
  )
}
