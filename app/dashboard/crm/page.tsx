'use client'

import { createClient } from '../../../utils/supabase/client'
import { EcosystemBridge } from '../../../utils/ecosystem-bridge'
import { useEffect, useState, useRef, useMemo } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts'
import { 
  Users, DollarSign, TrendingUp, Filter, ChevronDown, ChevronUp, 
  Activity, Download, Bot, Sparkles, X, Store, Globe, Calendar, Search, Zap, Target, BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface Order {
    id: string;
    date: string;
    amount: number;
    channel: 'Ecommerce' | 'Store';
    category: string;
    items: string;
}

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    notes: string;
    created_at: string;
    ltv: number;
    total_orders: number;
    last_order_date: string | null;
    churn_date: string | null;
    preferred_category: string;
    orders: Order[];
}

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  
  const [dateStart, setDateStart] = useState<string>('')
  const [dateEnd, setDateEnd] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [showAnalytics, setShowAnalytics] = useState(true)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile')
  const [saving, setSaving] = useState(false)

  const initialForm: Contact = {
    id: '', name: '', email: '', phone: '', source: 'Sito Web', notes: '', status: 'Nuovo',
    created_at: new Date().toISOString(), ltv: 0, total_orders: 0, last_order_date: null, churn_date: null,
    preferred_category: 'Generale', orders: []
  }
  const [formData, setFormData] = useState<Contact>(initialForm)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        // Redirigi al login se non autenticato in un'app di produzione
      }
      fetchContacts()
    }
    getData()
  }, [])

  const fetchContacts = async () => {
    try {
        const { data, error } = await supabase.from('contacts').select('*, orders(*)').order('created_at', { ascending: false });
        if (error) throw error;

        if (data) {
            const enrichedData = data.map((c: any) => ({
                ...c,
                name: c.name || 'Senza Nome',
                // Calcola il Lifetime Value reale in base agli ordini E-Commerce agganciati, oppure fallo ripiegare sul valore generico B2B
                ltv: c.orders?.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0) || Number(c.value) || 0,
                total_orders: c.orders?.length || 0,
                orders: c.orders || []
            }))
            setContacts(enrichedData)
        }
    } catch (err) {
        console.error(err)
    }
    setLoading(false)
  }

  const filteredContacts = useMemo(() => {
      return contacts.filter(c => {
          const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesStatus = filterStatus === 'all' || c.status === filterStatus
          let matchesDate = true
          if(dateStart && dateEnd) {
              const checkDate = c.last_order_date ? new Date(c.last_order_date) : new Date(c.created_at)
              matchesDate = checkDate >= new Date(dateStart) && checkDate <= new Date(dateEnd)
          }
          let matchesCategory = true
          if(filterCategory !== 'all') {
              matchesCategory = c.orders.some(o => o.category === filterCategory) || c.preferred_category === filterCategory
          }
          return matchesSearch && matchesStatus && matchesDate && matchesCategory
      })
  }, [contacts, searchTerm, filterStatus, dateStart, dateEnd, filterCategory])

  const analyticsData = useMemo(() => {
    const totalValue = filteredContacts.reduce((acc, c) => acc + c.ltv, 0)
    const countVisualizzato = filteredContacts.filter(c => c.status === 'Visualizzato').length
    const countRichiesta = filteredContacts.filter(c => c.status === 'Richiesta' || c.status === 'Nuovo').length
    const countPromo = filteredContacts.filter(c => c.status === 'Promo Inviata').length
    const countOfferta = filteredContacts.filter(c => c.status === 'Offerta').length
    const countTrattativa = filteredContacts.filter(c => c.status === 'Trattativa' || c.status === 'In Trattativa').length
    const countChiusi = filteredContacts.filter(c => c.status === 'Chiuso' || c.status === 'Vinto').length
    const countPersi = filteredContacts.filter(c => c.status === 'Perso').length
    
    const funnel = [
      { stage: 'Visualizzato', count: countVisualizzato, color: '#93C5FD' },
      { stage: 'Richieste', count: countRichiesta, color: '#60A5FA' },
      { stage: 'Invio Promo', count: countPromo, color: '#A78BFA' },
      { stage: 'Offerta', count: countOfferta, color: '#F59E0B' },
      { stage: 'Trattativa', count: countTrattativa, color: '#F97316' },
      { stage: 'Goal', count: countChiusi, color: '#10B981' }
    ]
    
    const conversionRate = filteredContacts.length > 0 ? Math.round((countChiusi / filteredContacts.length) * 100) : 0
    const churnedCount = filteredContacts.filter(c => c.churn_date).length;
    const totalClientsEver = countChiusi + churnedCount;
    const churnRate = totalClientsEver > 0 ? Math.round((churnedCount / totalClientsEver) * 100) : 0;

    const sourceStats: any = {}
    let onlineCount = 0; let storeCount = 0;
    
    filteredContacts.forEach(c => {
        const src = c.source || 'Sconosciuto'
        if(!sourceStats[src]) sourceStats[src] = { name: src, count: 0, value: 0 }
        sourceStats[src].count += 1
        sourceStats[src].value += c.ltv
        c.orders.forEach(o => { if(o.channel === 'Ecommerce') onlineCount++; else storeCount++; })
    })

    const pivotData = Object.values(sourceStats).sort((a:any, b:any) => b.value - a.value)
    const categories = Array.from(new Set(contacts.flatMap(c => c.orders.map(o => o.category))))

    return { totalValue, funnel, conversionRate, churnRate, countChiusi, onlineCount, storeCount, categories, pivotData }
  }, [filteredContacts, contacts])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true)
    
    // In assenza di auth reale, interrompi
    const uuid = user?.id;
    if (!uuid) return;

    const payload = { 
        user_id: uuid,
        name: formData.name, 
        email: formData.email, 
        phone: formData.phone,
        source: formData.source, 
        notes: formData.notes, 
        status: formData.status,
        value: Number(formData.ltv) || 0,
        churn_date: formData.churn_date || null
    }

    try {
        const res = await fetch('/api/crm/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Errore HTTP: ${res.status}`);
        }
        
        const resultData = await res.json();
        const finalId = editingId || resultData?.lead?.id;

        // ECOSYSTEM BRIDGE: Auto-Nurturing if lead is lost
        if (finalId && (formData.status === 'Perso' || formData.status === 'Abbandono')) {
            console.log("Triggering Auto-Nurturing for:", finalId);
            await EcosystemBridge.triggerAutoNurturing(uuid, finalId, formData.name, formData.status)
        }

        await fetchContacts();
        setIsModalOpen(false)
    } catch (error: any) { 
        alert("Errore salvataggio: " + error.message) 
    } finally { 
        setSaving(false) 
    }
  }

  const handleDelete = async (id: string) => { 
    if(!confirm('Eliminare definitivamente questo contatto?')) return;
    const res = await fetch(`/api/crm/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
        setContacts(contacts.filter(c => c.id !== id))
        setIsModalOpen(false)
    } else {
        alert("Errore eliminazione")
    }
  }

  const handleExportCSV = () => {
      if(filteredContacts.length === 0) return alert("Nessun dato da esportare.");
      const exportData = filteredContacts.map(c => ({
          Nome: c.name, Email: c.email, Telefono: c.phone, 
          Stato: c.status, Fonte: c.source, Valore_LTV: c.ltv, Ordini: c.total_orders,
          Data_Abbandono: c.churn_date || 'Attivo'
      }))
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `integra_crm_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.name.split('.').pop()?.toLowerCase() === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const rows: any[] = results.data
          const uuid = user?.id;
          if (!uuid) return alert("Autenticazione richiesta per importare.");
          
          const newContacts = rows.map((row: any) => ({
            name: row.Nome || row.Name || 'Senza Nome',
            email: row.Email || '', phone: row.Telefono || '', source: 'Import CSV',
            status: 'Nuovo',
            user_id: uuid
          })).filter((c: any) => c.name !== 'Senza Nome')
          
          if (newContacts.length === 0) return alert("Nessun contatto valido trovato nel CSV.")
          
          for (const c of newContacts) {
              await fetch('/api/crm/leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(c)
              });
          }
          await fetchContacts();
          alert(`Importati ${newContacts.length} contatti!`); 
          setIsImportInfoOpen(false)
        }
      })
    } else { alert("Per ora supportiamo solo file CSV.") }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generateAiSuggestions = () => {
      const suggestions = [];
      const churned = filteredContacts.filter(c => c.churn_date && c.ltv > 500);
      if(churned.length > 0) suggestions.push({type: 'alert', title: '🚨 Recupero Alto Valore', text: `Hai ${churned.length} VIP persi nel periodo selezionato.`, action: 'Mostra' });

      const dormant = filteredContacts.filter(c => c.last_order_date && new Date(c.last_order_date) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
      if(dormant.length > 0) suggestions.push({type: 'warning', title: '💤 Rischio Abbandono', text: `${dormant.length} clienti non acquistano da mesi. Offri uno sconto.`, action: 'Crea Campagna' });

      const topCategory = analyticsData.categories[0];
      if(topCategory) suggestions.push({type: 'info', title: '📈 Trend Positivo', text: `La categoria "${topCategory}" sta performando bene. Fai Up-Selling.`, action: 'Vedi' });

      setAiSuggestions(suggestions);
      setShowAiPanel(true);
  }

  const openNewModal = () => { setEditingId(null); setFormData(initialForm); setActiveTab('profile'); setIsModalOpen(true) }
  const openEditModal = (contact: Contact) => { setEditingId(contact.id); setFormData({ ...initialForm, ...contact }); setActiveTab('profile'); setIsModalOpen(true) }
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '??';

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento CRM Enterprise...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative pb-20">
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">CRM & Marketing Data</h1>
          <p className="text-gray-500 text-sm mt-1">Acquisti, LTV e KPI Integrati.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
            {showAnalytics ? <ChevronUp size={18}/> : <ChevronDown size={18}/>} KPI
          </button>
          <button onClick={generateAiSuggestions} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 hover:scale-105 transition flex items-center gap-2 animate-pulse">
            <Bot size={18}/> Analizza
          </button>
          <button onClick={handleExportCSV} className="bg-white border border-gray-200 text-[#00665E] px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm"><Download size={18}/></button>
          <button onClick={() => setIsImportInfoOpen(true)} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm">Importa</button>
          <Link href="/dashboard/crm/pipeline" className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2"><BarChart3 size={18}/> Pipeline</Link>
          <Link href="/dashboard/crm/objectives" className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2"><Target size={18}/> KPI</Link>
          <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">+ Nuovo</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400"/>
            <input type="text" placeholder="Cerca Nome o Email..." className="bg-transparent border-none outline-none w-full text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400"/>
            <input type="date" className="text-xs p-2 border rounded-lg outline-none bg-gray-50" title="Data Inizio" value={dateStart} onChange={e => setDateStart(e.target.value)}/>
            <span className="text-gray-400">-</span>
            <input type="date" className="text-xs p-2 border rounded-lg outline-none bg-gray-50" title="Data Fine" value={dateEnd} onChange={e => setDateEnd(e.target.value)}/>
        </div>
        <select className="text-xs p-2.5 border rounded-lg outline-none bg-gray-50 font-bold" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tutti gli Stati</option>
            <option value="Visualizzato">Visualizzato</option>
            <option value="Richiesta">Richiesta</option>
            <option value="Promo Inviata">Promo Inviata</option>
            <option value="Offerta">Offerta</option>
            <option value="Trattativa">Trattativa</option>
            <option value="Vinto">Vinto/Goal</option>
            <option value="Perso">Perso/Abbandono</option>
        </select>
        <select className="text-xs p-2.5 border rounded-lg outline-none bg-gray-50 font-bold" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">Tutti i Cluster</option>
            {analyticsData.categories.map((cat:any, i:number) => <option key={i} value={cat}>{cat}</option>)}
        </select>
        {(dateStart || filterCategory !== 'all' || filterStatus !== 'all' || searchTerm) && (
            <button onClick={() => {setDateStart(''); setDateEnd(''); setFilterCategory('all'); setFilterStatus('all'); setSearchTerm('')}} className="text-xs text-red-500 hover:underline font-bold">Reset</button>
        )}
      </div>

      {showAnalytics && (
        <div className="mb-10 animate-in slide-in-from-top duration-500 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiBox title="Valore Totale (LTV)" val={`€ ${analyticsData.totalValue.toLocaleString()}`} icon={<DollarSign className="text-white"/>} bg="bg-gradient-to-br from-blue-600 to-indigo-800 text-white" />
                <KpiBox title="Tasso di Conversione" val={`${analyticsData.conversionRate}%`} sub={`su ${filteredContacts.length} lead`} icon={<TrendingUp className="text-white"/>} bg="bg-gradient-to-br from-green-500 to-emerald-700 text-white" />
                <KpiBox title="Churn Rate (Abbandono)" val={`${analyticsData.churnRate}%`} sub="Clienti persi" icon={<Activity className="text-white"/>} bg="bg-gradient-to-br from-red-500 to-rose-700 text-white" />
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Canali Acquisto</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-1 text-blue-600"><Globe size={14}/><span className="text-xl font-black">{analyticsData.onlineCount}</span></div>
                            <span className="text-[10px] text-gray-500 uppercase">E-commerce</span>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-orange-500 justify-end"><Store size={14}/><span className="text-xl font-black">{analyticsData.storeCount}</span></div>
                            <span className="text-[10px] text-gray-500 uppercase">Punto Vendita</span>
                        </div>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                   <h3 className="font-bold text-gray-800 mb-4">Pipeline Funnel</h3>
                   <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={analyticsData.funnel} layout="vertical" margin={{left: 30}}>
                               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                               <XAxis type="number" hide />
                               <YAxis dataKey="stage" type="category" width={120} tick={{fontSize: 12, fontWeight: 'bold'}} />
                               <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px'}} />
                               <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                                   {analyticsData.funnel.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                               </Bar>
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                   <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Fonti di Acquisizione</h3>
                   <div className="flex-1 overflow-auto">
                       <table className="w-full text-xs text-left">
                           <thead><tr className="text-gray-400 border-b border-gray-100"><th className="pb-2">Fonte</th><th className="pb-2 text-right">Valore Generato</th></tr></thead>
                           <tbody className="divide-y divide-gray-50">
                               {analyticsData.pivotData.map((row: any, i: number) => (
                                   <tr key={i} className="group hover:bg-gray-50">
                                       <td className="py-3 font-bold text-gray-700">{row.name}</td>
                                       <td className="py-3 text-right text-[#00665E] font-mono font-bold">€{row.value.toLocaleString()}</td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Risultati CRM ({filteredContacts.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4 text-center">Acquisti</th>
                <th className="px-6 py-4 text-center">Ultimo Canale</th>
                <th className="px-6 py-4 text-right">LTV Valore</th>
                <th className="px-6 py-4 text-center">Stato</th>
                <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {filteredContacts.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nessun contatto corrisponde ai filtri.</td></tr>}
                {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-blue-50/30 transition group cursor-pointer" onClick={() => openEditModal(contact)}>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${contact.churn_date ? 'bg-red-100 text-red-600' : 'bg-[#00665E]/10 text-[#00665E]'}`}>
                                {getInitials(contact.name)}
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 block">{contact.name}</span>
                                <span className="text-[10px] text-gray-400">{contact.email}</span>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">{contact.orders.length}</td>
                    <td className="px-6 py-4 text-center">
                        {contact.orders.length > 0 ? (
                            contact.orders[0].channel === 'Ecommerce' ? <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded flex items-center justify-center gap-1 w-max mx-auto"><Globe size={12}/> Web</span> : <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded flex items-center justify-center gap-1 w-max mx-auto"><Store size={12}/> Store</span>
                        ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-900 font-bold">€ {contact.ltv?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            contact.status === 'Nuovo' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            (contact.status === 'Vinto' || contact.status === 'Chiuso') ? 'bg-green-50 text-green-600 border-green-100' : 
                            (contact.status === 'Perso') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>{contact.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button className="text-[#00665E] font-bold text-xs bg-[#00665E]/10 px-3 py-1.5 rounded-lg hover:bg-[#00665E] hover:text-white transition">Apri Scheda</button>
                    </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {isImportInfoOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white p-6 rounded-3xl max-w-sm w-full relative shadow-2xl">
              <button onClick={() => setIsImportInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4"><Download size={24}/></div>
              <h3 className="font-black text-xl mb-2 text-gray-900">Importa Clienti (CSV)</h3>
              <p className="text-sm text-gray-500 mb-6">Carica un file in formato .csv. Assicurati che abbia le colonne: <b className="text-gray-800">Nome</b>, <b className="text-gray-800">Email</b>, <b className="text-gray-800">Telefono</b>.</p>
              <button onClick={() => fileInputRef.current?.click()} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white py-3 rounded-xl font-bold shadow-lg transition">Scegli File dal PC</button>
           </div>
        </div>
      )}

      {isModalOpen && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                  <div className="flex items-center gap-6">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#00665E] text-white flex items-center justify-center text-sm">{getInitials(formData.name)}</div>
                        {editingId ? formData.name : 'Nuovo Lead'}
                    </h2>
                    <div className="flex bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'profile' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Profilo</button>
                        <button onClick={() => setActiveTab('orders')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'orders' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Acquisti</button>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-2"><X size={16}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                  {activeTab === 'profile' && (
                      <form id="crm-form" onSubmit={handleSave} className="grid grid-cols-2 gap-6">
                         <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold uppercase text-gray-500">Nome</label><input className="w-full p-3 rounded-xl border mt-1 font-medium" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} required/></div>
                         <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold uppercase text-gray-500">Email</label><input className="w-full p-3 rounded-xl border mt-1 font-medium" value={formData.email || ''} onChange={e=>setFormData({...formData, email: e.target.value})}/></div>
                         <div><label className="text-xs font-bold uppercase text-gray-500">Telefono</label><input className="w-full p-3 rounded-xl border mt-1 font-medium" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})}/></div>
                         <div><label className="text-xs font-bold uppercase text-gray-500">Stato Cliente</label>
                            <select className="w-full p-3 rounded-xl border mt-1 font-bold" value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
                              <option value="Visualizzato">Visualizzato</option><option value="Richiesta">Richiesta Info</option><option value="Promo Inviata">Promo Inviata</option><option value="Offerta">Offerta / Preventivo</option><option value="Trattativa">In Trattativa</option><option value="Vinto">Vinto / Goal</option><option value="Perso">Perso / Abbandono</option>
                           </select>
                         </div>
                         <div><label className="text-xs font-bold uppercase text-gray-500">Data Abbandono</label><input type="date" className="w-full p-3 rounded-xl border mt-1 font-medium text-red-600" value={formData.churn_date || ''} onChange={e=>setFormData({...formData, churn_date: e.target.value})}/></div>
                         <div><label className="text-xs font-bold uppercase text-gray-500">Fonte</label><input className="w-full p-3 rounded-xl border mt-1" value={formData.source || ''} onChange={e=>setFormData({...formData, source: e.target.value})}/></div>
                         {/* FIX: IL CRASH AVVENIVA QUI SOTTO PERCHÈ NOTES POTREBBE ESSERE NULL */}
                         <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-500">Note Commerciali</label><textarea className="w-full p-3 rounded-xl border mt-1 h-24 resize-none bg-white" value={formData.notes || ''} onChange={e=>setFormData({...formData, notes: e.target.value})}/></div>
                      </form>
                  )}

                  {activeTab === 'orders' && (
                      <div className="space-y-6">
                          <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs text-gray-400 font-bold uppercase">Valore LTV</p><p className="text-2xl font-black text-[#00665E]">€ {formData.ltv.toLocaleString()}</p></div>
                              <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs text-gray-400 font-bold uppercase">Totale Ordini</p><p className="text-2xl font-black text-gray-900">{formData.orders.length}</p></div>
                              <div className="bg-white p-4 rounded-xl shadow-sm border"><p className="text-xs text-gray-400 font-bold uppercase">Cluster Frequente</p><p className="text-xl font-black text-purple-600">{formData.preferred_category || '-'}</p></div>
                          </div>
                          <h3 className="font-bold text-gray-800 border-b pb-2">Cronologia Acquisti (Ecommerce & Store)</h3>
                          <div className="space-y-3">
                              {formData.orders.length === 0 ? <p className="text-gray-400 text-sm italic py-4">Nessun ordine registrato per questo cliente.</p> : null}
                              {formData.orders.map((ord:any, i:number) => (
                                  <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                                      <div className="flex items-center gap-4">
                                          <div className={`p-3 rounded-xl ${ord.channel === 'Ecommerce' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                              {ord.channel === 'Ecommerce' ? <Globe size={20}/> : <Store size={20}/>}
                                          </div>
                                          <div>
                                              <p className="font-bold text-sm text-gray-900">{ord.id} - {ord.items}</p>
                                              <p className="text-xs text-gray-500">{new Date(ord.date).toLocaleDateString()} • {ord.category}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-black text-lg text-[#00665E]">€ {ord.amount}</p>
                                          <p className="text-[10px] uppercase font-bold text-gray-400">{ord.channel}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                  {editingId ? <button type="button" onClick={() => handleDelete(editingId)} className="text-sm font-bold text-red-500 hover:text-red-700 px-4 py-2 rounded-xl hover:bg-red-50 transition">Elimina</button> : <div></div>}
                  <div className="flex gap-2">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">Annulla</button>
                      <button type="submit" form="crm-form" className="px-8 py-2.5 rounded-xl font-black text-white bg-[#00665E] hover:bg-[#004d46] shadow-lg flex items-center gap-2">{saving ? 'Salvataggio...' : 'Salva'}</button>
                  </div>
              </div>
            </div>
         </div>
      )}

      {showAiPanel && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 border-l border-gray-100 p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg text-white"><Sparkles size={20}/></div>
                    <h2 className="text-xl font-black text-gray-900">AI Advisor</h2>
                </div>
                <button onClick={() => setShowAiPanel(false)} className="text-gray-400 hover:text-gray-900"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
                {aiSuggestions.length === 0 ? <p className="text-gray-400 text-sm">Nessuna criticità rilevata nel periodo selezionato.</p> : null}
                {aiSuggestions.map((sug, i) => (
                    <div key={i} className={`p-4 rounded-xl border-l-4 ${sug.type === 'alert' ? 'bg-red-50 border-red-500' : sug.type === 'warning' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'}`}>
                        <h3 className="font-bold text-sm mb-1 text-gray-900">{sug.title}</h3>
                        <p className="text-xs text-gray-600 mb-3 leading-relaxed">{sug.text}</p>
                        <button onClick={() => setShowAiPanel(false)} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-50">{sug.action}</button>
                    </div>
                ))}
            </div>
        </div>
      )}
    </main>
  )
}

function KpiBox({title, val, sub, icon, bg}: any) {
    return (
        <div className={`p-5 rounded-2xl shadow-lg ${bg} relative overflow-hidden group hover:scale-[1.02] transition`}>
            <div className="flex justify-between mb-2 relative z-10">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">{icon}</div>
            </div>
            <p className="opacity-80 text-xs font-bold uppercase relative z-10">{title}</p>
            <h3 className="text-3xl font-black mt-1 relative z-10">{val}</h3>
            {sub && <p className="text-[10px] opacity-70 mt-1 relative z-10">{sub}</p>}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition"></div>
        </div>
    )
}