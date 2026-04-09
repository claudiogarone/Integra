'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
    Shield, Users, Eye, Mail, Search, Download, Send, X, Loader2, 
    CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Database,
    Server, Power, Lock, Activity, Building, Star, Zap, RefreshCw,
    MessageSquare, FileText, UserCheck, Globe, BookOpen, ChevronDown,
    MoreVertical, ExternalLink, Copy, Check, PlayCircle, LogOut
} from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts'

// ===================== TYPES =====================
type Tab = 'overview' | 'accounts' | 'consents' | 'views' | 'contact' | 'server'

// ===================== HELPERS =====================
const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        'Attivo': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Sospeso': 'bg-rose-50 text-rose-600 border-rose-200',
        'Trial': 'bg-blue-50 text-blue-600 border-blue-200',
        'In Ritardo': 'bg-amber-50 text-amber-600 border-amber-200',
    }
    return (
        <span className={`px-2 py-0.5 text-[10px] uppercase font-black rounded-full border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    )
}

const KpiCard = ({ icon: Icon, label, value, sub, color = 'emerald' }: any) => {
    const colorMap: Record<string, string> = {
        'emerald': 'bg-emerald-50 text-emerald-600',
        'blue': 'bg-blue-50 text-blue-600',
        'indigo': 'bg-indigo-50 text-indigo-600',
        'amber': 'bg-amber-50 text-amber-600',
        'purple': 'bg-purple-50 text-purple-600',
    };
    
    return (
        <div className="bg-white border border-gray-100 p-6 rounded-3xl relative overflow-hidden shadow-sm group hover:border-[#00665E] transition duration-300">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorMap[color] || colorMap['emerald']}`}>
                <Icon size={24} />
            </div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-4xl font-black text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-50 px-2 py-1 rounded inline-block">{sub}</p>}
        </div>
    )
}

