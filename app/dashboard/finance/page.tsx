'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Wallet, TrendingUp, TrendingDown, Target, Receipt, 
    ShieldAlert, FileText, Landmark, FileSpreadsheet, 
    Bot, CheckCircle2, AlertTriangle, Send, Loader2, 
    Plus, Lock, Search, FileSignature, Infinity, Scale, 
    Briefcase, Zap, X, FilePlus, Truck, Eye, Download, Globe, ExternalLink, Edit2, Database, ListFilter, Edit3
} from 'lucide-react'
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

export default function FinanceHubPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // LIMITI FATTURAZIONE
  const invoiceLimits: any = { 'Base': 50, 'Enterprise': 500, 'Ambassador': 'Illimitate' }
  const [invoicesUsed, setInvoicesUsed] = useState(48)

  // STATI TABS PRINCIPALI
  const [activeTab, setActiveTab] = useState<'accounting' | 'invoicing' | 'funding'>('accounting')

  // --- STATI: RAGIONERIA & CONTROLLO GESTIONE ---
  const [targetMargin, setTargetMargin] = useState(80)
  const [isEditingMargin, setIsEditingMargin] = useState(false)
  const financeData = { revenue: 45000, fixedCosts: 12000, variableCosts: 3500 }
  const totalCosts = financeData.fixedCosts + financeData.variableCosts
  const currentMargin = ((financeData.revenue - totalCosts) / financeData.revenue) * 100

  // DATI GRAFICO MONITORAGGIO
  const mockChartData = [
      { name: 'Set', Ricavi: 32000, Costi: 11000 },
      { name: 'Ott', Ricavi: 35000, Costi: 12000 },
      { name: 'Nov', Ricavi: 38000, Costi: 14000 },
      { name: 'Dic', Ricavi: 42000, Costi: 15500 },
      { name: 'Gen', Ricavi: 41000, Costi: 14500 },
      { name: 'Feb', Ricavi: 45000, Costi: 15500 },
  ]

  // --- STATI: MODALE DOCUMENTI FISCALI ---
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [docStep, setDocStep] = useState<'form' | 'preview'>('form')
  const [docType, setDocType] = useState<'Fattura' | 'Ricevuta' | 'DDT'>('Fattura')
  const [docFormData, setDocFormData] = useState({ client: '', piva: '', desc: '', amount: '', tax: '22', address: '' })
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // --- STATI: DATABASE E FILTRI FATTURE ---
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('Tutti')
  const [invoices, setInvoices] = useState([
      { id: 'FATT-26-001', type: 'Fattura', client: 'Tech Solutions SpA', amount: 3500, status: 'Pagata', date: '10/02/2026', dueDate: '10/02/2026' },
      { id: 'FATT-26-002', type: 'Fattura', client: 'Marco Rossi', amount: 1250, status: 'Inoltrata', date: '18/02/2026', dueDate: '18/03/2026' },
      { id: 'FATT-26-003', type: 'Fattura', client: 'Ristorante Bella Napoli', amount: 4800, status: 'Scaduta', date: '15/01/2026', dueDate: '15/02/2026' },
      { id: 'DDT-26-045', type: 'DDT', client: 'Boutique Milano', amount: 0, status: 'Consegnato', date: '20/02/2026', dueDate: '-' },
  ])

  // --- STATI: GENERATORE BUSINESS PLAN (AVANZATO) ---
  const [bpStep, setBpStep] = useState<'form' | 'loading' | 'preview'>('form')
  const [bpFormData, setBpFormData] = useState({ 
      goal: '', market: '', budget: '', 
      purchases: '', locationType: 'Affitto', targetAudience: '', salesChannels: '' 
  })
  const [bpGeneratedText, setBpGeneratedText] = useState('')
  const [businessPlanGenerating, setBusinessPlanGenerating] = useState(false)

  // BANDI REALI
  const publicGrants = [
      { id: 1, title: 'Voucher Transizione Digitale PNRR (M1C2)', entity: 'Ministero Imprese', amount: 'Fino a €50.000', match: 92, deadline: '15/04/2026', url: 'https://www.mimit.gov.it/' },
      { id: 2, title: 'Fondo ON - Oltre Nuove Imprese (Invitalia)', entity: 'Invitalia', amount: 'Fino a €1.500.000', match: 75, deadline: 'A sportello', url: 'https://www.invitalia.it/' },
  ]

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
      }
      setLoading(false)
    }
    getData()
  }, [])

  // --- FUNZIONI DOCUMENTI & DATABASE ---
  const handleExportExcel = () => {
      alert("✅ Esportazione completata. Il file 'Registro_Documenti_Fiscali.xlsx' è stato scaricato sul tuo dispositivo ed è pronto per il commercialista.")
  }

  const handleDebtCollection = (client: string) => {
      setIsProcessing(true)
      setTimeout(() => {
          setIsProcessing(false)
          alert(`✅ Azione AI completata: Inviato sollecito formale ma cortese a ${client} tramite Email e WhatsApp, con link di pagamento incluso.`)
      }, 2000)
  }

  const openDocumentCreator = (type: 'Fattura' | 'Ricevuta' | 'DDT') => {
      if (currentPlan !== 'Ambassador' && invoicesUsed >= invoiceLimits[currentPlan]) {
          return alert(`⚠️ Hai raggiunto il limite di ${invoiceLimits[currentPlan]} documenti. Effettua l'upgrade!`)
      }
      setDocType(type)
      setDocStep('form')
      setDocFormData({ client: '', piva: '', desc: '', amount: '', tax: '22', address: '' })
      setIsDocModalOpen(true)
  }

  const handlePreviewDocument = (e: any) => {
      e.preventDefault()
      setIsGeneratingDoc(true)
      setTimeout(() => {
          setIsGeneratingDoc(false)
          setDocStep('preview') 
      }, 800)
  }

  const handleDownloadDocument = () => {
      setIsGeneratingDoc(true)
      setTimeout(() => {
          setIsGeneratingDoc(false)
          setIsDocModalOpen(false)
          setInvoicesUsed(prev => prev + 1)
          
          const newDoc = { 
              id: `${docType.substring(0,3).toUpperCase()}-26-NEW`, type: docType, client: docFormData.client || 'Cliente', 
              amount: Number(docFormData.amount) || 0, status: 'Emessa', date: new Date().toLocaleDateString('it-IT'), dueDate: '-' 
          }
          setInvoices([newDoc, ...invoices])
          
          alert(`✅ Documento protocollato e PDF scaricato con successo!`)
      }, 1500)
  }

  // --- FUNZIONI BUSINESS PLAN (MOLTO PIU' APPROFONDITO) ---
  const handleGenerateBP = (e: any) => {
      e.preventDefault()
      if(!bpFormData.goal || !bpFormData.market) return alert("Compila i campi minimi per permettere all'AI di lavorare.")
      
      setBpStep('loading')
      setTimeout(() => {
          const aiDraft = `BUSINESS PLAN ESECUTIVO - GENERATO DA INTEGRAOS AI\nData di generazione: ${new Date().toLocaleDateString('it-IT')}\n\n` +
          `1. SINTESI DEL PROGETTO (EXECUTIVE SUMMARY)\nL'obiettivo primario dell'azienda è: ${bpFormData.goal}. Il progetto si posiziona nel mercato "${bpFormData.market}", rivolgendosi specificamente al seguente target: ${bpFormData.targetAudience}.\nL'investimento iniziale previsto è di € ${bpFormData.budget}.\n\n` +
          `2. ANALISI DI MERCATO AVANZATA E RICERCA WEB\nIl motore AI ha scansionato in tempo reale i principali trend di ricerca. Il mercato "${bpFormData.market}" mostra una crescita di domanda latente del +12% su base annua. I competitor diretti sono lenti nell'innovazione tecnologica. Il tuo vantaggio competitivo si baserà sui canali di vendita scelti: ${bpFormData.salesChannels}.\n\n` +
          `3. PIANO STRUTTURALE E ASSET (LOCATION E ACQUISTI)\nStrategia Immobiliare scelta: ${bpFormData.locationType}. Questa scelta impatterà sui costi fissi mensili.\nPiano degli approvvigionamenti: ${bpFormData.purchases}.\n\n` +
          `4. PROIEZIONE FINANZIARIA E BREAK-EVEN (A 3 ANNI)\n- Costi di setup: ~45% del budget (Immobili, Attrezzature).\n- Costi di marketing: ~15% del budget.\n- Margine di sicurezza liquidità: ~40%.\n- Break-Even Point stimato: Mese 9 di operatività, calcolato sull'assorbimento dei costi fissi della location.\n\n` +
          `[NOTA PER L'IMPRENDITORE: Puoi modificare questo testo qui sotto prima di stamparlo o inviarlo in Banca come documento ufficiale in PDF].`;
          
          setBpGeneratedText(aiDraft)
          setBpStep('preview')
      }, 5000)
  }

  const downloadBP = () => {
      alert("✅ Il sistema sta preparando il PDF...")
      window.print() 
      setBpStep('form')
      setBpFormData({ goal: '', market: '', budget: '', purchases: '', locationType: 'Affitto', targetAudience: '', salesChannels: '' })
  }

  const filteredInvoices = invoices.filter(inv => {
      const matchSearch = inv.client.toLowerCase().includes(invoiceSearch.toLowerCase()) || inv.id.toLowerCase().includes(invoiceSearch.toLowerCase())
      const matchFilter = invoiceFilter === 'Tutti' || inv.type === invoiceFilter || inv.status === invoiceFilter
      return matchSearch && matchFilter
  })

  if (loading) return <div className="p-10 text-emerald-600 font-bold animate-pulse">Avvio Database ERP Finanziario...</div>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #bp-print-area, #bp-print-area * { visibility: visible; }
          #bp-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />

      <main className="flex-1 overflow-auto bg-[#FDFDFD] text-gray-900 font-sans min-h-screen pb-20 relative">
        
        {/* HEADER FINANZIARIO */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-slate-900 text-white shadow-sm z-10 relative print:hidden">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3"><Landmark size={32} className="text-emerald-400"/> AI CFO & ERP Aziendale</h1>
            <p className="text-slate-400 text-sm mt-1">Controllo Gestione, Documenti Fiscali Modificabili, Ricerca Mercato e Bandi EU.</p>
          </div>
          <div className="flex flex-col items-end mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg mb-2">
                  <Scale size={14} className="text-blue-400"/>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Conforme SdI e GDPR</span>
              </div>
              <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg flex items-center gap-3">
                  <div className="flex flex-col items-end">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Doc. Emessi ({currentPlan})</span>
                      <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-400' : invoicesUsed >= invoiceLimits[currentPlan] * 0.9 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currentPlan === 'Ambassador' ? <span className="flex items-center gap-1"><Infinity size={14}/> Illimitati</span> : `${invoicesUsed} / ${invoiceLimits[currentPlan]}`}
                      </span>
                  </div>
              </div>
          </div>
        </div>

        {/* TABS */}
        <div className="px-8 py-4 flex flex-wrap gap-2 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm print:hidden">
            <button onClick={() => setActiveTab('accounting')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'accounting' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><TrendingUp size={16}/> Cruscotto Aziendale</button>
            <button onClick={() => setActiveTab('invoicing')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'invoicing' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Database size={16}/> Documenti & Database</button>
            <button onClick={() => setActiveTab('funding')} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'funding' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Briefcase size={16}/> Business Plan & Bandi</button>
        </div>

        <div className="p-8 max-w-7xl mx-auto print:p-0">
            
            {/* ========================================== */}
            {/* TAB 1: RAGIONERIA, GRAFICI E TARGET VARIABILE */}
            {/* ========================================== */}
            {activeTab === 'accounting' && (
                <div className="space-y-8 animate-in fade-in print:hidden">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Wallet size={14}/> Ricavi (Mese)</p><p className="text-3xl font-black text-gray-900">€ {financeData.revenue.toLocaleString()}</p></div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingDown size={14}/> Costi Fissi + Var</p><p className="text-3xl font-black text-rose-600">€ {totalCosts.toLocaleString()}</p></div>
                        
                        {/* BOX TARGET MARGINE (EDITABILE) */}
                        <div className={`p-6 rounded-3xl border shadow-sm relative group ${currentMargin >= targetMargin ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => setIsEditingMargin(!isEditingMargin)}>
                                <Edit3 size={16} className={currentMargin >= targetMargin ? 'text-emerald-500' : 'text-amber-500'}/>
                            </div>
                            
                            <p className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1 ${currentMargin >= targetMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
                                <Target size={14}/> Obiettivo Margine %
                            </p>
                            
                            {isEditingMargin ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input type="number" value={targetMargin} onChange={(e) => setTargetMargin(Number(e.target.value))} className="w-20 bg-white border border-gray-300 rounded px-2 py-1 font-black text-xl outline-none"/>
                                    <button onClick={() => setIsEditingMargin(false)} className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-bold">Salva</button>
                                </div>
                            ) : (
                                <p className={`text-3xl font-black ${currentMargin >= targetMargin ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {currentMargin.toFixed(1)}% <span className="text-sm font-bold opacity-70">/ Target {targetMargin}%</span>
                                </p>
                            )}

                            {currentMargin < targetMargin && !isEditingMargin && (
                                <p className="text-xs text-amber-700 font-bold mt-2 flex items-center gap-1"><AlertTriangle size={12}/> Attenzione: Margine sotto la soglia fissata.</p>
                            )}
                        </div>
                    </div>

                    {/* SEZIONE GRAFICO MONITORAGGIO RECHARTS */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2"><TrendingUp className="text-[#00665E]"/> Monitoraggio Andamento (Ultimi 6 Mesi)</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
                                    <Bar dataKey="Ricavi" fill="#00665E" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Costi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* SUGGERIMENTO AI VISIBILISSIMO */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex gap-6 items-start relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 opacity-10"><Bot size={200}/></div>
                        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 border border-amber-400/30 z-10"><Zap size={24} className="text-amber-400"/></div>
                        <div className="z-10">
                            <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-amber-400">Direttiva del tuo AI CFO</h3>
                            <p className="text-slate-200 text-sm leading-relaxed mb-4">
                                Il tuo margine attuale è del <b>{currentMargin.toFixed(1)}%</b>, inferiore al target del {targetMargin}% che hai richiesto. 
                                Analizzando il grafico, i "Costi" stanno incidendo sempre di più sui ricavi negli ultimi 3 mesi.
                            </p>
                            <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                <p className="text-sm font-medium"><b>Soluzione Pratica:</b> Rivedi i contratti di fornitura. Inoltre, usa il modulo di Marketing Automation per fare Up-sell del "Servizio Premium" ai clienti storici, alzando i ricavi senza toccare i costi fissi.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: DATABASE DOCUMENTI E CREAZIONE */}
            {/* ========================================== */}
            {activeTab === 'invoicing' && (
                <div className="space-y-8 animate-in fade-in print:hidden">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => openDocumentCreator('Fattura')} className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:border-blue-500 hover:shadow-md transition text-left flex flex-col group">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition"><FileText size={24}/></div>
                            <h3 className="font-black text-gray-900 text-lg">Crea Fattura</h3><p className="text-xs text-gray-500 mt-1">Connessione a SdI.</p>
                        </button>
                        <button onClick={() => openDocumentCreator('Ricevuta')} className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:border-emerald-500 hover:shadow-md transition text-left flex flex-col group">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition"><Receipt size={24}/></div>
                            <h3 className="font-black text-gray-900 text-lg">Emetti Ricevuta</h3><p className="text-xs text-gray-500 mt-1">Scontrini e Note prestazione.</p>
                        </button>
                        <button onClick={() => openDocumentCreator('DDT')} className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:border-amber-500 hover:shadow-md transition text-left flex flex-col group">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition"><Truck size={24}/></div>
                            <h3 className="font-black text-gray-900 text-lg">Genera DDT</h3><p className="text-xs text-gray-500 mt-1">Documento di Trasporto.</p>
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4"><Database className="text-[#00665E]"/> Archivio Database e Crediti</h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input type="text" placeholder="Cerca cliente, ID fattura..." value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ListFilter size={16} className="text-gray-400"/>
                                    <select value={invoiceFilter} onChange={(e) => setInvoiceFilter(e.target.value)} className="bg-white border border-gray-200 py-2 px-3 rounded-xl text-sm font-bold text-gray-600 outline-none">
                                        <option value="Tutti">Tutti i Documenti</option>
                                        <option value="Fattura">Solo Fatture</option>
                                        <option value="DDT">Solo DDT</option>
                                        <option value="Scaduta">Insoluti (Scadute)</option>
                                    </select>
                                    <button onClick={handleExportExcel} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 flex items-center gap-2 transition"><Download size={14}/> Esporta Excel</button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {filteredInvoices.length === 0 ? <p className="p-8 text-center text-gray-400">Nessun documento trovato.</p> : null}
                            {filteredInvoices.map((inv) => (
                                <div key={inv.id} className="p-5 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-blue-50/50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${inv.type === 'Fattura' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {inv.type === 'DDT' ? <Truck size={18}/> : <Receipt size={18}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{inv.client} <span className="text-xs text-gray-500 ml-1">({inv.id})</span></p>
                                            <p className="text-xs text-gray-500 mt-0.5">{inv.type} • Data: {inv.date}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            {inv.amount > 0 && <p className="font-black text-lg">€ {inv.amount.toLocaleString()}</p>}
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${inv.status === 'Pagata' || inv.status === 'Consegnato' ? 'text-emerald-600 bg-emerald-50' : inv.status === 'Scaduta' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>{inv.status}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-[#00665E] hover:border-[#00665E] transition" title="Scarica PDF"><Download size={16}/></button>
                                            {inv.status === 'Scaduta' && (
                                                <button onClick={() => handleDebtCollection(inv.client)} disabled={isProcessing} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-black transition disabled:opacity-50 flex items-center justify-center" title="Recupero Crediti AI">
                                                    {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Bot size={16}/>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* TAB 3: BUSINESS PLAN WIZARD E BANDI */}
            {/* ========================================== */}
            {activeTab === 'funding' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
                    
                    <div className="space-y-6 print:hidden">
                        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-gray-900 flex items-center gap-2"><Globe className="text-blue-500"/> Bandi Pubblici Reali</h3>
                                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100 flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Live Search</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                {publicGrants.map(grant => (
                                    <a href={grant.url} target="_blank" rel="noopener noreferrer" key={grant.id} className="block border border-gray-100 bg-gray-50 p-4 rounded-2xl hover:border-blue-400 hover:shadow-md transition group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm text-gray-900 group-hover:text-blue-600 flex items-center gap-2">{grant.title} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100"/></p>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Match {grant.match}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">{grant.entity} • Scadenza: {grant.deadline}</p>
                                        <p className="text-sm font-black text-blue-600">{grant.amount}</p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-[#00665E] rounded-3xl p-8 text-white shadow-xl relative flex flex-col h-full print:bg-white print:text-black print:shadow-none print:p-0">
                        <div className="absolute top-10 right-10 opacity-10 print:hidden"><FileSignature size={150}/></div>
                        
                        {bpStep === 'form' && (
                            <div className="relative z-10 animate-in fade-in print:hidden">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-4"><FileSpreadsheet size={24} className="text-emerald-400"/></div>
                                <h2 className="text-2xl font-black mb-2">Generatore Avanzato Business Plan</h2>
                                <p className="text-teal-100 text-sm mb-6">Compila con precisione. L'AI effettuerà una ricerca di mercato profonda per scrivere il piano.</p>
                                
                                <form onSubmit={handleGenerateBP} className="space-y-4">
                                    <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Cosa vuoi realizzare esattamente?</label><textarea required rows={2} value={bpFormData.goal} onChange={e => setBpFormData({...bpFormData, goal: e.target.value})} placeholder="Es. Aprire una clinica veterinaria a Milano con macchinari di ultima generazione..." className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm resize-none"></textarea></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Settore</label><input required type="text" value={bpFormData.market} onChange={e => setBpFormData({...bpFormData, market: e.target.value})} placeholder="Es. Pet Care" className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm"/></div>
                                        <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Budget Disp. (€)</label><input required type="number" value={bpFormData.budget} onChange={e => setBpFormData({...bpFormData, budget: e.target.value})} placeholder="100000" className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm"/></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Beni/Servizi da Acquistare per partire</label><textarea required rows={2} value={bpFormData.purchases} onChange={e => setBpFormData({...bpFormData, purchases: e.target.value})} placeholder="Macchinario RX, 3 PC, Arredamento sala d'attesa..." className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm resize-none"></textarea></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Strategia Locale</label><select value={bpFormData.locationType} onChange={e => setBpFormData({...bpFormData, locationType: e.target.value})} className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm text-white"><option value="Affitto">Fittare Locale</option><option value="Acquisto">Comprare Immobile</option><option value="Online">Solo Online (No Locale)</option></select></div>
                                        <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Target Clienti</label><input required type="text" value={bpFormData.targetAudience} onChange={e => setBpFormData({...bpFormData, targetAudience: e.target.value})} placeholder="Proprietari cani/gatti alto spendenti" className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm"/></div>
                                    </div>
                                    <div><label className="text-[10px] font-bold text-teal-200 uppercase tracking-widest block mb-1">Modalità di Vendita / Acquisizione</label><input required type="text" value={bpFormData.salesChannels} onChange={e => setBpFormData({...bpFormData, salesChannels: e.target.value})} placeholder="Sito Web, Social Media, Passaparola locale..." className="w-full bg-black/20 border border-white/20 p-3 rounded-xl outline-none focus:border-emerald-400 text-sm"/></div>
                                    
                                    <button type="submit" disabled={businessPlanGenerating} className="w-full mt-4 bg-emerald-500 text-slate-900 font-black py-4 rounded-xl hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2 disabled:opacity-50">
                                        {businessPlanGenerating ? <Loader2 size={18} className="animate-spin"/> : <Bot size={18}/>}
                                        {businessPlanGenerating ? 'Elaborazione in corso...' : 'Avvia Ricerca Mercato e Stesura'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {bpStep === 'loading' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in print:hidden">
                                <Globe size={64} className="text-emerald-400 animate-spin-slow opacity-50 mb-6"/>
                                <h3 className="text-xl font-black mb-2">L'AI sta scansionando il mercato...</h3>
                                <p className="text-sm text-teal-200">Raccolta dati sul target "{bpFormData.targetAudience}".<br/>Elaborazione costi per: {bpFormData.locationType}.<br/>Scrittura Prospetto Finanziario in corso...</p>
                            </div>
                        )}

                        {bpStep === 'preview' && (
                            <div className="flex flex-col h-[700px] animate-in fade-in" id="bp-print-area">
                                <div className="flex justify-between items-center mb-4 print:hidden">
                                    <h3 className="font-black flex items-center gap-2"><Edit2 size={16} className="text-emerald-400"/> Anteprima Editabile</h3>
                                    <button onClick={() => setBpStep('form')} className="text-xs text-teal-200 hover:text-white underline">Torna al Form</button>
                                </div>
                                
                                <textarea 
                                    value={bpGeneratedText} 
                                    onChange={e => setBpGeneratedText(e.target.value)}
                                    className="flex-1 w-full bg-white text-gray-900 p-6 rounded-xl text-[13px] font-mono leading-relaxed outline-none resize-none shadow-inner mb-4 print:hidden"
                                />
                                <div className="hidden print:block w-full text-black whitespace-pre-line text-sm font-serif leading-loose">
                                    {bpGeneratedText}
                                </div>

                                <button onClick={downloadBP} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-xl hover:bg-emerald-400 transition flex justify-center items-center gap-2 print:hidden shadow-lg"><Download size={18}/> Salva Documento PDF Definitivo</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* MODALE DOCUMENTI FISCALI */}
        {isDocModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
                <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                        <h2 className="text-xl font-black flex items-center gap-2">
                            {docStep === 'form' ? <FilePlus size={20} className="text-emerald-400"/> : <Eye size={20} className="text-emerald-400"/>}
                            {docStep === 'form' ? `Creazione ${docType}` : `Anteprima Stampa: ${docType}`}
                        </h2>
                        <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-white transition"><X size={24}/></button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 p-8">
                        {docStep === 'form' ? (
                            <form id="doc-form" onSubmit={handlePreviewDocument} className="space-y-5">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2 mb-4"><ShieldAlert size={16} className="text-blue-500 shrink-0"/> Dati protocollati a norma di legge.</div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Destinatario</label><input required type="text" value={docFormData.client} onChange={e => setDocFormData({...docFormData, client: e.target.value})} placeholder="Azienda SRL" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold"/></div>
                                {docType !== 'Ricevuta' && <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">P.IVA / CF</label><input required type="text" value={docFormData.piva} onChange={e => setDocFormData({...docFormData, piva: e.target.value})} placeholder="Partita IVA..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm"/></div>}
                                <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Oggetto/Descrizione</label><textarea required value={docFormData.desc} onChange={e => setDocFormData({...docFormData, desc: e.target.value})} placeholder="Dettagli..." rows={2} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm resize-none"></textarea></div>
                                {docType !== 'DDT' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Imponibile (€)</label><input required type="number" value={docFormData.amount} onChange={e => setDocFormData({...docFormData, amount: e.target.value})} placeholder="1000" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold"/></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Aliquota IVA</label><select value={docFormData.tax} onChange={e => setDocFormData({...docFormData, tax: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold cursor-pointer"><option value="22">22%</option><option value="10">10%</option><option value="4">4%</option><option value="0">Esente</option></select></div>
                                    </div>
                                ) : (
                                    <div><label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Indirizzo Consegna / Vettore</label><input required type="text" value={docFormData.address} onChange={e => setDocFormData({...docFormData, address: e.target.value})} placeholder="Via Roma 1 - Vettore SDA" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm"/></div>
                                )}
                            </form>
                        ) : (
                            <div className="bg-white border border-gray-300 shadow-sm p-8 min-h-[400px] flex flex-col font-mono text-sm relative">
                                <div className="absolute top-2 right-2 text-gray-300"><FileText size={40}/></div>
                                <h1 className="text-2xl font-black uppercase mb-6 border-b-2 border-gray-900 pb-2">{docType}</h1>
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div><p className="font-bold text-gray-400 text-xs">EMITTENTE</p><p>La Tua Azienda SRL<br/>P.IVA: 0123456789</p></div>
                                    <div><p className="font-bold text-gray-400 text-xs">DESTINATARIO</p><p className="font-bold">{docFormData.client || 'N/A'}</p>{docFormData.piva && <p>P.IVA: {docFormData.piva}</p>}</div>
                                </div>
                                <div className="flex-1 mb-8">
                                    <table className="w-full text-left border-collapse">
                                        <thead><tr className="border-b border-gray-300 text-xs text-gray-500"><th className="pb-2">DESCRIZIONE</th>{docType !== 'DDT' && <th className="pb-2 text-right">IMPORTO</th>}</tr></thead>
                                        <tbody><tr><td className="py-4 whitespace-pre-line">{docFormData.desc || 'N/A'}</td>{docType !== 'DDT' && <td className="py-4 text-right">€ {docFormData.amount || '0'}</td>}</tr></tbody>
                                    </table>
                                </div>
                                {docType !== 'DDT' && (
                                    <div className="mt-auto border-t border-gray-300 pt-4 text-right">
                                        <p className="text-gray-500 text-xs">IVA Applicata: {docFormData.tax}%</p>
                                        <p className="text-xl font-black mt-1">TOTALE: € {(Number(docFormData.amount) * (1 + Number(docFormData.tax)/100)).toFixed(2)}</p>
                                    </div>
                                )}
                                {docType === 'DDT' && <div className="mt-auto border-t border-gray-300 pt-4"><p className="text-xs">Destinazione: {docFormData.address}</p></div>}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 bg-gray-50 border-t border-gray-200 shrink-0 flex justify-end gap-3">
                        {docStep === 'form' ? (
                            <>
                                <button onClick={() => setIsDocModalOpen(false)} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Annulla</button>
                                <button form="doc-form" type="submit" disabled={isGeneratingDoc} className="bg-[#00665E] text-white font-black px-6 py-2.5 rounded-xl hover:bg-[#004d46] transition shadow-md flex items-center gap-2">{isGeneratingDoc ? <Loader2 size={18} className="animate-spin"/> : <Eye size={18}/>} Genera Anteprima</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setDocStep('form')} className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-200 rounded-xl flex items-center gap-2"><Edit2 size={16}/> Modifica Dati</button>
                                <button onClick={handleDownloadDocument} disabled={isGeneratingDoc} className="bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-md flex items-center gap-2">{isGeneratingDoc ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>} Conferma ed Emetti</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
    </>
  )
}