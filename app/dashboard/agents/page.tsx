'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { Users, Mail, TrendingUp, Plus, Trash2, UserCheck } from 'lucide-react'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', email: '', role: 'Sales' })

  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    // In futuro qui collegheremo una tabella 'team_members' reale.
    // Per ora usiamo una tabella simulata o i profili se hai un sistema multi-utente.
    // Simuliamo i dati per farti vedere la grafica subito:
    setLoading(false)
  }

  const handleAddAgent = () => {
      if(!newAgent.name || !newAgent.email) return alert("Compila i campi");
      const fakeAgent = { id: Date.now(), ...newAgent, sales: 0, status: 'Active' }
      setAgents([...agents, fakeAgent])
      setIsModalOpen(false)
      setNewAgent({ name: '', email: '', role: 'Sales' })
  }

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Gestione Team & Agenti</h1>
          <p className="text-gray-500 text-sm">Gestisci la tua rete vendita umana.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] shadow-lg">
           <Plus size={20}/> Aggiungi Agente
        </button>
      </div>

      {/* STATS RAPIDE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Totale Agenti</h3>
              <p className="text-3xl font-black text-gray-900 mt-2">{agents.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Vendite Totali Team</h3>
              <p className="text-3xl font-black text-[#00665E] mt-2">€ 0,00</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Top Performer</h3>
              <p className="text-3xl font-black text-orange-500 mt-2">-</p>
          </div>
      </div>

      {/* LISTA AGENTI */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-gray-500 text-xs uppercase flex justify-between">
              <span>Membro del Team</span>
              <span>Ruolo</span>
              <span>Stato</span>
              <span>Azioni</span>
          </div>
          {agents.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                  <Users size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>Nessun agente nel team. Aggiungine uno!</p>
              </div>
          ) : (
              agents.map(agent => (
                  <div key={agent.id} className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {agent.name.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-gray-900">{agent.name}</p>
                              <p className="text-xs text-gray-400">{agent.email}</p>
                          </div>
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold">{agent.role}</span>
                      <span className="text-green-600 text-xs font-bold flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> {agent.status}</span>
                      <button onClick={() => setAgents(agents.filter(a => a.id !== agent.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
              ))
          )}
      </div>

      {/* MODALE */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                  <h2 className="text-xl font-black mb-6">Nuovo Membro Team</h2>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500">Nome Completo</label>
                          <input className="w-full p-3 border rounded-xl mt-1" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} placeholder="Mario Rossi" />
                      </div>
                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500">Email Aziendale</label>
                          <input className="w-full p-3 border rounded-xl mt-1" value={newAgent.email} onChange={e => setNewAgent({...newAgent, email: e.target.value})} placeholder="mario@azienda.it" />
                      </div>
                      <button onClick={handleAddAgent} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold mt-4">Aggiungi al Team</button>
                      <button onClick={() => setIsModalOpen(false)} className="w-full text-gray-400 py-2 text-sm">Annulla</button>
                  </div>
              </div>
          </div>
      )}
    </main>
  )
}