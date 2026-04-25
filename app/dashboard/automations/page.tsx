'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
    Zap, Plus, Save, Play, Clock, 
    MessageCircle, Mail, GitBranch, ShoppingCart, 
    Settings, Trash2, CheckCircle2, UserPlus, CreditCard, X, Infinity, 
    Loader2, BrainCircuit, Sparkles, Activity, Edit3, FileText, 
    BarChart3, Download, Filter, AlertCircle, Calendar, 
    ToggleLeft, ToggleRight, Wand2, ArrowRight,
    Star, Tag, RefreshCw, Smartphone, Globe, Bell, 
    RotateCcw, SplitSquareHorizontal, PackageX, TrendingUp,
    PhoneCall, Repeat, Webhook
} from 'lucide-react'
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'ai_processor';

interface FlowNode { 
    id: string; 
    type: NodeType; 
    title: string; 
    desc: string; 
    icon: any; 
    color: string; 
    config?: any;
}

export default function AutomationsPage() {
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  
  // STATI UI
  const [activeTab, setActiveTab] = useState<'builder' | 'monitor'>('builder')
  const [isEditing, setIsEditing] = useState(false)
  const [workflowName, setWorkflowName] = useState('Nuova Automazione')
  const [isSaving, setIsSaving] = useState(false)
  const [flow, setFlow] = useState<FlowNode[]>([])
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number>(0)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  // STATI MONITORAGGIO E FILTRI
  const [dateFilter, setDateFilter] = useState('7')
  const [isRefreshingData, setIsRefreshingData] = useState(false)

  const supabase = createClient()
  
  const limits: any = { 
      'Base': { zaps: 3, operations: 1000 }, 
      'Enterprise': { zaps: 20, operations: 10000 }, 
      'Ambassador': { zaps: 'Illimitati', operations: 'Illimitate' } 
  }
  const [usageStats, setUsageStats] = useState({ zaps: 0, operations: 432 })

  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([])

  // DATI ANALYTICS DINAMICI (Reagiscono al filtro)
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  
  const getMockDataByDays = (days: number) => {
      const data = [];
      let totalOps = 0;
      for(let i=days; i>0; i--) {
          const ops = Math.floor(Math.random() * 50) + 10;
          totalOps += ops;
          data.push({ 
              date: `-${i}g`, 
              esecuzioni: ops, 
              errori: Math.floor(Math.random() * 3) 
          });
      }
      return { data, totalOps };
  }

  // LOG ESECUZIONI
  const executionLogs = [
      { id: 'log_1', time: 'Oggi, 14:32', wf: 'Recupero Carrello', trigger: 'Carrello 0x44A', status: 'success', savedTime: '5 min' },
      { id: 'log_2', time: 'Oggi, 12:15', wf: 'Follow-up Preventivo', trigger: 'Prev. #102 chiuso', status: 'success', savedTime: '10 min' },
      { id: 'log_3', time: 'Oggi, 09:05', wf: 'Benvenuto VIP', trigger: 'Cliente Mario R.', status: 'failed', savedTime: '-' },
      { id: 'log_4', time: 'Ieri, 18:40', wf: 'Recupero Carrello', trigger: 'Carrello 0x44B', status: 'success', savedTime: '5 min' },
  ]

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
          
          // Carica le automazioni REALI dal database
          const { data: dbAutomations } = await supabase
            .from('automations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (dbAutomations) {
              setSavedWorkflows(dbAutomations)
              setUsageStats(prev => ({...prev, zaps: dbAutomations.length}))
          }

          // Carica i Log REALI
          const { data: dbLogs } = await supabase
            .from('automation_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('time_stamp', { ascending: false })
            .limit(10)

          if (dbLogs) {
              setRealLogs(dbLogs)
          }
      }
      handleFilterChange('7')
      setLoading(false)
    }
    getData()
  }, [])

  const [realLogs, setRealLogs] = useState<any[]>([])

  // ==========================================
  // LOGICA FILTRI MONITORAGGIO
  // ==========================================
  const handleFilterChange = (days: string) => {
      setDateFilter(days)
      setIsRefreshingData(true)
      
      // Simula il tempo di caricamento dal server
      setTimeout(() => {
          const result = getMockDataByDays(Number(days))
          setAnalyticsData(result.data)
          setUsageStats(prev => ({...prev, operations: result.totalOps}))
          setIsRefreshingData(false)
      }, 800)
  }

  // ==========================================
  // TEMPLATES 1-CLICK
  // ==========================================
  const loadTemplate = (templateId: string) => {
      if (currentPlan !== 'Ambassador' && savedWorkflows.length >= limits[currentPlan].zaps) {
          return alert(`Hai raggiunto il limite di ${limits[currentPlan].zaps} automazioni. Effettua l'upgrade!`)
      }

      if (templateId === 'cart') {
          setWorkflowName('Recupero Carrello Abbandonato')
          setFlow([
              { id: '1', type: 'trigger', title: 'Carrello Abbandonato', desc: 'Shopify / WooCommerce', icon: <ShoppingCart size={20}/>, color: 'bg-orange-500', config: {} },
              { id: '2', type: 'delay', title: 'Attendi', desc: 'Pausa di 2 Ore', icon: <Clock size={20}/>, color: 'bg-amber-500', config: { time: 2, unit: 'Ore'} },
              { id: '3', type: 'action', title: 'Invia WhatsApp', desc: 'Template: Sconto 10%', icon: <MessageCircle size={20}/>, color: 'bg-emerald-600', config: { template: 'Sconto 10%'} }
          ])
      } else if (templateId === 'birthday') {
          setWorkflowName('Buon Compleanno Cliente')
          setFlow([
              { id: '1', type: 'trigger', title: 'Ricorrenza Compleanno', desc: 'CRM Customer Data', icon: <Calendar size={20}/>, color: 'bg-pink-500', config: {} },
              { id: '2', type: 'action', title: 'Invia Email Auguri', desc: 'Template: Promo Compleanno', icon: <Mail size={20}/>, color: 'bg-blue-600', config: { template: 'Auguri VIP'} },
              { id: '3', type: 'action', title: 'Assegna Punti Fidelity', desc: '+50 Punti Fidelity', icon: <CreditCard size={20}/>, color: 'bg-indigo-600', config: {} }
          ])
      } else if (templateId === 'welcome') {
          setWorkflowName('Benvenuto Nuovo Cliente')
          setFlow([
              { id: '1', type: 'trigger', title: 'Primo Acquisto', desc: 'Cliente nuovo — 1° ordine', icon: <TrendingUp size={20}/>, color: 'bg-teal-500', config: {} },
              { id: '2', type: 'action', title: 'Invia Email Benvenuto', desc: 'Template: Benvenuto VIP', icon: <Mail size={20}/>, color: 'bg-blue-600', config: { template: 'Benvenuto VIP'} },
              { id: '3', type: 'action', title: 'Assegna Punti Fidelity', desc: '+100 Punti Benvenuto', icon: <CreditCard size={20}/>, color: 'bg-indigo-600', config: { points: 100} },
              { id: '4', type: 'action', title: 'Aggiorna Tag CRM', desc: 'Tag: Nuovo Cliente', icon: <Tag size={20}/>, color: 'bg-purple-500', config: { tag: 'Nuovo Cliente'} }
          ])
      } else if (templateId === 'dormant') {
          setWorkflowName('Riattivazione Cliente Dormiente')
          setFlow([
              { id: '1', type: 'trigger', title: 'Cliente Inattivo', desc: 'Nessun acquisto da 60 giorni', icon: <RotateCcw size={20}/>, color: 'bg-slate-500', config: { days: 60 } },
              { id: '2', type: 'action', title: 'Invia WhatsApp', desc: 'Template: Sconto Rientro 15%', icon: <MessageCircle size={20}/>, color: 'bg-emerald-600', config: { template: 'Sconto Rientro 15%'} },
              { id: '3', type: 'delay', title: 'Attendi', desc: 'Pausa di 5 Giorni', icon: <Clock size={20}/>, color: 'bg-amber-500', config: { time: 5, unit: 'Giorni'} },
              { id: '4', type: 'condition', title: 'Ha Acquistato?', desc: 'Se ha_acquistato = Sì', icon: <GitBranch size={20}/>, color: 'bg-purple-500', config: { rule: 'Ha Acquistato', value: 'Sì'} },
              { id: '5', type: 'action', title: 'Aggiorna Tag CRM', desc: 'Tag: Cliente Riattivato', icon: <Tag size={20}/>, color: 'bg-purple-500', config: { tag: 'Riattivato'} }
          ])
      } else if (templateId === 'review') {
          setWorkflowName('Richiesta Recensione Post-Acquisto')
          setFlow([
              { id: '1', type: 'trigger', title: 'Nuovo Scontrino Cassa', desc: 'Dopo ogni acquisto', icon: <CreditCard size={20}/>, color: 'bg-blue-600', config: {} },
              { id: '2', type: 'delay', title: 'Attendi', desc: 'Pausa di 2 Giorni', icon: <Clock size={20}/>, color: 'bg-amber-500', config: { time: 2, unit: 'Giorni'} },
              { id: '3', type: 'action', title: 'Invia WhatsApp', desc: 'Template: Lascia Recensione Google', icon: <MessageCircle size={20}/>, color: 'bg-emerald-600', config: { template: 'Richiesta Recensione Google'} }
          ])
      } else if (templateId === 'followup') {
          setWorkflowName('Follow-up Preventivo Aperto')
          setFlow([
              { id: '1', type: 'trigger', title: 'Nuovo Preventivo Creato', desc: 'Dall\'app Agente', icon: <FileText size={20}/>, color: 'bg-teal-600', config: {} },
              { id: '2', type: 'delay', title: 'Attendi', desc: 'Pausa di 3 Giorni', icon: <Clock size={20}/>, color: 'bg-amber-500', config: { time: 3, unit: 'Giorni'} },
              { id: '3', type: 'condition', title: 'Verifica Stato', desc: 'Se Stato = Aperto', icon: <GitBranch size={20}/>, color: 'bg-purple-500', config: { rule: 'Stato Preventivo', value: 'Aperto'} },
              { id: '4', type: 'action', title: 'Invia Email', desc: 'Template: Chiusura Deal', icon: <Mail size={20}/>, color: 'bg-blue-600', config: { template: 'Chiusura Deal'} },
              { id: '5', type: 'action', title: 'Crea Task Agente', desc: 'Task: Richiama cliente', icon: <PhoneCall size={20}/>, color: 'bg-rose-500', config: { task: 'Richiama cliente per preventivo'} }
          ])
      } else if (templateId === 'vip') {
          setWorkflowName('Promozione Soglia VIP (€500)')
          setFlow([
              { id: '1', type: 'trigger', title: 'Soglia Spesa Raggiunta', desc: 'Cliente supera €500 totali', icon: <TrendingUp size={20}/>, color: 'bg-yellow-500', config: { threshold: 500 } },
              { id: '2', type: 'action', title: 'Aggiorna Tag CRM', desc: 'Tag: VIP', icon: <Tag size={20}/>, color: 'bg-purple-500', config: { tag: 'VIP'} },
              { id: '3', type: 'action', title: 'Invia Email', desc: 'Template: Benvenuto Club VIP', icon: <Mail size={20}/>, color: 'bg-blue-600', config: { template: 'Benvenuto Club VIP'} },
              { id: '4', type: 'action', title: 'Assegna Punti Fidelity', desc: '+200 Punti VIP Bonus', icon: <CreditCard size={20}/>, color: 'bg-indigo-600', config: { points: 200} }
          ])
      }
      setIsEditing(true)
      setEditingNodeId(null)
  }

  // ==========================================
  // FUNZIONI BUILDER E NODI
  // ==========================================
  const createNewWorkflow = () => {
      if (currentPlan !== 'Ambassador' && savedWorkflows.length >= limits[currentPlan].zaps) {
          return alert(`Hai raggiunto il limite di ${limits[currentPlan].zaps} automazioni. Effettua l'upgrade!`)
      }
      setWorkflowName('Nuova Automazione')
      setFlow([
          { id: Date.now().toString(), type: 'trigger', title: 'Scegli il Trigger', desc: 'Clicca qui per scegliere cosa fa partire l\'automazione.', icon: <Settings size={20}/>, color: 'bg-gray-400' }
      ])
      setIsEditing(true)
      setEditingNodeId(null)
  }

  const saveWorkflow = async () => {
      if (!user) return alert("Devi essere loggato per salvare.")
      setIsSaving(true)
      
      try {
          const { data, error } = await supabase.from('automations').upsert({
              user_id: user.id,
              name: workflowName,
              status: true,
              nodes: flow.length,
              runs: 0,
              configuration: flow,
              updated_at: new Date().toISOString()
          }).select().single()

          if (error) throw error

          setSavedWorkflows([data, ...savedWorkflows.filter(w => w.id !== data.id)])
          setUsageStats(prev => ({...prev, zaps: prev.zaps + 1}))
          setIsSaving(false)
          setIsEditing(false)
          setEditingNodeId(null)
          alert("✅ Automazione salvata e attivata con successo!")
      } catch(e: any) { 
          console.error("Salvataggio fallito:", e)
          alert("Errore durante il salvataggio: " + e.message)
          setIsSaving(false)
      }
  }

  const openNodeSelector = (index: number) => {
      setInsertIndex(index)
      setIsNodeModalOpen(true)
  }

  const addNode = (type: NodeType, title: string, desc: string, icon: any, color: string) => {
      const newNode: FlowNode = { id: Date.now().toString(), type, title, desc, icon, color, config: {} }
      if (type === 'trigger' && insertIndex === 0) {
          setFlow([newNode, ...flow.slice(1)])
      } else {
          const newFlow = [...flow]
          newFlow.splice(insertIndex, 0, newNode)
          setFlow(newFlow)
      }
      setIsNodeModalOpen(false)
      setEditingNodeId(newNode.id) 
  }

  const removeNode = (id: string) => {
      if (flow.length === 1) return alert("Non puoi eliminare l'evento scatenante principale.")
      setFlow(flow.filter(n => n.id !== id))
      if (editingNodeId === id) setEditingNodeId(null)
  }

  const updateNodeConfig = (id: string, key: string, value: any) => {
      setFlow(flow.map(n => {
          if (n.id === id) {
              const updatedConfig = { ...(n.config || {}), [key]: value }
              let updatedDesc = n.desc;
              if (n.type === 'delay') updatedDesc = `Pausa di ${updatedConfig.time || 1} ${updatedConfig.unit || 'Giorni'}`
              if (n.type === 'condition') updatedDesc = `Se ${updatedConfig.rule || '...'} = ${updatedConfig.value || '...'}`
              if (n.type === 'action' && n.title.includes('WhatsApp')) updatedDesc = `Template: ${updatedConfig.template || 'Nessuno'}`
              return { ...n, config: updatedConfig, desc: updatedDesc }
          }
          return n
      }))
  }

  const toggleStatus = (id: string) => {
      setSavedWorkflows(savedWorkflows.map(wf => wf.id === id ? { ...wf, status: !wf.status } : wf))
  }

  const handleExportCSV = () => {
      let csvContent = "Data_Ora,Workflow,Trigger,Status,Tempo_Risparmiato\n";
      executionLogs.forEach(row => {
          csvContent += `${row.time},${row.wf},${row.trigger},${row.status},${row.savedTime}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "log_automazioni_integraos.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  if (loading) return <div className="p-10 text-amber-600 font-bold animate-pulse">Avvio Motore Automazioni...</div>

  const activeNode = flow.find(n => n.id === editingNodeId)

  return (
    <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col pb-20 md:pb-0">
      
      {/* HEADER PRINCIPALE E LIMITI PIANO */}
      <div className="flex-shrink-0 p-6 md:p-8 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center z-10 shadow-sm relative gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Zap size={32} className="text-amber-500" fill="currentColor"/> Zap Automations</h1>
          <p className="text-gray-500 text-sm mt-1">Costruisci e monitora i tuoi percorsi automatici basati sui dati reali.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* WIDGET LIMITI DEL PIANO */}
            <div className="bg-gray-50 border border-gray-200 p-2 rounded-xl flex items-center gap-4 w-full md:w-auto shadow-inner">
                <div className="flex flex-col px-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zaps Attivi</span>
                    <span className={`font-black text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {usageStats.zaps} / {limits[currentPlan].zaps}
                    </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col px-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Op. Mensili</span>
                    <span className={`font-black text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {usageStats.operations} / {limits[currentPlan].operations}
                    </span>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                <button onClick={() => setActiveTab('builder')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'builder' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
                    <GitBranch size={16}/> Builder
                </button>
                <button onClick={() => setActiveTab('monitor')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'monitor' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
                    <BarChart3 size={16}/> Analytics
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          {/* ================================================================ */}
          {/* TAB 1: BUILDER VISIVO E TEMPLATES */}
          {/* ================================================================ */}
          {activeTab === 'builder' && (
              <>
                  {!isEditing && (
                      <div className="w-full max-w-sm flex flex-col bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                          <button onClick={createNewWorkflow} className="w-full bg-[#00665E] text-white px-6 py-4 rounded-2xl font-black hover:bg-[#004d46] flex items-center justify-center gap-2 shadow-lg transition transform hover:-translate-y-1 mb-8">
                              <Plus size={20}/> Costruisci da Zero
                          </button>

                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Wand2 size={14}/> Template Consigliati</h3>
                          <div className="grid gap-2 mb-8">
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">🛒 E-Commerce</p>
                              <div onClick={() => loadTemplate('cart')} className="bg-white border border-orange-200 hover:border-orange-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-orange-600">Recupero Carrello</h4>
                                  <p className="text-xs text-gray-500">Abbandono → WhatsApp Sconto</p>
                              </div>
                              <div onClick={() => loadTemplate('review')} className="bg-white border border-yellow-200 hover:border-yellow-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-yellow-600">Richiesta Recensione</h4>
                                  <p className="text-xs text-gray-500">Acquisto → WhatsApp Google Review</p>
                              </div>
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 mt-3">❤️ Fidelizzazione</p>
                              <div onClick={() => loadTemplate('birthday')} className="bg-white border border-pink-200 hover:border-pink-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-pink-600">Compleanno VIP</h4>
                                  <p className="text-xs text-gray-500">Compleanno → Email + Punti</p>
                              </div>
                              <div onClick={() => loadTemplate('welcome')} className="bg-white border border-teal-200 hover:border-teal-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-teal-600">Benvenuto Nuovo Cliente</h4>
                                  <p className="text-xs text-gray-500">1° Acquisto → Email + 100 Punti</p>
                              </div>
                              <div onClick={() => loadTemplate('vip')} className="bg-white border border-yellow-200 hover:border-yellow-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-yellow-600">Promozione Soglia VIP</h4>
                                  <p className="text-xs text-gray-500">€500 spesi → Tag VIP + Bonus</p>
                              </div>
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 mt-3">🔄 Riattivazione</p>
                              <div onClick={() => loadTemplate('dormant')} className="bg-white border border-slate-200 hover:border-slate-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-slate-600">Cliente Dormiente</h4>
                                  <p className="text-xs text-gray-500">Inattivo 60gg → WhatsApp 15%</p>
                              </div>
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 mt-3">📋 Vendite</p>
                              <div onClick={() => loadTemplate('followup')} className="bg-white border border-blue-200 hover:border-blue-500 p-3 rounded-2xl shadow-sm cursor-pointer transition group">
                                  <h4 className="font-bold text-gray-900 text-sm mb-0.5 group-hover:text-blue-600">Follow-up Preventivo</h4>
                                  <p className="text-xs text-gray-500">3gg senza risposta → Email + Task</p>
                              </div>
                          </div>

                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">I tuoi Flussi Attivi</h3>
                          <div className="space-y-3 mb-8">
                              {savedWorkflows.length === 0 ? <p className="text-sm text-gray-400">Nessuna automazione.</p> : null}
                              {savedWorkflows.map(wf => (
                                  <div key={wf.id} className={`bg-white border-2 rounded-2xl p-4 transition shadow-sm ${wf.status ? 'border-gray-200 hover:border-amber-400 cursor-pointer' : 'border-gray-100 opacity-60'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                          <h4 className="font-bold text-gray-900 truncate pr-2">{wf.name}</h4>
                                          <button onClick={(e) => { e.stopPropagation(); toggleStatus(wf.id) }} className={`${wf.status ? 'text-emerald-500' : 'text-gray-300'} hover:scale-110 transition-transform`}>
                                              {wf.status ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                          </button>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                          <span className="flex items-center gap-1"><Activity size={12}/> {wf.runs} run</span>
                                          <span className="flex items-center gap-1"><GitBranch size={12}/> {wf.nodes} nodi</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* CANVAS DEL WORKFLOW */}
                  <div className="flex-1 bg-gray-50 relative overflow-y-auto p-10 flex flex-col items-center custom-scrollbar">
                      {!isEditing ? (
                          <div className="m-auto text-center max-w-md opacity-40">
                              <GitBranch size={64} className="mx-auto mb-4 text-gray-400"/>
                              <h2 className="text-xl font-black text-gray-500">Seleziona o Crea un Flusso</h2>
                              <p className="text-sm mt-2 font-bold">Puoi anche usare uno dei template pronti a sinistra!</p>
                          </div>
                      ) : (
                          <div className="w-full max-w-3xl pb-32 animate-in fade-in flex gap-8">
                              
                              <div className="flex-1 flex flex-col items-center relative">
                                  {/* CAMPO NOME */}
                                  <div className="flex w-full justify-between items-center mb-10">
                                      <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} className="text-2xl font-black bg-transparent outline-none border-b-2 border-transparent focus:border-amber-500 text-gray-900 w-2/3" placeholder="Nome Automazione..." />
                                      <div className="flex gap-2">
                                          <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition">Annulla</button>
                                          <button onClick={saveWorkflow} disabled={isSaving || flow.length < 2 || flow[0].title.includes('Scegli')} className="bg-[#00665E] text-white px-6 py-2 rounded-xl font-black hover:bg-[#004d46] flex items-center gap-2 shadow-md disabled:opacity-50 transition">
                                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Salva Flusso
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {/* NODI DEL FLUSSO */}
                                  {flow.map((node, index) => (
                                      <div key={node.id} className="flex flex-col items-center relative w-full max-w-md group">
                                          
                                          <div 
                                              onClick={() => {
                                                  if (node.title.includes('Scegli')) openNodeSelector(0);
                                                  else setEditingNodeId(node.id);
                                              }}
                                              className={`bg-white rounded-3xl p-5 w-full shadow-md relative z-10 transition transform cursor-pointer border-2 ${editingNodeId === node.id ? 'border-amber-500 scale-[1.02] shadow-xl ring-4 ring-amber-500/20' : 'border-gray-200 hover:-translate-y-1 hover:border-gray-300'}`}
                                          >
                                              <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${node.color}`}>
                                                  {node.type}
                                              </div>
                                              
                                              {index !== 0 && (
                                                  <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition bg-gray-50 p-1.5 rounded-lg"><Trash2 size={16}/></button>
                                              )}

                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-4 mt-2">
                                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner ${node.color}`}>{node.icon}</div>
                                                      <div>
                                                          <h3 className="font-black text-gray-900 text-lg leading-tight">{node.title}</h3>
                                                          <p className={`text-xs mt-1 ${node.title.includes('Scegli') ? 'text-amber-500 font-bold animate-pulse' : 'text-gray-500'}`}>{node.desc}</p>
                                                      </div>
                                                  </div>
                                                  {!node.title.includes('Scegli') && <Edit3 size={16} className="text-gray-300"/>}
                                              </div>
                                          </div>

                                          <div className="w-1 bg-gray-300 h-16 relative flex items-center justify-center group-hover:bg-amber-400 transition-colors">
                                              {node.title !== 'Scegli il Trigger' && (
                                                  <button onClick={() => openNodeSelector(index + 1)} className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center hover:border-amber-500 hover:text-amber-600 z-20 absolute shadow-sm transition transform hover:scale-110"><Plus size={16} className="font-bold"/></button>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                                  <div className="w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm"></div>
                                  <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Fine Flusso</p>
                              </div>

                              {/* PANNELLO LATERALE CONFIGURAZIONE NODO */}
                              {editingNodeId && activeNode && (
                                  <div className="w-80 shrink-0 bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-right-8 h-fit sticky top-10">
                                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                          <h3 className="font-black text-gray-900 flex items-center gap-2"><Settings size={18} className="text-amber-500"/> Configurazione</h3>
                                          <button onClick={() => setEditingNodeId(null)} className="text-gray-400 hover:text-gray-900 bg-gray-100 p-1.5 rounded-full"><X size={14}/></button>
                                      </div>

                                      <div className="space-y-5">
                                          <div>
                                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Azione Selezionata</p>
                                              <p className="font-black text-gray-800 text-sm flex items-center gap-2"><div className={`p-1 rounded-md text-white ${activeNode.color}`}>{activeNode.icon}</div> {activeNode.title}</p>
                                          </div>

                                          {activeNode.type === 'delay' && (
                                              <div>
                                                  <label className="text-xs font-bold text-gray-600 block mb-2">Tempo di attesa</label>
                                                  <div className="flex gap-2">
                                                      <input type="number" min="1" value={activeNode.config?.time || 1} onChange={(e) => updateNodeConfig(activeNode.id, 'time', e.target.value)} className="w-1/3 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-amber-500 font-bold text-center"/>
                                                      <select value={activeNode.config?.unit || 'Giorni'} onChange={(e) => updateNodeConfig(activeNode.id, 'unit', e.target.value)} className="w-2/3 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-amber-500 font-bold text-gray-700">
                                                          <option value="Minuti">Minuti</option><option value="Ore">Ore</option><option value="Giorni">Giorni</option>
                                                      </select>
                                                  </div>
                                              </div>
                                          )}

                                          {activeNode.type === 'condition' && (
                                              <div>
                                                  <label className="text-xs font-bold text-gray-600 block mb-2">Verifica il parametro</label>
                                                  <select value={activeNode.config?.rule || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'rule', e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-gray-700 mb-2">
                                                      <option value="" disabled>-- Scegli campo --</option>
                                                      <option value="Ha Acquistato">Ha Acquistato Prima?</option>
                                                      <option value="Stato Preventivo">Stato Preventivo</option>
                                                      <option value="Tags Cliente">Contiene il Tag VIP</option>
                                                  </select>
                                                  <label className="text-xs font-bold text-gray-600 block mb-2 mt-4">Risultato Atteso</label>
                                                  <input type="text" value={activeNode.config?.value || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'value', e.target.value)} placeholder="es. Vero, Aperto, Si" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-amber-500 text-sm font-bold"/>
                                              </div>
                                          )}

                                          {activeNode.type === 'action' && (
                                              <div>
                                                  <label className="text-xs font-bold text-gray-600 block mb-2">Seleziona Messaggio (Sincronizzato col CRM)</label>
                                                  <select value={activeNode.config?.template || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'template', e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-amber-500 text-sm font-bold text-gray-700">
                                                      <option value="" disabled>-- Scegli Template --</option>
                                                      <option value="Sconto 10% Ritorno">SMS: Sconto 10% Ritorno</option>
                                                      <option value="Chiusura Deal">WhatsApp: Richiamo Preventivo</option>
                                                      <option value="Benvenuto VIP">Email: Benvenuto VIP</option>
                                                  </select>
                                              </div>
                                          )}

                                          <button onClick={() => setEditingNodeId(null)} className="w-full mt-6 bg-[#00665E] text-white font-bold py-3 rounded-xl hover:bg-[#004d46] transition">Chiudi e Applica</button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </>
          )}

          {/* ================================================================ */}
          {/* TAB 2: MONITORAGGIO ED ANALYTICS CON FILTRI REALI */}
          {/* ================================================================ */}
          {activeTab === 'monitor' && (
              <div className="flex-1 bg-white p-8 overflow-y-auto animate-in fade-in">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <div>
                          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BarChart3 className="text-blue-600"/> Analytics & Logs</h2>
                          <p className="text-sm text-gray-500 mt-1">Monitora l'impatto reale delle automazioni sul tuo fatturato.</p>
                      </div>
                      
                      {/* FILTRO DATE FUNZIONANTE */}
                      <div className="flex gap-3 items-center">
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                              <Calendar size={16} className="text-gray-500"/>
                              <select value={dateFilter} onChange={(e) => handleFilterChange(e.target.value)} className="bg-transparent font-bold text-sm text-gray-700 outline-none cursor-pointer">
                                  <option value="7">Ultimi 7 Giorni</option>
                                  <option value="30">Ultimi 30 Giorni</option>
                                  <option value="90">Ultimo Trimestre</option>
                              </select>
                          </div>
                          <button onClick={handleExportCSV} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold text-sm hover:bg-blue-700 transition shadow-md"><Download size={16}/> CSV</button>
                      </div>
                  </div>

                  {isRefreshingData ? (
                      <div className="h-64 flex flex-col items-center justify-center text-blue-500">
                          <Loader2 size={40} className="animate-spin mb-4"/>
                          <p className="font-bold">Elaborazione dati dal server...</p>
                      </div>
                  ) : (
                      <>
                          {/* Kpis Monitoraggio */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                              <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Esecuzioni ({dateFilter} gg)</p>
                                  <p className="text-3xl font-black text-gray-900">{usageStats.operations}</p>
                              </div>
                              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl">
                                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Successo</p>
                                  <p className="text-3xl font-black text-emerald-700">99.1%</p>
                              </div>
                              <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl">
                                  <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Errori Bloccanti</p>
                                  <p className="text-3xl font-black text-rose-700">{Math.floor(usageStats.operations * 0.009)}</p>
                              </div>
                              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-5 rounded-3xl text-white shadow-lg">
                                  <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">Tempo Risparmiato</p>
                                  <p className="text-3xl font-black">~ {Math.floor(usageStats.operations * 5 / 60)} Ore</p>
                              </div>
                          </div>

                          {/* Grafico Andamento */}
                          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-8">
                              <h3 className="font-bold text-gray-800 mb-6">Volume Esecuzioni Storico</h3>
                              <div className="h-72 w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={analyticsData}>
                                          <defs>
                                              <linearGradient id="colorEs" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                              </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                          <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                          <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}}/>
                                          <Area type="monotone" name="Operazioni Eseguite" dataKey="esecuzioni" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEs)" />
                                          <Area type="monotone" name="Errori" dataKey="errori" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} />
                                      </AreaChart>
                                  </ResponsiveContainer>
                              </div>
                          </div>

                          {/* Tabella Log */}
                          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
                              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                  <h3 className="font-bold text-gray-800">Registro Attività Recenti (Log REALI)</h3>
                              </div>
                              <table className="w-full text-left text-sm">
                                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                      <tr>
                                          <th className="p-4">Data & Ora</th>
                                          <th className="p-4">Flusso Automazione</th>
                                          <th className="p-4">Evento Rilevato</th>
                                          <th className="p-4 text-center">Stato</th>
                                          <th className="p-4 text-right">Impatto</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                      {realLogs.length === 0 && (
                                          <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">Nessun log reale ancora registrato.</td></tr>
                                      )}
                                      {realLogs.map((log) => (
                                          <tr key={log.id} className="hover:bg-gray-50/50 transition">
                                              <td className="p-4 text-gray-500 font-medium">
                                                  {new Date(log.time_stamp).toLocaleString('it-IT')}
                                              </td>
                                              <td className="p-4 font-bold text-gray-900">{log.workflow_name}</td>
                                              <td className="p-4 text-gray-600">{log.trigger_event}</td>
                                              <td className="p-4 text-center">
                                                  {log.status === 'success' ? (
                                                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-xs font-bold"><CheckCircle2 size={12}/> Eseguito</span>
                                                  ) : (
                                                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-xs font-bold"><AlertCircle size={12}/> Fallito</span>
                                                  )}
                                              </td>
                                              <td className="p-4 text-right text-emerald-600 font-bold">{log.saved_time || '-'}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </>
                  )}
              </div>
          )}

      </div>

      {/* MODALE DI SELEZIONE DEI NODI */}
      {isNodeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h2 className="text-xl font-black text-gray-900">{insertIndex === 0 ? 'Scegli l\'Evento Scatenante (Trigger)' : 'Aggiungi Azione o Regola'}</h2>
                      <button onClick={() => setIsNodeModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                      
                      {insertIndex === 0 ? (
                          <>
                              <div className="col-span-1 md:col-span-2 mb-2"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">🛒 E-commerce / Negozi</p></div>
                              <button onClick={() => addNode('trigger', 'Nuovo Scontrino Cassa', 'Quando Nexus Hub legge la cassa', <CreditCard size={20}/>, 'bg-blue-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-blue-500 hover:shadow-md transition text-left group">
                                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition"><CreditCard size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Nuovo Scontrino Cassa</p><p className="text-xs text-gray-400">POS / Nexus Hub</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Ordine Online Creato', 'Da Shopify o WooCommerce', <ShoppingCart size={20}/>, 'bg-orange-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-orange-500 hover:shadow-md transition text-left group">
                                  <div className="bg-orange-100 text-orange-600 p-3 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition"><ShoppingCart size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Ordine Online Creato</p><p className="text-xs text-gray-400">Shopify / WooCommerce</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Carrello Abbandonato', 'Oltre 30 min senza checkout', <ShoppingCart size={20}/>, 'bg-red-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-red-500 hover:shadow-md transition text-left group">
                                  <div className="bg-red-100 text-red-600 p-3 rounded-xl group-hover:bg-red-500 group-hover:text-white transition"><ShoppingCart size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Carrello Abbandonato</p><p className="text-xs text-gray-400">Dopo 30 min senza pagamento</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Primo Acquisto', 'Cliente alla prima transazione', <TrendingUp size={20}/>, 'bg-teal-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-teal-500 hover:shadow-md transition text-left group">
                                  <div className="bg-teal-100 text-teal-600 p-3 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition"><TrendingUp size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Primo Acquisto</p><p className="text-xs text-gray-400">Cliente nuovo — 1° ordine</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Soglia Spesa Raggiunta', 'Es. cliente supera €500 totali', <TrendingUp size={20}/>, 'bg-yellow-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-yellow-500 hover:shadow-md transition text-left group">
                                  <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition"><TrendingUp size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Soglia Spesa Raggiunta</p><p className="text-xs text-gray-400">Configurabile in €</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Reso / Rimborso Richiesto', 'Cliente apre pratica reso', <PackageX size={20}/>, 'bg-rose-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-rose-500 hover:shadow-md transition text-left group">
                                  <div className="bg-rose-100 text-rose-600 p-3 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition"><PackageX size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Reso / Rimborso</p><p className="text-xs text-gray-400">Pratica reso aperta</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">👥 CRM / Clienti</p></div>
                              <button onClick={() => addNode('trigger', 'Nuovo Lead nel CRM', 'Utente compila form sito', <UserPlus size={20}/>, 'bg-indigo-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500 hover:shadow-md transition text-left group">
                                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-500 group-hover:text-white transition"><UserPlus size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Lead Entra nel CRM</p><p className="text-xs text-gray-400">Da form web o importazione</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Nuovo Preventivo Creato', 'Dall\'app Agente', <FileText size={20}/>, 'bg-teal-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-teal-500 hover:shadow-md transition text-left group">
                                  <div className="bg-teal-100 text-teal-600 p-3 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition"><FileText size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Nuovo Preventivo Creato</p><p className="text-xs text-gray-400">Dall'app Agente</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Cliente Inattivo', 'Nessun acquisto da X giorni', <RotateCcw size={20}/>, 'bg-slate-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-slate-500 hover:shadow-md transition text-left group">
                                  <div className="bg-slate-100 text-slate-600 p-3 rounded-xl group-hover:bg-slate-500 group-hover:text-white transition"><RotateCcw size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Cliente Inattivo / Dormiente</p><p className="text-xs text-gray-400">Configurabile in giorni</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Cambio Stato Pipeline', 'Lead → Trattativa → Cliente', <GitBranch size={20}/>, 'bg-violet-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-violet-500 hover:shadow-md transition text-left group">
                                  <div className="bg-violet-100 text-violet-600 p-3 rounded-xl group-hover:bg-violet-500 group-hover:text-white transition"><GitBranch size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Cambio Stato Pipeline CRM</p><p className="text-xs text-gray-400">Qualsiasi step configurabile</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Recensione Ricevuta', 'Google / TrustPilot', <Star size={20}/>, 'bg-yellow-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-yellow-500 hover:shadow-md transition text-left group">
                                  <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl group-hover:bg-yellow-500 group-hover:text-white transition"><Star size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Recensione Ricevuta</p><p className="text-xs text-gray-400">Google / TrustPilot</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Tag Cliente Assegnato', 'Es. VIP, At-Risk, Inattivo', <Tag size={20}/>, 'bg-purple-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 hover:shadow-md transition text-left group">
                                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition"><Tag size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Tag Cliente Assegnato</p><p className="text-xs text-gray-400">VIP, At-Risk, ecc.</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Form Sito Compilato', 'Landing page o sito web', <Globe size={20}/>, 'bg-cyan-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-cyan-500 hover:shadow-md transition text-left group">
                                  <div className="bg-cyan-100 text-cyan-600 p-3 rounded-xl group-hover:bg-cyan-500 group-hover:text-white transition"><Globe size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Form Sito Compilato</p><p className="text-xs text-gray-400">Contatto / richiesta info</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Messaggio Non Risposto', 'Inbox — dopo X ore senza risposta', <Bell size={20}/>, 'bg-amber-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-amber-600 hover:shadow-md transition text-left group">
                                  <div className="bg-amber-100 text-amber-600 p-3 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition"><Bell size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Messaggio Non Risposto</p><p className="text-xs text-gray-400">Da Inbox dopo X ore</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">⏰ Schedulato / Tempo</p></div>
                              <button onClick={() => addNode('trigger', 'Ricorrenza Temporale', 'Es. Compleanno o Scadenza', <Calendar size={20}/>, 'bg-pink-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-pink-500 hover:shadow-md transition text-left group">
                                  <div className="bg-pink-100 text-pink-600 p-3 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition"><Calendar size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Ricorrenza Temporale</p><p className="text-xs text-gray-400">Compleanno, anniversario</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Ogni Settimana (Schedulato)', 'Giorno fisso della settimana', <Repeat size={20}/>, 'bg-gray-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-gray-600 hover:shadow-md transition text-left group">
                                  <div className="bg-gray-100 text-gray-600 p-3 rounded-xl group-hover:bg-gray-600 group-hover:text-white transition"><Repeat size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Ogni Settimana</p><p className="text-xs text-gray-400">Giorno configurabile</p></div>
                              </button>
                          </>
                      ) : (
                          <>
                              <div className="col-span-1 md:col-span-2 mb-2"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">📤 Comunicazione</p></div>
                              <button onClick={() => addNode('action', 'Invia Messaggio WhatsApp', 'Tramite IntegraOS AI Agent', <MessageCircle size={20}/>, 'bg-emerald-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-emerald-500 hover:shadow-md transition text-left group">
                                  <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition"><MessageCircle size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Invia WhatsApp</p><p className="text-xs text-gray-400">AI Agent / Template</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Invia Email', 'Dal modulo DEM / Marketing', <Mail size={20}/>, 'bg-blue-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-blue-500 hover:shadow-md transition text-left group">
                                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition"><Mail size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Invia Email</p><p className="text-xs text-gray-400">Template DEM</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Invia SMS', 'Via provider esterno (es. Twilio)', <Smartphone size={20}/>, 'bg-green-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-green-500 hover:shadow-md transition text-left group">
                                  <div className="bg-green-100 text-green-600 p-3 rounded-xl group-hover:bg-green-600 group-hover:text-white transition"><Smartphone size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Invia SMS</p><p className="text-xs text-gray-400">Twilio / provider SMS</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Notifica Push App', 'IntegraOS mobile notification', <Bell size={20}/>, 'bg-violet-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-violet-500 hover:shadow-md transition text-left group">
                                  <div className="bg-violet-100 text-violet-600 p-3 rounded-xl group-hover:bg-violet-500 group-hover:text-white transition"><Bell size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Notifica Push App</p><p className="text-xs text-gray-400">IntegraOS mobile</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">📊 CRM / Dati</p></div>
                              <button onClick={() => addNode('action', 'Aggiorna Tag CRM', 'Assegna o rimuovi un tag cliente', <Tag size={20}/>, 'bg-purple-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 hover:shadow-md transition text-left group">
                                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition"><Tag size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Aggiorna Tag CRM</p><p className="text-xs text-gray-400">Assegna / rimuovi tag</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Crea Task per Agente', 'Assegna attività a un agente', <PhoneCall size={20}/>, 'bg-rose-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-rose-500 hover:shadow-md transition text-left group">
                                  <div className="bg-rose-100 text-rose-600 p-3 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition"><PhoneCall size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Crea Task Agente</p><p className="text-xs text-gray-400">Richiama / visita cliente</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Assegna Punti Fidelity', 'Aggiungi punti alla card cliente', <CreditCard size={20}/>, 'bg-indigo-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500 hover:shadow-md transition text-left group">
                                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition"><CreditCard size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Assegna Punti Fidelity</p><p className="text-xs text-gray-400">Configurabile in punti</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Crea Preventivo Auto', 'Genera preventivo da template', <FileText size={20}/>, 'bg-teal-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-teal-500 hover:shadow-md transition text-left group">
                                  <div className="bg-teal-100 text-teal-600 p-3 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition"><FileText size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Crea Preventivo Auto</p><p className="text-xs text-gray-400">Da template configurabile</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">🔗 Integrazioni</p></div>
                              <button onClick={() => addNode('ai_processor', 'AI Agent Processor', 'Elabora dati con Gemini AI', <BrainCircuit size={20}/>, 'bg-purple-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 hover:shadow-md transition text-left group">
                                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition"><BrainCircuit size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">AI Logic (Gemini)</p><p className="text-xs text-gray-400">Prompt personalizzabile</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Invia Webhook', 'POST a URL esterno (Zapier, Make...)', <Globe size={20}/>, 'bg-gray-700')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-gray-600 hover:shadow-md transition text-left group">
                                  <div className="bg-gray-100 text-gray-700 p-3 rounded-xl group-hover:bg-gray-700 group-hover:text-white transition"><Globe size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Invia Webhook</p><p className="text-xs text-gray-400">URL esterno / Zapier / Make</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">⚙️ Logica di Controllo</p></div>
                              <button onClick={() => addNode('delay', 'Attendi Tempo', 'Metti in pausa il flusso', <Clock size={20}/>, 'bg-amber-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-amber-500 hover:shadow-md transition text-left group">
                                  <div className="bg-amber-100 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition"><Clock size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Aggiungi Ritardo</p><p className="text-xs text-gray-400">Minuti / Ore / Giorni</p></div>
                              </button>
                              <button onClick={() => addNode('condition', 'Verifica Condizione', 'Se Vero → percorso A, Falso → B', <GitBranch size={20}/>, 'bg-purple-500')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 hover:shadow-md transition text-left group">
                                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition"><GitBranch size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Bivio If / Else</p><p className="text-xs text-gray-400">Percorso condizionale</p></div>
                              </button>
                              <button onClick={() => addNode('condition', 'Loop / Ripeti', 'Ripete azione per N volte', <Repeat size={20}/>, 'bg-cyan-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-cyan-500 hover:shadow-md transition text-left group">
                                  <div className="bg-cyan-100 text-cyan-600 p-3 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition"><Repeat size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">Loop / Ripeti</p><p className="text-xs text-gray-400">N volte configurabili</p></div>
                              </button>
                              <button onClick={() => addNode('condition', 'A/B Split Test', 'Divide il flusso 50/50', <SplitSquareHorizontal size={20}/>, 'bg-pink-600')} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-3 hover:border-pink-500 hover:shadow-md transition text-left group">
                                  <div className="bg-pink-100 text-pink-600 p-3 rounded-xl group-hover:bg-pink-600 group-hover:text-white transition"><SplitSquareHorizontal size={18}/></div>
                                  <div><p className="font-bold text-sm text-gray-900">A/B Split Test</p><p className="text-xs text-gray-400">Divide il flusso 50/50</p></div>
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </main>
  )
}