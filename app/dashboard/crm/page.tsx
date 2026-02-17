'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts'
import { Users, DollarSign, TrendingUp, AlertCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react'

export default function CRMPage() {
  // --- STATI ESISTENTI (LOGICA FUNZIONALE) ---
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati Modali
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false)
  const [isStrategyOpen, setIsStrategyOpen] = useState(false)
  
  // Stato Modifica & Timeline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [contactEvents, setContactEvents] = useState<any[]>([]) 
  const [loadingEvents, setLoadingEvents] = useState(false)

  const [formData, setFormData] = useState({ name: '', email: '', value: '', status: 'Nuovo' })
  const [saving, setSaving] = useState(false)

  // Stato Visualizzazione (Toggle Grafici)
  const [showAnalytics, setShowAnalytics] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // --- 1. RECUPERO DATI (Invariato) ---
  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchContacts()
      } else {
        setLoading(false)
      }
    }
    getData()
  }, [supabase])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('score', { ascending: false }) 
    if (data) setContacts(data)
    setLoading(false)
  }

  // --- 2. CALCOLI ANALITICI (NUOVO: Calcola i grafici dai dati veri) ---
  const analyticsData = useMemo(() => {
    const totalValue = contacts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
    const countNuovi = contacts.filter(c => c.status === 'Nuovo').length
    const countTrattativa = contacts.filter(c => c.status === 'In Trattativa' || c.status === 'Trattativa').length
    const countChiusi = contacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length
    const countPersi = contacts.filter(c => c.status === 'Perso').length

    // Dati per il Funnel
    const funnel = [
      { stage: 'Nuovi', count: countNuovi, color: '#60A5FA' },
      { stage: 'Trattativa', count: countTrattativa, color: '#FBBF24' },
      { stage: 'Chiusi', count: countChiusi, color: '#10B981' },
      { stage: 'Persi', count: countPersi, color: '#EF4444' }
    ]

    // Tasso Conversione (Chiusi / Totale * 100)
    const conversionRate = contacts.length > 0 ? Math.round((countChiusi / contacts.length) * 100) : 0

    return { totalValue, funnel, conversionRate, countChiusi }
  }, [contacts])

  // --- 3. LOGICA IMPORTAZIONE & CRUD (Invariata) ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const rows: any[] = results.data
          const newContacts = rows.map((row: any) => ({
            name: row.Nome || row.Name || (row['First Name'] ? `${row['First Name']} ${row['Last Name']}` : 'Senza Nome'),
            email: row.Email || row.email || row['E-mail Address'] || '',
            value: 0, status: 'Nuovo', user_id: user.id, score: 0 
          })).filter((c: any) => c.name !== 'Senza Nome')
          saveToDb(newContacts)
        }
      })
    } else { alert("Per ora supportiamo solo CSV.") }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveToDb = async (newContacts: any[]) => {
    if (newContacts.length === 0) { alert("Nessun contatto valido."); return }
    const { data, error } = await supabase.from('contacts').insert(newContacts).select()
    if (!error && data) {
      setContacts([...data, ...contacts])
      alert(`Importati ${data.length} contatti! 🚀`)
      setIsImportInfoOpen(false)
    } else { alert('Errore: ' + error?.message) }
  }

  const openNewModal = () => { 
      setEditingId(null); setContactEvents([]); 
      setFormData({ name: '', email: '', value: '', status: 'Nuovo' }); setIsModalOpen(true) 
  }

  const openEditModal = async (contact: any) => { 
      setEditingId(contact.id); 
      setFormData({ name: contact.name, email: contact.email, value: contact.value, status: contact.status }); 
      setIsModalOpen(true)
      
      setLoadingEvents(true)
      const { data } = await supabase.from('events').select('*').eq('contact_id', contact.id).order('created_at', { ascending: false }).limit(5)
      if(data) setContactEvents(data)
      setLoadingEvents(false)
  }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('contacts').update({ ...formData, value: Number(formData.value) }).eq('id', editingId)
      if (!error) { fetchContacts(); setIsModalOpen(false) }
    } else {
      const { data, error } = await supabase.from('contacts').insert({ ...formData, value: Number(formData.value), user_id: user.id }).select()
      if (!error && data) { setContacts([data[0], ...contacts]); setIsModalOpen(false) }
    }
    setSaving(false)
  }
  
  const handleDelete = async (id: number) => { 
    if(!confirm('Eliminare definitivamente?')) return; 
    const { error } = await supabase.from('contacts').delete().eq('id', id); 
    if (!error) setContacts(contacts.filter(c => c.id !== id)) 
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const getScoreBadge = (score: number) => {
      if(!score) score = 0;
      if(score >= 50) return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold">🔥 Hot ({score})</span>
      if(score >= 10) return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded text-xs font-bold">⚡ Active ({score})</span>
      return <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-1 rounded text-xs font-bold">❄️ Cold ({score})</span>
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento CRM...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">CRM & Funnel</h1>
          <p className="text-gray-500 text-sm mt-1">Gestisci relazioni e monitora le performance.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            {showAnalytics ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} 
            {showAnalytics ? 'Nascondi Grafici' : 'Mostra Analisi'}
          </button>
          
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => setIsStrategyOpen(true)} className="bg-white border-2 border-[#00665E] text-[#00665E] px-4 py-2 rounded-xl font-bold hover:bg-[#00665E]/5 transition shadow-sm hidden md:block">🎓 Strategie</button>
          <button onClick={() => setIsImportInfoOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">📂 Importa</button>
          <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">+ Nuovo</button>
        </div>
      </div>

      {/* --- SEZIONE ANALITICA (BREVO STYLE) --- */}
      {showAnalytics && (
        <div className="mb-10 animate-in slide-in-from-top duration-500">
           
           {/* KPI CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2"><div className="bg-blue-50 p-2 rounded-lg"><DollarSign className="text-blue-500 w-5 h-5"/></div></div>
                    <p className="text-gray-400 text-xs font-bold uppercase">Pipeline Totale</p>
                    <h3 className="text-2xl font-black text-gray-800">€ {analyticsData.totalValue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2"><div className="bg-green-50 p-2 rounded-lg"><TrendingUp className="text-green-500 w-5 h-5"/></div></div>
                    <p className="text-gray-400 text-xs font-bold uppercase">Tasso Conversione</p>
                    <h3 className="text-2xl font-black text-gray-800">{analyticsData.conversionRate}%</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2"><div className="bg-purple-50 p-2 rounded-lg"><Users className="text-purple-500 w-5 h-5"/></div></div>
                    <p className="text-gray-400 text-xs font-bold uppercase">Clienti Vinti</p>
                    <h3 className="text-2xl font-black text-gray-800">{analyticsData.countChiusi}</h3>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2"><div className="bg-orange-50 p-2 rounded-lg"><AlertCircle className="text-orange-500 w-5 h-5"/></div></div>
                    <p className="text-gray-400 text-xs font-bold uppercase">Contatti Totali</p>
                    <h3 className="text-2xl font-black text-gray-800">{contacts.length}</h3>
                </div>
           </div>

           {/* GRAFICI */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Funnel di Vendita</h2>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={analyticsData.funnel} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="stage" type="category" width={80} tick={{fontSize: 11, fontWeight: 'bold'}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px' }}/>
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={25}>
                                {analyticsData.funnel.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* Placeholder per Grafico Torta (In futuro espandibile per Sorgente) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <PieChart width={100} height={100}>
                            <Pie data={[{value: 100}]} cx="50%" cy="50%" innerRadius={30} outerRadius={40} fill="#E2E8F0" dataKey="value"/>
                        </PieChart>
                    </div>
                    <h3 className="font-bold text-gray-800">Analisi Sorgenti</h3>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs">Per attivare questo grafico, aggiungi il campo "Sorgente" (Social, Email, etc.) nel modulo contatti.</p>
                </div>
           </div>
        </div>
      )}

      {/* --- TABELLA CONTATTI (Invariata) --- */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 uppercase font-bold text-gray-400 text-xs tracking-wider">
                <tr>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Score</th>
                <th className="px-6 py-5">Valore</th>
                <th className="px-6 py-5">Stato</th>
                <th className="px-6 py-5 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {contacts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 italic">Nessun contatto presente. Inizia importando o creando un nuovo lead.</td></tr>
                ) : (
                contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50/80 transition group cursor-pointer" onClick={() => openEditModal(contact)}>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00665E]/10 text-[#00665E] flex items-center justify-center font-bold text-xs border border-[#00665E]/20">
                                {getInitials(contact.name)}
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 block">{contact.name}</span>
                                <span className="text-xs text-gray-400">{contact.email}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">{getScoreBadge(contact.score)}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">€ {contact.value}</td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            contact.status === 'Nuovo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            (contact.status === 'In Trattativa' || contact.status === 'Trattativa') ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                            (contact.status === 'Chiuso' || contact.status === 'Vinto') ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                        {contact.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => {e.stopPropagation(); openEditModal(contact)}} className="text-[#00665E] font-bold">Apri</button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* --- MODALI (Mantenuti Invariati) --- */}
      {isStrategyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsStrategyOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right">
                <button onClick={() => setIsStrategyOpen(false)} className="absolute top-6 right-6 text-gray-400">✕</button>
                <h2 className="text-2xl font-black text-[#00665E] mb-4">Strategie CRM</h2>
                <p className="text-gray-600">Consigli pratici per gestire la tua pipeline.</p>
            </div>
        </div>
      )}

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-black text-gray-900">{editingId ? 'Scheda Cliente' : 'Nuovo Contatto'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <form className="space-y-4" onSubmit={handleSave}>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" required /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Valore (€)</label><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" /></div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Stato</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none">
                                <option value="Nuovo">Nuovo</option>
                                <option value="Trattativa">In Trattativa</option>
                                <option value="Chiuso">Chiuso / Cliente</option>
                                <option value="Perso">Perso</option>
                            </select>
                          </div>
                          <div className="pt-4 flex gap-2">
                             <button type="submit" className="flex-1 bg-[#00665E] p-3 rounded-xl font-bold text-white hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">{saving ? '...' : 'Salva Modifiche'}</button>
                             {editingId && <button type="button" onClick={() => { handleDelete(editingId!); setIsModalOpen(false)}} className="px-4 text-red-400 font-bold hover:bg-red-50 rounded-xl">Elimina</button>}
                          </div>
                      </form>
                      {editingId && (
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 uppercase mb-4">Cronologia</h3>
                              {loadingEvents ? <div className="text-xs text-gray-400">Caricamento...</div> : contactEvents.length === 0 ? 
                                <div className="text-center py-8 text-gray-400 text-xs">Nessuna attività registrata.</div> : 
                                <div className="space-y-4">{contactEvents.map(ev => <div key={ev.id} className="text-xs">{ev.event_name}</div>)}</div>
                              }
                          </div>
                      )}
                  </div>
              </div>
            </div>
         </div>
      )}

      {isImportInfoOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-2xl max-w-sm w-full relative">
                <button onClick={() => setIsImportInfoOpen(false)} className="absolute top-2 right-4 text-gray-400">✕</button>
                <h3 className="font-bold mb-4">Importa Contatti</h3>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Seleziona CSV</button>
             </div>
          </div>
      )}

    </main>
  )
}