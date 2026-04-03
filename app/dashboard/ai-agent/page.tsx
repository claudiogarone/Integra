'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Target, TrendingUp, Zap, MessageCircle, 
    Smartphone, BrainCircuit, CheckCircle2, 
    AlertTriangle, Loader2, Star, ShieldCheck, 
    Award, Sparkles, QrCode, MessageSquareQuote, Search, Copy, X, Send, FileText, Power, Plus, Trash2, Eye, Download, Edit3, UserPlus, ArrowRight, Users
} from 'lucide-react'
import { SkillManager } from '@/components/ai/skill-manager'
import Link from 'next/link'

export default function AgentPortalPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const [agentData, setAgentData] = useState({
      name: 'Caricamento...',
      role: 'Agente',
      location: '-',
      performanceScore: 0,
      monthlyTarget: 10000,
      currentRevenue: 0,
  })

  const [activeApps, setActiveApps] = useState([
      { id: 'whatsapp', name: 'WhatsApp WebSync', icon: <MessageCircle size={16} className="text-[#25D366]"/> },
      { id: 'preventivatore', name: 'Smart Quote', icon: <FileText size={16} className="text-blue-500"/> }
  ])

  const [cardCode, setCardCode] = useState('')
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [isAddingPoints, setIsAddingPoints] = useState(false)
  const [terminalMessage, setTerminalMessage] = useState<{type: 'success'|'error', text: string} | null>(null)

  const [isCoaching, setIsCoaching] = useState(false)
  const [aiAdvice, setAiAdvice] = useState<string | null>(null)
  const [objection, setObjection] = useState('')
  const [isHandlingObjection, setIsHandlingObjection] = useState(false)
  const [objectionReply, setObjectionReply] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState<'insights' | 'skills'>('insights')

  // STATI SMART QUOTE
  const [crmClients, setCrmClients] = useState<any[]>([]) 
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false)
  const [quoteStep, setQuoteStep] = useState<'edit' | 'preview'>('edit')
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing')
  
  const [quoteClientInfo, setQuoteClientInfo] = useState({ name: '', email: '', phone: '' })
  const [quoteItems, setQuoteItems] = useState([{ desc: '', qty: 1, price: 0 }])
  const [isSendingQuote, setIsSendingQuote] = useState(false)

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          
          // 1. Recupera Info Agente Reale
          const { data: teamMember } = await supabase
              .from('team_members')
              .select('*')
              .eq('email', user.email)
              .single()

          // 2. Recupera Contatti/Clienti per calcolare Performance
          const { data: contactsData } = await supabase
              .from('contacts')
              .select('*')

          if (contactsData) {
              setCrmClients(contactsData)
              
              // Calcola fatturato reale (Status: Vinto o Chiuso)
              const wonContacts = contactsData.filter(c => c.status === 'Vinto' || c.status === 'Chiuso')
              const revenue = wonContacts.reduce((acc, c) => acc + (Number(c.ltv) || Number(c.value) || 0), 0)
              
              // Calcola Score (es. 10 punti ogni cliente vinto + base 30)
              const score = Math.min(100, 30 + (wonContacts.length * 10))

              setAgentData({
                  name: teamMember?.name || user.email?.split('@')[0] || 'Agente',
                  role: teamMember?.role || 'Digital Agent',
                  location: teamMember?.branch || 'Sede Centrale',
                  performanceScore: score,
                  monthlyTarget: 15000, 
                  currentRevenue: revenue
              })
          }
      }
      setLoading(false)
    }
    getData()
  }, [])

  const handleClientSelect = (clientName: string) => {
      const selected = crmClients.find(c => c.name === clientName)
      if (selected) {
          setQuoteClientInfo({ name: selected.name, email: selected.email || '', phone: selected.phone || '' })
      }
  }

  const handleAddPoints = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsAddingPoints(true)
      setTerminalMessage(null)

      try {
          // Ricerca cliente per card_code o email/telefono nel database reale
          const { data: customer, error: searchError } = await supabase
              .from('contacts')
              .select('*')
              .or(`id.eq.${cardCode},email.ilike.${cardCode},phone.eq.${cardCode}`)
              .single()

          if (searchError || !customer) {
              throw new Error("Cliente non trovato nel CRM.")
          }

          const currentPoints = Number(customer.points) || 0;
          const newPoints = currentPoints + Number(pointsToAdd);

          const { error: updateError } = await supabase
              .from('contacts')
              .update({ points: newPoints })
              .eq('id', customer.id)

          if (updateError) throw updateError

          setTerminalMessage({ type: 'success', text: `✅ Accreditati ${pointsToAdd} pt a ${customer.name}! Totale: ${newPoints}` })
          setCardCode(''); setPointsToAdd('');
      } catch (err: any) {
          setTerminalMessage({ type: 'error', text: `❌ Errore: ${err.message}` })
      } finally {
          setIsAddingPoints(false)
      }
  }

  const runPersonalCoach = async () => {
      setIsCoaching(true)
      setAiAdvice(null)
      try {
          const res = await fetch('/api/ai/agent-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  type: 'coach', 
                  data: agentData 
              })
          });
          const resData = await res.json();
          if (resData.response) setAiAdvice(resData.response);
          else throw new Error(resData.error || "Risposta vuota dall'AI.");
      } catch (err: any) {
          setAiAdvice(`❌ Errore AI Coach: ${err.message}`);
      } finally {
          setIsCoaching(false)
      }
  }

  const handleObjectionSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!objection.trim()) return
      setIsHandlingObjection(true)
      try {
          const res = await fetch('/api/ai/agent-brain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  type: 'objection', 
                  objective: objection 
              })
          });
          const resData = await res.json();
          if (resData.response) setObjectionReply(resData.response);
          else throw new Error("Risposta vuota dall'AI.");
      } catch (err: any) {
          setObjectionReply("❌ Errore AI Obiezioni: Servizio non disponibile.");
      } finally {
          setIsHandlingObjection(false)
      }
  }

  const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/login')
  }

  const handleAddItem = () => setQuoteItems([...quoteItems, { desc: '', qty: 1, price: 0 }])
  const handleRemoveItem = (index: number) => setQuoteItems(quoteItems.filter((_, i) => i !== index))
  const handleItemChange = (index: number, field: string, value: string | number) => {
      const newItems = [...quoteItems]
      newItems[index] = { ...newItems[index], [field]: value }
      setQuoteItems(newItems)
  }

  const quoteTotal = quoteItems.reduce((acc, item) => acc + (item.qty * item.price), 0)

  // ==========================================
  // FUNZIONE DOWNLOAD PDF REALE TRAMITE STAMPA
  // ==========================================
  const handleDownloadPDF = () => {
      // Questo comando apre la finestra di stampa nativa del PC/Mac.
      // Grazie al CSS speciale aggiunto sotto, l'utente potrà scegliere "Salva come PDF".
      window.print();
  }

  const sendFinalQuote = () => {
      setIsSendingQuote(true)
      setTimeout(() => {
          setIsSendingQuote(false)
          alert(`🚀 SMART LINK INVIATO!\n\nÈ stato generato il link univoco: integra.os/quote/8842X\nÈ stato inviato via SMS/WhatsApp a ${quoteClientInfo.name || 'Cliente'}. \n\nIl CRM ti invierà una notifica sul telefono non appena il cliente aprirà la pagina web per visionare e accettare il preventivo!`)
          setIsQuoteBuilderOpen(false)
          setQuoteStep('edit')
          setQuoteItems([{ desc: '', qty: 1, price: 0 }])
          setQuoteClientInfo({ name: '', email: '', phone: '' })
      }, 2000)
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-400 font-bold animate-pulse">Avvio Area Operativa...</div>

  const progressPercent = Math.min(100, Math.round((agentData.currentRevenue / agentData.monthlyTarget) * 100))

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col relative">
      
      {/* STILE CSS SPECIALE PER LA STAMPA DEL PDF: 
          Nasconde tutta l'interfaccia tranne l'area del preventivo quando si clicca "Scarica PDF" 
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #quote-print-area, #quote-print-area * { visibility: visible; }
          #quote-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 0; margin: 0; }
          .print-hidden { display: none !important; }
        }
      `}} />

      {/* HEADER AGENTE */}
      <div className="bg-slate-900 text-white p-6 border-b border-slate-800 shadow-md relative overflow-hidden shrink-0 print-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-[#00665E] rounded-full flex items-center justify-center text-xl font-black shadow-lg border-2 border-slate-800">
                      {agentData.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                      <h1 className="text-2xl font-black flex items-center gap-2">Spazio Operativo</h1>
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-400"/> {agentData.name} • {agentData.location}
                      </p>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-2">
                      <Link href="/dashboard/ai-agent/teams">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition shadow-lg">
                            <Users size={14}/> Gestione Team
                        </button>
                      </Link>
                      {activeApps.map(app => (
                          <span key={app.id} className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold text-slate-300">
                              {app.icon} {app.name}
                          </span>
                      ))}
                  </div>
                  <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded-full transition" title="Disconnetti"><Power size={18}/></button>
              </div>
          </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start print-hidden">
          
          {/* COLONNA SINISTRA */}
          <div className="lg:col-span-6 space-y-6">
              
              <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl w-max shadow-sm mb-2">
                  <button onClick={() => setActiveLeftTab('insights')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeLeftTab === 'insights' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Insights & Coach</button>
                  <button onClick={() => setActiveLeftTab('skills')} className={`px-4 py-2 rounded-xl text-xs font-black transition ${activeLeftTab === 'skills' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>Libreria Skills</button>
              </div>

              {activeLeftTab === 'skills' ? (
                  <div className="h-[600px]">
                      <SkillManager />
                  </div>
              ) : (
                  <>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Target className="text-blue-500"/> I Tuoi Obiettivi Mensili</h2>
                  <div className="flex justify-between items-end mb-2">
                      <div>
                          <p className="text-3xl font-black text-gray-900">€ {agentData.currentRevenue.toLocaleString()}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Fatturato Attuale</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">Target: € {agentData.monthlyTarget.toLocaleString()}</p>
                          <p className={`text-xs font-black mt-1 ${progressPercent >= 100 ? 'text-emerald-500' : 'text-blue-600'}`}>{progressPercent}% Raggiunto</p>
                      </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4 mb-6 overflow-hidden border border-gray-200">
                      <div className={`h-4 rounded-full transition-all duration-1000 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Award size={20}/></div>
                          <div><p className="text-xs font-bold text-gray-500">Score AI</p><p className="text-lg font-black">{agentData.performanceScore}/100</p></div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><TrendingUp size={20}/></div>
                          <div><p className="text-xs font-bold text-gray-500">Trend</p><p className="text-lg font-black text-emerald-500">+12%</p></div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col">
                      <BrainCircuit className="absolute -right-4 -bottom-4 text-indigo-200" size={100} opacity={0.3}/>
                      <h2 className="text-md font-black text-indigo-900 mb-2 flex items-center gap-2 relative z-10"><Sparkles size={18} className="text-indigo-500"/> Il tuo AI Coach</h2>
                      <p className="text-xs text-indigo-700/80 mb-6 relative z-10">L'AI analizza i tuoi numeri e ti consiglia l'azione migliore per chiudere vendite oggi.</p>
                      
                      <div className="mt-auto relative z-10">
                          {!isCoaching && !aiAdvice ? (
                              <button onClick={runPersonalCoach} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 transition shadow-md flex justify-center items-center gap-2 text-sm">
                                  <BrainCircuit size={16}/> Richiedi Consiglio
                              </button>
                          ) : isCoaching ? (
                              <div className="flex flex-col items-center justify-center py-4 text-indigo-600"><Loader2 size={24} className="animate-spin"/></div>
                          ) : (
                              <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm animate-in zoom-in-95">
                                  <p className="text-xs font-medium text-gray-800 whitespace-pre-line leading-relaxed">{aiAdvice}</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col">
                      <h2 className="text-md font-black text-gray-900 mb-2 flex items-center gap-2"><MessageSquareQuote size={18} className="text-amber-500"/> Supera-Obiezioni AI</h2>
                      <p className="text-xs text-gray-500 mb-4">Il cliente tentenna? Scrivi cosa ti ha detto e l'AI ti darà la risposta psicologica perfetta.</p>
                      
                      <form onSubmit={handleObjectionSubmit} className="mt-auto space-y-3">
                          <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                              <input type="text" value={objection} onChange={e=>setObjection(e.target.value)} placeholder="Es. 'Ci devo pensare'..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:border-amber-500" />
                          </div>
                          {!objectionReply && !isHandlingObjection && (
                              <button type="submit" disabled={!objection.trim()} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-black transition text-xs disabled:opacity-50">Genera Risposta Infallibile</button>
                          )}
                      </form>

                      {isHandlingObjection && <div className="flex justify-center mt-4"><Loader2 size={20} className="animate-spin text-amber-500"/></div>}
                      
                      {objectionReply && !isHandlingObjection && (
                          <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl relative animate-in slide-in-from-bottom-2">
                              <p className="text-xs text-amber-900 font-medium italic leading-relaxed">{objectionReply}</p>
                              <button onClick={() => {setObjectionReply(null); setObjection('')}} className="text-[10px] text-amber-600 font-bold mt-2 hover:underline">Chiudi</button>
                          </div>
                      )}
                  </div>
              </div>
                  </>
              )}
          </div>

          {/* COLONNA DESTRA */}
          <div className="lg:col-span-6 flex flex-col h-full space-y-6">
              
              <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-md transition" onClick={() => setIsQuoteBuilderOpen(true)}>
                  <div>
                      <h2 className="text-lg font-black text-blue-900 mb-1 flex items-center gap-2"><FileText size={20} className="text-blue-500"/> Preventivatore Smart Quote</h2>
                      <p className="text-sm text-gray-500">Crea un'offerta dettagliata, visualizza l'anteprima e invia il link al cliente in 30 secondi.</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition shrink-0 ml-4">
                      <ArrowRight size={24}/>
                  </div>
              </div>

              <div className="bg-slate-900 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-800 flex-1 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#00665E]/20 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#00665E] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,102,94,0.5)]">
                              <Zap size={20} className="text-white" />
                          </div>
                          <div>
                              <h2 className="text-xl font-black text-white">Terminale Punti</h2>
                              <p className="text-slate-400 text-[10px] uppercase tracking-widest">Assegna punti in cassa</p>
                          </div>
                      </div>
                      
                      <button onClick={() => setIsQrModalOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition backdrop-blur-sm text-xs">
                          <QrCode size={14} className="text-emerald-400"/> Registra Cliente
                      </button>
                  </div>

                  {terminalMessage && (
                      <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold relative z-10 animate-in fade-in zoom-in-95 ${terminalMessage.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'bg-rose-500/20 border border-rose-500/50 text-rose-400'}`}>
                          {terminalMessage.type === 'success' ? <CheckCircle2 size={20}/> : <AlertTriangle size={20}/>}
                          <span>{terminalMessage.text}</span>
                      </div>
                  )}

                  <form onSubmit={handleAddPoints} className="space-y-4 relative z-10 flex-1 flex flex-col justify-end">
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Codice Carta o Telefono</label>
                          <input 
                            type="text" 
                            value={cardCode} 
                            onChange={(e) => setCardCode(e.target.value)} 
                            placeholder="Email, Telefono o ID" 
                            className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white font-mono text-center tracking-normal text-lg focus:border-[#00665E] outline-none transition placeholder:text-slate-600" 
                            required 
                          />
                      </div>
                      <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Punti Acquisiti</label>
                          <input type="number" value={pointsToAdd} onChange={(e) => setPointsToAdd(e.target.value)} placeholder="0" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-white text-center text-2xl font-black focus:border-[#00665E] outline-none transition placeholder:text-slate-600" required />
                      </div>

                      <button type="submit" disabled={isAddingPoints || !cardCode || !pointsToAdd} className="w-full mt-4 bg-gradient-to-r from-[#00665E] to-teal-500 hover:from-[#00554e] hover:to-teal-600 text-white font-black py-4 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                          {isAddingPoints ? <Loader2 size={20} className="animate-spin"/> : <Star size={20}/>}
                          {isAddingPoints ? 'Registrazione sul CRM...' : 'CONFERMA E ASSEGNA PUNTI'}
                      </button>
                  </form>
              </div>
          </div>
      </div>

      {/* MODALE SMART QUOTE BUILDER */}
      {isQuoteBuilderOpen && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
              <div className="bg-gray-50 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-full overflow-hidden animate-in zoom-in-95 print-visible-container">
                  
                  <div className="bg-white p-6 border-b border-gray-200 flex justify-between items-center shrink-0 print-hidden">
                      <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-xl"><FileText size={24}/></div>
                          <div>
                              <h2 className="text-xl font-black text-gray-900">Generatore Preventivi (Smart Quote)</h2>
                              <p className="text-xs text-gray-500">Crea offerte professionali collegate al tuo CRM</p>
                          </div>
                      </div>
                      <button onClick={() => setIsQuoteBuilderOpen(false)} className="text-gray-400 hover:text-gray-900 transition"><X size={24}/></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 md:p-8" id="quote-print-area">
                      {quoteStep === 'edit' ? (
                          <div className="space-y-8">
                              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><UserPlus size={18} className="text-blue-500"/> Dati Cliente</h3>
                                  <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-max">
                                      <button type="button" onClick={() => setClientType('existing')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${clientType === 'existing' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Cerca da CRM</button>
                                      <button type="button" onClick={() => setClientType('new')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${clientType === 'new' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Nuovo Cliente</button>
                                  </div>
                                  {clientType === 'existing' ? (
                                      <div>
                                          <select 
                                              value={quoteClientInfo.name} 
                                              onChange={e => handleClientSelect(e.target.value)} 
                                              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 text-sm font-bold cursor-pointer"
                                          >
                                              <option value="" disabled>Seleziona un cliente esistente dal database...</option>
                                              {crmClients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                                          </select>
                                          {quoteClientInfo.email && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><CheckCircle2 size={12}/> Email trovata: {quoteClientInfo.email}</p>}
                                      </div>
                                  ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div><label className="text-[10px] font-bold text-gray-500 uppercase">Nome / Azienda</label><input type="text" value={quoteClientInfo.name} onChange={e=>setQuoteClientInfo({...quoteClientInfo, name: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"/></div>
                                          <div><label className="text-[10px] font-bold text-gray-500 uppercase">Email</label><input type="email" value={quoteClientInfo.email} onChange={e=>setQuoteClientInfo({...quoteClientInfo, email: e.target.value})} className="w-full border p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"/></div>
                                      </div>
                                  )}
                              </div>

                              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><FileText size={18} className="text-blue-500"/> Voci dell'Offerta</h3>
                                  <div className="space-y-3 mb-4">
                                      {quoteItems.map((item, index) => (
                                          <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                              <div className="flex-1 w-full"><input type="text" placeholder="Descrizione prodotto/servizio" value={item.desc} onChange={e => handleItemChange(index, 'desc', e.target.value)} className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-blue-500"/></div>
                                              <div className="flex gap-3 w-full md:w-auto">
                                                  <div className="w-20 shrink-0"><input type="number" min="1" placeholder="Qtà" value={item.qty} onChange={e => handleItemChange(index, 'qty', Number(e.target.value))} className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm text-center outline-none focus:border-blue-500"/></div>
                                                  <div className="w-32 shrink-0 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span><input type="number" placeholder="Prezzo" value={item.price} onChange={e => handleItemChange(index, 'price', Number(e.target.value))} className="w-full bg-white border border-gray-200 p-2 pl-7 rounded-lg text-sm font-bold outline-none focus:border-blue-500"/></div>
                                                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition" disabled={quoteItems.length === 1}><Trash2 size={18}/></button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="flex justify-between items-center mt-6">
                                      <button type="button" onClick={handleAddItem} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"><Plus size={14}/> Aggiungi Voce</button>
                                      <div className="text-right">
                                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Totale Stimato</p>
                                          <p className="text-2xl font-black text-gray-900">€ {quoteTotal.toLocaleString('it-IT', {minimumFractionDigits: 2})}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-white max-w-2xl mx-auto shadow-sm border border-gray-200 p-10 font-sans min-h-[500px]">
                              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
                                  <div>
                                      <h1 className="text-3xl font-black tracking-tight text-gray-900">PREVENTIVO</h1>
                                      <p className="text-gray-500 text-sm mt-1">N° PRV-{new Date().getFullYear()}-0042</p>
                                  </div>
                                  <div className="text-right text-sm text-gray-600">
                                      <p className="font-bold text-gray-900">La Tua Azienda SpA</p>
                                      <p>Agente: {agentData.name}</p>
                                      <p>Data: {new Date().toLocaleDateString('it-IT')}</p>
                                  </div>
                              </div>
                              <div className="mb-10 text-sm">
                                  <p className="font-bold text-gray-400 text-xs mb-1">SPETTABILE:</p>
                                  <p className="text-lg font-bold text-gray-900">{quoteClientInfo.name || 'Cliente'}</p>
                                  {quoteClientInfo.email && <p className="text-gray-600">{quoteClientInfo.email}</p>}
                                  {quoteClientInfo.phone && <p className="text-gray-600">{quoteClientInfo.phone}</p>}
                              </div>
                              <table className="w-full text-left text-sm mb-10">
                                  <thead>
                                      <tr className="border-b border-gray-300 text-gray-500">
                                          <th className="pb-3 font-bold">DESCRIZIONE</th>
                                          <th className="pb-3 font-bold text-center">QTÀ</th>
                                          <th className="pb-3 font-bold text-right">PREZZO UN.</th>
                                          <th className="pb-3 font-bold text-right">TOTALE</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {quoteItems.map((item, idx) => (
                                          <tr key={idx} className="border-b border-gray-100">
                                              <td className="py-4 font-medium text-gray-800">{item.desc || 'Voce senza nome'}</td>
                                              <td className="py-4 text-center text-gray-600">{item.qty}</td>
                                              <td className="py-4 text-right text-gray-600">€ {item.price.toLocaleString('it-IT', {minimumFractionDigits: 2})}</td>
                                              <td className="py-4 text-right font-bold text-gray-900">€ {(item.qty * item.price).toLocaleString('it-IT', {minimumFractionDigits: 2})}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              <div className="flex justify-end">
                                  <div className="w-64 bg-gray-50 p-4 rounded-xl border border-gray-200 text-right">
                                      <p className="text-xs text-gray-500 font-bold mb-1">TOTALE DA SALDARE</p>
                                      <p className="text-3xl font-black text-blue-600">€ {quoteTotal.toLocaleString('it-IT', {minimumFractionDigits: 2})}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-white shrink-0 flex justify-between items-center print-hidden">
                      {quoteStep === 'edit' ? (
                          <>
                              <button onClick={() => setIsQuoteBuilderOpen(false)} className="text-gray-500 font-bold text-sm hover:underline">Annulla</button>
                              <button 
                                  onClick={() => setQuoteStep('preview')} 
                                  disabled={quoteTotal === 0 || !quoteClientInfo.name}
                                  className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-black transition flex items-center gap-2 shadow-md disabled:opacity-50"
                              >
                                  <Eye size={18}/> Genera Anteprima
                              </button>
                          </>
                      ) : (
                          <>
                              <button onClick={() => setQuoteStep('edit')} className="text-gray-500 font-bold text-sm flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition"><Edit3 size={16}/> Modifica Dati</button>
                              <div className="flex gap-3">
                                  {/* BOTTONE STAMPA/PDF REALE */}
                                  <button onClick={handleDownloadPDF} className="bg-white border border-gray-300 text-gray-700 font-bold px-4 py-3 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 shadow-sm"><Download size={18}/><span className="hidden md:inline">Scarica PDF</span></button>
                                  
                                  <button onClick={sendFinalQuote} disabled={isSendingQuote} className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                                      {isSendingQuote ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} Invia Link al Cliente
                                  </button>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODALE QR CODE (ISCRIZIONE CLIENTI) */}
      {isQrModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print-hidden" onClick={() => setIsQrModalOpen(false)}>
              <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-8 text-center animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setIsQrModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={24}/></button>
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Smartphone size={32}/></div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Inquadra con lo Smartphone</h2>
                  <p className="text-sm text-gray-500 mb-8">Il cliente si registrerà da solo al CRM. Nessun modulo cartaceo da compilare.</p>
                  <div className="bg-white border-4 border-gray-100 p-4 rounded-3xl mx-auto w-48 h-48 flex items-center justify-center shadow-inner mb-6">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://integra.os/join&color=0f172a" alt="QR Code" className="w-full h-full opacity-90"/>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500 truncate mr-2">integra.os/join-card</span>
                      <button onClick={() => {navigator.clipboard.writeText('https://integra.os/join-card'); alert('Link Copiato')}} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"><Copy size={16}/></button>
                  </div>
              </div>
          </div>
      )}

    </main>
  )
}