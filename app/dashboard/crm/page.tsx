'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts'
import { 
  Users, DollarSign, TrendingUp, AlertCircle, Filter, ChevronDown, ChevronUp, 
  Phone, Globe, FileText, Calendar, ShoppingBag, Star, Zap, Activity, PieChart 
} from 'lucide-react'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false)
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'sales' | 'marketing'>('profile')
  const [formData, setFormData] = useState<any>({}) // Semplificato per brevità
  const [saving, setSaving] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // DEFAULT FORM DATA
  const initialForm = {
    name: '', email: '', phone: '', source: '', notes: '', value: '', status: 'Nuovo',
    customer_since: new Date().toISOString().split('T')[0], churn_date: '', total_orders: 0, ltv: 0, 
    last_order_date: '', avg_days_between_orders: 0, preferred_category: '', preferred_channel: '',
    marketing_engagement_score: 50, nps_score: 0, next_action: '', next_action_date: ''
  }

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
  }, [])

  const fetchContacts = async () => {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false }) 
    if (data) setContacts(data)
    setLoading(false)
  }

  // --- ANALYTICS & PIVOT ---
  const analyticsData = useMemo(() => {
    const totalValue = contacts.reduce((acc, c) => acc + (Number(c.value) || 0), 0)
    const countNuovi = contacts.filter(c => c.status === 'Nuovo').length
    const countTrattativa = contacts.filter(c => c.status === 'Trattativa' || c.status === 'In Trattativa').length
    const countChiusi = contacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length
    const countPersi = contacts.filter(c => c.status === 'Perso').length
    
    // Funnel Data
    const funnel = [
      { stage: 'Nuovi Lead', count: countNuovi, color: '#3B82F6' },
      { stage: 'In Trattativa', count: countTrattativa, color: '#F59E0B' },
      { stage: 'Clienti Vinti', count: countChiusi, color: '#10B981' },
      { stage: 'Persi', count: countPersi, color: '#EF4444' }
    ]

    // PIVOT TABLE: Analisi per Fonte (ROI)
    const sourceStats: any = {}
    contacts.forEach(c => {
        const src = c.source || 'Sconosciuto'
        if(!sourceStats[src]) sourceStats[src] = { name: src, count: 0, value: 0, won: 0 }
        sourceStats[src].count += 1
        sourceStats[src].value += (Number(c.value) || 0)
        if(c.status === 'Chiuso' || c.status === 'Vinto') sourceStats[src].won += 1
    })
    const pivotData = Object.values(sourceStats).sort((a:any, b:any) => b.value - a.value)

    return { totalValue, funnel, pivotData, countChiusi }
  }, [contacts])

  // --- HELPER FUNCTIONS ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... codice invariato ... */ }
  const saveToDb = async (newContacts: any[]) => { /* ... codice invariato ... */ }

  const openNewModal = () => { 
      setEditingId(null); setFormData(initialForm); setActiveTab('profile'); setIsModalOpen(true) 
  }

  const openEditModal = (contact: any) => { 
      setEditingId(contact.id); 
      setFormData({ 
        ...initialForm, ...contact, 
        // Gestione null
        marketing_engagement_score: contact.marketing_engagement_score || 0
      }); 
      setActiveTab('profile'); setIsModalOpen(true)
  }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const payload = { ...formData, value: Number(formData.value), ltv: Number(formData.ltv), total_orders: Number(formData.total_orders) }
    
    if (editingId) {
      const { error } = await supabase.from('contacts').update(payload).eq('id', editingId)
      if (!error) { fetchContacts(); setIsModalOpen(false) }
    } else {
      const { data, error } = await supabase.from('contacts').insert({ ...payload, user_id: user.id }).select()
      if (!error && data) { setContacts([data[0], ...contacts]); setIsModalOpen(false) }
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => { /* ... codice invariato ... */ }
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  
  // Colore Score
  const getScoreColor = (score: number) => {
      if(score >= 80) return 'bg-green-500';
      if(score >= 50) return 'bg-yellow-500';
      return 'bg-gray-300';
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Integra CRM...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">CRM Enterprise</h1>
          <p className="text-gray-500 text-sm mt-1">Business Intelligence & Pipeline.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            {showAnalytics ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} Analisi
          </button>
          <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">+ Nuovo Lead</button>
        </div>
      </div>

      {/* DASHBOARD ANALITICA "WOW" */}
      {showAnalytics && (
        <div className="mb-10 animate-in slide-in-from-top duration-500 space-y-6">
           
           {/* KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiBox title="Pipeline Value" val={`€ ${analyticsData.totalValue.toLocaleString()}`} icon={<DollarSign className="text-white"/>} bg="bg-gradient-to-br from-blue-500 to-blue-700 text-white" />
                <KpiBox title="Conversion Rate" val={`${contacts.length > 0 ? Math.round((analyticsData.countChiusi/contacts.length)*100) : 0}%`} icon={<Activity className="text-white"/>} bg="bg-gradient-to-br from-purple-500 to-purple-700 text-white" />
                <KpiBox title="Clienti Vinti" val={analyticsData.countChiusi} icon={<Users className="text-white"/>} bg="bg-gradient-to-br from-green-500 to-green-700 text-white" />
                <KpiBox title="Lead Totali" val={contacts.length} icon={<Filter className="text-white"/>} bg="bg-gradient-to-br from-gray-700 to-gray-900 text-white" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. FUNNEL VISIVO "WOW" (Gradiente) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="font-bold text-gray-800 mb-4">Pipeline Funnel</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.funnel} layout="vertical" margin={{left: 20}}>
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#00665E" stopOpacity={0.6}/>
                                        <stop offset="100%" stopColor="#00665E" stopOpacity={1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                                    {analyticsData.funnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. PIVOT TABLE (Analisi per Fonte) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Performance Fonti</h3>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="text-gray-400 border-b border-gray-100">
                                    <th className="pb-2">Fonte</th>
                                    <th className="pb-2 text-right">Valore</th>
                                    <th className="pb-2 text-right">Conv.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {analyticsData.pivotData.map((row: any, i: number) => (
                                    <tr key={i} className="group hover:bg-gray-50">
                                        <td className="py-3 font-bold text-gray-700">{row.name}</td>
                                        <td className="py-3 text-right text-[#00665E] font-mono font-bold">€{row.value.toLocaleString()}</td>
                                        <td className="py-3 text-right text-gray-500">{Math.round((row.won / row.count) * 100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {analyticsData.pivotData.length === 0 && <p className="text-center text-gray-400 py-4">Nessun dato.</p>}
                    </div>
                </div>
           </div>
        </div>
      )}

      {/* --- TABELLA CONTATTI PRINCIPALE (Upgrade) --- */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Elenco Clienti</h3>
            <span className="text-xs text-gray-400">{contacts.length} record trovati</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                <tr>
                <th className="px-6 py-4">Cliente / Azienda</th>
                <th className="px-6 py-4">Engagement Marketing</th> {/* NUOVO: Barra Score */}
                <th className="px-6 py-4">Next Action</th>
                <th className="px-6 py-4">Ultimo Contatto</th> {/* NUOVO: Data */}
                <th className="px-6 py-4 text-right">Valore LTV</th>
                <th className="px-6 py-4 text-center">Stato</th>
                <th className="px-6 py-4 text-right"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-blue-50/30 transition group cursor-pointer" onClick={() => openEditModal(contact)}>
                    
                    {/* 1. Cliente */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs border border-gray-300 shadow-sm">
                                {getInitials(contact.name)}
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 block">{contact.name}</span>
                                <span className="text-[10px] text-gray-400">{contact.email}</span>
                            </div>
                        </div>
                    </td>
                    
                    {/* 2. Engagement Score (Barra Visiva) */}
                    <td className="px-6 py-4">
                        <div className="w-24">
                            <div className="flex justify-between text-[10px] mb-1 font-bold text-gray-500">
                                <span>Score</span>
                                <span>{contact.marketing_engagement_score || 0}/100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${getScoreColor(contact.marketing_engagement_score || 0)}`} 
                                    style={{width: `${contact.marketing_engagement_score || 0}%`}}
                                ></div>
                            </div>
                        </div>
                    </td>

                    {/* 3. Next Action */}
                    <td className="px-6 py-4">
                        {contact.next_action ? (
                             <div className="flex items-center gap-2 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 w-fit">
                                <Calendar size={10}/> {contact.next_action}
                             </div>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                    </td>

                    {/* 4. Ultimo Contatto */}
                    <td className="px-6 py-4 text-xs">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                    </td>

                    {/* 5. Valore */}
                    <td className="px-6 py-4 text-right font-mono text-gray-900 font-bold">
                        € {contact.value?.toLocaleString()}
                    </td>

                    {/* 6. Stato */}
                    <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            contact.status === 'Nuovo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            (contact.status === 'Chiuso') ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>
                        {contact.status}
                        </span>
                    </td>

                    {/* 7. Azioni */}
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[#00665E] font-bold text-xs bg-[#00665E]/10 px-3 py-1 rounded hover:bg-[#00665E] hover:text-white transition">APRI</button>
                    </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* MODALE DI MODIFICA (Manteniamo quello che abbiamo fatto prima, ometto per brevità ma tu lascialo nel codice se vuoi o chiedimi di rimetterlo) */}
      {/* ... CODICE MODALE ... (Usa quello che ti ho dato nel messaggio precedente per la modale a Tabs) */}
      {isModalOpen && (
        /* INCOLLA QUI IL CODICE DELLA MODALE A TABS CHE TI HO DATO PRIMA */
        /* Per sicurezza te lo rimetto compatto qui sotto */
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black text-gray-900">{editingId ? 'Scheda Cliente' : 'Nuovo Lead'}</h2>
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-1 text-xs font-bold rounded-md transition ${activeTab === 'profile' ? 'bg-white shadow' : ''}`}>Profilo</button>
                        <button onClick={() => setActiveTab('sales')} className={`px-4 py-1 text-xs font-bold rounded-md transition ${activeTab === 'sales' ? 'bg-white shadow text-blue-600' : ''}`}>Sales</button>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  <form onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                      {activeTab === 'profile' && (
                        <>
                           <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-500">Nome</label><input className="w-full p-3 rounded-xl border mt-1" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required/></div>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Email</label><input className="w-full p-3 rounded-xl border mt-1" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/></div>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Fonte</label><input className="w-full p-3 rounded-xl border mt-1" value={formData.source} onChange={e=>setFormData({...formData, source: e.target.value})}/></div>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Valore €</label><input type="number" className="w-full p-3 rounded-xl border mt-1" value={formData.value} onChange={e=>setFormData({...formData, value: e.target.value})}/></div>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Stato</label>
                             <select className="w-full p-3 rounded-xl border mt-1" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                               <option value="Nuovo">Nuovo</option><option value="Trattativa">Trattativa</option><option value="Chiuso">Vinto</option><option value="Perso">Perso</option>
                             </select>
                           </div>
                           <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-500">Note</label><textarea className="w-full p-3 rounded-xl border mt-1" value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})}/></div>
                        </>
                      )}
                      {activeTab === 'sales' && (
                        <>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Engagement (0-100)</label><input type="number" className="w-full p-3 rounded-xl border mt-1" value={formData.marketing_engagement_score} onChange={e=>setFormData({...formData, marketing_engagement_score: e.target.value})}/></div>
                           <div><label className="text-xs font-bold uppercase text-gray-500">Next Action</label><input className="w-full p-3 rounded-xl border mt-1" value={formData.next_action} onChange={e=>setFormData({...formData, next_action: e.target.value})}/></div>
                        </>
                      )}
                      <div className="col-span-2 pt-4 flex gap-2">
                        <button className="bg-[#00665E] text-white font-bold py-3 px-6 rounded-xl flex-1">{saving ? '...' : 'Salva'}</button>
                      </div>
                  </form>
              </div>
            </div>
         </div>
      )}
      
    </main>
  )
}

function KpiBox({title, val, icon, bg}: any) {
    return (
        <div className={`p-5 rounded-2xl shadow-lg ${bg} relative overflow-hidden group hover:scale-[1.02] transition`}>
            <div className="flex justify-between mb-2 relative z-10">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">{icon}</div>
            </div>
            <p className="opacity-80 text-xs font-bold uppercase relative z-10">{title}</p>
            <h3 className="text-3xl font-black mt-1 relative z-10">{val}</h3>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition"></div>
        </div>
    )
}