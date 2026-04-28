"use client"

import { useEffect, useState } from 'react'
import { Search, ShieldCheck, ShieldX, Mail, Phone, Calendar, Loader2, Download, CheckSquare, Square } from 'lucide-react'

const API = 'https://api.runbits.dev'

type User = {
  id: string; email: string; name: string; phone: string; auth_provider: string
  status: string; email_verified: number; created_at: number
  roles: Array<{ role: string; entity_id: string; is_primary: number }>
}

const roleColors: Record<string, string> = {
  customer: 'bg-blue-50 text-blue-700',
  restaurant_owner: 'bg-indigo-50 text-indigo-700',
  rider: 'bg-amber-50 text-amber-700',
  admin: 'bg-red-50 text-red-700',
  super_admin: 'bg-red-50 text-red-700',
  superadmin: 'bg-red-50 text-red-700',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-slate-50 text-slate-500',
  suspended: 'bg-red-50 text-red-700',
}

function getHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => { loadUsers() }, [roleFilter, verifiedFilter, dateFrom, dateTo])

  async function loadUsers(q?: string) {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (q || search) params.set('q', q || search)
    if (roleFilter) params.set('role', roleFilter)
    if (verifiedFilter !== '') params.set('email_verified', verifiedFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    try {
      const res = await fetch(`${API}/api/admin/users?${params}`, { headers: getHeaders() })
      if (res.ok) { const d = await res.json(); setUsers(d.data || []); setTotal(d.total || 0) }
    } catch {}
    setLoading(false)
  }

  async function loadDetail(id: string) {
    setDetailLoading(true)
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { headers: getHeaders() })
      if (res.ok) setSelected(await res.json())
    } catch {}
    setDetailLoading(false)
  }

  async function updateUser(id: string, data: Record<string, any>) {
    setActionLoading(id)
    await fetch(`${API}/api/admin/users/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) })
    loadUsers()
    if (selected?.account?.id === id) loadDetail(id)
    setActionLoading(null)
  }

  async function addRole(userId: string, role: string) {
    setActionLoading(userId)
    await fetch(`${API}/api/admin/users/${userId}/add-role`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ role }) })
    loadDetail(userId)
    loadUsers()
    setActionLoading(null)
  }

  async function removeRole(userId: string, roleId: string) {
    if (!confirm('¿Eliminar este rol?')) return
    setActionLoading(userId)
    await fetch(`${API}/api/admin/users/${userId}/roles/${roleId}`, { method: 'DELETE', headers: getHeaders() })
    loadDetail(userId)
    loadUsers()
    setActionLoading(null)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadUsers(search)
  }

  function toggleCheck(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setCheckedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleAll(e: React.MouseEvent) {
    e.stopPropagation()
    if (checkedIds.size === users.length) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(users.map(u => u.id)))
    }
  }

  async function bulkSuspend() {
    if (checkedIds.size === 0) return
    if (!confirm(`¿Suspender ${checkedIds.size} usuario(s)?`)) return
    setBulkLoading(true)
    await Promise.all([...checkedIds].map(id =>
      fetch(`${API}/api/admin/users/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status: 'inactive' }) })
    ))
    setCheckedIds(new Set())
    loadUsers()
    setBulkLoading(false)
  }

  function exportCSV() {
    const headers = 'Nombre,Email,Teléfono,Rol,Estado,Registrado\n'
    const rows = users.map(u =>
      `"${u.name}","${u.email}","${u.phone || ''}","${u.roles?.map(r => r.role).join('/')}","${u.status}","${new Date(u.created_at).toLocaleDateString('es-AR')}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'runbits-users.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const allChecked = users.length > 0 && checkedIds.size === users.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-1">{total} usuarios registrados</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </form>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Todos los roles</option>
          <option value="customer">Customer</option>
          <option value="restaurant_owner">Restaurant Owner</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>
        <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Verificación: todos</option>
          <option value="1">Verificado</option>
          <option value="0">No verificado</option>
        </select>
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Registrado desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            Limpiar fechas
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <span className="text-sm text-amber-800 font-medium">{checkedIds.size} seleccionado(s)</span>
          <button onClick={bulkSuspend} disabled={bulkLoading}
            className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">
            {bulkLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Suspender seleccionados
          </button>
          <button onClick={() => setCheckedIds(new Set())} className="text-xs text-amber-700 hover:underline ml-auto">
            Cancelar
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Users table */}
        <div className={`${selected ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No se encontraron usuarios</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Select-all header */}
                <div className="px-4 py-2 bg-slate-50 flex items-center gap-3">
                  <button onClick={toggleAll} className="text-slate-400 hover:text-indigo-600 transition-colors">
                    {allChecked
                      ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                      : <Square className="w-4 h-4" />}
                  </button>
                  <span className="text-xs text-slate-500">Seleccionar todos</span>
                </div>
                {users.map(u => (
                  <div key={u.id} onClick={() => loadDetail(u.id)}
                    className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${selected?.account?.id === u.id ? 'bg-indigo-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={e => toggleCheck(u.id, e)} className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0">
                        {checkedIds.has(u.id)
                          ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                          : <Square className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{u.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[u.status] || 'bg-slate-100 text-slate-500'}`}>
                            {u.status}
                          </span>
                          {u.email_verified ? <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> : null}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                        <div className="flex gap-1 mt-1">
                          {u.roles?.map((r, i) => (
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColors[r.role] || 'bg-slate-100 text-slate-600'}`}>
                              {r.role}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0">
                        {u.auth_provider}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-1/2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
              {detailLoading ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">{selected.account.name}</h3>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cerrar</button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {selected.account.email}
                      {selected.account.email_verified ? <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> : <ShieldX className="w-3.5 h-3.5 text-red-400" />}
                    </div>
                    {selected.account.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" /> {selected.account.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" /> Registrado: {new Date(selected.account.created_at).toLocaleDateString('es-AR')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <span>Último acceso: <span className="text-slate-400 italic">No disponible</span></span>
                      <span className="text-[10px] text-slate-300">(próximamente)</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Provider: {selected.account.auth_provider}
                      {selected.account.google_id && ' · Google'}
                      {selected.account.apple_id && ' · Apple'}
                      {selected.account.facebook_id && ' · Facebook'}
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="mb-5">
                    <h4 className="text-xs font-semibold text-slate-600 mb-2">Roles</h4>
                    <div className="space-y-1.5">
                      {selected.roles?.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${roleColors[r.role] || 'bg-slate-100'}`}>{r.role}</span>
                            {r.is_primary ? <span className="text-[10px] text-slate-400 ml-2">Primary</span> : null}
                          </div>
                          {r.status === 'active' && (
                            <button onClick={() => removeRole(selected.account.id, r.id)} className="text-[10px] text-red-400 hover:text-red-600">Remover</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {['customer', 'restaurant_owner', 'rider'].map(role => (
                        <button key={role} onClick={() => addRole(selected.account.id, role)}
                          className="text-[10px] text-indigo-600 hover:underline font-medium">+{role}</button>
                      ))}
                    </div>
                  </div>

                  {/* Profiles */}
                  {selected.profiles?.length > 0 && (
                    <div className="mb-5">
                      <h4 className="text-xs font-semibold text-slate-600 mb-2">Perfiles</h4>
                      {selected.profiles.map((p: any) => (
                        <div key={p.id} className="bg-slate-50 rounded-lg px-3 py-2 mb-1.5">
                          <p className="text-sm font-medium text-slate-900">{p.display_name || p.name}</p>
                          <p className="text-xs text-slate-500">{p.business_category} · {p.business_type} · {p.operation_type}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-slate-100 pt-4 flex gap-2">
                    {selected.account.status === 'active' ? (
                      <button onClick={() => updateUser(selected.account.id, { status: 'inactive' })}
                        disabled={actionLoading === selected.account.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Suspender cuenta
                      </button>
                    ) : (
                      <button onClick={() => updateUser(selected.account.id, { status: 'active' })}
                        disabled={actionLoading === selected.account.id}
                        className="text-xs text-green-600 hover:text-green-700 font-medium">
                        Reactivar cuenta
                      </button>
                    )}
                    {!selected.account.email_verified && (
                      <button onClick={() => updateUser(selected.account.id, { email_verified: true })}
                        disabled={actionLoading === selected.account.id}
                        className="text-xs text-indigo-600 hover:underline font-medium">
                        Verificar email
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
