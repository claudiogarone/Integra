'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AIAgentPage() {
  const [user, setUser] = useState<any>(null)
  
  // Dati Configurazione
  const [botName, setBotName] = useState('Assistente Virtuale')
  const [website, setWebsite] = useState('') 
  const [instructions, setInstructions] = useState('')
  const [isTraining, setIsTraining] = useState(false)

  // Chat Playground
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string}[]>([
    { role: 'bot', text: 'Ciao! 👋 Sono il tuo nuovo assistente virtuale. Configura le mie istruzioni a sinistra e testami qui!' }
  ])
  const [inputMsg, setInputMsg] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return; }
      setUser(user)
      
      // Recupera configurazione esistente se c'è (opzionale, se hai una tabella 'bots')
      // ...
    }
    checkUser()
  }, [router, supabase])

  const formatUrl = (url: string) => {
    let clean = url.trim()
    if (!clean) return ''
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean
    }
    return clean
  }

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTraining(true)
    
    const cleanUrl = formatUrl(website)
    setWebsite(cleanUrl)

    // Simulazione salvataggio
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsTraining(false)
    setMessages([{ role: 'bot', text: `Ottimo! Ho imparato le nuove istruzioni per ${cleanUrl || 'il tuo sito'}. Fammi una domanda!` }])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!inputMsg.trim()) return

    const userText = inputMsg
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInputMsg('')
    setIsThinking(true)

    try {
      // In un caso reale, qui chiameresti la tua API /api/chat che usa OpenAI/Claude
      // Per la demo, simuliamo una risposta intelligente
      
      // const response = await fetch('/api/chat', { ... }) 
      // const data = await response.json()
      
      // Simulazione risposta
      setTimeout(() => {
          setMessages(prev => [...prev, { role: 'bot', text: `[Simulazione AI]: Ho capito che mi chiedi "${userText}". Sarei configurato per rispondere in base a: "${instructions.substring(0,30)}..."` }])
          setIsThinking(false)
      }, 1000)

    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Errore di connessione.' }])
      setIsThinking(false)
    }
  }

  // Genera lo snippet di codice per il cliente
  const embedCode = `<script src="https://integra.os/widget.js" data-id="${user?.id}"></script>`

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Agente Virtuale</h1>
          <p className="text-gray-500 text-sm mt-1">Addestra l'IA per rispondere ai clienti 24/7 sul tuo sito.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full pb-10">
        
        {/* COLONNA SX: CONFIGURAZIONE & CODICE */}
        <div className="space-y-6 overflow-y-auto pr-2">
            
            {/* BOX ADDESTRAMENTO */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">🧠 Istruzioni Bot</h2>
                <form onSubmit={handleTrain} className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nome Assistente</label>
                    <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" placeholder="Es. Supporto Clienti" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Sito Web Aziendale</label>
                    <input 
                        type="text" 
                        value={website} 
                        onChange={(e) => setWebsite(e.target.value)} 
                        placeholder="www.tuosito.it" 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E]" 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Prompt di Sistema (Cosa deve sapere?)</label>
                    <textarea 
                        value={instructions} 
                        onChange={(e) => setInstructions(e.target.value)} 
                        placeholder="Esempio: Sei un assistente gentile. Rispondi in modo breve. I nostri orari sono 9-18. Vendiamo scarpe sportive..." 
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-[#00665E] h-40 resize-none text-sm" 
                    />
                </div>
                <button disabled={isTraining} type="submit" className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 rounded-xl mt-2 transition shadow-lg shadow-[#00665E]/20">
                    {isTraining ? 'Addestramento in corso...' : '💾 Salva e Addestra'}
                </button>
                </form>
            </div>

            {/* BOX CODICE EMBED (La feature "Wow") */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white relative group">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2">🔌 Codice per il Sito</h3>
                    <button onClick={() => navigator.clipboard.writeText(embedCode)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition">Copia</button>
                </div>
                <p className="text-xs text-slate-400 mb-3">Incolla questo snippet nel <code>&lt;head&gt;</code> del tuo sito web per far apparire la chat.</p>
                <div className="bg-black/50 p-4 rounded-xl font-mono text-xs text-green-400 break-all border border-white/5">
                    {embedCode}
                </div>
            </div>

        </div>

        {/* COLONNA DX: PLAYGROUND INTERATTIVO */}
        <div className="bg-gray-100 rounded-[2.5rem] border-8 border-white shadow-2xl flex flex-col h-[700px] overflow-hidden relative">
            
            {/* Simulazione Browser Bar */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-center relative">
                <div className="absolute left-4 flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-gray-100 px-4 py-1 rounded-md text-xs text-gray-400 font-medium w-1/2 text-center truncate">
                    {website || 'tuosito.it'}
                </div>
            </div>

            {/* Contenuto Sito Finto */}
            <div className="flex-1 p-8 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                <h2 className="text-4xl font-bold text-gray-300 mb-4">Il Tuo Sito Web</h2>
                <div className="w-full max-w-md space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
                </div>
            </div>

            {/* WIDGET CHAT (Floating) */}
            <div className="absolute bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[500px]">
                
                {/* Header Widget */}
                <div className="bg-[#00665E] p-4 flex items-center gap-3 text-white">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">🤖</div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#00665E] rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">{botName}</h3>
                        <p className="text-[10px] opacity-80">Risponde subito</p>
                    </div>
                </div>

                {/* Area Messaggi */}
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3 h-64">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-[#00665E] text-white rounded-br-none' 
                                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-gray-200 rounded-full px-3 py-2 flex gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Chat */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <input 
                        type="text" 
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                        placeholder="Scrivi un messaggio..." 
                        className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-[#00665E]"
                    />
                    <button type="submit" className="w-8 h-8 bg-[#00665E] text-white rounded-lg flex items-center justify-center hover:bg-[#004d46] transition">➤</button>
                </form>
            </div>

        </div>

      </div>
    </main>
  )
}