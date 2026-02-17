'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'
import { 
  Users, DollarSign, TrendingUp, AlertCircle, Filter, ChevronDown, ChevronUp, 
  Phone, Globe, FileText, Calendar, ShoppingBag, Star, Zap, Activity 
} from 'lucide-react'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modali
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false)
  
  // Editing & Tabs
  const [editingId, setEditingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'sales' | 'marketing'>('profile')
  
  // Form Data Completo
  const [formData, setFormData] = useState({ 
      name: '', email: '', phone: '', source: '', notes: '', value: '', status: 'Nuovo',
      customer_since: '', churn_date: '', total_orders: 0, ltv: 0, 
      last_order_date: '', avg_days_between_orders: 0, preferred_category: '', preferred_channel: '',
      marketing_engagement_score: 0, nps_score: 0, next_action: '', next_action_date: ''
  })
  
  const [saving, setSaving] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

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
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }) 
    if (data) setContacts(data)
    setLoading(false)
  }

  // --- ANALYTICS AVANZATE ---
  const analyticsData = useMemo(() => {
    const totalValue = contacts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
    const countNuovi = contacts.filter(c => c.status === 'Nuovo').length
    const countTrattativa = contacts.filter(c => c.status === 'Trattativa' || c.status === 'In Trattativa').length
    const countChiusi = contacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length
    const countPersi = contacts.filter(c => c.status === 'Perso').length
    
    // Calcolo Churn Rate (Clienti con data churn valorizzata)
    const churnedCount = contacts.filter(c => c.churn_date).length
    const activeCount = contacts.length - churnedCount

    const funnel = [
      { stage: 'Nuovi', count: countNuovi, color: '#60A5FA' },
      { stage: 'Trattativa', count: countTrattativa, color: '#FBBF24' },
      { stage: 'Chiusi', count: countChiusi, color: '#10B981' },
      { stage: 'Persi', count: countPersi, color: '#EF4444' }
    ]
    const conversionRate = contacts.length > 0 ? Math.round((countChiusi / contacts.length) * 100) : 0
    return { totalValue, funnel, conversionRate, countChiusi, churnedCount }
  }, [contacts])

  // --- GESTIONE FILE (CSV) ---
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
            name: row.Nome || row.Name || 'Senza Nome',
            email: row.Email || row.email || '',
            phone: row.Telefono || '',
            source: 'Import CSV',
            value: 0, status: 'Nuovo', user_id: user.id
          })).filter((c: any) => c.name !== 'Senza Nome')
          saveToDb(newContacts)
        }
      })
    } else { alert("Per ora supportiamo solo CSV.") }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveToDb = async (newContacts: any[]) => {
    if (newContacts.length === 0) return
    const { data, error } = await supabase.from('contacts').insert(newContacts).select()
    if (!error && data) {
      setContacts([...data, ...contacts])
      alert(`Importati ${data.length} contatti! 🚀`)
      setIsImportInfoOpen(false)
    } else { alert('Errore: ' + error?.message) }
  }

  // --- CRUD MODALS ---
  const openNewModal = () => { 
      setEditingId(null); 
      setFormData({ 
        name: '', email: '', phone: '', source: '', notes: '', value: '', status: 'Nuovo',
        customer_since: new Date().toISOString().split('T')[0], churn_date: '', total_orders: 0, ltv: 0, 
        last_order_date: '', avg_days_between_orders: 0, preferred_category: '', preferred_channel: '',
        marketing_engagement_score: 0, nps_score: 0, next_action: '', next_action_date: ''
      }); 
      setActiveTab('profile');
      setIsModalOpen(true) 
  }

  const openEditModal = async (contact: any) => { 
      setEditingId(contact.id); 
      setFormData({ 
          name: contact.name, email: contact.email, 
          phone: contact.phone || '', source: contact.source || '', notes: contact.notes || '',
          value: contact.value, status: contact.status,
          customer_since: contact.customer_since || '', churn_date: contact.churn_date || '',
          total_orders: contact.total_orders || 0, ltv: contact.ltv || 0,
          last_order_date: contact.last_order_date || '', avg_days_between_orders: contact.avg_days_between_orders || 0,
          preferred_category: contact.preferred_category || '', preferred_channel: contact.preferred_channel || '',
          marketing_engagement_score: contact.marketing_engagement_score || 0, nps_score: contact.nps_score || 0,
          next_action: contact.next_action || '', next_action_date: contact.next_action_date || ''
      }); 
      setActiveTab('profile');
      setIsModalOpen(true)
  }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    // Convertiamo i numeri
    const payload = { 
        ...formData, 
        value: Number(formData.value),
        total_orders: Number(formData.total_orders),
        ltv: Number(formData.ltv),
        avg_days_between_orders: Number(formData.avg_days_between_orders),
        marketing_engagement_score: Number(formData.marketing_engagement_score),
        nps_score: Number(formData.nps_score),
        churn_date: formData.churn_date === '' ? null : formData.churn_date, // Gestione date vuote
        last_order_date: formData.last_order_date === '' ? null : formData.last_order_date,
        next_action_date: formData.next_action_date === '' ? null : formData.next_action_date,
    }
    
    if (editingId) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', editingId)
      if (!error) { fetchContacts(); setIsModalOpen(false) }
      else alert("Errore aggiornamento: " + error.message)
    } else {
      const { data, error } = await supabase.from('contacts').insert({ ...payload, user_id: user.id }).select()
      if (!error && data) { setContacts([data[0], ...contacts]); setIsModalOpen(false) }
      else alert("Errore creazione: " + error.message)
    }
    setSaving(false)
  }
  
  const handleDelete = async (id: number) => { 
    if(!confirm('Eliminare definitivamente?')) return; 
    const { error } = await supabase.from('contacts').delete().eq('id', id); 
    if (!error) setContacts(contacts.filter(c => c.id !== id)) 
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento CRM Enterprise...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">CRM Enterprise</h1>
          <p className="text-gray-500 text-sm mt-1">Gestione clienti a 360°.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-end">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            {showAnalytics ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} 
            {showAnalytics ? 'Nascondi Grafici' : 'Mostra Analisi'}
          </button>
          
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => setIsImportInfoOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">📂 Importa</button>
          <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">+ Nuovo</button>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      {showAnalytics && (
        <div className="mb-10 animate-in slide-in-from-top duration-500">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <KpiBox title="Pipeline Totale" val={`€ ${analyticsData.totalValue.toLocaleString()}`} icon={<DollarSign className="text-blue-500"/>} />
                <KpiBox title="Conversione" val={`${analyticsData.conversionRate}%`} icon={<TrendingUp className="text-green-500"/>} />
                <KpiBox title="Clienti Attivi" val={contacts.length - analyticsData.churnedCount} icon={<Users className="text-purple-500"/>} />
                <KpiBox title="Rischio Churn" val={`${analyticsData.churnedCount} Persi`} icon={<AlertCircle className="text-red-500"/>} />
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={analyticsData.funnel} margin={{left: 20}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="stage" type="category" width={80} tick={{fontSize: 11}} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={25}>
                            {analyticsData.funnel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* TABELLA CONTATTI */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 uppercase font-bold text-gray-400 text-xs tracking-wider">
                <tr>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">LTV / Ordini</th> {/* NUOVO */}
                <th className="px-6 py-5">Next Action</th>  {/* NUOVO */}
                <th className="px-6 py-5">Fonte</th> 
                <th className="px-6 py-5">Stato</th>
                <th className="px-6 py-5 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {contacts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 italic">Nessun contatto. Crea il primo!</td></tr>
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
                                {contact.churn_date && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">CHURNED</span>}
                            </div>
                        </div>
                    </td>
                    
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">€ {contact.ltv || 0}</span>
                            <span className="text-xs text-gray-400">{contact.total_orders || 0} Ordini</span>
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        {contact.next_action ? (
                             <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                <Calendar size={10}/> {contact.next_action}
                             </div>
                        ) : <span className="text-gray-300">-</span>}
                    </td>

                    <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">
                           {contact.source || 'Diretto'}
                        </span>
                    </td>

                    <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            contact.status === 'Nuovo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            (contact.status === 'Chiuso') ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>
                        {contact.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[#00665E] font-bold text-xs">APRI</button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* MODALE AVANZATO A SCHEDE (TABS) */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-gray-900">{editingId ? 'Scheda Cliente' : 'Nuovo Contatto'}</h2>
                    {/* TABS */}
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-1 text-xs font-bold rounded-md transition ${activeTab === 'profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Profilo</button>
                        <button onClick={() => setActiveTab('sales')} className={`px-4 py-1 text-xs font-bold rounded-md transition ${activeTab === 'sales' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Commerciale</button>
                        <button onClick={() => setActiveTab('marketing')} className={`px-4 py-1 text-xs font-bold rounded-md transition ${activeTab === 'marketing' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Marketing & AI</button>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
              </div>

              {/* Form Content Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  <form onSubmit={handleSave}>
                      
                      {/* --- TAB 1: PROFILO --- */}
                      {activeTab === 'profile' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                             <div className="md:col-span-2"><label className="lbl">Nome / Azienda</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required /></div>
                             <div><label className="lbl"><Globe size={12}/> Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" /></div>
                             <div><label className="lbl"><Phone size={12}/> Telefono</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" /></div>
                             <div><label className="lbl">Stato Lead</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field">
                                    <option value="Nuovo">Nuovo Lead</option>
                                    <option value="Trattativa">In Trattativa</option>
                                    <option value="Chiuso">Vinto / Chiuso</option>
                                    <option value="Perso">Perso</option>
                                </select>
                             </div>
                             <div><label className="lbl">Fonte (Source)</label><input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="input-field" /></div>
                             
                             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 md:col-span-2 flex gap-4">
                                <div className="flex-1">
                                    <label className="lbl text-orange-600">Prossima Azione (Next Action)</label>
                                    <input type="text" placeholder="Es. Inviare preventivo" value={formData.next_action} onChange={e => setFormData({...formData, next_action: e.target.value})} className="input-field bg-white" />
                                </div>
                                <div>
                                    <label className="lbl text-orange-600">Entro il</label>
                                    <input type="date" value={formData.next_action_date} onChange={e => setFormData({...formData, next_action_date: e.target.value})} className="input-field bg-white" />
                                </div>
                             </div>

                             <div className="md:col-span-2"><label className="lbl"><FileText size={12}/> Note</label><textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-field resize-none" /></div>
                          </div>
                      )}

                      {/* --- TAB 2: COMMERCIALE --- */}
                      {activeTab === 'sales' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                              <div><label className="lbl">Data Attivazione (Customer Since)</label><input type="date" value={formData.customer_since} onChange={e => setFormData({...formData, customer_since: e.target.value})} className="input-field" /></div>
                              <div><label className="lbl text-red-500">Data Churn (Abbandono)</label><input type="date" value={formData.churn_date} onChange={e => setFormData({...formData, churn_date: e.target.value})} className="input-field border-red-100 bg-red-50" /></div>
                              
                              <div className="md:col-span-2 h-px bg-gray-200 my-2"></div>
                              
                              <div><label className="lbl flex items-center gap-1"><ShoppingBag size={12}/> Totale Ordini</label><input type="number" value={formData.total_orders} onChange={e => setFormData({...formData, total_orders: Number(e.target.value)})} className="input-field" /></div>
                              <div><label className="lbl flex items-center gap-1"><DollarSign size={12}/> LTV (Spesa Totale)</label><input type="number" value={formData.ltv} onChange={e => setFormData({...formData, ltv: Number(e.target.value)})} className="input-field font-bold text-[#00665E]" /></div>
                              
                              <div><label className="lbl">Ultimo Ordine</label><input type="date" value={formData.last_order_date} onChange={e => setFormData({...formData, last_order_date: e.target.value})} className="input-field" /></div>
                              <div><label className="lbl">Frequenza Media (Giorni)</label><input type="number" value={formData.avg_days_between_orders} onChange={e => setFormData({...formData, avg_days_between_orders: Number(e.target.value)})} className="input-field" /></div>
                          </div>
                      )}

                      {/* --- TAB 3: MARKETING --- */}
                      {activeTab === 'marketing' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                              <div><label className="lbl">Interessi / Categoria Preferita</label><input type="text" placeholder="Es. Pasta, Vini, Eventi..." value={formData.preferred_category} onChange={e => setFormData({...formData, preferred_category: e.target.value})} className="input-field" /></div>
                              <div><label className="lbl">Canale Preferito</label><input type="text" placeholder="Es. WhatsApp, Email..." value={formData.preferred_channel} onChange={e => setFormData({...formData, preferred_channel: e.target.value})} className="input-field" /></div>
                              
                              <div className="md:col-span-2 h-px bg-gray-200 my-2"></div>

                              <div>
                                <label className="lbl flex items-center gap-1"><Zap size={12}/> Engagement Marketing (0-100)</label>
                                <input type="range" min="0" max="100" value={formData.marketing_engagement_score} onChange={e => setFormData({...formData, marketing_engagement_score: Number(e.target.value)})} className="w-full accent-[#00665E]" />
                                <div className="text-right text-xs font-bold text-[#00665E]">{formData.marketing_engagement_score}/100</div>
                              </div>
                              
                              <div>
                                <label className="lbl flex items-center gap-1"><Star size={12}/> NPS / Rating (1-10)</label>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5,6,7,8,9,10].map(v => (
                                        <button type="button" key={v} onClick={() => setFormData({...formData, nps_score: v})} className={`w-8 h-8 rounded-full text-xs font-bold transition ${formData.nps_score === v ? 'bg-[#00665E] text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                                            {v}
                                        </button>
                                    ))}
                                </div>
                              </div>
                          </div>
                      )}

                  </form>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                  {editingId ? <button type="button" onClick={() => { handleDelete(editingId!); setIsModalOpen(false)}} className="px-4 text-red-400 font-bold hover:bg-red-50 rounded-xl text-sm">Elimina Contatto</button> : <div></div>}
                  <button onClick={handleSave} className="bg-[#00665E] px-8 py-3 rounded-xl font-bold text-white hover:bg-[#004d46] transition shadow-lg">{saving ? 'Salvataggio...' : 'Salva Scheda'}</button>
              </div>

            </div>
         </div>
      )}

      {/* STILI CSS LOCALI PER PULIZIA CODICE */}
      <style jsx>{`
        .lbl { @apply text-xs font-bold text-gray-500 uppercase mb-1 block; }
        .input-field { @apply w-full bg-white border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] transition text-sm; }
      `}</style>
      
      {/* Modale Import (Semplificato) */}
      {isImportInfoOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-2xl max-w-sm w-full relative">
                <button onClick={() => setIsImportInfoOpen(false)} className="absolute top-2 right-4 text-gray-400">✕</button>
                <h3 className="font-bold mb-4">Importa CSV</h3>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Seleziona File</button>
             </div>
          </div>
      )}
    </main>
  )
}

function KpiBox({title, val, icon}: any) {
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-2"><div className="bg-gray-50 p-2 rounded-lg">{icon}</div></div>
            <p className="text-gray-400 text-xs font-bold uppercase">{title}</p>
            <h3 className="text-2xl font-black text-gray-800">{val}</h3>
        </div>
    )
}