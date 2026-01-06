'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AIAgentPage() {
  const [user, setUser] = useState<any>(null)
  
  // Dati Configurazione (Default: www.integra.it)
  const [botName, setBotName] = useState('Assistente Integra')
  const [website, setWebsite] = useState('www.integra.it') 
  const [instructions, setInstructions] = useState('')
  const [isTraining, setIsTraining] = useState(false)

  // Chat Playground
  const [messages, setMessages] = useState<{role: 'bot'|'user', text: string}[]>([
    { role: 'bot', text: 'Ciao! Sono il tuo assistente. Configura le istruzioni a sinistra e provami qui!' }
  ])
  const [inputMsg, setInputMsg] = useState('')
  const [isThinking, setIsThinking] = useState(false) // Stato "Sto pensando..."

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login'); else setUser(user)
    }
    checkUser()
  }, [router, supabase])

  // Funzione per sistemare l'URL (aggiunge https://)
  const formatUrl = (url: string) => {
    let clean = url.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean
    }
    return clean
  }

  // "Addestramento" (Salva le impostazioni per la sessione corrente)
  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTraining(true)
    
    // Formatta l'URL automaticamente
    const cleanUrl = formatUrl(website)
    setWebsite(cleanUrl) // Aggiorna l'input visivo

    await new Promise(resolve => setTimeout(resolve, 1000)) // Piccola pausa estetica
    
    setIsTraining(false)
    alert(`✅ Bot Configurato!\nSito: ${cleanUrl}\nPronto a rispondere.`)
    
    setMessages([{ role: 'bot', text: `Ciao! Sono ${botName}. Ho memorizzato le istruzioni per ${cleanUrl}. Mettimi alla prova!` }])
  }

  // Invio Messaggio (Chat Vera)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!inputMsg.trim()) return

    const userText = inputMsg
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInputMsg('')
    setIsThinking(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          instructions: instructions,
          website: website, // Già pulito (senza formatUrl qui se lo usi nello state)
          userId: user.id // <--- FONDAMENTALE: Mandiamo l'ID per scalare i crediti
        })
      })

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
      } else {
        throw new Error('Nessuna risposta dall\'AI')
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Errore di connessione al cervello AI. Controlla la tua API Key.' }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-auto">
        <h1 className="text-3xl font-bold mb-2">Configura Agente Virtuale</h1>
        <p className="text-gray-400 mb-8">Collega il cervello AI al tuo sito.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* COLONNA SX: IMPOSTAZIONI */}
          <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl h-fit">
            <h2 className="text-xl font-bold text-white mb-6">🧠 Istruzioni Bot</h2>
            <form onSubmit={handleTrain} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Assistente</label>
                <input type="text" value={botName} onChange={(e) => setBotName(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sito Web Aziendale (URL)</label>
                <input 
                  type="text" // Cambiato da url a text per permettere di scrivere senza https
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="www.integra.it" 
                  className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Aggiungiamo noi https:// se manca.</p>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Cosa deve sapere? (Prompt)</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Esempio: Sei gentile e professionale. Vendiamo software gestionale. I prezzi partono da 50€/mese..." className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none h-40 resize-none" />
              </div>
              <button disabled={isTraining} type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4">
                {isTraining ? 'Salvataggio...' : '💾 Salva Configurazione'}
              </button>
            </form>
          </div>

          {/* COLONNA DX: PLAYGROUND INTERATTIVO */}
          <div className="bg-white rounded-2xl border border-gray-800 shadow-2xl flex flex-col h-[600px] overflow-hidden">
            {/* Header Chat */}
            <div className="bg-yellow-500 p-4 flex items-center gap-3 text-black">
                <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-bold text-lg">🤖</div>
                <div>
                    <h3 className="font-bold">{botName}</h3>
                    <p className="text-xs opacity-70">Powered by OpenAI</p>
                </div>
            </div>

            {/* Area Messaggi */}
            <div className="flex-1 bg-gray-100 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            msg.role === 'user' 
                            ? 'bg-yellow-500 text-black rounded-tr-none' 
                            : 'bg-white text-gray-800 shadow rounded-tl-none'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isThinking && <div className="text-xs text-gray-400 ml-4">Sta scrivendo...</div>}
            </div>

            {/* Input Chat */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input 
                    type="text" 
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Fai una domanda vera..." 
                    className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button type="submit" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800">➤</button>
            </form>
          </div>

        </div>
      </main>
    </div>
  )
}