const COLORS_PIE = ['#00665E', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

// ===================== MAIN PAGE =====================
export default function IntegraOSAdminPage() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    
    // Data states
    const [accounts, setAccounts] = useState<any[]>([])
    const [accountStats, setAccountStats] = useState<any>(null)
    const [consents, setConsents] = useState<any[]>([])
    const [consentStats, setConsentStats] = useState<any>(null)
    const [viewStats, setViewStats] = useState<any>(null)
    const [msgHistory, setMsgHistory] = useState<any[]>([])
    
    // UI states
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterPlan, setFilterPlan] = useState('Tutti')
    const [viewDays, setViewDays] = useState(30)
    const [copied, setCopied] = useState<string | null>(null)

    // Contact form
    const [contactMode, setContactMode] = useState<'single' | 'bulk'>('single')
    const [contactTo, setContactTo] = useState('')
    const [contactName, setContactName] = useState('')
    const [contactSubject, setContactSubject] = useState('')
    const [contactBody, setContactBody] = useState('')
    const [contactSending, setContactSending] = useState(false)
    const [contactResult, setContactResult] = useState<any>(null)

    // Fetch helpers
    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/admin/accounts')
            const d = await r.json()
            if (!d.error) { setAccounts(d.accounts || []); setAccountStats(d.stats) }
        } catch {}
        setLoading(false)
    }, [])

    const fetchConsents = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/admin/consents')
            const d = await r.json()
            if (!d.error) { setConsents(d.consents || []); setConsentStats(d.stats) }
        } catch {}
        setLoading(false)
    }, [])

    const fetchViews = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`/api/admin/views?days=${viewDays}`)
            const d = await r.json()
            if (!d.error) setViewStats(d)
        } catch {}
        setLoading(false)
    }, [viewDays])

    const fetchMsgHistory = useCallback(async () => {
        try {
            const r = await fetch('/api/admin/contact')
            const d = await r.json()
            if (!d.error) setMsgHistory(d.messages || [])
        } catch {}
    }, [])

    useEffect(() => {
        if (activeTab === 'accounts' || activeTab === 'overview') fetchAccounts()
        if (activeTab === 'consents') fetchConsents()
        if (activeTab === 'views') fetchViews()
        if (activeTab === 'contact') fetchMsgHistory()
    }, [activeTab, fetchAccounts, fetchConsents, fetchViews, fetchMsgHistory])

    const sendContact = async () => {
        if (!contactSubject || !contactBody) return alert('Compila oggetto e messaggio')
        if (contactMode === 'single' && !contactTo) return alert('Inserisci email destinatario')
        setContactSending(true)
        setContactResult(null)
        try {
            const emailsList = contactMode === 'bulk' 
                ? consents.filter(c => c.accepted_marketing).map(c => c.email)
                : null
            const r = await fetch('/api/admin/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to_email: contactTo, to_name: contactName,
                    subject: contactSubject, body: contactBody,
                    send_to_all: contactMode === 'bulk', emails_list: emailsList
                })
            })
            const d = await r.json()
            setContactResult(d)
            if (!d.error) { setContactSubject(''); setContactBody(''); fetchMsgHistory() }
        } catch {}
        setContactSending(false)
    }

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const exportCSV = () => {
        const headers = 'Email,Nome,Piano,Registrato,Confermato\n'
        const rows = accounts.map(a => `${a.email},${a.full_name || a.company_name || ''},${a.plan || 'Base'},${new Date(a.created_at_auth || a.created_at).toLocaleDateString('it-IT')},${a.email_confirmed ? 'Sì' : 'No'}`).join('\n')
        const blob = new Blob([headers + rows], { type: 'text/csv' })
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
        link.download = `IntegraOS_Account_${new Date().toLocaleDateString()}.csv`; link.click()
    }

    const filteredAccounts = accounts.filter(a => {
        const q = searchQuery.toLowerCase()
        const matchQ = !q || a.email?.toLowerCase().includes(q) || (a.company_name || '').toLowerCase().includes(q) || (a.full_name || '').toLowerCase().includes(q)
        const matchPlan = filterPlan === 'Tutti' || (a.plan || 'Base') === filterPlan
        return matchQ && matchPlan
    })

    const TABS: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'accounts', label: 'Account Registrati', icon: Users },
        { id: 'consents', label: 'Privacy & Consensi', icon: UserCheck },
        { id: 'views', label: 'Visualizzazioni', icon: Eye },
        { id: 'contact', label: 'Contatta Utenti', icon: Mail },
        { id: 'server', label: 'Infrastruttura', icon: Server },
    ]

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-20">

            {/* HEADER */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-30 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-4">
                        <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-[48px] object-contain drop-shadow-sm" />
                        <div>
                            <h1 className="text-2xl font-black text-[#00665E] leading-none">Root Master</h1>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Pannello controllo SaaS <span className="font-bold text-[#00665E]">IntegraOS</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <button onClick={() => { fetchAccounts(); fetchViews() }} className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-[#00665E] transition border border-gray-200" title="Aggiorna dati">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={exportCSV} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-5 py-2.5 rounded-xl border border-gray-200 transition text-sm shadow-sm whitespace-nowrap">
                            <Download size={16} /> Export CSV
                        </button>
                        <Link href="/admin/formazione" className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-5 py-2.5 rounded-xl border border-indigo-200 transition text-sm whitespace-nowrap">
                            <PlayCircle size={16} /> Formazione
                        </Link>
                        <Link href="/admin/login" className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-5 py-2.5 rounded-xl border border-rose-200 transition text-sm">
                            <LogOut size={16} /> Esci
                        </Link>
                    </div>
                </div>

                {/* TABS */}
                <div className="max-w-[1600px] mx-auto px-6 flex gap-2 overflow-x-auto pt-2">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap border-b-4 transition ${activeTab === t.id ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'}`}>
                            <t.icon size={18} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 py-8">

                {/* ===== TAB: OVERVIEW ===== */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard icon={Users} label="Account Totali" value={accountStats?.total ?? '—'} sub={`+${accountStats?.new_today ?? 0} oggi`} color="emerald" />
                            <KpiCard icon={UserCheck} label="Consensi Privacy" value={consentStats?.total ?? '—'} sub={`${consentStats?.marketing_yes ?? 0} marketing OK`} color="blue" />
                            <KpiCard icon={Eye} label="Visualizzazioni (30gg)" value={viewStats?.total_views ?? '—'} sub={`${viewStats?.unique_visitors ?? 0} visitatori unici`} color="indigo" />
                            <KpiCard icon={TrendingUp} label="Attivi questo mese" value={accountStats?.active_this_month ?? '—'} sub="utenti con attività" color="amber" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Trend visualizzazioni 7gg */}
                            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-2"><Eye className="text-[#00665E]" size={24} /> Trend Visualizzazioni (7gg)</h3>
                                {viewStats?.last7_trend ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={viewStats.last7_trend}>
                                            <defs>
                                                <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00665E" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#00665E" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="views" stroke="#00665E" strokeWidth={4} fill="url(#viewGrad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        {loading ? <Loader2 className="animate-spin text-[#00665E]" /> : 'Nessun dato ancora — esegui admin_tables.sql su Supabase'}
                                    </div>
                                )}
                            </div>

                            {/* Distribuzione piani */}
                            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col">
                                <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-2"><Database className="text-[#00665E]" size={24} /> Account per Piano</h3>
                                {accountStats?.by_plan && Object.keys(accountStats.by_plan).length > 0 ? (
                                    <div className="flex flex-col sm:flex-row gap-8 items-center flex-1 justify-center">
                                        <ResponsiveContainer width={220} height={220}>
                                            <PieChart>
                                                <Pie data={Object.entries(accountStats.by_plan).map(([name, value]) => ({ name, value }))}
                                                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={5}>
                                                    {Object.keys(accountStats.by_plan).map((_: any, i: number) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-4 w-full sm:w-auto">
                                            {Object.entries(accountStats.by_plan).map(([plan, count]: any, i) => (
                                                <div key={plan} className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-xl">
                                                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS_PIE[i % COLORS_PIE.length] }} />
                                                    <span className="text-gray-700 text-sm font-black">{plan}</span>
                                                    <span className="text-gray-900 text-lg font-black ml-auto bg-white px-2 py-0.5 rounded-lg border border-gray-100">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        {loading ? <Loader2 className="animate-spin text-[#00665E]" /> : 'Carica account per vedere statistiche'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top pagine viste */}
                        {viewStats?.by_page?.length > 0 && (
                            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-2"><Globe className="text-blue-500" size={24} /> Pagine Più Visitate</h3>
                                <div className="space-y-5">
                                    {viewStats.by_page.slice(0, 8).map((p: any, i: number) => (
                                        <div key={p.page} className="flex items-center gap-4">
                                            <span className="text-gray-400 font-black w-6 text-center">{i + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm font-bold text-gray-700">{p.page}</span>
                                                    <span className="text-sm font-black text-[#00665E] bg-[#00665E]/10 px-2 py-0.5 rounded-lg">{p.count} views</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#00665E] rounded-full transition-all duration-1000" style={{ width: `${(p.count / viewStats.by_page[0].count) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TAB: ACCOUNT REGISTRATI ===== */}
                {activeTab === 'accounts' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">Account Registrati</h2>
                                <p className="text-gray-500 text-sm mt-1 font-medium">Tutti gli utenti IntegraOS con dati reali dal database</p>
                            </div>
                            <div className="flex gap-2 flex-wrap bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                                {['Tutti', 'Base', 'Pro', 'Enterprise', 'Ambassador'].map(p => (
                                    <button key={p} onClick={() => setFilterPlan(p)}
                                        className={`px-4 py-2 rounded-lg text-xs font-black transition ${filterPlan === p ? 'bg-[#00665E] text-white shadow-md' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cerca per email, nome azienda..."
                                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition shadow-sm font-medium" />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#00665E]" size={40} /></div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                    <Users size={32} className="text-gray-400" />
                                </div>
                                <p className="text-gray-900 font-black text-xl">Nessun account trovato</p>
                                <p className="text-gray-500 text-sm mt-2">Verifica che l'API admin sia configurata correttamente</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                                {['Utente', 'Piano', 'Registrato', 'Ultimo Accesso', 'Email Confermata', 'Azioni'].map(h => (
                                                    <th key={h} className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredAccounts.map(acc => (
                                                <tr key={acc.id} className="hover:bg-gray-50/80 transition group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-[#00665E]/10 flex items-center justify-center text-[#00665E] font-black text-sm shrink-0">
                                                                {(acc.company_name || acc.full_name || acc.email || 'U')[0].toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 text-sm">{acc.company_name || acc.full_name || 'Utente'}</p>
                                                                <button onClick={() => copyToClipboard(acc.email, acc.id)}
                                                                    className="text-xs text-gray-500 hover:text-[#00665E] flex items-center gap-1.5 transition font-medium mt-0.5">
                                                                    {acc.email}
                                                                    {copied === acc.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 text-gray-300" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-gray-100 text-gray-700 border border-gray-200">{acc.plan || 'Base'}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-600 font-medium">
                                                        {acc.created_at_auth ? new Date(acc.created_at_auth).toLocaleDateString('it-IT') : '—'}
                                                    </td>
                                                    <td className="px-6 py-5 text-sm text-gray-600 font-medium">
                                                        {acc.last_sign_in ? new Date(acc.last_sign_in).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Mai'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {acc.email_confirmed
                                                            ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 flex w-fit items-center gap-1.5 rounded-md text-xs font-bold border border-emerald-100"><CheckCircle2 size={14} /> Sì</span>
                                                            : <span className="text-amber-600 bg-amber-50 px-2 py-1 flex w-fit items-center gap-1.5 rounded-md text-xs font-bold border border-amber-100"><AlertTriangle size={14} /> No</span>}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <button onClick={() => { setContactTo(acc.email); setContactName(acc.company_name || acc.full_name || ''); setActiveTab('contact') }}
                                                            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#00665E] hover:text-[#00665E] hover:bg-[#00665E]/5 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm">
                                                            <Mail size={16} /> Contatta
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 font-bold uppercase tracking-widest">
                                    {filteredAccounts.length} account mostrati
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TAB: CONSENSI PRIVACY ===== */}
                {activeTab === 'consents' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <KpiCard icon={UserCheck} label="Totale Consensi" value={consentStats?.total ?? '—'} sub="hanno accettato Privacy Policy" color="emerald" />
                            <KpiCard icon={MessageSquare} label="Consenso Marketing" value={consentStats?.marketing_yes ?? '—'} sub="contattabili via email" color="blue" />
                            <KpiCard icon={TrendingUp} label="Questo mese" value={consentStats?.this_month ?? '—'} sub="nuovi consensi" color="indigo" />
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#00665E]" size={40} /></div>
                        ) : consents.length === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                    <FileText size={32} className="text-emerald-500" />
                                </div>
                                <p className="text-gray-900 font-black text-xl">Nessun consenso registrato</p>
                                <p className="text-gray-500 text-sm mt-2">Usa l'API <code className="text-[#00665E] bg-[#00665E]/10 px-2 py-0.5 rounded font-bold">/api/admin/consents</code> (POST) dalla tua landing page per registrare i consensi</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <span className="text-gray-900 font-black text-lg">{consents.length} utenti con consenso registrato</span>
                                    <button onClick={() => { setContactMode('bulk'); setActiveTab('contact') }}
                                        className="inline-flex items-center gap-2 bg-[#00665E] hover:bg-[#004d46] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md shadow-[#00665E]/20">
                                        <Send size={16} /> Invia Email a Tutti
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-white">
                                                {['Email', 'Nome', 'Privacy', 'Marketing', 'Versione', 'Data'].map(h => (
                                                    <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {consents.map(c => (
                                                <tr key={c.id} className="hover:bg-gray-50/80 transition">
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-bold">{c.email}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{c.full_name || '—'}</td>
                                                    <td className="px-6 py-4"><span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded w-fit text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Sì</span></td>
                                                    <td className="px-6 py-4">
                                                        {c.accepted_marketing
                                                            ? <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded w-fit text-xs font-bold flex items-center gap-1.5"><CheckCircle2 size={14} /> Sì</span>
                                                            : <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 text-xs font-bold">No</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-400 font-mono font-bold">v{c.consent_version}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{new Date(c.created_at).toLocaleDateString('it-IT')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== TAB: VISUALIZZAZIONI ===== */}
                {activeTab === 'views' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl w-fit border border-gray-200 shadow-sm">
                            <span className="text-gray-500 text-sm font-bold pl-4">Periodo:</span>
                            {[7, 30, 90].map(d => (
                                <button key={d} onClick={() => setViewDays(d)}
                                    className={`px-5 py-2 rounded-xl text-sm font-black transition ${viewDays === d ? 'bg-[#00665E]/10 text-[#00665E]' : 'bg-transparent text-gray-600 hover:bg-gray-50'}`}>
                                    {d} Giorni
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#00665E]" size={40} /></div>
                        ) : !viewStats || viewStats.total_views === 0 ? (
                            <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                                    <Eye size={32} className="text-indigo-500" />
                                </div>
                                <p className="text-gray-900 font-black text-xl">Nessuna visualizzazione registrata</p>
                                <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">Integra il tracker chiamando l'API <code className="text-[#00665E] font-bold">/api/admin/views</code> o usa l'hook da ogni pagina che vuoi monitorare.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <KpiCard icon={Eye} label="Visualizzazioni Totali" value={viewStats.total_views} color="indigo" />
                                    <KpiCard icon={Users} label="Visitatori Unici" value={viewStats.unique_visitors} color="blue" />
                                    <KpiCard icon={Globe} label="Pagine Tracciate" value={viewStats.by_page?.length || 0} color="emerald" />
                                    <KpiCard icon={BookOpen} label="Sezioni Tracciate" value={viewStats.by_section?.length || 0} color="amber" />
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                        <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-2"><TrendingUp className="text-indigo-500" size={24} /> Trend Giornaliero</h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart data={viewStats.last7_trend}>
                                                <defs>
                                                    <linearGradient id="vg2" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
                                                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={4} fill="url(#vg2)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                        <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-2"><Globe className="text-[#00665E]" size={24} /> Top Pagine</h3>
                                        <div className="space-y-4 overflow-y-auto max-h-60 pr-4">
                                            {viewStats.by_page?.slice(0, 10).map((p: any, i: number) => (
                                                <div key={p.page} className="flex items-center gap-4">
                                                    <span className="text-gray-400 font-black w-6 text-center">{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-sm font-bold text-gray-700 truncate">{p.page}</span>
                                                            <span className="text-xs font-black text-[#00665E] bg-[#00665E]/10 px-2 py-0.5 rounded-lg shrink-0">{p.count} views</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-gray-100 rounded-full">
                                                            <div className="h-full bg-[#00665E] rounded-full transition-all duration-1000" style={{ width: `${(p.count / viewStats.by_page[0].count) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Ultimi accessi */}
                                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                                        <h3 className="text-gray-900 font-black text-lg flex items-center gap-2"><Activity className="text-[#00665E]" size={20}/> Log Eventi Recenti</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-white">
                                                    {['Pagina', 'Sezione', 'Utente', 'Ora'].map(h => (
                                                        <th key={h} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {viewStats.recent?.slice(0, 20).map((v: any) => (
                                                    <tr key={v.id} className="hover:bg-gray-50/80 transition">
                                                        <td className="px-8 py-4 text-sm text-gray-900 font-bold">{v.page}</td>
                                                        <td className="px-8 py-4 text-sm text-gray-500 font-medium bg-gray-50/50 border-r border-l border-white">{v.section || '—'}</td>
                                                        <td className="px-8 py-4 text-sm text-gray-600 font-medium">{v.user_email || <span className="italic text-gray-400">Anonimo</span>}</td>
                                                        <td className="px-8 py-4 text-sm text-gray-500 font-medium">{new Date(v.viewed_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ===== TAB: CONTATTA UTENTI ===== */}
                {activeTab === 'contact' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Form */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm h-fit">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#00665E]/10 rounded-xl flex items-center justify-center"><Mail className="text-[#00665E]" size={20}/></div>
                                    Nuovo Messaggio
                                </h2>
                                <p className="text-gray-500 text-sm mt-2 font-medium">Invia email con interfaccia premium e brandizzata IntegraOS.</p>
                            </div>

                            {/* Modalità */}
                            <div className="flex gap-4 mb-8 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                {(['single', 'bulk'] as const).map(m => (
                                    <button key={m} onClick={() => setContactMode(m)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-black transition ${contactMode === m ? 'bg-white text-[#00665E] shadow-sm border border-gray-200' : 'bg-transparent text-gray-500 hover:text-gray-900'}`}>
                                        {m === 'single' ? '👤 Utente Singolo' : '📢 Invio Massivo (Newsletter)'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                {contactMode === 'single' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email Destinatario *</label>
                                            <input value={contactTo} onChange={e => setContactTo(e.target.value)}
                                                placeholder="mario.rossi@azienda.it"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-900 font-medium outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome (opzionale)</label>
                                            <input value={contactName} onChange={e => setContactName(e.target.value)}
                                                placeholder="Mario Rossi"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-900 font-medium outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition" />
                                        </div>
                                    </div>
                                )}

                                {contactMode === 'bulk' && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                                        <div className="bg-blue-100 p-2 rounded-lg"><Users size={20} className="text-blue-600"/></div>
                                        <div>
                                            <p className="text-blue-900 text-sm font-black">Modalità Broadcast Attiva</p>
                                            <p className="text-blue-700 text-sm mt-1 font-medium">L'email verrà recapitata a <strong className="font-black text-blue-900">{consentStats?.marketing_yes ?? 0} destinatari</strong> che hanno espresso il consenso commerciale (opt-in).</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Oggetto Email *</label>
                                    <input value={contactSubject} onChange={e => setContactSubject(e.target.value)}
                                        placeholder="Novità in arrivo sul tuo E-commerce..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-900 font-bold outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition" />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Corpo del Messaggio *</label>
                                    <textarea value={contactBody} onChange={e => setContactBody(e.target.value)}
                                        rows={8} placeholder="Scrivi il contenuto. Il layout aziendale e i loghi verranno applicati automaticamente..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-sm text-gray-900 font-medium outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition resize-none leading-relaxed" />
                                </div>

                                <button onClick={sendContact} disabled={contactSending}
                                    className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-black py-4 rounded-xl transition flex items-center justify-center gap-3 shadow-lg shadow-[#00665E]/20 disabled:opacity-50 text-lg mt-4">
                                    {contactSending ? <><Loader2 size={20} className="animate-spin" /> Elaborazione in corso...</> : <><Send size={20} /> Invia Messaggio</>}
                                </button>

                                {contactResult && (
                                    <div className={`rounded-xl p-5 border flex items-start gap-4 animate-in zoom-in-95 ${contactResult.error ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                        <div className={`p-2 rounded-lg ${contactResult.error ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {contactResult.error ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black ${contactResult.error ? 'text-rose-900' : 'text-emerald-900'}`}>
                                                {contactResult.error ? 'Errore di invio' : 'Invio completato!'}
                                            </p>
                                            <p className={`text-sm mt-1 font-medium ${contactResult.error ? 'text-rose-700' : 'text-emerald-700'}`}>
                                                {contactResult.error || `${contactResult.sent} elaborazioni riuscite, ${contactResult.failed} fallite.`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Storico messaggi */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col h-full max-h-[850px]">
                            <h3 className="text-gray-900 font-black text-xl flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center"><Activity className="text-indigo-500" size={20}/></div>
                                Registro Invii (Log)
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                                {msgHistory.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-16 text-center h-full flex flex-col items-center justify-center">
                                        <MessageSquare size={40} className="text-gray-300 mb-4" />
                                        <p className="text-gray-900 font-black text-lg">Nessun log disponibile</p>
                                        <p className="text-gray-500 text-sm mt-1 font-medium">Usa il form a lato per inviare il tuo primo messaggio.</p>
                                    </div>
                                ) : msgHistory.map(m => (
                                    <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#00665E]/50 transition shadow-sm group relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100 group-hover:bg-[#00665E] transition-colors"></div>
                                        <div className="flex items-start justify-between gap-4 mb-3 pl-3">
                                            <p className="text-base font-black text-gray-900 leading-tight">{m.subject}</p>
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border shrink-0 uppercase tracking-widest ${m.status === 'sent' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                {m.status}
                                            </span>
                                        </div>
                                        <div className="pl-3 flex flex-col gap-2">
                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2"><Users size={14} className="text-gray-400"/> Destinazione: <span className="font-bold text-gray-700">{m.to_email}</span></p>
                                            <p className="text-xs text-gray-400 font-medium flex items-center gap-2"><Activity size={14} className="text-gray-300"/> Timestamp: {new Date(m.sent_at).toLocaleString('it-IT')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== TAB: SERVER / INFRASTRUTTURA ===== */}
                {activeTab === 'server' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white border border-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"><AlertTriangle size={28} className="text-rose-500"/></div>
                                <div>
                                    <h3 className="text-rose-900 font-black text-xl mb-1">Zona Configurazione Critica</h3>
                                    <p className="text-sm text-rose-700 font-medium">Queste impostazioni hanno impatto globale su architettura dati e server node.</p>
                                </div>
                            </div>
                            <button className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-rose-600/20 whitespace-nowrap">
                                <Power size={18} /> Riavvio Servizi Root
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* API Keys */}
                            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-gray-900 font-black text-xl flex items-center gap-3 mb-8"><Zap className="text-amber-500" size={24} /> Stato Servizi Microservices</h3>
                                <div className="space-y-2">
                                    {[
                                        { name: 'Supabase Postgres DB', status: 'Operativo', color: 'emerald' },
                                        { name: 'Gemini AI Core (LLM)', status: 'Quota esaurita', color: 'rose' },
                                        { name: 'Resend SMTP Gateway', status: 'Connesso', color: 'emerald' },
                                        { name: 'Anthropic Claude Engine', status: 'Attivo', color: 'emerald' },
                                        { name: 'Chatwoot WebSocket', status: 'Manutenzione', color: 'amber' },
                                        { name: 'Stripe Billing & Payments', status: 'Sandbox mode', color: 'blue' },
                                    ].map((s, i) => (
                                        <div key={s.name} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-4 rounded-xl transition -mx-4 group">
                                            <span className="text-gray-700 text-sm font-black group-hover:text-gray-900 transition">{s.name}</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-${s.color}-50 text-${s.color}-600 border border-${s.color}-200 rounded-md shadow-sm`}>{s.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Security */}
                            <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                                <h3 className="text-gray-900 font-black text-xl flex items-center gap-3 mb-8"><Shield className="text-indigo-500" size={24} /> Sicurezza & Compliance</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Policy Row Level Security (RLS)', active: true, desc: "Isolamento dati multi-tenant attivo." },
                                        { label: 'Service Role Key (Bypass)', active: true, desc: "Token amministrativo configurato correttamente." },
                                        { label: 'Token ADMIN_SECRET (.env)', active: false, desc: "Header segreto per le API in produzione assente." },
                                    ].map(item => (
                                        <div key={item.label} className={`flex items-start gap-4 p-5 rounded-2xl border ${item.active ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'}`}>
                                            <div className={`mt-0.5 ${item.active ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {item.active ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                                            </div>
                                            <div>
                                                <span className={`text-sm font-black block mb-1 ${item.active ? 'text-emerald-900' : 'text-amber-900'}`}>{item.label}</span>
                                                <span className={`text-xs font-medium ${item.active ? 'text-emerald-700' : 'text-amber-700'}`}>{item.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Link utili */}
                        <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
                            <h3 className="text-gray-900 font-black text-xl mb-6 flex items-center gap-3"><ExternalLink className="text-blue-500" size={24} /> Link Root & Gestione Risorse</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Supabase SQL Editor', href: 'https://supabase.com/dashboard', icon: Database, color: 'emerald' },
                                    { label: 'Logs Health Check API', href: '/api/health', icon: Activity, color: 'blue' },
                                    { label: 'Genera Chiave Gemini', href: 'https://aistudio.google.com/apikey', icon: Zap, color: 'amber' },
                                    { label: 'Pannello Formatori', href: '/admin/formazione', icon: PlayCircle, color: 'indigo' },
                                ].map(l => (
                                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-white text-gray-700 hover:text-[#00665E] rounded-2xl text-sm font-black transition border border-gray-200 hover:border-[#00665E] hover:shadow-md group">
                                        <div className={`w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-${l.color}-500 group-hover:bg-[#00665E] group-hover:text-white transition group-hover:border-transparent`}><l.icon size={18}/></div> 
                                        {l.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}