'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Monitor, Car, HardHat, HeartPulse, Gift, Ticket, Plus, X, AlertTriangle,
  CheckCircle2, Clock, Wrench, ChevronRight, Search, Filter, Laptop, Smartphone,
  ShieldCheck, Star, FileText, Bell, Calendar, User, PhoneCall, Globe, Package
} from 'lucide-react'

type Tab = 'assets' | 'medical' | 'tickets' | 'benefits'

const ASSET_CATEGORIES = ['ICT', 'DPI', 'Auto', 'Attrezzatura', 'Licenza Software']
const TICKET_PRIORITIES = ['Bassa', 'Media', 'Alta', 'Critica']
const BENEFIT_CATEGORIES = ['Sanitario', 'Commerciale', 'Assicurativo', 'Formativo', 'Altro']

const statusColor = (s: string) => {
  if (['Attivo', 'Idoneo', 'Risolto'].includes(s)) return 'bg-emerald-100 text-emerald-700'
  if (['In Manutenzione', 'In Lavorazione', 'Idoneo con Prescrizioni'].includes(s)) return 'bg-amber-100 text-amber-700'
  if (['Fuori Servizio', 'Non Idoneo', 'Critica'].includes(s)) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const categoryIcon = (cat: string) => {
  if (cat === 'ICT') return <Monitor size={16}/>
  if (cat === 'DPI') return <HardHat size={16}/>
  if (cat === 'Auto') return <Car size={16}/>
  if (cat === 'Licenza Software') return <Package size={16}/>
  return <Wrench size={16}/>
}

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('assets')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Data
  const [assets, setAssets] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [checkups, setCheckups] = useState<any[]>([])
  const [benefits, setBenefits] = useState<any[]>([])

  // Modal states
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false)
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Forms
  const [assetForm, setAssetForm] = useState({ name: '', category: 'ICT', subcategory: '', brand: '', model: '', serial_number: '', assigned_name: '', status: 'Attivo', next_renewal_date: '', warranty_expiry: '', license_plate: '', insurance_expiry: '', dpi_size: '', notes: '' })
  const [ticketForm, setTicketForm] = useState({ title: '', description: '', priority: 'Media', reported_by: '', asset_id: '' })
  const [medicalForm, setMedicalForm] = useState({ employee_name: '', employee_role: '', checkup_type: 'Visita Periodica', checkup_date: '', next_checkup_date: '', fitness_status: 'Idoneo', doctor_name: '', health_facility: '', notes: '' })
  const [benefitForm, setBenefitForm] = useState({ name: '', category: 'Sanitario', partner_name: '', description: '', discount_percentage: '', contact_name: '', contact_phone: '', website_url: '', valid_until: '' })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;
      setUser(user)
      await fetchAll(user.id)
    }
    getData()
  }, [])

  const fetchAll = async (uid: string) => {
    setLoading(true)
    const [a, t, m, b] = await Promise.all([
      supabase.from('ops_assets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('ops_tickets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('ops_medical_checkups').select('*').eq('user_id', uid).order('next_checkup_date', { ascending: true }),
      supabase.from('ops_benefits').select('*').eq('user_id', uid).eq('is_active', true).order('created_at', { ascending: false }),
    ])
    setAssets(a.data || [])
    setTickets(t.data || [])
    setCheckups(m.data || [])
    setBenefits(b.data || [])
    setLoading(false)
  }

  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('ops_assets').insert({ ...assetForm, user_id: user.id, next_renewal_date: assetForm.next_renewal_date || null, warranty_expiry: assetForm.warranty_expiry || null, insurance_expiry: assetForm.insurance_expiry || null })
    if (error) { alert('Errore: ' + error.message); setSaving(false); return }
    await fetchAll(user.id); setIsAssetModalOpen(false); setSaving(false)
    setAssetForm({ name: '', category: 'ICT', subcategory: '', brand: '', model: '', serial_number: '', assigned_name: '', status: 'Attivo', next_renewal_date: '', warranty_expiry: '', license_plate: '', insurance_expiry: '', dpi_size: '', notes: '' })
  }

  const saveTicket = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('ops_tickets').insert({ ...ticketForm, user_id: user.id, asset_id: ticketForm.asset_id || null })
    if (error) { alert('Errore: ' + error.message); setSaving(false); return }
    await fetchAll(user.id); setIsTicketModalOpen(false); setSaving(false)
    setTicketForm({ title: '', description: '', priority: 'Media', reported_by: '', asset_id: '' })
  }

  const saveMedical = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('ops_medical_checkups').insert({ ...medicalForm, user_id: user.id })
    if (error) { alert('Errore: ' + error.message); setSaving(false); return }
    await fetchAll(user.id); setIsMedicalModalOpen(false); setSaving(false)
    setMedicalForm({ employee_name: '', employee_role: '', checkup_type: 'Visita Periodica', checkup_date: '', next_checkup_date: '', fitness_status: 'Idoneo', doctor_name: '', health_facility: '', notes: '' })
  }

  const saveBenefit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('ops_benefits').insert({ ...benefitForm, user_id: user.id, discount_percentage: Number(benefitForm.discount_percentage) || null, valid_until: benefitForm.valid_until || null })
    if (error) { alert('Errore: ' + error.message); setSaving(false); return }
    await fetchAll(user.id); setIsBenefitModalOpen(false); setSaving(false)
    setBenefitForm({ name: '', category: 'Sanitario', partner_name: '', description: '', discount_percentage: '', contact_name: '', contact_phone: '', website_url: '', valid_until: '' })
  }

  const daysUntil = (dateStr: string) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    return diff
  }

  const filteredAssets = assets.filter(a => !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.assigned_name?.toLowerCase().includes(search.toLowerCase()) || a.brand?.toLowerCase().includes(search.toLowerCase()))

  // STATS
  const expiringSoon = assets.filter(a => { const d = daysUntil(a.next_renewal_date); return d !== null && d <= 30 && d >= 0 }).length
  const openTickets = tickets.filter(t => t.status === 'Aperto' || t.status === 'In Lavorazione').length
  const pendingMedical = checkups.filter(c => { const d = daysUntil(c.next_checkup_date); return d !== null && d <= 60 }).length

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode; count?: number; alert?: boolean }[] = [
    { id: 'assets', label: 'Asset ICT / DPI / Auto', icon: <Monitor size={16}/>, count: assets.length, alert: expiringSoon > 0 },
    { id: 'medical', label: 'Salute & Visite', icon: <HeartPulse size={16}/>, count: checkups.length, alert: pendingMedical > 0 },
    { id: 'tickets', label: 'Ticket Assistenza', icon: <Ticket size={16}/>, count: openTickets, alert: openTickets > 0 },
    { id: 'benefits', label: 'Convenzioni & Benefit', icon: <Gift size={16}/>, count: benefits.length },
  ]

  if (loading) return <div className="p-10 text-teal-700 font-bold animate-pulse">Caricamento Operations Center...</div>

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3">
            <ShieldCheck size={28}/> Ops & Safety 360
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestione Asset, Sicurezza sul Lavoro e Welfare Aziendale</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* STAT CARDS */}
          {expiringSoon > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
              <AlertTriangle size={16}/> {expiringSoon} scadenze prossime
            </div>
          )}
          {openTickets > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
              <Ticket size={16}/> {openTickets} ticket aperti
            </div>
          )}
          {pendingMedical > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold">
              <HeartPulse size={16}/> {pendingMedical} visite in scadenza
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabConfig.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all relative ${activeTab === t.id ? 'bg-[#00665E] text-white shadow-lg shadow-[#00665E]/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#00665E]/40 hover:text-[#00665E]'}`}>
            {t.icon} {t.label}
            {t.count !== undefined && (
              <span className={`ml-1 text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
            )}
            {t.alert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
          </button>
        ))}
      </div>

      {/* ======== TAB: ASSETS ======== */}
      {activeTab === 'assets' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome, assegnatario, brand..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
            </div>
            <button onClick={() => setIsAssetModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20 shrink-0">
              <Plus size={18}/> Aggiungi Asset
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <Monitor size={48} className="mx-auto mb-4 text-gray-300"/>
              <p className="font-bold text-gray-500">Nessun asset registrato</p>
              <p className="text-sm text-gray-400 mt-1">Aggiungi laptop, DPI, auto aziendali e attrezzatura.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAssets.map(asset => {
                const renewalDays = daysUntil(asset.next_renewal_date)
                const urgent = renewalDays !== null && renewalDays <= 30 && renewalDays >= 0
                return (
                  <div key={asset.id} className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden ${urgent ? 'border-amber-300' : 'border-gray-100'}`}>
                    {urgent && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400"></div>}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-[#00665E]/10 rounded-xl flex items-center justify-center text-[#00665E]">
                          {categoryIcon(asset.category)}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm leading-tight">{asset.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{asset.category} {asset.subcategory && `· ${asset.subcategory}`}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${statusColor(asset.status)}`}>{asset.status}</span>
                    </div>

                    {asset.assigned_name && (
                      <div className="flex items-center gap-2 mb-2">
                        <User size={12} className="text-gray-400"/>
                        <span className="text-xs text-gray-600 font-medium">{asset.assigned_name}</span>
                      </div>
                    )}
                    {asset.brand && <p className="text-xs text-gray-500 mb-1"><span className="font-bold">Brand:</span> {asset.brand} {asset.model && `${asset.model}`}</p>}
                    {asset.serial_number && <p className="text-xs text-gray-400 font-mono mb-2">SN: {asset.serial_number}</p>}

                    {asset.next_renewal_date && (
                      <div className={`flex items-center gap-2 mt-3 p-2 rounded-xl text-xs font-bold ${urgent ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                        {urgent ? <AlertTriangle size={14}/> : <Calendar size={14}/>}
                        Rinnovo: {new Date(asset.next_renewal_date).toLocaleDateString('it-IT')}
                        {renewalDays !== null && <span className="ml-auto">({renewalDays}gg)</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ======== TAB: MEDICAL ======== */}
      {activeTab === 'medical' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-800">Registro Visite Mediche & Idoneità</h2>
            <button onClick={() => setIsMedicalModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">
              <Plus size={18}/> Nuova Visita
            </button>
          </div>

          {checkups.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <HeartPulse size={48} className="mx-auto mb-4 text-gray-300"/>
              <p className="font-bold text-gray-500">Nessuna visita medica registrata</p>
              <p className="text-sm text-gray-400 mt-1">Traccia le visite mediche obbligatorie e le date di rinnovo.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checkups.map(c => {
                const days = daysUntil(c.next_checkup_date)
                const isUrgent = days !== null && days <= 60
                return (
                  <div key={c.id} className={`bg-white border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 ${isUrgent ? 'border-blue-300' : 'border-gray-100'}`}>
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                      <HeartPulse size={22} className="text-blue-500"/>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900">{c.employee_name}</p>
                      <p className="text-xs text-gray-500">{c.employee_role && `${c.employee_role} · `}{c.checkup_type}</p>
                      {c.health_facility && <p className="text-xs text-gray-400 mt-0.5">{c.health_facility}{c.doctor_name && ` — Dr. ${c.doctor_name}`}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${statusColor(c.fitness_status)}`}>{c.fitness_status}</span>
                      {c.next_checkup_date && (
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isUrgent ? 'text-blue-600' : 'text-gray-400'}`}>
                          <Bell size={12}/> Prossima: {new Date(c.next_checkup_date).toLocaleDateString('it-IT')}
                          {days !== null && <span className="font-black">({days}gg)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ======== TAB: TICKETS ======== */}
      {activeTab === 'tickets' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-800">Helpdesk Interno</h2>
            <button onClick={() => setIsTicketModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">
              <Plus size={18}/> Apri Ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <Ticket size={48} className="mx-auto mb-4 text-gray-300"/>
              <p className="font-bold text-gray-500">Nessun ticket aperto</p>
              <p className="text-sm text-gray-400 mt-1">I collaboratori possono segnalare malfunzionamenti qui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`w-2 self-stretch rounded-full shrink-0 ${t.priority === 'Critica' ? 'bg-red-500' : t.priority === 'Alta' ? 'bg-orange-400' : t.priority === 'Media' ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    {t.reported_by && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><User size={10}/>{t.reported_by}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${statusColor(t.status)}`}>{t.status}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${t.priority === 'Critica' ? 'bg-red-100 text-red-600' : t.priority === 'Alta' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======== TAB: BENEFITS ======== */}
      {activeTab === 'benefits' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-800">Convenzioni & Welfare Collaboratori</h2>
            <button onClick={() => setIsBenefitModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">
              <Plus size={18}/> Nuova Convenzione
            </button>
          </div>

          {benefits.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
              <Gift size={48} className="mx-auto mb-4 text-gray-300"/>
              <p className="font-bold text-gray-500">Nessuna convenzione attiva</p>
              <p className="text-sm text-gray-400 mt-1">Aggiungi sconti e benefit per i tuoi collaboratori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {benefits.map(b => (
                <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-gray-900">{b.name}</p>
                      {b.partner_name && <p className="text-xs text-gray-500">{b.partner_name}</p>}
                    </div>
                    {b.discount_percentage && (
                      <div className="bg-[#00665E] text-white font-black text-lg px-3 py-1 rounded-xl shrink-0">
                        -{b.discount_percentage}%
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded-lg uppercase tracking-widest">{b.category}</span>
                  {b.description && <p className="text-xs text-gray-500 mt-3 leading-relaxed">{b.description}</p>}
                  <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                    {b.contact_phone && (
                      <a href={`tel:${b.contact_phone}`} className="flex items-center gap-1 text-[#00665E] text-xs font-bold hover:underline">
                        <PhoneCall size={12}/> Chiama
                      </a>
                    )}
                    {b.website_url && (
                      <a href={b.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#00665E] text-xs font-bold hover:underline">
                        <Globe size={12}/> Sito Web
                      </a>
                    )}
                    {b.valid_until && (
                      <span className="ml-auto text-[10px] text-gray-400 font-medium">
                        Scade: {new Date(b.valid_until).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== MODAL: ASSET ===== */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#00665E] flex items-center gap-2"><Monitor size={20}/> Nuovo Asset</h2>
              <button onClick={() => setIsAssetModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>
            <form id="assetForm" onSubmit={saveAsset} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Categoria *</label>
                  <select value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="input-field">
                    {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs">Sottocategoria</label>
                  <input value={assetForm.subcategory} onChange={e => setAssetForm({...assetForm, subcategory: e.target.value})} placeholder="Es: Laptop, Elmetto..." className="input-field"/>
                </div>
              </div>
              <div>
                <label className="label-xs">Nome / Descrizione *</label>
                <input required value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} placeholder="Es: MacBook Pro 14 di Mario Rossi" className="input-field"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Brand</label><input value={assetForm.brand} onChange={e => setAssetForm({...assetForm, brand: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Modello</label><input value={assetForm.model} onChange={e => setAssetForm({...assetForm, model: e.target.value})} className="input-field"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Seriale / Codice</label><input value={assetForm.serial_number} onChange={e => setAssetForm({...assetForm, serial_number: e.target.value})} className="input-field font-mono"/></div>
                <div><label className="label-xs">Assegnato a</label><input value={assetForm.assigned_name} onChange={e => setAssetForm({...assetForm, assigned_name: e.target.value})} className="input-field"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Garanzia Fino Al</label><input type="date" value={assetForm.warranty_expiry} onChange={e => setAssetForm({...assetForm, warranty_expiry: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Prossimo Rinnovo</label><input type="date" value={assetForm.next_renewal_date} onChange={e => setAssetForm({...assetForm, next_renewal_date: e.target.value})} className="input-field"/></div>
              </div>
              {assetForm.category === 'Auto' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div><label className="label-xs">Targa</label><input value={assetForm.license_plate} onChange={e => setAssetForm({...assetForm, license_plate: e.target.value})} className="input-field font-mono uppercase"/></div>
                  <div><label className="label-xs">Scadenza Assicurazione</label><input type="date" value={assetForm.insurance_expiry} onChange={e => setAssetForm({...assetForm, insurance_expiry: e.target.value})} className="input-field"/></div>
                </div>
              )}
              {assetForm.category === 'DPI' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <div><label className="label-xs">Taglia DPI</label><input value={assetForm.dpi_size} onChange={e => setAssetForm({...assetForm, dpi_size: e.target.value})} placeholder="Es: 42, M, XL" className="input-field"/></div>
                </div>
              )}
              <div><label className="label-xs">Note</label><textarea value={assetForm.notes} onChange={e => setAssetForm({...assetForm, notes: e.target.value})} className="input-field h-20 resize-none"/></div>
            </form>
            <div className="p-5 border-t bg-white">
              <button type="submit" form="assetForm" disabled={saving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50">
                {saving ? 'Salvataggio...' : 'Registra Asset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: MEDICAL ===== */}
      {isMedicalModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#00665E] flex items-center gap-2"><HeartPulse size={20}/> Nuova Visita Medica</h2>
              <button onClick={() => setIsMedicalModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>
            <form id="medicalForm" onSubmit={saveMedical} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Collaboratore *</label><input required value={medicalForm.employee_name} onChange={e => setMedicalForm({...medicalForm, employee_name: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Ruolo</label><input value={medicalForm.employee_role} onChange={e => setMedicalForm({...medicalForm, employee_role: e.target.value})} className="input-field"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Tipo Visita *</label>
                  <select value={medicalForm.checkup_type} onChange={e => setMedicalForm({...medicalForm, checkup_type: e.target.value})} className="input-field">
                    {['Visita Preventiva', 'Visita Periodica', 'al Rientro', 'Straordinaria'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs">Esito *</label>
                  <select value={medicalForm.fitness_status} onChange={e => setMedicalForm({...medicalForm, fitness_status: e.target.value})} className="input-field">
                    {['Idoneo', 'Idoneo con Prescrizioni', 'Non Idoneo'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Data Visita *</label><input required type="date" value={medicalForm.checkup_date} onChange={e => setMedicalForm({...medicalForm, checkup_date: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Prossima Visita *</label><input required type="date" value={medicalForm.next_checkup_date} onChange={e => setMedicalForm({...medicalForm, next_checkup_date: e.target.value})} className="input-field"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Medico</label><input value={medicalForm.doctor_name} onChange={e => setMedicalForm({...medicalForm, doctor_name: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Struttura</label><input value={medicalForm.health_facility} onChange={e => setMedicalForm({...medicalForm, health_facility: e.target.value})} className="input-field"/></div>
              </div>
              <div><label className="label-xs">Note</label><textarea value={medicalForm.notes} onChange={e => setMedicalForm({...medicalForm, notes: e.target.value})} className="input-field h-16 resize-none"/></div>
            </form>
            <div className="p-5 border-t bg-white">
              <button type="submit" form="medicalForm" disabled={saving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50">
                {saving ? 'Salvataggio...' : 'Registra Visita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: TICKET ===== */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#00665E] flex items-center gap-2"><Ticket size={20}/> Apri Ticket Assistenza</h2>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>
            <form id="ticketForm" onSubmit={saveTicket} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div><label className="label-xs">Titolo del Problema *</label><input required value={ticketForm.title} onChange={e => setTicketForm({...ticketForm, title: e.target.value})} placeholder="Es: Laptop non si accende" className="input-field"/></div>
              <div><label className="label-xs">Descrizione</label><textarea value={ticketForm.description} onChange={e => setTicketForm({...ticketForm, description: e.target.value})} className="input-field h-24 resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Priorità</label>
                  <select value={ticketForm.priority} onChange={e => setTicketForm({...ticketForm, priority: e.target.value})} className="input-field">
                    {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="label-xs">Segnalato da</label><input value={ticketForm.reported_by} onChange={e => setTicketForm({...ticketForm, reported_by: e.target.value})} className="input-field"/></div>
              </div>
              <div>
                <label className="label-xs">Asset Associato</label>
                <select value={ticketForm.asset_id} onChange={e => setTicketForm({...ticketForm, asset_id: e.target.value})} className="input-field">
                  <option value="">-- Nessuno / Non specificato --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
                </select>
              </div>
            </form>
            <div className="p-5 border-t bg-white">
              <button type="submit" form="ticketForm" disabled={saving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50">
                {saving ? 'Invio...' : 'Apri Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: BENEFIT ===== */}
      {isBenefitModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#00665E] flex items-center gap-2"><Gift size={20}/> Nuova Convenzione</h2>
              <button onClick={() => setIsBenefitModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>
            <form id="benefitForm" onSubmit={saveBenefit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div><label className="label-xs">Nome Convenzione *</label><input required value={benefitForm.name} onChange={e => setBenefitForm({...benefitForm, name: e.target.value})} placeholder="Es: Palestra FitCenter" className="input-field"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Categoria</label>
                  <select value={benefitForm.category} onChange={e => setBenefitForm({...benefitForm, category: e.target.value})} className="input-field">
                    {BENEFIT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label-xs">Partner</label><input value={benefitForm.partner_name} onChange={e => setBenefitForm({...benefitForm, partner_name: e.target.value})} className="input-field"/></div>
              </div>
              <div><label className="label-xs">Descrizione Vantaggio</label><textarea value={benefitForm.description} onChange={e => setBenefitForm({...benefitForm, description: e.target.value})} className="input-field h-20 resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Sconto (%)</label><input type="number" min="1" max="100" value={benefitForm.discount_percentage} onChange={e => setBenefitForm({...benefitForm, discount_percentage: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Valida Fino Al</label><input type="date" value={benefitForm.valid_until} onChange={e => setBenefitForm({...benefitForm, valid_until: e.target.value})} className="input-field"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label-xs">Contatto</label><input value={benefitForm.contact_name} onChange={e => setBenefitForm({...benefitForm, contact_name: e.target.value})} className="input-field"/></div>
                <div><label className="label-xs">Telefono</label><input value={benefitForm.contact_phone} onChange={e => setBenefitForm({...benefitForm, contact_phone: e.target.value})} className="input-field"/></div>
              </div>
              <div><label className="label-xs">Sito Web</label><input type="url" value={benefitForm.website_url} onChange={e => setBenefitForm({...benefitForm, website_url: e.target.value})} placeholder="https://..." className="input-field"/></div>
            </form>
            <div className="p-5 border-t bg-white">
              <button type="submit" form="benefitForm" disabled={saving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50">
                {saving ? 'Salvataggio...' : 'Registra Convenzione'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .label-xs { display: block; font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; margin-bottom: 4px; }
        .input-field { width: 100%; background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 14px; border-radius: 12px; outline: none; font-size: 14px; transition: border-color 0.2s; }
        .input-field:focus { border-color: #00665E; background: white; }
      `}</style>
    </main>
  )
}
