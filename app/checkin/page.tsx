'use client'

import { useState, useEffect, useRef } from 'react'
import { 
    BrainCircuit, Smile, Frown, BatteryMedium, 
    ShieldCheck, Lock, PlayCircle, Youtube, 
    Send, CheckCircle2, Loader2, User 
} from 'lucide-react'

export default function EmployeeCheckinPage() {
  const [loading, setLoading] = useState(true)
  const [agentConsented, setAgentConsented] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)

  // STATI DELLA CHAT CONTINUA
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const employeeName = "Giulia"

  const [chatHistory, setChatHistory] = useState<any[]>([
      { 
          id: 1, 
          role: 'ai', 
          content: `Ciao ${employeeName}! Ho notato dal sistema che questa settimana hai gestito 45 ticket e molte telefonate, ben oltre la tua media solita. Voglio assicurarmi che tu stia bene. Come ti senti a riguardo? Puoi scrivermi liberamente qui sotto.` 
      }
  ])

  useEffect(() => {
      setTimeout(() => setLoading(false), 1000)
  }, [])

  // Auto-scroll alla fine della chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, isTyping])

  const handleSendMessage = (e?: React.FormEvent, presetText?: string) => {
      if (e) e.preventDefault()
      
      const textToSend = presetText || inputText
      if (!textToSend.trim()) return

      // Conto quanti messaggi ha già mandato l'utente per variare la risposta dell'AI
      const userMessageCount = chatHistory.filter(m => m.role === 'user').length

      // 1. Aggiungo il messaggio dell'utente
      setChatHistory(prev => [...prev, { id: Date.now(), role: 'user', content: textToSend }])
      setInputText('')
      setIsTyping(true)

      // 2. Simulo l'elaborazione dell'AI (Analisi del sentiment + Chat continua)
      setTimeout(() => {
          const lowerText = textToSend.toLowerCase()
          let aiResponse = ""
          let showVideo = false

          if (userMessageCount === 0) {
              // PRIMA RISPOSTA DELL'AI
              if (lowerText.includes('bene') || lowerText.includes('ottimo') || lowerText.includes('caric') || lowerText.includes('tranquill')) {
                  aiResponse = "Ottimo! Sono felice di sentirlo. Continua così e ricordati sempre di fare delle pause. Ho segnalato al sistema che sei in ottima forma! Se hai altro da aggiungere, ti ascolto."
              } else {
                  aiResponse = "Capisco perfettamente. Il contatto continuo col pubblico drena molte energie. Ho segnalato in modo anonimo alla direzione che la tua 'Batteria' è bassa, così potranno bilanciare i carichi.\n\nNel frattempo, ho sbloccato questo contenuto terapeutico per te. Prenditi 5 minuti, è un tuo diritto:"
                  showVideo = true
              }
          } else {
              // RISPOSTE SUCCESSIVE (Conversazione libera)
              aiResponse = "Ti capisco. Sfogarsi fa bene. Se c'è qualcos'altro che ti preoccupa o se hai suggerimenti su come potremmo migliorare i turni, scrivilo pure. Quando hai finito, puoi cliccare sul tasto 'Concludi Check-in' qui sotto."
          }

          setChatHistory(prev => [...prev, { 
              id: Date.now() + 1, 
              role: 'ai', 
              content: aiResponse,
              video: showVideo ? { title: 'De-escalation dello Stress', thumb: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=200' } : null
          }])
          setIsTyping(false)
      }, 2000)
  }

  const finishCheckin = () => {
      setIsSubmitting(true)
      
      // Qui in produzione invieremmo i dati reali a Supabase
      /*
      await supabase.from('team_members').update({ 
          battery: calcolataDallAi,
          aiSummary: riassuntoDellaChat 
      }).eq('id', employeeId)
      */

      setTimeout(() => {
          setIsSubmitting(false)
          setFinished(true)
      }, 1500)
  }

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
              <ShieldCheck size={48} className="text-emerald-400 mb-4 animate-pulse"/>
              <p className="font-bold tracking-widest uppercase text-sm">Connessione Sicura in corso...</p>
          </div>
      )
  }

  if (finished) {
      return (
          <div className="min-h-screen bg-emerald-500 flex flex-col items-center justify-center text-white p-6 text-center">
              <CheckCircle2 size={80} className="mb-6 drop-shadow-lg"/>
              <h1 className="text-3xl font-black mb-2">Dati Inviati al CRM</h1>
              <p className="text-emerald-100 font-medium leading-relaxed max-w-sm">
                  Grazie per aver condiviso come ti senti. Il tuo feedback è stato processato e anonimizzato per la direzione.
              </p>
          </div>
      )
  }

  const userHasReplied = chatHistory.some(msg => msg.role === 'user')

  return (
    <main className="min-h-screen bg-gray-50 font-sans sm:bg-gray-200 sm:flex sm:items-center sm:justify-center">
      
      <div className="w-full sm:max-w-md min-h-screen sm:min-h-[800px] sm:h-[800px] bg-gray-50 sm:rounded-[40px] sm:shadow-2xl overflow-hidden relative flex flex-col border-[8px] sm:border-[12px] border-slate-900">
          
          {/* HEADER MOBILE APP */}
          <div className="bg-gradient-to-br from-slate-900 to-[#00665E] p-6 pb-8 text-center text-white relative shrink-0 shadow-md z-10">
              <h1 className="text-2xl font-black mb-1">Pulse AI Wellness</h1>
              <p className="text-xs text-teal-100 font-medium">Spazio privato per {employeeName}</p>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white text-slate-800 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-gray-100 whitespace-nowrap">
                  <Lock size={12} className="text-emerald-500"/> 100% Anonimo dal Management
              </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50">
              
              {/* STEP 1: CONSENSO GDPR */}
              {!agentConsented ? (
                  <div className="p-6 pt-10 flex flex-col flex-1 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 relative">
                          <BrainCircuit className="absolute -top-3 -right-3 text-blue-200" size={60} opacity={0.5}/>
                          <p className="text-sm text-blue-900 font-medium leading-relaxed relative z-10">
                              L'azienda ha attivato l'AI di IntegraOS per supportarti. Le tue risposte in questa chat <b>non saranno mai lette in chiaro dai tuoi superiori</b>, ma serviranno al sistema per capire come alleggerire il tuo carico di lavoro.
                          </p>
                      </div>
                      
                      <div className="mt-auto space-y-4">
                          <label className="flex items-start gap-3 bg-white p-4 rounded-xl border-2 border-gray-100 cursor-pointer text-left hover:border-[#00665E] transition shadow-sm">
                              <input type="checkbox" className="mt-1 w-5 h-5 accent-[#00665E] cursor-pointer" onChange={(e) => setAgentConsented(e.target.checked)}/>
                              <span className="text-xs text-gray-600 font-bold leading-relaxed">
                                  Accetto l'informativa sulla privacy e do il consenso all'AI per elaborare dati aggregati.
                              </span>
                          </label>

                          <button 
                              disabled={!agentConsented} 
                              onClick={() => setAgentConsented(true)}
                              className="w-full bg-[#00665E] text-white font-black py-4 rounded-2xl hover:bg-[#004d46] transition disabled:opacity-50 shadow-lg flex justify-center items-center gap-2 text-lg"
                          >
                              <Smile size={20}/> Inizia Chat
                          </button>
                      </div>
                  </div>
              ) : (
                  
                  /* STEP 2: CHAT INTERATTIVA REALE CONTINUA */
                  <div className="flex flex-col flex-1 h-full relative">
                      
                      {/* Cronologia Chat */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
                          {chatHistory.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                  
                                  {msg.role === 'ai' && (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 mr-3 shadow-md mt-1">
                                          <BrainCircuit size={16}/>
                                      </div>
                                  )}

                                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#00665E] text-white p-4 rounded-2xl rounded-tr-sm shadow-sm' : 'w-full'}`}>
                                      
                                      {msg.role === 'user' ? (
                                          <p className="text-sm font-medium">{msg.content}</p>
                                      ) : (
                                          <div className="w-full">
                                              <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-line">
                                                  {msg.content}
                                              </div>
                                              
                                              {/* Se l'AI ha allegato un video terapeutico */}
                                              {msg.video && (
                                                  <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden flex flex-col group cursor-pointer hover:shadow-lg transition bg-white ml-2">
                                                      <div className="h-32 bg-gray-800 relative overflow-hidden">
                                                          <img src={msg.video.thumb} alt="Video" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"/>
                                                          <div className="absolute inset-0 flex items-center justify-center">
                                                              <div className="w-12 h-12 bg-white/20 rounded-full backdrop-blur-sm flex items-center justify-center"><PlayCircle size={32} className="text-white drop-shadow-md"/></div>
                                                          </div>
                                                      </div>
                                                      <div className="p-3">
                                                          <p className="font-black text-gray-900 text-xs flex items-center gap-1"><Youtube size={14} className="text-red-500"/> {msg.video.title}</p>
                                                          <p className="text-[10px] text-gray-500 mt-1 font-medium">Respira. Svuota la mente in 3 minuti.</p>
                                                      </div>
                                                  </div>
                                              )}
                                          </div>
                                      )}
                                  </div>

                                  {msg.role === 'user' && (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 ml-3 shadow-sm mt-1 border border-gray-300">
                                          <User size={16}/>
                                      </div>
                                  )}
                              </div>
                          ))}

                          {isTyping && (
                              <div className="flex justify-start animate-in fade-in">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00665E] to-teal-500 flex items-center justify-center text-white shrink-0 mr-3 shadow-md mt-1">
                                      <BrainCircuit size={16} className="animate-pulse"/>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                                  </div>
                              </div>
                          )}
                          <div ref={chatEndRef} />
                      </div>

                      {/* BARRA INFERIORE (Sempre visibile per continuare la chat o per finire) */}
                      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                          
                          {/* Se il dipendente ha risposto almeno una volta, gli do la possibilità di terminare quando vuole */}
                          {userHasReplied && !isTyping && (
                              <button 
                                  onClick={finishCheckin}
                                  disabled={isSubmitting}
                                  className="w-full mb-3 bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-black transition shadow-md flex justify-center items-center gap-2 text-sm"
                              >
                                  {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                                  {isSubmitting ? 'Sincronizzazione...' : 'Concludi Check-in'}
                              </button>
                          )}

                          {/* Suggerimenti Rapidi (Solo al primo messaggio per aiutarlo a rompere il ghiaccio) */}
                          {!userHasReplied && !isTyping && (
                              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                                  <button onClick={() => handleSendMessage(undefined, "Tutto bene, sono molto carico oggi!")} className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-xs font-bold transition">Tutto alla grande! 🚀</button>
                                  <button onClick={() => handleSendMessage(undefined, "Sono un po' stanca per via dei troppi clienti.")} className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-xs font-bold transition">Sono molto stanca 🥱</button>
                              </div>
                          )}

                          {/* Barra di Inserimento Testo CONTINUA */}
                          <form onSubmit={handleSendMessage} className="relative flex items-center">
                              <input 
                                  type="text" 
                                  value={inputText}
                                  onChange={(e) => setInputText(e.target.value)}
                                  placeholder="Scrivi qui..."
                                  disabled={isTyping || isSubmitting}
                                  className="w-full bg-gray-50 border border-gray-200 py-3 pl-4 pr-12 rounded-2xl text-sm outline-none focus:border-[#00665E] focus:bg-white transition disabled:opacity-50"
                              />
                              <button 
                                  type="submit"
                                  disabled={!inputText.trim() || isTyping || isSubmitting}
                                  className="absolute right-2 w-8 h-8 bg-[#00665E] text-white rounded-xl flex items-center justify-center hover:bg-[#004d46] transition disabled:opacity-50"
                              >
                                  <Send size={14} className="ml-0.5"/>
                              </button>
                          </form>
                      </div>

                  </div>
              )}
          </div>
      </div>
    </main>
  )
}