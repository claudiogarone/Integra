'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
    Building, Users, Settings, Search, CheckCircle2, X, Loader2,
    Shield, BarChart3, Download, Activity, Database, Server,
    AlertTriangle, Zap, LogOut, TrendingUp, CreditCard, Power,
    MoreVertical, Box, Mail, MessageSquare, BrainCircuit, PlayCircle,
    Network, Lock, ArrowRight, Eye, UserPlus, Target, Star, Smile,
    Send,
    Sparkles
} from 'lucide-react'

// --- DATI REALI SIMULATI ---
const INITIAL_COMPANIES = [
    { id: '1', name: 'TechSolutions Srl', admin: 'Mario Rossi', email: 'admin@tech.it', plan: 'Enterprise', mrr: 299, status: 'Attivo', aiTokens: '1.2M', users: 12, rating: 5, joinDate: '12 Gen 2026' },
    { id: '2', name: 'Digital Agency', admin: 'Laura Bianchi', email: 'laura@digital.it', plan: 'Pro', mrr: 149, status: 'In Ritardo', aiTokens: '450k', users: 5, rating: 3, joinDate: '03 Feb 2026' },
    { id: '3', name: 'Verdi Consulting', admin: 'Marco Verdi', email: 'marco@verdi.com', plan: 'Starter', mrr: 49, status: 'Attivo', aiTokens: '50k', users: 2, rating: 5, joinDate: '28 Feb 2026' },
    { id: '4', name: 'Neri & Co. Logistics', admin: 'Giulia Neri', email: 'giulia@neri.it', plan: 'Pro', mrr: 149, status: 'Sospeso', aiTokens: '0', users: 4, rating: 2, joinDate: '15 Nov 2025' },
    { id: '5', name: 'Ristorante La Pinta', admin: 'Luigi Neri', email: 'info@lapinta.it', plan: 'Starter', mrr: 49, status: 'Trial', aiTokens: '12k', users: 1, rating: 4, joinDate: 'Oggi' },
]

const HOT_LEADS = [
    { id: 1, email: 'ceo@marketingpro.it', visits: 5, intent: 'Alto (Pagina Prezzi)', time: '10 min fa' },
    { id: 2, email: 'info@studiograndi.com', visits: 3, intent: 'Medio (Features CRM)', time: '1 ora fa' },
    { id: 3, email: 'm.ferrari@logistica.it', visits: 8, intent: 'Molto Alto (Checkout abbandonato)', time: '3 ore fa' }
]

const SYSTEM_LOGS = [
    { id: 1, type: 'warning', msg: 'Picco chiamate API Anthropic (Claude 3.5)', time: '10 min fa' },
    { id: 2, type: 'error', msg: 'CRITICO: Coda Email (Resend) bloccata. Timeout connessione.', time: '1 ora fa' },
    { id: 3, type: 'success', msg: 'Backup Database Supabase completato', time: '03:00 AM' },
    { id: 4, type: 'success', msg: 'Sincronizzazione webhook completata', time: 'Ieri 22:00' },
    { id: 5, type: 'warning', msg: 'Utilizzo disco server al 85%', time: 'Ieri 18:30' }
]

