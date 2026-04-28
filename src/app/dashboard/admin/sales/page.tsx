"use client"

import { useEffect, useState } from 'react'
import { Plus, Send, Eye, RotateCcw, Trash2, UserPlus, Mail, Check, X as XIcon, Loader2 } from 'lucide-react'

const API = 'https://api.runbits.dev'

type Lead = {
  id: string
  businessName: string
  email: string
  category: string
  city: string
  phone?: string
  notes?: string
  addedAt: number
  lastContactedAt?: number
  contactCount: number
  status: string
  lastPreview?: { subject: string; html: string; generatedAt: number }
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-blue-50 text-blue-700' },
  preview_ready: { label: 'Preview listo', color: 'bg-amber-50 text-amber-700' },
  contacted: { label: 'Contactado', color: 'bg-indigo-50 text-indigo-700' },
  followed_up: { label: 'Follow-up', color: 'bg-violet-50 text-violet-700' },
  responded: { label: 'Respondió', color: 'bg-green-50 text-green-700' },
  converted: { label: 'Convertido', color: 'bg-green-50 text-green-800' },
  unsubscribed: { label: 'Desuscrito', color: 'bg-red-50 text-red-700' },
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  }
}

export default function SalesAgentPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [previewLead, setPreviewLead] = useState<Lead | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState<string | null>(null)

  // Add lead form
  const [newLead, setNewLead] = useState({ businessName: '', email: '', category: '', city: '', phone: '', notes: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/sales/leads`, { headers: getHeaders() }),
        fetch(`${API}/api/admin/sales/stats`, { headers: getHeaders() }),
      ])
      if (leadsRes.ok) { const d = await leadsRes.json(); setLeads(d.leads || []) }
      if (statsRes.ok) setStats(await statsRes.json())
    } catch {}
    setLoading(false)
  }

  async function addLead() {
    if (!newLead.businessName || !newLead.email) return
    await fetch(`${API}/api/admin/sales/leads`, {
      method: 'POST', headers: getHeaders(),
      body: JSON.stringify({ leads: [newLead] }),
    })
    setNewLead({ businessName: '', email: '', category: '', city: '', phone: '', notes: '' })
    setShowAdd(false)
    loadData()
  }

  async function generatePreview(lead: Lead) {
    setPreviewLoading(true)
    setPreviewLead(lead)
    try {
      const res = await fetch(`${API}/api/admin/sales/leads/${lead.id}/preview`, { method: 'POST', headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPreviewLead(data.lead)
        loadData()
      }
    } catch {}
    setPreviewLoading(false)
  }

  async function sendEmail(lead: Lead) {
    if (!confirm(`¿Enviar email a ${lead.businessName} (${lead.email})?`)) return
    setSendLoading(lead.id)
    try {
      const res = await fetch(`${API}/api/admin/sales/leads/${lead.id}/send`, { method: 'POST', headers: getHeaders(), body: '{}' })
      if (res.ok) {
        setPreviewLead(null)
        loadData()
      } else {
        const err = await res.json()
        alert(err.error || 'Error al enviar')
      }
    } catch {}
    setSendLoading(null)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API}/api/admin/sales/leads/${id}`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify({ status }),
    })
    loadData()
    if (previewLead?.id === id) setPreviewLead(null)
  }

  async function deleteLead(id: string) {
    if (!confirm('¿Eliminar este lead?')) return
    await fetch(`${API}/api/admin/sales/leads/${id}`, { method: 'DELETE', headers: getHeaders() })
    loadData()
    if (previewLead?.id === id) setPreviewLead(null)
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales Agent</h1>
          <p className="text-slate-500 text-sm mt-1">Outreach semi-autónomo — preview y aprobá antes de enviar</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
          <UserPlus className="w-4 h-4" /> Agregar lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats[key] || 0}</p>
            <p className="text-xs text-slate-500">{cfg.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Leads list */}
        <div className={`${previewLead ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {leads.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                No hay leads. Agregá el primero.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <div key={lead.id} className={`px-4 py-3 hover:bg-slate-50 ${previewLead?.id === lead.id ? 'bg-indigo-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{lead.businessName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusConfig[lead.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                            {statusConfig[lead.status]?.label || lead.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{lead.email} · {lead.category} · {lead.city}</p>
                        {lead.contactCount > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{lead.contactCount} contacto(s) · último: {new Date(lead.lastContactedAt!).toLocaleDateString('es-AR')}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(lead.status === 'new' || lead.status === 'contacted' || lead.status === 'followed_up') && (
                          <button onClick={() => generatePreview(lead)} title="Generar preview" className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {lead.status === 'preview_ready' && (
                          <button onClick={() => setPreviewLead(lead)} title="Ver preview" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {lead.status === 'contacted' || lead.status === 'followed_up' ? (
                          <button onClick={() => updateStatus(lead.id, 'responded')} title="Marcar como respondió" className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600">
                            <Check className="w-4 h-4" />
                          </button>
                        ) : null}
                        <button onClick={() => deleteLead(lead.id)} title="Eliminar" className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        {previewLead && (
          <div className="w-1/2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Preview — {previewLead.businessName}</h3>
                <button onClick={() => setPreviewLead(null)} className="text-slate-400 hover:text-slate-600">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              {previewLoading ? (
                <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /><p className="text-sm text-slate-400 mt-2">Generando email con IA...</p></div>
              ) : previewLead.lastPreview ? (
                <>
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Para: {previewLead.email}</p>
                    <p className="text-xs text-slate-500">Subject:</p>
                    <p className="text-sm font-medium text-slate-900">{previewLead.lastPreview.subject}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 mb-4 max-h-[300px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: previewLead.lastPreview.html }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => sendEmail(previewLead)} disabled={sendLoading === previewLead.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                      {sendLoading === previewLead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendLoading === previewLead.id ? 'Enviando...' : 'Aprobar y enviar'}
                    </button>
                    <button onClick={() => generatePreview(previewLead)} className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerar
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400 mb-3">No hay preview generado</p>
                  <button onClick={() => generatePreview(previewLead)} className="text-sm text-indigo-600 font-medium hover:underline">Generar preview</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add lead modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Agregar lead</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nombre del negocio *</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newLead.businessName} onChange={e => setNewLead(f => ({ ...f, businessName: e.target.value }))} placeholder="Pizzería Don Juan" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                <input type="email" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newLead.email} onChange={e => setNewLead(f => ({ ...f, email: e.target.value }))} placeholder="contacto@negocio.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Categoría</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newLead.category} onChange={e => setNewLead(f => ({ ...f, category: e.target.value }))} placeholder="restaurante" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Ciudad</label>
                  <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newLead.city} onChange={e => setNewLead(f => ({ ...f, city: e.target.value }))} placeholder="Córdoba" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Teléfono</label>
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={newLead.phone} onChange={e => setNewLead(f => ({ ...f, phone: e.target.value }))} placeholder="+54 9 351 ..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Notas (contexto para la IA)</label>
                <textarea className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" rows={2} value={newLead.notes} onChange={e => setNewLead(f => ({ ...f, notes: e.target.value }))} placeholder="Vi que no tienen presencia online..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={addLead} disabled={!newLead.businessName || !newLead.email} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
