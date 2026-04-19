"use client"

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, Send } from 'lucide-react'

const FAQ: Record<string, string> = {
  'cómo cargo productos': 'Andá a Catálogo en el menú lateral. Clickeá "+ Agregar producto" y completá nombre, precio, descripción y foto. Podés organizar por categorías.',
  'cómo creo un cupón': 'Andá a Marketing → pestaña "Cupones" → "+ Nuevo cupón". Elegí el código, tipo de descuento (% o fijo), y monto mínimo.',
  'cómo veo mis pedidos': 'En la sección Pedidos del menú lateral ves todos tus pedidos. Clickeá en uno para ver el detalle y chatear con el cliente.',
  'cómo cambio mi plan': 'Andá a Suscripción en el menú lateral. Ahí ves tu plan actual y podés hacer upgrade a un plan superior.',
  'cómo personalizo mi tienda': 'En Configuración podés cambiar los datos de tu negocio. Los colores de tu tienda se configuran desde tu perfil de restaurante.',
  'cómo funciona el delivery': 'Podés usar tus propios repartidores (ellos usan la app Runbits Rider con GPS y QR) o retiro en local. Más adelante vamos a integrar servicios de envío externos.',
  'qué incluye mi plan': 'Todos los planes incluyen pedidos y catálogo ilimitados. Las diferencias están en cupones, promos, IA, personalización y soporte. Revisá la sección Suscripción para ver los detalles.',
  'cómo agrego fotos': 'Cuando creás o editás un producto en Catálogo, hay un campo para subir foto. Aceptamos JPG, PNG y WebP hasta 5MB.',
  'necesito ayuda': 'Podés escribirnos a soporte@runbits.io o usar este chat para consultas rápidas. Si tenés un plan Growth o superior, tu respuesta es prioritaria.',
}

function findAnswer(question: string): string {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const words = q.replace(/[¿?¡!,.:]/g, '').split(/\s+/).filter(w => w.length > 2)
  let bestMatch = ''
  let bestScore = 0
  for (const [key, answer] of Object.entries(FAQ)) {
    const k = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const kWords = k.split(/\s+/)
    const matchCount = kWords.filter(w => words.some(qw => qw.includes(w) || w.includes(qw))).length
    const score = matchCount / kWords.length
    if (score > bestScore) { bestScore = score; bestMatch = answer }
  }
  if (bestScore >= 0.4) return bestMatch
  return 'No encontré una respuesta exacta. Probá preguntar sobre: cargar productos, crear cupones, ver pedidos, cambiar plan, personalizar tienda, delivery. O escribinos a soporte@runbits.io.'
}

type Message = { role: 'user' | 'assistant'; text: string }

export function HelpWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente de Runbits. ¿En qué te puedo ayudar?' },
  ])
  const [input, setInput] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  function send() {
    if (!input.trim()) return
    const q = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: findAnswer(q) }])
    }, 400)
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center hover:scale-105"
          title="¿Necesitás ayuda?"
        >
          <MessageCircleQuestion className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5" />
              <span className="font-semibold text-sm">Ayuda Runbits</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-emerald-700 rounded-lg p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 border-b border-gray-100 flex gap-1.5 overflow-x-auto shrink-0">
            {['Cargar productos', 'Crear cupón', 'Ver pedidos', 'Cambiar plan'].map(q => (
              <button
                key={q}
                onClick={() => { setInput(''); setMessages(prev => [...prev, { role: 'user', text: `¿Cómo ${q.toLowerCase()}?` }]); setTimeout(() => setMessages(prev => [...prev, { role: 'assistant', text: findAnswer(q.toLowerCase()) }]), 400) }}
                className="shrink-0 text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribí tu pregunta..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button onClick={send} disabled={!input.trim()} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