export default function IntegraOSAdminPage() {
    // Stati Dati Vivi
    const [companies, setCompanies] = useState(INITIAL_COMPANIES)
    const [force2FA, setForce2FA] = useState(false)
    
    // Stati Navigazione
    const [activeTab, setActiveTab] = useState<'overview' | 'aziende' | 'server'>('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [companyFilter, setCompanyFilter] = useState('Tutti')
    const [timeFilter, setTimeFilter] = useState('mese')
    const [kpiMultiplier, setKpiMultiplier] = useState(1) // Moltiplicatore per i filtri
    
    // Stati Modali e UI
    const [companyDetailsModal, setCompanyDetailsModal] = useState<any>(null)
    const [logsModalOpen, setLogsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [systemRestarting, setSystemRestarting] = useState(false)
    const [aiActionStatus, setAiActionStatus] = useState<'idle' | 'running' | 'success'>('idle')

    // --- FUNZIONI ---

    const handleTimeFilter = (filter: string) => {
        setTimeFilter(filter)
        // Simula la variazione dei dati (Oggi = 10%, 7gg = 30%, Mese = 100%, Anno = 1200%)
        if(filter === 'oggi') setKpiMultiplier(0.1)
        if(filter === '7gg') setKpiMultiplier(0.3)
        if(filter === 'mese') setKpiMultiplier(1)
        if(filter === 'anno') setKpiMultiplier(12)
    }

    const exportToCSV = () => {
        const headers = ['Azienda,Amministratore,Email,Piano,MRR (€),Stato,Feedback,Token AI\n'];
        const csvData = companies.map(c => 
            `"${c.name}","${c.admin}","${c.email}","${c.plan}","${c.mrr}","${c.status}","${c.rating}/5","${c.aiTokens}"`
        ).join('\n');
        
        const blob = new Blob([headers + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `IntegraOS_Aziende_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }

    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = companyFilter === 'Tutti' || 
                              (companyFilter === 'Sospesi' && c.status === 'Sospeso') || 
                              (companyFilter === 'In Trial' && c.status === 'Trial');
        return matchesSearch && matchesFilter;
    })

    const handleContactLead = (email: string) => {
        // In una vera app aprirebbe il client mail (es. window.location.href = `mailto:${email}`)
        alert(`Apertura bozza email diretta a: ${email}\nOggetto: Integrazione IntegraOS - Abbiamo un'offerta per te.`);
    }

    const simulateSystemRestart = () => {
        setSystemRestarting(true)
        setTimeout(() => setSystemRestarting(false), 3000)
    }

    const handleAction = (action: string) => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            alert(`Azione: "${action}" eseguita.`)
        }, 1000)
    }

    const toggleCompanyStatus = () => {
        setIsSaving(true)
        setTimeout(() => {
            const newStatus = companyDetailsModal.status === 'Sospeso' ? 'Attivo' : 'Sospeso';
            setCompanies(companies.map(c => c.id === companyDetailsModal.id ? {...c, status: newStatus} : c));
            setCompanyDetailsModal({...companyDetailsModal, status: newStatus});
            setIsSaving(false);
        }, 1000)
    }

    const activateAIGrowthCampaign = () => {
        setAiActionStatus('running')
        setTimeout(() => setAiActionStatus('success'), 2000)
    }

    return (
        <div className="min-h-screen bg-[#02050A] font-sans selection:bg-emerald-500 selection:text-white p-6 md:p-8 lg:p-12 text-slate-200">
            
            {/* --- HEADER ADMIN --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <Shield size={24} className="text-white"/>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Root Master <span className="text-emerald-500 font-light">| IntegraOS</span></h1>
                    </div>
                    <p className="text-slate-400">Controllo SaaS: MRR, Server, Upselling e Sicurezza.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/admin/formazione" className="bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                        <PlayCircle size={18}/> Switch to Academy
                    </Link>
                    <button onClick={exportToCSV} className="bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg">
                        <Download size={18}/> Export CSV
                    </button>
                    <Link href="/admin/login" className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                        <LogOut size={18}/> Lock Terminal
                    </Link>
                </div>
            </div>

            {/* --- MENU TABS --- */}
            <div className="flex border-b border-slate-800 mb-8 overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><BarChart3 size={18}/> Overview & Growth</button>
                <button onClick={() => setActiveTab('aziende')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'aziende' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Building size={18}/> Imprese & Licenze</button>
                <button onClick={() => setActiveTab('server')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'server' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Server size={18}/> Health & Architettura</button>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW SAAS E GROWTH                             */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in">
                    
                    {/* Filtri Temporali Vivi */}
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 w-fit">
                        {['oggi', '7gg', 'mese', 'anno'].map(f => (
                            <button key={f} onClick={() => handleTimeFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${timeFilter === f ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>{f}</button>
                        ))}
                    </div>

                    {/* KPI CARDS (Dinamici con filtro) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm mb-4"><CreditCard size={18} className="text-emerald-500"/> MRR (Ricavi)</div>
                            <div className="text-4xl font-black text-white">€{Math.round(12450 * kpiMultiplier).toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm mb-4"><Activity size={18} className="text-blue-500"/> LTV (Permanenza)</div>
                            <div className="text-4xl font-black text-white">18 <span className="text-xl text-slate-500">mesi</span></div>
                            <p className="text-slate-500 text-xs font-bold mt-2">Lifetime Value medio</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm mb-4"><Target size={18} className="text-indigo-400"/> Conversion Rate Vetrina</div>
                            <div className="text-4xl font-black text-white">3.2%</div>
                            <p className="text-emerald-500 text-xs font-bold mt-2 flex items-center gap-1">{Math.round(2450 * kpiMultiplier)} Visite uniche</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm mb-4"><Smile size={18} className="text-amber-400"/> Feedback (NPS)</div>
                            <div className="text-4xl font-black text-white">72<span className="text-xl text-slate-500">/100</span></div>
                        </div>
                    </div>

                    {/* NUOVO GRAFICO CRESCITA MRR */}
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col">
                        <h3 className="text-white font-bold mb-8 flex items-center gap-2"><BarChart3 className="text-emerald-500"/> Crescita Entrate (MRR Growth)</h3>
                        <div className="flex items-end justify-between gap-2 md:gap-4 h-48 mt-auto">
                            {[30, 40, 45, 60, 55, 75, 90].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                    <div className="w-full bg-slate-800/50 rounded-t-xl relative overflow-hidden" style={{height: `${h * (kpiMultiplier > 1 ? 1 : kpiMultiplier)}%`}}>
                                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl group-hover:opacity-80 transition-opacity h-full"></div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Mes {i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* SEZIONE ACQUISIZIONE E LEADS (RADAR) */}
                        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-white font-bold flex items-center gap-2"><UserPlus className="text-blue-500"/> Hot Leads Radar</h3>
                                    <p className="text-xs text-slate-400">Aziende che stanno guardando IntegraOS in questo momento.</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Tracker Attivo
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-800">
                                            <th className="pb-3">Contatto Trovato (Email/IP)</th>
                                            <th className="pb-3">Comportamento</th>
                                            <th className="pb-3">Ultima Azione</th>
                                            <th className="pb-3 text-right">Azione Commerciale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {HOT_LEADS.map(lead => (
                                            <tr key={lead.id} className="hover:bg-slate-800/30 transition">
                                                <td className="py-4 text-sm font-bold text-white">{lead.email}</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 text-[10px] rounded border ${lead.intent.includes('Alto') ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                                                        {lead.intent} ({lead.visits} visite)
                                                    </span>
                                                </td>
                                                <td className="py-4 text-xs text-slate-400">{lead.time}</td>
                                                <td className="py-4 text-right">
                                                    {/* Pulsante Contatta Funzionante */}
                                                    <button onClick={() => handleContactLead(lead.email)} className="bg-slate-800 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto">
                                                        <Send size={12}/> Contatta
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* AI BUSINESS ADVISOR */}
                        <div className="bg-gradient-to-br from-teal-900/30 to-slate-900 border border-emerald-500/30 p-8 rounded-3xl flex flex-col relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 text-emerald-500/10"><BrainCircuit size={150}/></div>
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2 relative z-10"><Sparkles className="text-emerald-400"/> AI Growth Advisor</h3>
                            <p className="text-xs text-emerald-200/50 mb-6 relative z-10">Suggerimenti per aumentare l'MRR.</p>

                            <div className="space-y-4 relative z-10 flex-1">
                                <div className="bg-[#02050A] p-4 rounded-xl border border-slate-800">
                                    <p className="text-xs text-amber-400 font-bold mb-1">Opportunità Rilevata</p>
                                    <p className="text-sm text-slate-300">Ci sono 12 aziende in "Starter" che usano l'AI Agent tutti i giorni.</p>
                                </div>
                                <div className="bg-emerald-600/10 p-4 rounded-xl border border-emerald-500/30">
                                    <p className="text-xs text-emerald-400 font-bold mb-1">Azione Consigliata</p>
                                    <p className="text-sm text-slate-300">Invia proposta di Upgrade al piano "Pro" (-15% primo mese).</p>
                                </div>
                            </div>
                            
                            {aiActionStatus === 'success' ? (
                                <div className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 relative z-10">
                                    <CheckCircle2 size={18}/> Campagna Upsell Inviata
                                </div>
                            ) : (
                                <button onClick={activateAIGrowthCampaign} disabled={aiActionStatus === 'running'} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl mt-4 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {aiActionStatus === 'running' ? <Loader2 size={16} className="animate-spin"/> : <Zap size={16}/>} Genera Email Upsell
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: GESTIONE AZIENDE E LICENZE (+ COLONNA FEEDBACK)    */}
            {/* ========================================================= */}
            {activeTab === 'aziende' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
                    <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center flex-wrap gap-4">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Cerca impresa (Nome, Email)..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#02050A] border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCompanyFilter('Tutti')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${companyFilter === 'Tutti' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Tutti</button>
                            <button onClick={() => setCompanyFilter('Sospesi')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${companyFilter === 'Sospesi' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Sospesi</button>
                            <button onClick={() => setCompanyFilter('In Trial')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${companyFilter === 'In Trial' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>In Trial</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-widest font-bold border-b border-slate-800 bg-[#02050A]">
                                    <th className="p-6">Azienda (Workspace)</th>
                                    <th className="p-6">Piano & Licenze</th>
                                    <th className="p-6">Stato Sistema</th>
                                    <th className="p-6">Feedback</th> {/* NUOVA COLONNA */}
                                    <th className="p-6 text-right">Azioni Root</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredCompanies.map(comp => (
                                    <tr key={comp.id} className="hover:bg-slate-800/20 transition group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400">
                                                    <Building size={18}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base">{comp.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">Root: {comp.admin} • {comp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-white font-bold mb-1">{comp.plan} <span className="text-slate-500 font-normal ml-1">(€{comp.mrr}/mese)</span></p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1"><Users size={12}/> {comp.users} Utenti</p>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 text-[10px] uppercase tracking-wider font-black rounded-full border inline-block ${
                                                comp.status === 'Attivo' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                (comp.status === 'Sospeso' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                                (comp.status === 'In Ritardo' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'))
                                            }`}>
                                                {comp.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {/* VISUALIZZAZIONE FEEDBACK STELLINE */}
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < comp.rating ? "currentColor" : "transparent"} className={i < comp.rating ? "" : "text-slate-600"}/>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-slate-500 mt-1 block">NPS Score</span>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button onClick={() => setCompanyDetailsModal(comp)} className="bg-slate-800 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition inline-flex items-center gap-1">
                                                <Settings size={14}/> Gestisci
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCompanies.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-bold">Nessun Workspace trovato.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: HEALTH E API (+ COLLI DI BOTTIGLIA)                */}
            {/* ========================================================= */}
            {activeTab === 'server' && (
                <div className="space-y-6 animate-in fade-in">
                    
                    <div className="bg-rose-950/20 border border-rose-900/50 p-6 rounded-3xl flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle className="text-rose-500"/> Azioni di Rete (Pericolo)</h3>
                            <p className="text-xs text-rose-200/50 mt-1">Azioni che impattano tutte le aziende collegate.</p>
                        </div>
                        <button onClick={simulateSystemRestart} disabled={systemRestarting} className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50">
                            {systemRestarting ? <><Loader2 size={18} className="animate-spin"/> Riavvio in corso...</> : <><Power size={18}/> Hard Restart Container</>}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* MAPPA RETE SERVER ANIMATA CON BOTTLENECK */}
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col relative overflow-hidden">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2 relative z-10"><Network className="text-emerald-500"/> Flusso Dati & Colli di Bottiglia</h3>
                            <p className="text-xs text-slate-400 mb-8 relative z-10">Monitoraggio live del flusso dati. Le linee rosse indicano blocchi di rete.</p>
                            
                            <div className="flex-1 min-h-[300px] relative flex items-center justify-center">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                                
                                {/* SVG ANIMAZIONI FLUSSO DATI E BLOCCHI (Bottlenecks) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                    {/* Linea Supabase -> Core (Sana) */}
                                    <path id="path-db" d="M 20% 30% L 50% 50%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2" fill="none" />
                                    <circle r="3" fill="#3b82f6" className="drop-shadow-[0_0_5px_#3b82f6]"><animateMotion dur="1.5s" repeatCount="indefinite"><mpath href="#path-db"/></animateMotion></circle>
                                    
                                    {/* Linea Core -> Chatwoot (Sana) */}
                                    <path id="path-chat" d="M 50% 50% L 80% 30%" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="2" fill="none" />
                                    <circle r="3" fill="#f59e0b" className="drop-shadow-[0_0_5px_#f59e0b]"><animateMotion dur="2s" repeatCount="indefinite"><mpath href="#path-chat"/></animateMotion></circle>
                                    
                                    {/* Linea Core -> AI (Sana) */}
                                    <path id="path-ai" d="M 50% 50% L 30% 80%" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="2" fill="none" />
                                    <circle r="3" fill="#6366f1" className="drop-shadow-[0_0_5px_#6366f1]"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-ai"/></animateMotion></circle>
                                    
                                    {/* COLLO DI BOTTIGLIA: Linea Core -> Resend (Rossa, lenta, pulsante) */}
                                    <path id="path-mail" d="M 50% 50% L 70% 80%" stroke="rgba(244, 63, 94, 0.8)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="animate-pulse" />
                                    <circle r="5" fill="#f43f5e" className="drop-shadow-[0_0_10px_#f43f5e]">
                                        {/* Va lentissimo per indicare il blocco */}
                                        <animateMotion dur="8s" repeatCount="indefinite"><mpath href="#path-mail"/></animateMotion>
                                    </circle>
                                </svg>

                                {/* Nodo Centrale */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-950 border-2 border-emerald-500 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center relative"><Box size={32} className="text-emerald-400"/><div className="absolute -inset-2 border border-emerald-500/30 rounded-3xl animate-ping opacity-20"></div></div>
                                    <span className="mt-2 text-xs font-black text-white tracking-widest bg-slate-900 px-2 py-1 rounded-md border border-slate-800">CORE SERVER</span>
                                </div>

                                {/* Nodi Periferici */}
                                <div className="absolute top-[20%] left-[10%] z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-900 border border-blue-500 rounded-xl flex items-center justify-center"><Database size={20} className="text-blue-400"/></div>
                                    <span className="mt-2 text-[10px] font-bold text-slate-400">SUPABASE</span>
                                </div>
                                <div className="absolute top-[20%] right-[10%] z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-900 border border-amber-500 rounded-xl flex items-center justify-center"><MessageSquare size={20} className="text-amber-400"/></div>
                                    <span className="mt-2 text-[10px] font-bold text-slate-400">CHATWOOT</span>
                                </div>
                                <div className="absolute bottom-[10%] left-[20%] z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-slate-900 border border-indigo-500 rounded-xl flex items-center justify-center"><BrainCircuit size={20} className="text-indigo-400"/></div>
                                    <span className="mt-2 text-[10px] font-bold text-slate-400">AI AGENTS</span>
                                </div>
                                
                                {/* Nodo con Errore / Bottleneck */}
                                <div className="absolute bottom-[10%] right-[20%] z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-rose-950 border border-rose-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"><Mail size={20} className="text-rose-400"/></div>
                                    <span className="mt-2 text-[10px] font-bold text-rose-500 bg-rose-950 px-1 rounded border border-rose-900">RESEND API (BLOCCATO)</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* API Limits */}
                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Zap className="text-amber-400"/> Limiti API Esterne</h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2"><span className="text-slate-300 font-bold">Anthropic (Claude)</span><span className="text-emerald-400 font-mono">$140 / $500</span></div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full w-[28%]"></div></div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2"><span className="text-slate-300 font-bold">Resend (Email Queue)</span><span className="text-rose-400 font-mono text-xs">ERRORE: TIMEOUT API</span></div>
                                        <div className="w-full bg-rose-950 border border-rose-900 h-2 rounded-full overflow-hidden"><div className="bg-rose-500 h-full w-full animate-pulse"></div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Configurazione Sicurezza con Toggle FUNZIONANTE e Tasto Logs */}
                            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Lock className="text-indigo-400"/> Sicurezza e Accessi</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#02050A] rounded-xl border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-white">Forza 2FA (Aziende)</p>
                                            <p className="text-xs text-slate-500">Stato: {force2FA ? 'Attivo' : 'Disattivato'}</p>
                                        </div>
                                        <button onClick={() => { setForce2FA(!force2FA); handleAction(force2FA ? '2FA Disattivata' : '2FA Attivata'); }} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${force2FA ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${force2FA ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 bg-[#02050A] rounded-xl border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-white">Log di Sistema</p>
                                            <p className="text-xs text-rose-500 font-bold">1 Errore Critico Rilevato</p>
                                        </div>
                                        {/* Tasto Vedi Logs FUNZIONANTE */}
                                        <button onClick={() => setLogsModalOpen(true)} className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition">Vedi Logs</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODALE DETTAGLI AZIENDA (Sospensione e Impersonate)       */}
            {/* ========================================================= */}
            {companyDetailsModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#02050A] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-black text-white flex items-center gap-2"><Settings size={20} className="text-emerald-500"/> Gestione: {companyDetailsModal.name}</h2>
                            <button onClick={() => setCompanyDetailsModal(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <div className="p-8">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Piano Attuale</p>
                                    <p className="text-lg font-black text-white">{companyDetailsModal.plan}</p>
                                    <button className="text-xs text-indigo-400 font-bold mt-2 hover:underline">Forza Upgrade</button>
                                </div>
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Consumo Token AI</p>
                                    <p className="text-lg font-black text-white">{companyDetailsModal.aiTokens}</p>
                                    <button className="text-xs text-amber-400 font-bold mt-2 hover:underline">Resetta Limiti</button>
                                </div>
                            </div>

                            <h4 className="text-white font-bold mb-4 border-b border-slate-800 pb-2">Azioni Root Access</h4>
                            <div className="space-y-3">
                                <button disabled={isSaving} onClick={() => handleAction('Impersonate User')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-4 rounded-xl transition flex justify-between items-center group">
                                    <span className="flex items-center gap-2"><Eye size={18}/> Impersonifica Amministratore (Entra nel CRM cliente)</span>
                                    <ArrowRight size={18} className="text-indigo-300 group-hover:translate-x-1 transition"/>
                                </button>
                                <button disabled={isSaving} onClick={() => handleAction('Invio Sollecito')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-4 rounded-xl transition flex items-center gap-2">
                                    <Mail size={18} className="text-amber-400"/> Invia sollecito di pagamento manuale
                                </button>
                                
                                {companyDetailsModal.status === 'Sospeso' ? (
                                    <button disabled={isSaving} onClick={toggleCompanyStatus} className="w-full bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-400 font-bold p-4 rounded-xl transition flex items-center gap-2 mt-4">
                                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} Riattiva Accesso Workspace
                                    </button>
                                ) : (
                                    <button disabled={isSaving} onClick={toggleCompanyStatus} className="w-full border border-rose-900/50 hover:bg-rose-950/30 text-rose-500 font-bold p-4 rounded-xl transition flex items-center gap-2 mt-4">
                                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Power size={18}/>} Sospendi Accesso Workspace
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODALE VISUALIZZATORE LOGS (Nuovo)                        */}
            {/* ========================================================= */}
            {logsModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-[#02050A] border border-slate-700 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h2 className="text-xl font-black text-white flex items-center gap-2"><Activity size={20} className="text-blue-500"/> Console Logs Server</h2>
                            <button onClick={() => setLogsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6 bg-[#010306] font-mono text-sm h-96 overflow-y-auto custom-scrollbar">
                            {SYSTEM_LOGS.map(log => (
                                <div key={log.id} className="mb-3 border-b border-slate-800/50 pb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold mr-3 ${log.type === 'error' ? 'bg-rose-500/20 text-rose-500' : (log.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500')}`}>
                                        {log.type}
                                    </span>
                                    <span className="text-slate-500 mr-3">[{log.time}]</span>
                                    <span className="text-slate-300">{log.msg}</span>
                                </div>
                            ))}
                            <div className="text-slate-600 mt-4 animate-pulse">&gt; In attesa di nuovi log...</div>
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-right">
                            <button onClick={() => handleAction('Svuota Logs')} className="text-xs font-bold text-slate-400 hover:text-white">Pulisci Console</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}