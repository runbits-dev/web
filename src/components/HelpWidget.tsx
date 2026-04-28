"use client"

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, Send, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.runbits.dev'

type Message = { role: 'user' | 'assistant'; text: string }

async function chatRequest(message: string, history: Array<{ role: string; content: string }>): Promise<string> {
  // Use api.ts request() which handles token refresh automatically
  try {
    const data = await api.supportChat(message, history)
    return data.reply || 'Error al procesar'
  } catch {
    return 'Error de conexión. Intentá de nuevo o escribinos a soporte@runbits.io.'
  }
}

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente de Runbits. Puedo consultar tus pedidos, catálogo, estadísticas y más. ¿En qué te ayudo?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages, loading])

  async function send() {
    if (!input.trim() || loading) return
    const q = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', text: q }]
    setMessages(newMessages)
    setLoading(true)
    const reply = await chatRequest(q, newMessages.slice(1).map(m => ({ role: m.role, content: m.text })))
    setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    setLoading(false)
  }

  async function quickAction(label: string) {
    const newMessages: Message[] = [...messages, { role: 'user', text: label }]
    setMessages(newMessages)
    setLoading(true)
    const reply = await chatRequest(label, [{ role: 'user', content: label }])
    setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    setLoading(false)
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center hover:scale-105"
          title="¿Necesitás ayuda?"
        >
          <MessageCircleQuestion className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5" />
              <span className="font-semibold text-sm">Soporte Runbits</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-indigo-700 rounded-lg p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto shrink-0">
            {[
              '¿Cuántos pedidos tengo hoy?',
              '¿Cuál es mi plan?',
              '¿Cómo cargo productos?',
            ].map(q => (
              <button key={q} onClick={() => quickAction(q)}
                className="shrink-0 text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-400 rounded-xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Consultando...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribí tu pregunta..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={send} disabled={!input.trim() || loading} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
