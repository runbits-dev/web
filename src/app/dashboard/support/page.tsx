"use client"

import { useEffect, useState, useRef } from 'react'
import { Plus, Send, MessageSquare, Clock, Check, X, Loader2, Trash2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

type Conversation = {
  id: string; title: string; status: string; role: string; created_at: number; updated_at: number
  messages?: Message[]
}
type Message = { id: string; role: string; content: string; created_at: number }

function getHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'ahora'
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)}h`
  return new Date(ts).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function SupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [active, setActive] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight) }, [messages, sending])

  async function loadConversations() {
    try {
      const res = await fetch(`${API}/api/support/conversations`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.data || data.conversations || [])
      }
    } catch {}
    setLoading(false)
  }

  async function loadConversation(id: string) {
    const res = await fetch(`${API}/api/support/conversations/${id}`, { headers: getHeaders() })
    if (res.ok) {
      const conv = await res.json()
      setActive(conv)
      setMessages(conv.messages || [])
    }
  }

  async function createConversation() {
    setCreating(true)
    try {
      const res = await fetch(`${API}/api/support/conversations`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ title: 'Nueva consulta' }),
      })
      if (res.ok) {
        const conv = await res.json()
        await loadConversations()
        await loadConversation(conv.id)
      }
    } catch {}
    setCreating(false)
  }

  async function sendMessage() {
    if (!input.trim() || !active || sending) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: q, created_at: Date.now() }])
    setSending(true)
    try {
      const res = await fetch(`${API}/api/support/conversations/${active.id}/message`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ message: q }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => {
          const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'))
          return [...withoutTemp,
            { id: `u-${Date.now()}`, role: 'user', content: q, created_at: Date.now() },
            { id: `a-${Date.now()}`, role: 'assistant', content: data.reply, created_at: Date.now() },
          ]
        })
        loadConversations()
      }
    } catch {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: 'Error de conexión. Intentá de nuevo.', created_at: Date.now() }])
    }
    setSending(false)
  }

  async function closeConversation(id: string) {
    await fetch(`${API}/api/support/conversations/${id}`, {
      method: 'PATCH', headers: getHeaders(),
      body: JSON.stringify({ status: 'closed' }),
    })
    if (active?.id === id) { setActive(null); setMessages([]) }
    loadConversations()
  }

  async function deleteConversation(id: string) {
    if (!confirm('¿Eliminar esta conversación?')) return
    await fetch(`${API}/api/support/conversations/${id}`, { method: 'DELETE', headers: getHeaders() })
    if (active?.id === id) { setActive(null); setMessages([]) }
    loadConversations()
  }

  const openConvs = conversations.filter(c => c.status === 'open')
  const closedConvs = conversations.filter(c => c.status === 'closed')

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar — conversations list */}
      <div className="w-72 shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-slate-900">Soporte</h1>
          <button onClick={createConversation} disabled={creating}
            className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Nueva
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && <p className="text-sm text-slate-400 text-center py-4">Cargando...</p>}

          {openConvs.length > 0 && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold px-2 py-1">Abiertas</p>
              {openConvs.map(conv => (
                <button key={conv.id} onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors group ${active?.id === conv.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900 truncate flex-1">{conv.title || 'Sin título'}</p>
                    <div className="hidden group-hover:flex gap-0.5 shrink-0">
                      <button onClick={e => { e.stopPropagation(); closeConversation(conv.id) }} title="Cerrar" className="p-0.5 text-slate-400 hover:text-slate-600"><Check className="w-3 h-3" /></button>
                      <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id) }} title="Eliminar" className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(conv.updated_at)}</p>
                </button>
              ))}
            </>
          )}

          {closedConvs.length > 0 && (
            <>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold px-2 py-1 mt-3">Cerradas</p>
              {closedConvs.slice(0, 5).map(conv => (
                <button key={conv.id} onClick={() => loadConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active?.id === conv.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                  <p className="text-sm text-slate-500 truncate">{conv.title || 'Sin título'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(conv.updated_at)}</p>
                </button>
              ))}
            </>
          )}

          {!loading && conversations.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay conversaciones</p>
              <p className="text-xs text-slate-400 mt-1">Creá una nueva para empezar</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {active ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{active.title || 'Conversación'}</h2>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeAgo(active.created_at)}
                  {active.status === 'closed' && <span className="ml-2 text-slate-400">· Cerrada</span>}
                </p>
              </div>
              {active.status === 'open' && (
                <button onClick={() => closeConversation(active.id)} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
                  Cerrar conversación
                </button>
              )}
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && !sending && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400">Escribí tu consulta para empezar.</p>
                  <p className="text-xs text-slate-400 mt-1">Puedo consultar tus pedidos, catálogo, estadísticas y más.</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-400 rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Consultando...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            {active.status === 'open' && (
              <div className="px-5 py-3 border-t border-slate-100 flex gap-3 shrink-0">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribí tu consulta..."
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
            {active.status === 'closed' && (
              <div className="px-5 py-3 border-t border-slate-100 text-center shrink-0">
                <p className="text-xs text-slate-400">Esta conversación está cerrada. <button onClick={createConversation} className="text-indigo-600 font-medium hover:underline">Crear nueva</button></p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Seleccioná una conversación o creá una nueva</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
