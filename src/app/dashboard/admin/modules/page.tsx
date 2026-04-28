"use client"

import { MODULES, MODULE_CATEGORIES, PLAN_ORDER } from '@/lib/modules'

const planBadge: Record<string, string> = {
  free: 'bg-slate-100 text-slate-600',
  pro: 'bg-blue-50 text-blue-700',
  business: 'bg-violet-50 text-violet-700',
  enterprise: 'bg-amber-50 text-amber-700',
}

const categoryLabel: Record<string, string> = {
  sales: 'Ventas',
  logistics: 'Logística',
  communication: 'Comunicación',
  operations: 'Operaciones',
}

export default function AdminModulesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Modules</h1>
        <p className="text-slate-500 text-sm mt-1">
          Definiciones de todos los módulos disponibles en la plataforma. Los comercios activan sus propios módulos desde su dashboard.
        </p>
      </div>

      <div className="space-y-8">
        {MODULE_CATEGORIES.map(cat => {
          const mods = MODULES.filter(m => m.category === cat.id)
          return (
            <div key={cat.id}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat.label}</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Modulo</th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Descripcion</th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Plan minimo</th>
                      <th className="text-right px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Precio</th>
                      <th className="text-left px-6 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Aplica a</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mods.map(mod => (
                      <tr key={mod.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{mod.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{mod.id}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs">{mod.description}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${planBadge[mod.minPlan] || 'bg-slate-100 text-slate-600'}`}>
                            {mod.minPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {mod.price === 0 ? (
                            <span className="text-green-600 font-medium text-xs">Incluido</span>
                          ) : (
                            <span className="text-slate-700 font-semibold">${mod.price}<span className="text-slate-400 font-normal text-xs">/mes</span></span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {mod.applicableTo.includes('all') ? 'Todos' : mod.applicableTo.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
