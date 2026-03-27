'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { 
  Bot, BrainCircuit, Database, Trash2, 
  MessageSquare, Send, Sparkles, Loader2, CheckCircle2,
  ShieldCheck, BookOpen, AlertTriangle
} from 'lucide-react'

export default function AITrainingPage() {
  const [activeTab, setActiveTab] = useState<'train' | 'test'>('train')
  const [user, setUser] = useState<any>(null)
  
  const [knowledgeText, setKnowledgeText] = useState('')
  const [isTraining, setIsTraining] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [trainStatus, setTrainStatus] = useState<{success: boolean, msg: string} | null>(null)

  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string, contextFound?: boolean}[]>([
      { role: 'ai', text: 'Ciao! Sono il tuo Agente AI. Addestrami nella scheda "Base di Conoscenza", poi fammi una domanda!' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    const initUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user || { id: '00000000-0000-0000-0000-000000000000' })
    }
    initUser()
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const handleTrainAI = async () => {
      if (!knowledgeText.trim() || knowledgeText.length < 20) return alert("Inserisci un testo più lungo per addestrare l'AI.");
      setIsTraining(true); setTrainStatus(null);
      try {
          const res = await fetch('/api/ai/train', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: knowledgeText, namespace: user?.id })
          });
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setTrainStatus({ success: true, msg: `Addestramento completato! Memorizzati ${data.chunksLearned} blocchi di informazioni.` })
          setKnowledgeText('') 
      } catch (err: any) {
          setTrainStatus({ success: false, msg: "Errore: " + err.message })
      } finally { setIsTraining(false) }
  }

  const handleResetAI = async () => {
      if(!confirm("⚠️ Vuoi cancellare TUTTA la memoria di questo Agente?")) return;
      setIsResetting(true)
      try {
          const res = await fetch('/api/ai/reset', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ namespace: user?.id })
          });
          if (!res.ok) throw new Error("Errore durante il reset")
          alert("✅ Memoria cancellata. Ora è 'vuoto'.")
          setTrainStatus(null)
      } catch (err: any) { alert("Errore: " + err.message) } finally { setIsResetting(false) }
  }

  const handleChatTest = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!chatInput.trim() || isTyping) return;
      const userQuestion = chatInput;
      setMessages(prev => [...prev, { role: 'user', text: userQuestion }]);
      setChatInput(''); setIsTyping(true);

      try {
          // ATTENZIONE QUI: CHIAMIAMO LA NUOVA API RAG-CHAT INVECE CHE QUELLA VECCHIA!
          const res = await fetch('/api/ai/rag-chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: userQuestion, namespace: user?.id })
          });
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          setMessages(prev => [...prev, { role: 'ai', text: data.response, contextFound: data.contextFound }]);
      } catch (err: any) {
          setMessages(prev => [...prev, { role: 'ai', text: "❌ Errore di connessione." }]);
      } finally { setIsTyping(false); }
  }

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-slate-900 font-sans min-h-screen pb-20 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Bot size={32} className="text-purple-600"/> Centro Addestramento RAG</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Inietta i dati aziendali nel cervello di Pinecone.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab('train')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'train' ? 'bg-[#00665E] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}><Database size={16}/> Inserimento Dati</button>
            <button onClick={() => setActiveTab('test')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'test' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}><MessageSquare size={16}/> Simulatore Chat</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
          {activeTab === 'train' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-left-4">
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100"><BookOpen size={24}/></div>
                          <div><h2 className="text-xl font-black text-slate-900">Incolla Documentazione</h2><p className="text-xs text-slate-500 mt-1">Regole, orari, listini. Più sei preciso, più l'AI risponderà bene.</p></div>
                      </div>
                      <textarea 
                          className="w-full h-80 bg-slate-50 border border-slate-200 rounded-2xl p-6 outline-none focus:border-[#00665E] transition text-sm text-slate-800 resize-none shadow-inner"
                          placeholder="Scrivi o incolla qui..." value={knowledgeText} onChange={(e) => setKnowledgeText(e.target.value)}
                      />
                      <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100">
                          <button onClick={handleResetAI} disabled={isResetting || isTraining} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2">
                              {isResetting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Svuota Memoria DB
                          </button>
                          <button onClick={handleTrainAI} disabled={isTraining || !knowledgeText.trim()} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-black hover:bg-[#004d47] transition disabled:opacity-50 flex items-center gap-2 shadow-lg">
                              {isTraining ? <Loader2 size={20} className="animate-spin"/> : <BrainCircuit size={20}/>} Invia a Pinecone
                          </button>
                      </div>
                      {trainStatus && (
                          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${trainStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                              {trainStatus.success ? <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-500"/> : <AlertTriangle className="shrink-0 mt-0.5 text-rose-500"/>}
                              <p className="text-sm font-bold">{trainStatus.msg}</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                      <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                          <BrainCircuit size={150} className="absolute -right-10 -bottom-10 opacity-10 text-indigo-400"/>
                          <h3 className="text-xl font-black mb-4 flex items-center gap-2"><Sparkles className="text-indigo-400"/> Come Funziona</h3>
                          <div className="space-y-4 text-sm text-slate-300 font-medium">
                              <p>Il testo viene trasformato in Vettori Matematici tramite l'API di Gemini e inviato a Pinecone.</p>
                              <p>Questo permette alla tua AI di rispondere solo con i dati reali dell'azienda, senza allucinazioni.</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'test' && (
              <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden flex flex-col h-[700px] max-w-4xl mx-auto">
                  <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between z-10 shadow-sm">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center"><Bot size={24} className="text-white"/></div>
                          <div><h3 className="font-black text-lg text-slate-900">RAG Chat Simulator</h3><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">Pinecone Connesso <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span></p></div>
                      </div>
                      <button onClick={() => setMessages([{ role: 'ai', text: 'Chat pulita.' }])} className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:text-slate-800 transition">Svuota Chat</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] custom-scrollbar space-y-6">
                      {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.role === 'user' ? 'bg-[#00665E] text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'}`}>
                                      {msg.text}
                                  </div>
                                  {msg.role === 'ai' && i > 0 && (
                                      <div className={`mt-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-0.5 rounded-full border ${msg.contextFound ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                          {msg.contextFound ? <CheckCircle2 size={10}/> : <AlertTriangle size={10}/>}
                                          {msg.contextFound ? 'Dati Trovati in Pinecone' : 'Memoria non trovata'}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      {isTyping && (
                          <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-200 flex gap-1.5"><span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100"></span></div></div>
                      )}
                      <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                      <form onSubmit={handleChatTest} className="relative max-w-4xl mx-auto flex gap-2">
                          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Fai una domanda per testare il bot RAG..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-16 text-sm outline-none focus:border-purple-500 font-bold" />
                          <button type="submit" disabled={!chatInput.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:bg-purple-700 shadow-md">
                              <Send size={18}/>
                          </button>
                      </form>
                  </div>
              </div>
          )}
      </div>
    </main>
  )
}