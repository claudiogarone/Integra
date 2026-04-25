'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
    BrainCircuit, Sparkles, Send, Database, Download, Loader2, Bot, User, Infinity 
} from 'lucide-react'
import { 
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, PieChart as RechartsPie, Pie
} from 'recharts'

export default function DataStudioPage() {
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)
  
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  const queryLimits: any = { 'Base': 100, 'Enterprise': 1000, 'Ambassador': 'Illimitate' }
  const [queriesUsed, setQueriesUsed] = useState(12)

  const initialMessage = { 
      id: 1, 
      role: 'ai', 
      text: "Ciao! Sono il tuo Assistente Dati A.I. Ora sono collegato in tempo reale ai tuoi database CRM ed E-Commerce aziendali. Chiedimi del fatturato, da dove provengono i lead o cosa hai in magazzino!", 
      type: 'text' 
  }
  const [messages, setMessages] = useState<any[]>([initialMessage])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan, company_name').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
      }
      setLoading(false)
    }
    getData()
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isThinking])

  const COLORS = ['#00665E', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  const handleAskAI = async (e?: React.FormEvent, customQuery?: string) => {
      if (e) e.preventDefault();
      const query = customQuery || inputQuery;
      if (!query.trim()) return;

      if (currentPlan !== 'Ambassador' && queriesUsed >= queryLimits[currentPlan]) {
          return alert(`Hai raggiunto il limite di query AI del piano ${currentPlan}.`)
      }

      setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: query, type: 'text' }])
      setInputQuery('')
      setIsThinking(true)

      try {
          // Ricaviamo esplicitamente la sessione attiva
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          const token = sessionData?.session?.access_token;
          
          if (!token) {
              setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: "Errore: Autenticazione scaduta. Ricarica la pagina per favore.", type: 'text' }])
              setIsThinking(false);
              return;
          }

          const res = await fetch('/api/data-studio/chat', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ query })
          })

          const aiResponseData = await res.json()
          
          if (aiResponseData.error) {
              setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `Errore: ${aiResponseData.error}`, type: 'text' }])
          } else {
              setMessages(prev => [...prev, { ...aiResponseData, id: Date.now() + 1, role: 'ai' }])
              setQueriesUsed(prev => prev + 1)
          }

      } catch (err) {
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: "Errore di connessione al motore Data Studio.", type: 'text' }])
      } finally {
          setIsThinking(false)
      }
  }

  const renderChart = (msg: any) => {
      if (!msg.data || msg.data.length === 0) return null;

      if (msg.chartType === 'area') {
          const dataKey = msg.dataKey1 || 'Fatturato';
          return (
              <div className="h-72 print:h-[350px] w-full mt-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm print:shadow-none print:border-2 print:border-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={msg.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <XAxis dataKey="name"/>
                          <YAxis/>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <Tooltip/>
                          <Legend/>
                          <Area type="monotone" dataKey={dataKey} stroke="#00665E" fill="#00665E" fillOpacity={0.3}/>
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          )
      }
      if (msg.chartType === 'bar') {
          const dataKey = msg.dataKey1 || 'Leads';
          return (
              <div className="h-72 print:h-[350px] w-full mt-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm print:shadow-none print:border-2 print:border-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={msg.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <XAxis dataKey="name"/>
                          <YAxis/>
                          <CartesianGrid strokeDasharray="3 3"/>
                          <Tooltip/>
                          <Bar dataKey={dataKey} fill="#00665E" radius={[4, 4, 0, 0]}/>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          )
      }
      if (msg.chartType === 'pie') {
          return (
              <div className="h-72 print:h-[350px] w-full mt-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center print:shadow-none print:border-2 print:border-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                          <Pie data={msg.data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                              {msg.data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip/>
                          <Legend/>
                      </RechartsPie>
                  </ResponsiveContainer>
              </div>
          )
      }
      return null;
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Avvio Motore di Business Intelligence...</div>

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; }
          body * { visibility: hidden; }
          #chat-export-area, #chat-export-area * { visibility: visible; }
          #chat-export-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; display: block !important; }
          #chat-input-bar, #chat-input-bar * { display: none !important; }
          .print-avoid-break { break-inside: avoid; }
        }
      `}} />

      <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col pb-20 md:pb-0">
        
        {/* HEADER */}
        <div className="flex-shrink-0 p-8 border-b border-gray-200 bg-white flex justify-between items-center z-10 shadow-sm relative">
          <div>
            <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><BrainCircuit size={32}/> AI Data Studio</h1>
            <p className="text-gray-500 text-sm mt-1">Esplora e visualizza i tuoi veri dati aziendali in tempo reale.</p>
          </div>
          <div className="flex items-center gap-4">
              <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex flex-col items-end">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Query AI Mese ({currentPlan})</span>
                  <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-[#00665E]'}`}>
                      {currentPlan === 'Ambassador' ? <Infinity size={16}/> : `${queriesUsed} / ${queryLimits[currentPlan]}`}
                  </span>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#00665E] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#004d46] transition shadow-lg">
                  <Download size={16}/> Esporta Report
              </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR */}
            <div className="hidden xl:flex w-80 flex-col bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
                <div className="mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14}/> Fonti Dati Sincronizzate</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between bg-white p-3 rounded-xl shadow-sm text-sm font-bold text-gray-700"><span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> CRM Contacts</span></div>
                        <div className="flex justify-between bg-white p-3 rounded-xl shadow-sm text-sm font-bold text-gray-700"><span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> E-Commerce Orders</span></div>
                    </div>
                </div>

                {/* SEZIONE CHECKUP AZIENDALE */}
                <div className="mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14} className="text-amber-500"/> Checkup Aziendale</h3>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-3">
                        <p className="text-xs font-bold text-amber-800 leading-relaxed mb-3">Avvia un'analisi completa automatica della salute del business: lead, conversioni, prodotti e fatturato.</p>
                        <button
                            onClick={() => {
                                const checkupQueries = [
                                    "Quanti lead ho in totale e qual è la loro distribuzione per stato?",
                                    "Qual è il fatturato totale e i prodotti più venduti?",
                                    "Qual è il tasso di conversione dei lead e i canali di acquisizione principali?"
                                ];
                                let i = 0;
                                const runNext = () => {
                                    if (i < checkupQueries.length) {
                                        handleAskAI(undefined, checkupQueries[i]);
                                        i++;
                                        setTimeout(runNext, 3500);
                                    }
                                };
                                runNext();
                            }}
                            className="w-full bg-amber-500 text-white font-black py-2.5 px-3 rounded-xl text-xs hover:bg-amber-600 transition flex items-center justify-center gap-2 shadow-md"
                        >
                            <Sparkles size={14}/> Avvia Checkup Completo
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14}/> Prompts Rapidi</h3>
                    <div className="space-y-3">
                        {[
                            "Storico vendite e fatturato",
                            "Distribuzione dei lead per stato",
                            "Prodotti più presenti in catalogo",
                            "Quanti lead ho acquisito questo mese?",
                            "Quali sono i canali di acquisizione principali?",
                            "Mostrami i clienti con il più alto LTV"
                        ].map((prompt, i) => (
                            <button key={i} onClick={() => handleAskAI(undefined, prompt)} className="w-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-[#00665E] hover:shadow-md transition text-sm text-gray-600 font-medium">{prompt}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* AREA CHAT */}
            <div id="chat-export-area" className="flex-1 flex flex-col bg-white relative">
                {/* Print PDF Header */}
                <div className="hidden print:block mb-8 border-b-4 border-[#00665E] pb-6 px-4 mt-4">
                    <div className="flex items-center gap-3 mb-2">
                        <BrainCircuit size={40} className="text-[#00665E]"/>
                        <h1 className="text-4xl font-black text-[#00665E]">Data Studio Report</h1>
                    </div>
                    <p className="text-gray-600 font-bold text-xl">Aggregazione e Visualizzazione {new Date().toLocaleDateString('it-IT')}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth" id="chat-container">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex print-avoid-break ${msg.role === 'user' ? 'justify-end print:justify-start' : 'justify-start'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 shadow-md ${msg.role === 'user' ? 'bg-gray-200 text-gray-600 ml-4 print:hidden' : 'bg-[#00665E] mr-4'}`}>
                                {msg.role === 'user' ? <User size={20}/> : <Bot size={20}/>}
                            </div>
                            <div className={`max-w-[85%] print:max-w-full ${msg.role === 'user' ? 'bg-[#00665E] text-white p-5 rounded-3xl rounded-tr-sm print:bg-gray-100 print:text-gray-900 print:border-l-4 print:border-[#00665E] print:rounded-lg print:w-full' : 'w-full'}`}>
                                {msg.role === 'user' ? (
                                    <p className="text-[15px] font-medium print:font-black print:text-lg">Richiesta: "{msg.text}"</p>
                                ) : (
                                    <div className="w-full">
                                        <div className="bg-white border border-gray-100 p-6 rounded-[2rem] rounded-tl-sm shadow-md print:shadow-none print:bg-white print:border-none print:p-0 print:mb-4">
                                            <p className="text-[15px] text-gray-800 print:text-gray-900 print:text-lg"><Sparkles size={16} className="inline mr-2 text-amber-500 print:hidden"/>{msg.text}</p>
                                        </div>
                                        {msg.type === 'chart' && renderChart(msg)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isThinking && <div className="flex justify-start print:hidden"><div className="w-10 h-10 rounded-full bg-[#00665E] flex items-center justify-center text-white shrink-0 mr-4 animate-pulse"><Bot size={20}/></div><div className="bg-gray-50 p-5 rounded-3xl text-gray-500 flex items-center gap-3"><Loader2 className="animate-spin text-[#00665E]"/><span>Analisi in corso sui database reali...</span></div></div>}
                    <div ref={chatEndRef} className="print:hidden"/>
                </div>

                <div id="chat-input-bar" className="p-6 bg-white border-t border-gray-100">
                    <form onSubmit={handleAskAI} className="relative max-w-4xl mx-auto">
                        <input type="text" value={inputQuery} onChange={e => setInputQuery(e.target.value)} placeholder="Chiedi risultati sui lead, fatturato o prodotti..." className="w-full border-2 border-gray-200 p-5 pr-16 rounded-2xl outline-none focus:border-[#00665E]" disabled={isThinking} />
                        <button type="submit" disabled={!inputQuery.trim() || isThinking} className="absolute right-3 top-3 bottom-3 bg-[#00665E] text-white px-4 rounded-xl hover:bg-[#004d46] disabled:opacity-50 transition"><Send size={20}/></button>
                    </form>
                </div>

            </div>
        </div>
      </main>
    </>
  )
}