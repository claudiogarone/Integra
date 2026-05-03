'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
    Zap, Plus, Save, Play, Clock, 
    MessageCircle, Mail, GitBranch, ShoppingCart, 
    Settings, Trash2, CheckCircle2, UserPlus, CreditCard, X, Infinity, Loader2, BrainCircuit, Sparkles, Activity, Edit3, FileText
} from 'lucide-react'

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

export default function WorkflowsPage() {
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  
  const [isEditing, setIsEditing] = useState(false)
  const [workflowName, setWorkflowName] = useState('Nuova Automazione')
  const [isSaving, setIsSaving] = useState(false)
  const [flow, setFlow] = useState<FlowNode[]>([])

  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number>(0)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)

  const supabase = createClient()
  const limits: any = { 'Base': 3, 'Enterprise': 20, 'Ambassador': 'Illimitate' }

  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([])
  const [aiSuggestion, setAiSuggestion] = useState('Analisi dei lead in corso...')

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
          
          // Caricamento Workflow REALI
          const { data: dbWorkflows } = await supabase
            .from('workflows')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          
          if (dbWorkflows) {
              setSavedWorkflows(dbWorkflows)
          }

          // Caricamento Log REALI
          const { data: dbLogs } = await supabase
            .from('workflow_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('time_stamp', { ascending: false })
            .limit(10)
          
          if (dbLogs) {
              setRealLogs(dbLogs)
          }

          // Caricamento Suggerimento AI
          try {
              const res = await fetch('/api/ai/workflows/suggest')
              const data = await res.json()
              if (data.suggestion) setAiSuggestion(data.suggestion)
          } catch(e) {}
      }
      setLoading(false)
    }
    getData()
  }, [])

  const [realLogs, setRealLogs] = useState<any[]>([])

  const createNewWorkflow = () => {
      if (currentPlan !== 'Ambassador' && savedWorkflows.length >= limits[currentPlan]) {
          return alert(`Hai raggiunto il limite di ${limits[currentPlan]} automazioni. Effettua l'upgrade!`)
      }
      setWorkflowName('Nuova Automazione')
      setFlow([{ id: Date.now().toString(), type: 'trigger', title: 'Clicca per scegliere il Trigger', desc: 'Cosa fa partire il flusso?', icon: <Settings size={20}/>, color: 'bg-gray-400' }])
      setIsEditing(true)
      setEditingNodeId(null)
  }

  const saveWorkflow = async () => {
      if (!user) return alert("Devi essere loggato per salvare.")
      setIsSaving(true)
      
      try {
          const { data, error } = await supabase.from('workflows').insert({
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
          setIsSaving(false)
          setIsEditing(false)
          setEditingNodeId(null)
          alert("✅ Workflow salvato e attivato con successo!")
      } catch(e: any) {
          console.error("Salvataggio fallito:", e)
          alert("Errore durante il salvataggio: " + e.message)
          setIsSaving(false)
      }
  }

  const addNode = (type: NodeType, title: string, desc: string, icon: any, color: string, defaultTitle?: string) => {
      if (type === 'trigger' && insertIndex === 0) {
          const newTrigger: FlowNode = { id: Date.now().toString(), type, title: defaultTitle || title, desc, icon, color, config: {} }
          setFlow([newTrigger, ...flow.slice(1)])
      } else {
          const newNode: FlowNode = { id: Date.now().toString(), type, title: defaultTitle || title, desc, icon, color, config: {} }
          const newFlow = [...flow]
          newFlow.splice(insertIndex, 0, newNode)
          setFlow(newFlow)
      }
      setIsNodeModalOpen(false)
      setEditingNodeId(flow[0]?.id ? Date.now().toString() : null)
  }

  const removeNode = (id: string) => {
      if (flow.length === 1) return alert("Non puoi eliminare l'evento scatenante (Trigger).")
      setFlow(flow.filter(n => n.id !== id))
      if (editingNodeId === id) setEditingNodeId(null)
  }

  const updateNodeConfig = (id: string, key: string, value: any) => {
      setFlow(flow.map(n => {
          if (n.id === id) {
              const updatedConfig = { ...(n.config || {}), [key]: value }
              let updatedDesc = n.desc;
              let updatedTitle = n.title;
              if (n.type === 'delay') updatedDesc = `Pausa di ${updatedConfig.time || 1} ${updatedConfig.unit || 'Giorni'}`
              if (n.type === 'condition') updatedDesc = `Se ${updatedConfig.rule || '...'} = ${updatedConfig.value || '...'}`
              if (n.type === 'action' && n.title.includes('WhatsApp')) updatedDesc = `Template: ${updatedConfig.template || 'Nessuno'}`
              
              return { ...n, config: updatedConfig, desc: updatedDesc, title: updatedTitle }
          }
          return n
      }))
  }

  const handleAIAction = (suggestion: string) => {
      setWorkflowName(`AI: ${suggestion}`)
      if (suggestion.includes('Preventivi')) {
          setFlow([
              { id: '1', type: 'trigger', title: 'Preventivo Creato', desc: 'Tramite app mobile', icon: <FileText size={20}/>, color: 'bg-blue-600', config: {} },
              { id: '2', type: 'delay', title: 'Attendi', desc: 'Pausa di 3 Giorni', icon: <Clock size={20}/>, color: 'bg-amber-500', config: { time: 3, unit: 'Giorni'} },
              { id: '3', type: 'condition', title: 'Controllo Stato', desc: 'Se Stato = Aperto', icon: <GitBranch size={20}/>, color: 'bg-purple-600', config: { rule: 'Stato Preventivo', value: 'Aperto'} },
              { id: '4', type: 'action', title: 'Invia Email', desc: 'Template: Chiusura Deal', icon: <Mail size={20}/>, color: 'bg-emerald-600', config: { template: 'Chiusura Deal'} }
          ])
      }
      setIsEditing(true)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Avvio Motore Automazioni...</div>

  const activeNode = flow.find(n => n.id === editingNodeId)

  return (
    <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col pb-20 md:pb-0">
      
      {/* HEADER */}
      <div className="flex-shrink-0 p-8 border-b border-gray-200 bg-white flex justify-between items-center z-10 shadow-sm relative">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Zap size={32} className="text-[#00665E]"/> Visual Automator</h1>
          <p className="text-gray-500 text-sm mt-1">Costruisci percorsi automatici trascinando azioni e condizioni.</p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex flex-col items-end">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Automazioni Attive ({currentPlan})</span>
                <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-[#00665E]'}`}>
                    {currentPlan === 'Ambassador' ? <Infinity size={16}/> : `${savedWorkflows.length} / ${limits[currentPlan]}`}
                </span>
            </div>

            {isEditing ? (
                <div className="flex gap-3">
                    <button onClick={() => { setIsEditing(false); setEditingNodeId(null); }} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100">Annulla</button>
                    <button onClick={saveWorkflow} disabled={isSaving || flow.length < 2} className="bg-[#00665E] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#004d46] flex items-center gap-2 disabled:opacity-50 transition shadow-lg">
                        {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                        <span>{isSaving ? 'Salvataggio...' : 'Salva e Attiva'}</span>
                    </button>
                </div>
            ) : (
                <button onClick={createNewWorkflow} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black flex items-center gap-2 shadow-lg transition">
                    <Plus size={16}/> Crea Workflow
                </button>
            )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          {/* LATO SINISTRO: LIBRERIA E AI ADVISOR */}
          {!isEditing && (
              <div className="w-full max-w-sm flex flex-col bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                  
                  {/* AI ADVISOR */}
                  <div className="bg-gradient-to-br from-[#00665E] to-teal-600 p-5 rounded-2xl mb-8 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={80}/></div>
                      <h3 className="font-black flex items-center gap-2 mb-2 relative z-10"><Sparkles size={16} className="text-amber-300"/> AI CRM Advisor</h3>
                      <p className="text-xs text-teal-100 mb-4 relative z-10">{aiSuggestion}</p>
                      <button onClick={() => handleAIAction('Automazione Suggerita')} className="w-full bg-white text-[#00665E] font-bold py-2 rounded-lg text-xs hover:bg-teal-50 transition relative z-10">
                          Genera Automazione Recupero
                      </button>
                  </div>

                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">I tuoi Flussi Attivi</h3>
                  <div className="space-y-3 mb-8">
                      {savedWorkflows.length === 0 ? <p className="text-sm text-gray-400">Nessuna automazione creata.</p> : null}
                      {savedWorkflows.map(wf => (
                          <div key={wf.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm group">
                              <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-bold text-gray-900 truncate pr-2">{wf.name}</h4>
                                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${wf.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                  <span className="flex items-center gap-1"><Activity size={12}/> {wf.runs} esecuzioni</span>
                                  <span className="flex items-center gap-1"><GitBranch size={12}/> {wf.nodes} step</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* CENTRO: CANVAS DEL WORKFLOW */}
          <div className="flex-1 bg-slate-100 relative overflow-y-auto p-10 flex flex-col items-center">
              {!isEditing ? (
                  <div className="m-auto text-center max-w-md">
                      <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"><GitBranch size={48}/></div>
                      <h2 className="text-2xl font-black text-gray-900 mb-2">Il Motore del Business</h2>
                      <p className="text-gray-500 mb-8">Crea flussi per lavorare mentre dormi. Scegli le app, metti le condizioni e lascia fare a IntegraOS.</p>
                      <button onClick={createNewWorkflow} className="bg-[#00665E] text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-[#004d46] transition">
                          Inizia da zero
                      </button>
                  </div>
              ) : (
                  <div className="w-full max-w-3xl pb-32 animate-in fade-in flex gap-8">
                      
                      <div className="flex-1 flex flex-col items-center relative">
                          <input type="text" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} className="text-3xl font-black text-center w-full bg-transparent outline-none border-b-2 border-transparent focus:border-[#00665E] pb-2 mb-12 text-gray-900" />
                          
                          {flow.map((node, index) => (
                              <div key={node.id} className="flex flex-col items-center relative w-full group">
                                  
                                  <div 
                                      onClick={() => {
                                          if (node.title === 'Clicca per scegliere il Trigger') { setInsertIndex(0); setIsNodeModalOpen(true); } 
                                          else { setEditingNodeId(node.id); }
                                      }}
                                      className={`bg-white rounded-3xl p-5 w-full shadow-md relative z-10 transition transform cursor-pointer border-2 ${editingNodeId === node.id ? 'border-[#00665E] scale-105 shadow-xl' : 'border-gray-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg'}`}
                                  >
                                      <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${node.color}`}>
                                          {node.type}
                                      </div>
                                      
                                      {index !== 0 && (
                                          <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                      )}

                                      <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4 mt-2">
                                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${node.color}`}>{node.icon}</div>
                                              <div>
                                                  <h3 className="font-black text-gray-900 text-lg leading-tight">{node.title}</h3>
                                                  <p className={`text-xs mt-1 ${node.title.includes('Clicca') ? 'text-blue-500 animate-pulse font-bold' : 'text-gray-500'}`}>{node.desc}</p>
                                              </div>
                                          </div>
                                          {!node.title.includes('Clicca') && <Edit3 size={16} className="text-gray-300"/>}
                                      </div>
                                  </div>

                                  <div className="w-1 bg-gray-300 h-16 relative flex items-center justify-center group-hover:bg-[#00665E] transition-colors">
                                      {node.title !== 'Clicca per scegliere il Trigger' && (
                                          <button onClick={() => { setInsertIndex(index + 1); setIsNodeModalOpen(true); }} className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center hover:border-[#00665E] hover:text-[#00665E] z-20 absolute shadow-sm transition"><Plus size={16} className="font-bold"/></button>
                                      )}
                                  </div>
                              </div>
                          ))}
                          <div className="w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm"></div>
                          <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Fine</p>
                      </div>

                      {editingNodeId && activeNode && (
                          <div className="w-80 shrink-0 bg-white border border-gray-200 rounded-3xl p-6 shadow-xl animate-in slide-in-from-right-8 h-fit sticky top-10">
                              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                  <h3 className="font-black text-gray-900 flex items-center gap-2"><Settings size={18} className="text-[#00665E]"/> Configura Nodo</h3>
                                  <button onClick={() => setEditingNodeId(null)} className="text-gray-400 hover:text-gray-900 bg-gray-100 p-1.5 rounded-full"><X size={14}/></button>
                              </div>

                              <div className="space-y-5">
                                  <div>
                                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Azione Selezionata</p>
                                      <p className="font-black text-gray-800 text-sm">{activeNode.title}</p>
                                  </div>

                                  {activeNode.type === 'delay' && (
                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-xs font-bold text-gray-600 block mb-2">Tempo di attesa</label>
                                              <div className="flex gap-2">
                                                  <input type="number" min="1" value={activeNode.config?.time || 1} onChange={(e) => updateNodeConfig(activeNode.id, 'time', e.target.value)} className="w-1/3 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] font-bold text-center"/>
                                                  <select value={activeNode.config?.unit || 'Giorni'} onChange={(e) => updateNodeConfig(activeNode.id, 'unit', e.target.value)} className="w-2/3 bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] font-bold text-gray-700">
                                                      <option value="Minuti">Minuti</option>
                                                      <option value="Ore">Ore</option>
                                                      <option value="Giorni">Giorni</option>
                                                  </select>
                                              </div>
                                          </div>
                                      </div>
                                  )}

                                  {activeNode.type === 'condition' && (
                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-xs font-bold text-gray-600 block mb-2">Verifica il parametro</label>
                                              <select value={activeNode.config?.rule || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'rule', e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm text-gray-700 mb-2">
                                                  <option value="" disabled>-- Scegli campo --</option>
                                                  <option value="Ha Acquistato">Ha Acquistato</option>
                                                  <option value="Stato Preventivo">Stato Preventivo</option>
                                                  <option value="Tags Cliente">Tags Cliente</option>
                                              </select>
                                              <label className="text-xs font-bold text-gray-600 block mb-2">Uguale a</label>
                                              <input type="text" value={activeNode.config?.value || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'value', e.target.value)} placeholder="es. Falso, Aperto, VIP" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm"/>
                                          </div>
                                      </div>
                                  )}

                                  {activeNode.type === 'action' && (
                                      <div className="space-y-4">
                                          <div>
                                              <label className="text-xs font-bold text-gray-600 block mb-2">Scegli Template Messaggio</label>
                                              <select value={activeNode.config?.template || ''} onChange={(e) => updateNodeConfig(activeNode.id, 'template', e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm text-gray-700">
                                                  <option value="" disabled>-- Scegli --</option>
                                                  <option value="Sconto 10% Ritorno">Sconto 10% Ritorno</option>
                                                  <option value="Chiusura Deal">Richiamo Chiusura Deal</option>
                                                  <option value="Benvenuto VIP">Benvenuto VIP</option>
                                              </select>
                                          </div>
                                      </div>
                                  )}

                                  <button onClick={() => setEditingNodeId(null)} className="w-full mt-4 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">Applica al flusso</button>
                              </div>
                          </div>
                      )}

                  </div>
              )}
          </div>
      </div>

      {isNodeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h2 className="text-xl font-black text-gray-900">{insertIndex === 0 ? 'Scegli l\'Evento Scatenante' : 'Aggiungi Step'}</h2>
                      <button onClick={() => setIsNodeModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                      
                      {insertIndex === 0 ? (
                          <>
                              <div className="col-span-1 md:col-span-2 mb-2"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Eventi E-commerce / Negozi</p></div>
                              <button onClick={() => addNode('trigger', 'Scontrino POS Registrato', 'Quando Nexus Hub legge la cassa', <CreditCard size={20}/>, 'bg-blue-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-blue-500 text-left">
                                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><CreditCard size={18}/></div>
                                  <div><p className="font-bold text-sm">Nuovo Scontrino</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Nuovo Ordine E-commerce', 'Da Shopify o Woo', <ShoppingCart size={20}/>, 'bg-orange-500')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-orange-500 text-left">
                                  <div className="bg-orange-100 text-orange-600 p-2 rounded-xl"><ShoppingCart size={18}/></div>
                                  <div><p className="font-bold text-sm">Ordine Online</p></div>
                              </button>

                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Eventi CRM / Agenti</p></div>
                              <button onClick={() => addNode('trigger', 'Nuovo Lead Creato', 'Utente compila form', <UserPlus size={20}/>, 'bg-indigo-500')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-indigo-500 text-left">
                                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><UserPlus size={18}/></div>
                                  <div><p className="font-bold text-sm">Nuovo Lead</p></div>
                              </button>
                              <button onClick={() => addNode('trigger', 'Preventivo Creato', 'Dall\'app Agente', <FileText size={20}/>, 'bg-teal-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-teal-500 text-left">
                                  <div className="bg-teal-100 text-teal-600 p-2 rounded-xl"><FileText size={18}/></div>
                                  <div><p className="font-bold text-sm">Nuovo Preventivo</p></div>
                              </button>
                          </>
                      ) : (
                          <>
                              <div className="col-span-1 md:col-span-2 mb-2"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Azioni (Fai qualcosa)</p></div>
                              <button onClick={() => addNode('action', 'Messaggio WhatsApp', 'Invia tramite AI Agent', <MessageCircle size={20}/>, 'bg-emerald-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-emerald-500 text-left">
                                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><MessageCircle size={18}/></div>
                                  <div><p className="font-bold text-sm">Invia WhatsApp</p></div>
                              </button>
                              <button onClick={() => addNode('action', 'Invia Email', 'Invia offerta DEM', <Mail size={20}/>, 'bg-blue-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-blue-500 text-left">
                                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><Mail size={18}/></div>
                                  <div><p className="font-bold text-sm">Invia Email</p></div>
                              </button>

                              <button onClick={() => addNode('ai_processor', 'AI Agent Processor', 'Elabora dati con Gemini', <BrainCircuit size={20}/>, 'bg-purple-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 text-left">
                                  <div className="bg-purple-100 text-purple-600 p-2 rounded-xl"><BrainCircuit size={18}/></div>
                                  <div><p className="font-bold text-sm">AI Logic (Gemini)</p></div>
                              </button>
                              
                              <div className="col-span-1 md:col-span-2 mb-2 mt-4"><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Controllo e Logica</p></div>
                              <button onClick={() => addNode('delay', 'Attendi Tempo', 'Metti in pausa il flusso', <Clock size={20}/>, 'bg-amber-500')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-amber-500 text-left">
                                  <div className="bg-amber-100 text-amber-600 p-2 rounded-xl"><Clock size={18}/></div>
                                  <div><p className="font-bold text-sm">Aggiungi Ritardo</p></div>
                              </button>
                              <button onClick={() => addNode('condition', 'Verifica Condizione', 'Se Vero/Falso', <GitBranch size={20}/>, 'bg-purple-600')} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3 hover:border-purple-500 text-left">
                                  <div className="bg-purple-100 text-purple-600 p-2 rounded-xl"><GitBranch size={18}/></div>
                                  <div><p className="font-bold text-sm">If / Else Condizione</p></div>
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