'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import Papa from 'papaparse'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati Modali
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSocialInfoOpen, setIsSocialInfoOpen] = useState(false) 
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false)
  const [isStrategyOpen, setIsStrategyOpen] = useState(false)
  
  // Stato Modifica & Timeline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [contactEvents, setContactEvents] = useState<any[]>([]) // NUOVO: Eventi del contatto
  const [loadingEvents, setLoadingEvents] = useState(false) // NUOVO: Caricamento eventi

  const [formData, setFormData] = useState({ name: '', email: '', value: '', status: 'Nuovo' })
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        fetchContacts()
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const fetchContacts = async () => {
    // Ora recuperiamo anche lo 'score'
    const { data } = await supabase.from('contacts').select('*').order('score', { ascending: false }) 
    if (data) setContacts(data)
  }

  // --- LOGICA IMPORTAZIONE (Invariata) ---
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
            value: 0, status: 'Nuovo', user_id: user.id, score: 0 // Default score
          })).filter((c: any) => c.name !== 'Senza Nome')
          saveToDb(newContacts)
        }
      })
    } else {
        alert("Per ora supportiamo solo CSV per semplicità.")
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveToDb = async (newContacts: any[]) => {
    if (newContacts.length === 0) { alert("Nessun contatto valido trovato."); return }
    const { data, error } = await supabase.from('contacts').insert(newContacts).select()
    if (!error && data) {
      setContacts([...data, ...contacts]) // Aggiorna stato locale
      alert(`Importati ${data.length} contatti! 🚀`)
      setIsImportInfoOpen(false)
    } else {
      alert('Errore: ' + error?.message)
    }
  }

  // --- CRUD & TIMELINE ---
  const openNewModal = () => { 
      setEditingId(null); 
      setContactEvents([]); // Reset eventi
      setFormData({ name: '', email: '', value: '', status: 'Nuovo' }); 
      setIsModalOpen(true) 
  }

  const openEditModal = async (contact: any) => { 
      setEditingId(contact.id); 
      setFormData({ name: contact.name, email: contact.email, value: contact.value, status: contact.status }); 
      setIsModalOpen(true)
      
      // NUOVO: Carica la Timeline eventi
      setLoadingEvents(true)
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(5) // Limitazione Piano Base
      
      if(data) setContactEvents(data)
      setLoadingEvents(false)
  }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('contacts').update({ ...formData, value: Number(formData.value) }).eq('id', editingId)
      if (!error) { 
          fetchContacts(); // Ricarica per aggiornare eventuali calcoli
          setIsModalOpen(false) 
      }
    } else {
      const { data, error } = await supabase.from('contacts').insert({ ...formData, value: Number(formData.value), user_id: user.id }).select()
      if (!error && data) { 
          setContacts([data[0], ...contacts]); 
          setIsModalOpen(false) 
      }
    }
    setSaving(false)
  }
  
  const handleDelete = async (id: number) => { 
    if(!confirm('Eliminare definitivamente?')) return; 
    const { error } = await supabase.from('contacts').delete().eq('id', id); 
    if (!error) setContacts(contacts.filter(c => c.id !== id)) 
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  // Helper per badge Score
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
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">CRM Clienti</h1>
          <p className="text-gray-500 text-sm mt-1">Gestisci le tue relazioni e monitora il Lead Score.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          
          <button onClick={() => setIsStrategyOpen(true)} className="bg-white border-2 border-[#00665E] text-[#00665E] px-4 py-2 rounded-xl font-bold hover:bg-[#00665E]/5 transition flex items-center gap-2 shadow-sm">
             🎓 Strategie
          </button>
          
          <button onClick={() => setIsImportInfoOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">
            📂 Importa
          </button>
          <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">
            + Nuovo Contatto
          </button>
        </div>
      </div>

      {/* TABELLA CONTATTI */}
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
                <tr><td colSpan={5} className="text-center py-12 text-gray-400 italic">Nessun contatto.</td></tr>
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
                    <td className="px-6 py-4">
                        {getScoreBadge(contact.score)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">€ {contact.value}</td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            contact.status === 'Nuovo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            contact.status === 'In Trattativa' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                            'bg-green-50 text-green-600 border-green-100'
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

      {/* --- SIDEBAR STRATEGIE (Mantenuta uguale, codice omesso per brevità se vuoi lo rimetto) --- */}
      {isStrategyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsStrategyOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right">
                <button onClick={() => setIsStrategyOpen(false)} className="absolute top-6 right-6 text-gray-400">✕</button>
                <h2 className="text-2xl font-black text-[#00665E] mb-4">Strategie CRM</h2>
                <p className="text-gray-600">Qui trovi i consigli strategici (omessi per brevità).</p>
            </div>
        </div>
      )}

      {/* --- MODAL SCHEDA CONTATTO + TIMELINE --- */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-black text-gray-900">{editingId ? 'Scheda Cliente' : 'Nuovo Contatto'}</h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* COLONNA SX: Dati Anagrafici */}
                      <form className="space-y-4" onSubmit={handleSave}>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" required /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase">Valore (€)</label><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none" /></div>
                          <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Stato</label>
                            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 focus:border-[#00665E] outline-none">
                                <option value="Nuovo">Nuovo</option>
                                <option value="In Trattativa">In Trattativa</option>
                                <option value="Chiuso">Chiuso / Cliente</option>
                            </select>
                          </div>
                          <div className="pt-4 flex gap-2">
                             <button type="submit" className="flex-1 bg-[#00665E] p-3 rounded-xl font-bold text-white hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">{saving ? '...' : 'Salva Modifiche'}</button>
                             {editingId && <button type="button" onClick={() => { handleDelete(editingId!); setIsModalOpen(false)}} className="px-4 text-red-400 font-bold hover:bg-red-50 rounded-xl">Elimina</button>}
                          </div>
                      </form>

                      {/* COLONNA DX: Timeline Eventi (Solo se in modifica) */}
                      {editingId && (
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                              <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex justify-between">
                                  <span>Cronologia Attività</span>
                                  <span className="text-[#00665E] text-xs bg-[#00665E]/10 px-2 py-0.5 rounded">Ultimi 5</span>
                              </h3>
                              
                              {loadingEvents ? (
                                  <div className="text-xs text-gray-400">Caricamento storico...</div>
                              ) : contactEvents.length === 0 ? (
                                  <div className="text-center py-8 text-gray-400 text-xs">
                                      <div className="text-2xl mb-2">💤</div>
                                      Nessuna attività registrata.<br/>Il cliente non ha ancora interagito.
                                  </div>
                              ) : (
                                  <div className="relative border-l-2 border-gray-200 ml-2 space-y-6">
                                      {contactEvents.map((ev) => (
                                          <div key={ev.id} className="ml-4 relative">
                                              {/* Pallino sulla linea temporale */}
                                              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-white border-2 border-[#00665E] rounded-full"></div>
                                              
                                              <p className="text-xs font-bold text-gray-800">
                                                  {ev.event_name === 'page_view' && '👁️ Ha visitato il sito'}
                                                  {ev.event_name === 'email_open' && '📩 Ha letto una email'}
                                                  {ev.event_name === 'social_click' && '👍 Click da Social'}
                                                  {ev.event_name === 'form_submit' && '📝 Ha compilato un modulo'}
                                              </p>
                                              <p className="text-[10px] text-gray-400 mt-1">
                                                  {new Date(ev.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                              </p>
                                          </div>
                                      ))}
                                      {/* Upgrade Teaser */}
                                      <div className="ml-4 pt-2">
                                          <p className="text-[10px] text-gray-400 italic">
                                              Vuoi vedere lo storico completo? <span className="text-[#00665E] font-bold cursor-pointer">Passa a Enterprise</span>
                                          </p>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
            </div>
         </div>
      )}

      {/* Modale Importazione Semplificato (omesso per brevità ma incluso nel contesto precedente) */}
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