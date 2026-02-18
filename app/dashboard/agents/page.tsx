'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { Users, Trash2, Plus, Mail, Phone, Briefcase, Search } from 'lucide-react'

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form Agente
  const [newAgent, setNewAgent] = useState({ name: '', email: '', role: 'Sales', phone: '' })
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(user) {
        setUser(user)
        // Carica dalla tabella vera
        const { data, error } = await supabase.from('team_members').select('*').eq('user_id', user.id)
        if(data) setAgents(data)
        if(error) console.error("Errore fetch agenti:", error)
    }
    setLoading(false)
  }

  const handleAddAgent = async () => {
      if(!newAgent.name || !newAgent.email) return alert("Nome ed Email sono obbligatori");
      
      const { data, error } = await supabase.from('team_members').insert({
          user_id: user.id,
          name: newAgent.name,
          email: newAgent.email,
          role: newAgent.role,
          // phone: newAgent.phone // Se hai aggiunto la colonna phone al DB, scommenta
      }).select().single()

      if(data) {
          setAgents([...agents, data])
          setIsModalOpen(false)
          setNewAgent({ name: '', email: '', role: 'Sales', phone: '' })
      } else {
          alert("Errore salvataggio: " + error?.message)
      }
  }

  const handleDelete = async (id: number) => {
      if(!confirm("Eliminare definitivamente questo membro del team?")) return;
      
      const { error } = await supabase.from('team_members').delete().eq('id', id)
      
      if(!error) {
          setAgents(agents.filter(a => a.id !== id))
      } else {
          alert("Errore eliminazione: " + error.message)
      }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Team...</div>

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] min-h-screen text-gray-900 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-black text-[#00665E]">Agenti & Team</h1>
            <p className="text-gray-500 text-sm">Gestisci la tua rete vendita.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#004d46] transition">
           <Plus size={20}/> Aggiungi Membro
        </button>
      </div>

      {/* STATISTICHE RAPIDE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Totale Team</h3>
              <p className="text-3xl font-black text-gray-900 mt-2">{agents.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Ruoli Sales</h3>
              <p className="text-3xl font-black text-[#00665E] mt-2">{agents.filter(a => a.role === 'Sales').length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-gray-400 text-xs font-bold uppercase">Manager</h3>
              <p className="text-3xl font-black text-orange-500 mt-2">{agents.filter(a => a.role === 'Manager').length}</p>
          </div>
      </div>

      {/* TABELLA AGENTI */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Elenco Collaboratori</h3>
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={14}/>
                  <input placeholder="Cerca..." className="pl-8 pr-4 py-2 rounded-lg border border-gray-200 text-xs w-48 outline-none focus:border-[#00665E]" />
              </div>
          </div>
          
          {agents.length === 0 ? (
              <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                  <Users size={48} className="mb-4 opacity-20"/>
                  <p>Nessun agente nel team. Aggiungi il primo!</p>
              </div>
          ) : (
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-4">Nome</th>
                          <th className="px-6 py-4">Contatti</th>
                          <th className="px-6 py-4">Ruolo</th>
                          <th className="px-6 py-4 text-right">Azioni</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {agents.map(agent => (
                          <tr key={agent.id} className="hover:bg-blue-50/30 transition group">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-[#00665E] text-white flex items-center justify-center font-bold shadow-md">
                                          {agent.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-bold text-gray-900">{agent.name}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 text-gray-500">
                                      <span className="flex items-center gap-2"><Mail size={12}/> {agent.email}</span>
                                      {agent.phone && <span className="flex items-center gap-2"><Phone size={12}/> {agent.phone}</span>}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${agent.role === 'Manager' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                      {agent.role}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDelete(agent.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition">
                                      <Trash2 size={18}/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
      </div>

      {/* MODALE CREAZIONE */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900">✕</button>
                  <h2 className="text-xl font-black text-[#00665E] mb-6">Nuovo Collaboratore</h2>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500">Nome Completo</label>
                          <div className="relative">
                              <Users className="absolute top-3.5 left-3 text-gray-400" size={16}/>
                              <input className="w-full p-3 pl-10 border border-gray-200 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} placeholder="Es. Mario Rossi" />
                          </div>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500">Email Aziendale</label>
                          <div className="relative">
                              <Mail className="absolute top-3.5 left-3 text-gray-400" size={16}/>
                              <input type="email" className="w-full p-3 pl-10 border border-gray-200 rounded-xl mt-1 outline-none focus:border-[#00665E]" value={newAgent.email} onChange={e => setNewAgent({...newAgent, email: e.target.value})} placeholder="mario@azienda.it" />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500">Ruolo</label>
                          <div className="relative">
                              <Briefcase className="absolute top-3.5 left-3 text-gray-400" size={16}/>
                              <select className="w-full p-3 pl-10 border border-gray-200 rounded-xl mt-1 outline-none focus:border-[#00665E] bg-white" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})}>
                                  <option value="Sales">Sales / Agente</option>
                                  <option value="Manager">Manager / Capo Area</option>
                                  <option value="Admin">Admin</option>
                              </select>
                          </div>
                      </div>

                      <button onClick={handleAddAgent} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg mt-2">
                          Salva e Aggiungi
                      </button>
                  </div>
              </div>
          </div>
      )}
    </main>
  )
}