'use client'

import { useState } from 'react'
import { 
    PlayCircle, Search, BookOpen, Award, Zap, 
    Users, TrendingUp, Leaf, Palette, Landmark, Bot, ShieldCheck, X, FileText, Lock, CheckCircle, Gift,
    Sparkles, Workflow, HeartPulse, UserCheck // <-- Aggiunta icona UserCheck per Performance
} from 'lucide-react'

export default function TutorialPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('Tutti')
  
  // STATI MODALI
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showSecretGuide, setShowSecretGuide] = useState(false)

  // MAPPATURA DI TUTTI I MODULI REALI DI INTEGRA OS (Con video test MP4)
  const tutorials = [
    { id: 1, title: 'Primi Passi & Setup Aziendale', category: 'Inizia da Qui', duration: '05:30', icon: <ShieldCheck/>, desc: 'Come configurare orari, sedi e logo nel Nexus Hub.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 2, title: 'Gestione Pipeline e CRM', category: 'Vendite & CRM', duration: '08:45', icon: <Users/>, desc: 'Importare contatti e spostare le trattative nel CRM visivo.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 3, title: 'Generare Preventivi (Smart Quote)', category: 'Vendite & CRM', duration: '04:15', icon: <Landmark/>, desc: 'Come usare il preventivatore rapido dall\'Agent Portal.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 4, title: 'Terminale Punti & Fidelity Card', category: 'Vendite & CRM', duration: '06:00', icon: <Award/>, desc: 'Accreditare punti in cassa tramite QR code o telefono.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    
    // --> NUOVO TUTORIAL PERFORMANCE & HR INSERITO QUI <--
    { id: 13, title: 'Valutazione Performance & HR AI', category: 'Team & HR', duration: '11:45', icon: <UserCheck/>, desc: 'Usa l\'AI per analizzare i venditori, rilevare il burnout e creare piani formativi.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },

    { id: 5, title: 'L\'Agente AI Omnicanale', category: 'Intelligenza Artificiale', duration: '12:20', icon: <Bot/>, desc: 'Addestrare il bot con i PDF per WhatsApp e Sito Web.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 6, title: 'Workflow e Zap Automations', category: 'Intelligenza Artificiale', duration: '15:00', icon: <Zap/>, desc: 'Creare automazioni visive stile Zapier senza codice.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 7, title: 'Creare Grafiche nel Creative Studio', category: 'Marketing & Design', duration: '09:10', icon: <Palette/>, desc: 'Generare Packaging 3D e loghi vettoriali con l\'AI.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 8, title: 'Neuro-Marketing & Heatmaps', category: 'Marketing & Design', duration: '07:30', icon: <TrendingUp/>, desc: 'Analizzare volantini simulando lo sguardo umano.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 9, title: 'Radar Media Locali', category: 'Marketing & Design', duration: '05:45', icon: <BookOpen/>, desc: 'Trovare radio e TV locali per allocare il budget.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 10, title: 'AI CFO & ERP Finanziario', category: 'Amministrazione & ESG', duration: '10:05', icon: <Landmark/>, desc: 'Monitorare ricavi, costi fissi ed emettere fatture SdI.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 11, title: 'Energy Monitor e Report CO2', category: 'Amministrazione & ESG', duration: '08:50', icon: <Leaf/>, desc: 'Analizzare bollette via OCR per abbattere gli sprechi.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 12, title: 'App Nurturing (Regali AI)', category: 'Vendite & CRM', duration: '06:15', icon: <Gift/>, desc: 'Programmare invii WhatsApp con consigli per i clienti.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ]

  // AGGIUNTA CATEGORIA "Team & HR" AI FILTRI
  const categories = ['Tutti', 'Inizia da Qui', 'Vendite & CRM', 'Team & HR', 'Marketing & Design', 'Intelligenza Artificiale', 'Amministrazione & ESG']

  const filteredTutorials = tutorials.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = activeCategory === 'Tutti' || t.category === activeCategory
      return matchSearch && matchCategory
  })

  const openSupportTicket = () => {
      setShowSupportModal(true)
      setTimeout(() => setShowSupportModal(false), 3000)
  }

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20 relative">
      
      {/* HEADER ACADEMY E RICERCA */}
      <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-xl mb-8 relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                      <BookOpen className="text-blue-400" size={36}/> IntegraOS Academy
                  </h1>
                  <p className="text-slate-400 text-lg">Padroneggia ogni singolo modulo del tuo nuovo gestionale.</p>
              </div>
              
              <div className="flex flex-col gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                      <input type="text" placeholder="Cerca tutorial..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition shadow-inner" />
                  </div>
                  
                  <button onClick={() => setShowSecretGuide(true)} className="bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 transition px-4 py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg">
                      <Lock size={16}/> Leggi Manuale Operativo Completo
                  </button>
              </div>
          </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4 sticky top-0 bg-[#F8FAFC] z-20 pt-2">
          {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold transition shadow-sm border ${activeCategory === cat ? 'bg-[#00665E] text-white border-[#00665E]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {cat}
              </button>
          ))}
      </div>

      {filteredTutorials.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-20"/>
              <p className="font-bold text-lg text-gray-600">Nessun video trovato.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
              {filteredTutorials.map(tutorial => (
                  <div key={tutorial.id} onClick={() => setActiveVideoUrl(tutorial.videoUrl)} className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition group cursor-pointer flex flex-col">
                      <div className="aspect-video bg-slate-100 relative flex items-center justify-center border-b border-gray-100 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-300 opacity-50 group-hover:scale-105 transition duration-500"></div>
                          <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#00665E] shadow-lg group-hover:bg-[#00665E] group-hover:text-white transition z-10">
                              <PlayCircle size={32}/>
                          </div>
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-md">
                              {tutorial.duration}
                          </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                              <span className="text-[#00665E] bg-[#00665E]/10 p-1.5 rounded-lg">{tutorial.icon}</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tutorial.category}</span>
                          </div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight mb-2 group-hover:text-[#00665E] transition">{tutorial.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{tutorial.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      )}

      <div className="mt-16 bg-blue-50 border border-blue-100 rounded-3xl p-8 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Users size={32}/></div>
          <h3 className="text-xl font-black text-blue-900 mb-2">Non trovi quello che cerchi?</h3>
          <p className="text-blue-700 text-sm mb-6">Il tuo consulente dedicato IntegraOS è a disposizione per sessioni di training 1-to-1.</p>
          <button onClick={openSupportTicket} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition">
              Richiedi Supporto Live
          </button>
      </div>

      {activeVideoUrl && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setActiveVideoUrl(null)}>
              <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-gray-800" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setActiveVideoUrl(null)} className="absolute top-4 right-4 text-white hover:text-rose-400 z-10 bg-black/50 p-2 rounded-full backdrop-blur-sm transition"><X size={24}/></button>
                  <video src={activeVideoUrl} controls autoPlay className="w-full h-full object-contain">
                      Il tuo browser non supporta la riproduzione video.
                  </video>
              </div>
          </div>
      )}

      {showSupportModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32}/></div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Richiesta Inviata</h3>
                  <p className="text-gray-500">Un nostro consulente ti contatterà entro 15 minuti sulla chat aziendale.</p>
              </div>
          </div>
      )}

      {/* 🔐 MODALE MANUALE SEGRETO COMPLETO ANTI-COPIA / ANTI-SCREENSHOT 🔐 */}
      {showSecretGuide && (
          <div className="fixed inset-0 bg-slate-900 z-[100] overflow-y-auto" onClick={() => setShowSecretGuide(false)}>
              <button onClick={() => setShowSecretGuide(false)} className="fixed top-6 right-6 text-white hover:text-rose-400 z-50 bg-black/50 p-3 rounded-full"><X size={24}/></button>
              
              <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden flex flex-wrap opacity-5 justify-center items-center">
                  {Array.from({ length: 150 }).map((_, i) => (
                      <span key={i} className="text-white text-2xl font-black p-4 rotate-[-30deg] whitespace-nowrap">
                          CONFIDENZIALE - PROPRIETÀ INTEGRA OS
                      </span>
                  ))}
              </div>

              <div 
                  className="max-w-4xl mx-auto py-20 px-8 text-slate-300 font-sans leading-relaxed select-none relative z-10"
                  onContextMenu={(e) => { e.preventDefault(); alert("⛔ AZIONE BLOCCATA: Documento Protetto."); }}
                  onClick={e => e.stopPropagation()}
              >
                  <div className="flex items-center gap-4 mb-10 text-amber-500 border-b border-slate-700 pb-6">
                      <Lock size={40}/>
                      <div>
                          <h1 className="text-4xl font-black text-white">Manuale Operativo di Sistema</h1>
                          <p className="text-sm font-bold tracking-widest uppercase mt-1">Guida completa ai moduli di IntegraOS</p>
                      </div>
                  </div>

                  <div className="bg-rose-900/20 border border-rose-900/50 p-5 rounded-2xl mb-10 text-sm italic">
                      ⚠️ La copia, la riproduzione o la distribuzione non autorizzata di questo testo è severamente vietata. Il sistema di tracciamento IP e la filigrana dinamica sono attualmente attivi.
                  </div>

                  <div className="space-y-12">
                      
                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Users className="text-blue-400"/> 1. Modulo CRM e CDP (Customer Data Platform)</h2>
                          <p className="mb-4">Il cuore pulsante del sistema. La CDP unifica i dati provenienti dal sito web, dai social e dai negozi fisici. Ogni interazione del cliente viene registrata nella scheda "God-Mode".</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><b>Pipeline Visiva:</b> Trascina i contatti nelle varie fasi (Nuovo, Preventivo, Vinto).</li>
                              <li><b>Incognito Mode:</b> Traccia gli utenti anonimi sul tuo sito web e associagli le azioni una volta che si registrano (retroattività del dato).</li>
                              <li><b>Fidelity Card:</b> Assegna punti tramite codice QR o Terminale Punti fisico collegato all'app "Agent Portal".</li>
                          </ul>
                      </section>

                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="text-purple-400"/> 2. Launchpad & Marketing</h2>
                          <p className="mb-4">Sostituisci l'agenzia pubblicitaria con il Creative Studio AI integrato.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><b>Generazione Volantini & QR:</b> Crea grafiche pronte per la stampa e genera "Smart Links" per far iscrivere i clienti dal loro telefono.</li>
                              <li><b>Neuro-Marketing (Heatmaps):</b> Carica un PDF e l'AI genererà una mappa di calore mostrando dove cadrà l'occhio del cliente.</li>
                              <li><b>Radar Media Locali:</b> Inserisci un budget e l'AI ti consiglierà su quali Radio, TV o Giornali Locali investire i tuoi soldi per il massimo ROI.</li>
                          </ul>
                      </section>

                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Bot className="text-emerald-400"/> 3. Intelligenza Artificiale (Agente & Voice)</h2>
                          <p className="mb-4">I dipendenti virtuali che lavorano 24/7 per la tua azienda senza ferie o malattie.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><b>Voice Agent:</b> Un centralino AI che risponde al telefono, capisce l'intento del cliente e fissa appuntamenti leggendo l'agenda.</li>
                              <li><b>Agente Omnicanale:</b> Collegalo a WhatsApp, Instagram o al Sito. Carica i PDF del tuo listino prezzi per addestrarlo in 1 minuto.</li>
                              <li><b>Nurturing Engine:</b> Scegli il tuo settore (es. Ristorazione) e l'AI genererà un mese di consigli di valore da mandare via WhatsApp ai clienti per fidelizzarli.</li>
                          </ul>
                      </section>

                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Workflow className="text-amber-400"/> 4. Zap Automations</h2>
                          <p className="mb-4">Il motore logico che unisce le azioni. Un'interfaccia a nodi (Drag & Drop) dove puoi dire al sistema:</p>
                          
                          <div className="bg-slate-800 p-4 rounded-xl text-sm font-mono mt-2 mb-4">
                              {"SE [Cliente abbandona carrello] -> ATTENDI [2 ore] -> INVIA [SMS Sconto 10%]"}
                          </div>
                          
                          <p>Non serve saper programmare. Tutto è visivo e immediato.</p>
                      </section>

                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Leaf className="text-green-500"/> 5. Finance ERP & Energy ESG</h2>
                          <p className="mb-4">L'amministrazione aziendale proiettata nel futuro.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><b>CFO AI:</b> Monitoraggio dei costi fissi vs ricavi con l'AI che suggerisce dove tagliare le spese.</li>
                              <li><b>Fatturazione:</b> Emissione di preventivi, DDT e fatture con salvataggio diretto nel registro Cloud.</li>
                              <li><b>Energy ESG:</b> Carica il PDF della tua bolletta di luce o gas. L'OCR AI la legge e ti indica le fasce orarie in cui stai sprecando soldi, generando un piano d'azione ecologico.</li>
                          </ul>
                      </section>

                      <section>
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><HeartPulse className="text-rose-400"/> 6. Team, Performance & HR Coaching</h2>
                          <p className="mb-4">La gestione delle risorse umane (HR) e lo sviluppo dei dipendenti.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><b>Performance & Valutazioni:</b> Incrocia i dati di vendita con l'uso del CRM. L'AI genera una valutazione oggettiva e ti suggerisce un piano correttivo (es. assegnare un corso o sbloccare uno strumento).</li>
                              <li><b>Pulse Check-in:</b> Un misuratore del morale aziendale. I dipendenti segnano come si sentono a fine turno per prevenire il Burnout.</li>
                              <li><b>Agent Portal (Scrivania):</b> L'area riservata dell'agente dove visualizza lo storico dei suoi voti, riceve consigli dall'AI Coach e usa strumenti come il Preventivatore Veloce e la Cassa Punti.</li>
                          </ul>
                      </section>
                  </div>
                  
                  <div className="mt-20 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl text-center text-sm">
                      <p className="font-bold text-slate-400">Fine del Documento Operativo</p>
                      <p className="text-slate-500 mt-2">Usa il pulsante in alto a destra per chiudere il manuale.</p>
                  </div>
              </div>
          </div>
      )}

    </main>
  )
}