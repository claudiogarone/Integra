'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { 
  ArrowRight, CheckCircle, Shield, Zap, BarChart3, 
  PlayCircle, Bot, Workflow, HeartPulse, Palette, 
  Building, UserCheck, Smartphone, Lock, Mail, GraduationCap,
  Database, CreditCard, MessageSquare, Radar, EyeOff, Handshake,
  Star, Quote, TrendingUp, Clock, Landmark,
  Sparkles, Cookie, X
} from 'lucide-react'

export default function Home() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  
  // --- STATI PER TRACKING E PRIVACY ---
  const [showCookieBanner, setShowCookieBanner] = useState(false)
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  
  const [leadEmail, setLeadEmail] = useState('')
  const [leadConsent, setLeadConsent] = useState(false)

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')

  // --- STATI AUDIO ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  // CONTROLLO AL CARICAMENTO DELLA PAGINA
  useEffect(() => {
      // 1. Controlla se ha già accettato i cookie
      const cookieConsent = localStorage.getItem('integraos_cookie_consent')
      if (!cookieConsent) {
          setShowCookieBanner(true)
      } else {
          // Se aveva già accettato in passato, facciamo partire l'audio in background se non è partito
          playBackgroundAudio()
      }

      // 2. Controlla se abbiamo già la sua email, altrimenti mostra il Pop-up dopo 3 secondi
      const capturedEmail = localStorage.getItem('integraos_lead_email')
      if (!capturedEmail) {
          const timer = setTimeout(() => {
              setShowLeadModal(true)
          }, 3000)
          return () => clearTimeout(timer)
      } else {
          console.log(`Tracking: L'utente ${capturedEmail} sta visitando la Home Page.`)
      }
  }, [])

  // FUNZIONE PER FAR PARTIRE L'AUDIO
  const playBackgroundAudio = () => {
      const audio = document.getElementById('bgMusic') as HTMLAudioElement;
      if (audio) {
          audio.volume = 0.2; // Volume elegante al 20%
          audio.play().then(() => {
              setIsPlayingAudio(true);
          }).catch(e => console.log("Autoplay bloccato dal browser in attesa di interazione", e));
      }
  }

  // GESTIONE ACCETTAZIONE COOKIE
  const handleAcceptCookies = (type: 'all' | 'essential') => {
      localStorage.setItem('integraos_cookie_consent', type)
      setShowCookieBanner(false)
      // LA MAGIA: Fa partire la musica appena l'utente clicca su accetta
      playBackgroundAudio()
  }

  // GESTIONE INVIO EMAIL LEAD (Connessa al Backend Reale)
  const handleLeadSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!leadConsent) {
          alert("Devi accettare l'informativa sulla privacy per procedere.")
          return
      }

      try {
          // 1. Mostriamo caricamento visivo
          const btn = document.getElementById('leadSubmitBtn') as HTMLButtonElement;
          if(btn) btn.innerText = "Salvataggio in corso...";

          // 2. Chiamiamo la nostra vera API Backend
          const res = await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: leadEmail, consent_given: leadConsent })
          })
          
          if (!res.ok) throw new Error("Errore durante il salvataggio")

          // 3. Salviamo in locale per non mostrare più il popup a questo utente
          localStorage.setItem('integraos_lead_email', leadEmail)
          console.log("Nuovo Lead inviato a Supabase:", leadEmail)
          
          // 4. Chiudiamo il modale
          setShowLeadModal(false)

      } catch (error) {
          console.error(error)
          alert("Errore di connessione al server. Riprova più tardi.")
          const btn = document.getElementById('leadSubmitBtn') as HTMLButtonElement;
          if(btn) btn.innerText = "Accedi ai Contenuti";
      }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const subject = encodeURIComponent(`Richiesta Consulenza IntegraOS - ${contactName}`);
      const body = encodeURIComponent(`Nome Azienda: ${contactName}\nEmail: ${contactEmail}\n\nRichiesta:\n${contactMessage}`);
      window.location.href = `mailto:claudiogarone@gmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white text-slate-800 overflow-x-hidden relative">
      
      {/* ======================================================= */}
      {/* LETTORE AUDIO E PULSANTE MUTE                             */}
      {/* ======================================================= */}
      <audio id="bgMusic" src="/integraos-theme.mp3" loop preload="auto" className="hidden"></audio>

      {isPlayingAudio && (
          <button 
              onClick={() => {
                  const audio = document.getElementById('bgMusic') as HTMLAudioElement;
                  if (audio.paused) { audio.play(); setIsPlayingAudio(true); } 
                  else { audio.pause(); setIsPlayingAudio(false); }
              }}
              className="fixed bottom-6 left-6 z-[90] bg-white/80 backdrop-blur-md border border-slate-200 p-3 rounded-full text-[#00665E] hover:text-[#004d47] transition shadow-lg animate-in fade-in"
              title="Musica di Sottofondo"
          >
              <div className="flex gap-1 items-end h-4">
                  <span className="w-1 bg-[#00665E] rounded-full animate-[bounce_1s_infinite]"></span>
                  <span className="w-1 bg-[#00665E] rounded-full animate-[bounce_1.2s_infinite]"></span>
                  <span className="w-1 bg-[#00665E] rounded-full animate-[bounce_0.8s_infinite]"></span>
              </div>
          </button>
      )}

      {/* ======================================================= */}
      {/* MODALE ACQUISIZIONE EMAIL (LEAD GENERATION)             */}
      {/* ======================================================= */}
      {showLeadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden transform scale-100 animate-in zoom-in-95">
                  <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition z-10">
                      <X size={20}/>
                  </button>
                  
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#00665E]"></div>
                  
                  <div className="p-8 md:p-10 text-center">
                      <div className="w-16 h-16 bg-[#00665E]/10 text-[#00665E] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#00665E]/20">
                          <Building size={32}/>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">Scopri l'Ecosistema IntegraOS</h2>
                      <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                          Inserisci la tua email aziendale. Ti riconosceremo durante la navigazione per mostrarti contenuti personalizzati e ti sbloccheremo l'accesso alla demo completa.
                      </p>

                      <form onSubmit={handleLeadSubmit} className="space-y-4">
                          <input 
                              type="email" 
                              required 
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="La tua email lavorativa (es. info@azienda.it)" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] text-center transition"
                          />
                          <div className="flex items-start gap-3 text-left">
                              <input 
                                  type="checkbox" 
                                  id="privacy" 
                                  checked={leadConsent}
                                  onChange={(e) => setLeadConsent(e.target.checked)}
                                  className="mt-1 shrink-0 accent-[#00665E] w-4 h-4 cursor-pointer" 
                              />
                              <label htmlFor="privacy" className="text-[10px] text-slate-500 cursor-pointer">
                                  Acconsento al trattamento dei dati personali e al tracciamento della mia navigazione sull'ecosistema IntegraOS nel rispetto del GDPR.{' '}
                                  <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#00665E] underline font-bold hover:text-[#004d47]">
                                      Leggi la Privacy Policy
                                  </button>.
                              </label>
                          </div>
                          <button id="leadSubmitBtn" type="submit" className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl shadow-lg shadow-[#00665E]/20 hover:bg-[#004d47] transition transform">
                              Accedi ai Contenuti
                          </button>
                      </form>
                      <button onClick={() => setShowLeadModal(false)} className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 transition underline">
                          No grazie, voglio solo esplorare il sito in anonimo
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ======================================================= */}
      {/* MODALE TESTO LEGALE PRIVACY (GDPR)                      */}
      {/* ======================================================= */}
      {showPrivacyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Shield size={20} className="text-[#00665E]"/> Informativa sulla Privacy (GDPR)
                      </h2>
                      <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-2 rounded-full shadow-sm">
                          <X size={20}/>
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 custom-scrollbar bg-white">
                      <p><strong>1. Titolare del Trattamento:</strong> Il Titolare del trattamento dei dati è IntegraOS (Sviluppato da Concept ADV & Enestar).</p>
                      <p><strong>2. Finalità del Trattamento:</strong> I dati raccolti (es. indirizzo email) verranno utilizzati per: <br/>a) fornire l'accesso ai contenuti e ai servizi richiesti; <br/>b) inviare comunicazioni commerciali (ove esplicitamente acconsentito); <br/>c) monitorare e tracciare la navigazione all'interno dell'intero ecosistema IntegraOS per fini statistici e di profilazione.</p>
                      <p><strong>3. Base Giuridica:</strong> Il trattamento è basato sul consenso esplicito dell'utente (Art. 6 par. 1 lett. a del Regolamento UE 2016/679 - GDPR).</p>
                      <p><strong>4. Conservazione dei Dati:</strong> I dati saranno conservati in server protetti all'interno dell'Unione Europea, fino a revoca del consenso.</p>
                      <p><strong>5. Diritti dell'Interessato:</strong> Ai sensi degli artt. 15-22 del GDPR, in qualità di interessato hai il diritto di accedere ai tuoi dati personali, richiederne la rettifica o la cancellazione contattandoci all'indirizzo email: privacy@integraos.it.</p>
                  </div>
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={() => setShowPrivacyModal(false)} className="bg-[#00665E] hover:bg-[#004d47] text-white font-bold py-3 px-8 rounded-xl transition shadow-md">
                          Ho compreso, Chiudi
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* BACKGROUND EFFECTS (Light Theme) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00665E] rounded-full blur-[120px] opacity-[0.05]"></div>
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-400 rounded-full blur-[100px] opacity-[0.05]"></div>
      </div>

      {/* --- NAVBAR PREMIUM --- */}
      <nav className="fixed w-full z-40 top-0 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                {/* Nuovo Logo Inserito */}
                <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-8 md:h-10 object-contain" />
            </div>
            
            <div className="hidden lg:flex gap-8 text-sm font-bold text-slate-500">
                <a href="#impatto" className="hover:text-[#00665E] transition">Vantaggi</a>
                <a href="#ecosistema" className="hover:text-[#00665E] transition">I Moduli</a>
                <a href="#recensioni" className="hover:text-[#00665E] transition">Recensioni</a>
                <a href="#academy-esterna" className="hover:text-amber-600 transition">Corsi</a>
                <a href="#piani" className="hover:text-[#00665E] transition">Prezzi</a>
            </div>

            <div className="flex gap-3 items-center">
                <div className="hidden lg:flex items-center gap-4 mr-4 border-r border-slate-200 pr-4">
                    <Link href="/agent-auth" className="text-xs font-bold text-slate-500 hover:text-[#00665E] flex items-center gap-1.5 transition">
                        <UserCheck size={16}/> Area Agenti
                    </Link>
                    <Link href="/wallet" className="text-xs font-bold text-slate-500 hover:text-amber-600 flex items-center gap-1.5 transition">
                        <Smartphone size={16}/> Portale Clienti
                    </Link>
                </div>
                <Link href="/login" className="bg-[#00665E] hover:bg-[#004d47] shadow-md shadow-[#00665E]/20 text-white px-6 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm">
                    <Building size={16}/> Login Azienda
                </Link>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-44 pb-20 max-w-5xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="bg-emerald-50 text-[#00665E] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200 mb-6 inline-flex items-center gap-2 shadow-sm">
                <Sparkles size={14}/> Il primo Ecosistema AI per il Business
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                Gestisci tutto.<br/>
                <span className="text-[#00665E]">Senza fare nulla.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
                Non il solito gestionale. IntegraOS è un'Intelligenza Artificiale che automatizza le vendite, analizza il bilancio, gestisce le HR e fidelizza i clienti. Tutto da un'unica Control Room.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register" className="w-full sm:w-auto bg-[#00665E] text-white px-8 py-4 rounded-full font-black text-lg shadow-xl shadow-[#00665E]/20 hover:scale-105 transition transform flex items-center justify-center gap-2">
                    Crea Azienda Ora <ArrowRight size={20}/>
                </Link>
                <a href="#demo" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 shadow-sm px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2">
                    <PlayCircle size={20} className="text-[#00665E]"/> Guarda la Demo
                </a>
            </div>
        </div>

        {/* MOCKUP VIDEO DIMOSTRATIVO */}
        <div id="demo" className="mt-20 w-full max-w-5xl relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent z-20 h-full pointer-events-none"></div>
            {/* Struttura finestra tipo Mac */}
            <div className="relative rounded-t-2xl bg-white border border-slate-200 shadow-2xl p-2 pt-4 overflow-hidden">
                <div className="flex gap-2 mb-3 px-4 items-center">
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                    <div className="ml-4 bg-slate-100 flex-1 rounded-md h-5 border border-slate-200 flex items-center px-3">
                        <Lock size={10} className="text-slate-400 mr-2"/>
                        <span className="text-[10px] text-slate-400 font-medium">app.integraos.it/dashboard</span>
                    </div>
                </div>
                
                <div className="aspect-video bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden group">
                    {!isVideoPlaying ? (
                        <>
                            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-700"/>
                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
                                <div className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#00665E] shadow-xl border border-slate-200 group-hover:bg-[#00665E] group-hover:text-white transition duration-300 transform group-hover:scale-110">
                                    <PlayCircle size={44} className="ml-1"/>
                                </div>
                            </div>
                        </>
                    ) : (
                        <video controls autoPlay className="w-full h-full object-cover rounded-xl relative z-30" src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4">
                            Il tuo browser non supporta il tag video.
                        </video>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- PARTNERS --- */}
      <div className="border-y border-slate-200 bg-white relative z-10 py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Sviluppato e supportato dai partner tecnologici</p>
              <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center opacity-60 grayscale hover:grayscale-0 transition duration-500">
                  <div className="flex items-center gap-3">
                      <img src="/logo-concept.jpeg" alt="Concept ADV" className="h-10 md:h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <span className="hidden text-2xl font-black text-slate-800">Concept ADV</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <img src="/logo-enestar.jpeg" alt="Enestar" className="h-10 md:h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <span className="hidden text-2xl font-black text-slate-800">Enestar</span>
                  </div>
              </div>
          </div>
      </div>

      {/* --- IMPATTO E BENEFICI REALI (ROI) --- */}
      <div id="impatto" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Taglia i costi. Moltiplica i clienti.</h2>
                  <p className="text-slate-500 text-lg max-w-2xl mx-auto">Non è solo un software. È un'infrastruttura progettata per sostituire interi reparti inefficaci, risparmiando risorse fisiche ed umane.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition duration-300">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={28}/></div>
                      <h3 className="text-xl font-black text-slate-900 mb-3">Ricerca & Fidelizzazione</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">Usa la <span className="text-[#00665E] font-bold">Modalità Incognito</span> per tracciare i visitatori anonimi. Confeziona un'offerta su misura col <span className="text-[#00665E] font-bold">Launchpad Social</span> e tieni i clienti incollati con il modulo <span className="text-[#00665E] font-bold">Fidelity Card</span> nativo.</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-lg transition duration-300">
                      <div className="absolute top-0 right-0 p-6 opacity-5"><Clock size={100} className="text-slate-400"/></div>
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10"><Bot size={28}/></div>
                      <h3 className="text-xl font-black text-slate-900 mb-3 relative z-10">Risparmio di Risorse Umane</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4 relative z-10">Il <span className="text-[#00665E] font-bold">Centralino AI Voice</span> risponde ai clienti 24/7. Le <span className="text-[#00665E] font-bold">Zap Automations</span> fanno il lavoro di 3 segretarie. Il tuo team umano interviene solo per chiudere le trattative ad alto budget.</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-lg transition duration-300">
                      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Zap size={28}/></div>
                      <h3 className="text-xl font-black text-slate-900 mb-3">Risparmio Fisico & Strutturale</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">Non affittare nuovi uffici. Il modulo <span className="text-[#00665E] font-bold">Energy Monitor</span> analizza le tue bollette e taglia gli sprechi di luce e gas. Il <span className="text-[#00665E] font-bold">CFO AI</span> individua gli abbonamenti inutili e li recide per te.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- L'ECOSISTEMA ESTESO (Tutti i Tool) --- */}
      <div id="ecosistema" className="py-24 relative z-10 bg-white border-y border-slate-200">
          <div className="text-center mb-16 max-w-7xl mx-auto px-6">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Tutti i Tool di cui hai bisogno.</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">Nessuna integrazione di terze parti necessaria. Tutto nativo. Tutto sincronizzato.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-6">
              <ToolCard icon={<MessageSquare className="text-sky-500"/>} bgIcon="bg-sky-50" title="Inbox Unificata" desc="Tutte le chat in un solo posto." />
              <ToolCard icon={<Database className="text-blue-600"/>} bgIcon="bg-blue-50" title="CDP & Data Studio" desc="Analisi profonda dei clienti." />
              <ToolCard icon={<EyeOff className="text-indigo-500"/>} bgIcon="bg-indigo-50" title="Incognito Mode" desc="Traccia lead senza cookie." />
              <ToolCard icon={<CreditCard className="text-orange-500"/>} bgIcon="bg-orange-50" title="Fidelity & Wallet" desc="Raccolta punti e premi VIP." />
              
              <ToolCard icon={<Bot className="text-emerald-600"/>} bgIcon="bg-emerald-50" title="Agenti AI & Voice" desc="Centralini 24/7 intelligenti." />
              <ToolCard icon={<Workflow className="text-amber-500"/>} bgIcon="bg-amber-50" title="Zap Automations" desc="Il motore logico Drag&Drop." />
              <ToolCard icon={<Palette className="text-purple-500"/>} bgIcon="bg-purple-50" title="Creative Studio" desc="Design e volantini automatizzati." />
              <ToolCard icon={<Radar className="text-pink-500"/>} bgIcon="bg-pink-50" title="Radar Media Locali" desc="Ottimizza il budget Pubblicitario." />
              
              <ToolCard icon={<Handshake className="text-teal-500"/>} bgIcon="bg-teal-50" title="Network Affiliazioni" desc="Cross-promo con altre aziende." />
              <ToolCard icon={<HeartPulse className="text-rose-500"/>} bgIcon="bg-rose-50" title="Pulse HR & Valutazioni" desc="Analisi e performance venditori." />
              <ToolCard icon={<Landmark className="text-yellow-600"/>} bgIcon="bg-yellow-50" title="Finance ERP" desc="Fatturazione ed emissione SdI." />
              <ToolCard icon={<Zap className="text-green-600"/>} bgIcon="bg-green-50" title="Energy Monitor ESG" desc="Taglio costi fissi e bollette." />
          </div>
      </div>

      {/* --- RECENSIONI E SOCIAL PROOF --- */}
      <div id="recensioni" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">Chi l'ha provato non torna indietro.</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl relative shadow-sm">
                      <Quote className="text-slate-100 absolute top-6 right-6" size={60}/>
                      <div className="flex gap-1 text-amber-400 mb-4 relative z-10"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-600 italic mb-6 relative z-10 font-medium">"Prima usavamo Hubspot per il CRM, Mailchimp per le email e un'agenzia esterna per i volantini. Spendevamo circa 1.200€ al mese solo in software. Ora facciamo il triplo delle azioni, tutto in automatico, dal piano Enterprise."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">M</div>
                          <div><p className="font-bold text-slate-900">Marco Rivolta</p><p className="text-xs text-slate-500">CEO, TechSolutions Srl</p></div>
                      </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl relative transform md:-translate-y-4 shadow-xl">
                      <Quote className="text-slate-100 absolute top-6 right-6" size={60}/>
                      <div className="flex gap-1 text-amber-400 mb-4 relative z-10"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-600 italic mb-6 relative z-10 font-medium">"Il modulo AI Voice ci ha salvati. Durante il Black Friday il centralino AI ha gestito da solo oltre 500 chiamate dei clienti, smistando gli ordini e fissando appuntamenti in agenda senza nessun operatore umano presente."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">L</div>
                          <div><p className="font-bold text-slate-900">Laura Bernardi</p><p className="text-xs text-slate-500">Store Manager, FashionGroup</p></div>
                      </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-8 rounded-3xl relative shadow-sm">
                      <Quote className="text-slate-100 absolute top-6 right-6" size={60}/>
                      <div className="flex gap-1 text-amber-400 mb-4 relative z-10"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-600 italic mb-6 relative z-10 font-medium">"La funzione di Affiliazione B2B è pazzesca. Ci siamo collegati con altre due palestre in città e ora i nostri clienti ricevono in automatico promozioni incrociate. Il network ha generato 15k di fatturato extra nel primo mese."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">G</div>
                          <div><p className="font-bold text-slate-900">Giuseppe V.</p><p className="text-xs text-slate-500">Titolare Network Fitness</p></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- SEZIONE: ACADEMY ESTERNA --- */}
      <div id="academy-esterna" className="py-24 relative z-10 bg-gradient-to-br from-amber-50 to-orange-50 border-y border-amber-200/50 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
              <div className="w-20 h-20 bg-white text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-amber-100">
                  <GraduationCap size={40}/>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Vuoi solo formare il tuo Team?</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                  Non sei pronto per l'intero ecosistema gestionale ma vuoi accedere alla nostra formazione d'élite? Abbiamo creato un portale separato dove puoi acquistare singoli corsi.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/formazione" className="bg-amber-500 text-white font-black px-8 py-4 rounded-full shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:scale-105 transition transform flex items-center justify-center gap-2">
                      Esplora i Corsi <ArrowRight size={20}/>
                  </Link>
              </div>
          </div>
      </div>

      {/* --- SEZIONE PROTEZIONE E COPYRIGHT --- */}
      <div className="py-20 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
              <div className="bg-[#00665E] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
                  <Lock size={120} className="absolute -top-10 -right-10 text-white/10 rotate-12"/>
                  <Shield size={48} className="text-emerald-300 mx-auto mb-6"/>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Tecnologia Proprietaria. Dati Blindati.</h2>
                  <p className="text-emerald-50 max-w-2xl mx-auto font-medium">
                      IntegraOS si basa su architetture algoritmiche chiuse. Tutti i dati sono ospitati su server Europei (GDPR Compliance) con crittografia end-to-end.
                  </p>
                  <p className="text-xs text-emerald-300/60 font-mono mt-6">IP Registered &copy; Concept ADV & Enestar</p>
              </div>
          </div>
      </div>

      {/* --- PIANI TARIFFARI --- */}
      <div id="piani" className="py-24 relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Scegli la potenza.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* BASE */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-[#00665E] hover:shadow-xl transition duration-300 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Base</h3>
                  <p className="text-slate-500 text-sm mb-6 h-10 font-medium">Perfetto per PMI e negozi fisici singoli.</p>
                  <div className="text-4xl font-black text-slate-900 mb-6">€99<span className="text-lg text-slate-400 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-600 flex-1 font-medium">
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500"/> CRM & CDP (500 Lead)</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500"/> 3 Automazioni Zap</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-emerald-500"/> 5 Agenti & Terminale Punti</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Base'); window.location.href = '/register'; }} className="w-full block text-center bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 rounded-xl hover:bg-slate-200 transition">
                      Registrati ed Inizia
                  </button>
              </div>

              {/* ENTERPRISE */}
              <div className="bg-white border-2 border-[#00665E] rounded-3xl p-8 transform md:-translate-y-4 shadow-2xl flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00665E] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">Scelta Popolare</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                  <p className="text-slate-500 text-sm mb-6 h-10 font-medium">Il controllo totale per aziende strutturate e franchising.</p>
                  <div className="text-4xl font-black text-[#00665E] mb-6">€199<span className="text-lg text-slate-400 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-700 flex-1 font-bold">
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#00665E]"/> Modulo Finance ERP Illimitato</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#00665E]"/> 20 Automazioni Zap</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#00665E]"/> 15 Agenti & Pulse HR Team</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Enterprise'); window.location.href = '/register'; }} className="w-full block text-center bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d47] transition shadow-lg shadow-[#00665E]/20">
                      Registrati ed Inizia
                  </button>
              </div>

              {/* AMBASSADOR */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-purple-500 hover:shadow-xl transition duration-300 flex flex-col group">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">Ambassador <Bot className="text-purple-600" size={20}/></h3>
                  <p className="text-slate-500 text-sm mb-6 h-10 font-medium">Tutta la potenza dell'Intelligenza Artificiale.</p>
                  <div className="text-4xl font-black text-slate-900 mb-6">€499<span className="text-lg text-slate-400 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-600 flex-1 font-medium">
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-purple-500"/> AI Voice (Risponde al telefono)</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-purple-500"/> CFO AI (Analisi Bilancio)</li>
                      <li className="flex items-center gap-3"><CheckCircle size={18} className="text-purple-500"/> Limiti Illimitati Ovunque</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Ambassador'); window.location.href = '/register'; }} className="w-full block text-center bg-purple-50 text-purple-700 border border-purple-200 font-bold py-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      Registrati ed Inizia
                  </button>
              </div>
          </div>
      </div>

      {/* --- FORM CONTATTI & CTA FINALE --- */}
      <div className="py-24 relative z-10 bg-emerald-50 border-t border-emerald-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-black text-slate-900 mb-6">Pronto a fare il salto quantico?</h2>
              <p className="text-slate-600 mb-10 text-lg font-medium">Parla con un nostro consulente per scoprire come IntegraOS può automatizzare la tua azienda.</p>
              
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto text-left">
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Nome Azienda</label>
                              <input required type="text" value={contactName} onChange={e=>setContactName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-1 text-slate-900 focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] outline-none transition" placeholder="La tua azienda Srl" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Email Aziendale</label>
                              <input required type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-1 text-slate-900 focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] outline-none transition" placeholder="info@azienda.it" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Di cosa hai bisogno?</label>
                          <textarea required value={contactMessage} onChange={e=>setContactMessage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-1 text-slate-900 focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] outline-none min-h-[120px] transition custom-scrollbar" placeholder="Vorrei automatizzare le mie vendite..."></textarea>
                      </div>
                      <button type="submit" className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d47] transition flex items-center justify-center gap-2 shadow-lg shadow-[#00665E]/20">
                          <Mail size={18}/> Invia Richiesta via Mail
                      </button>
                  </form>
              </div>
          </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-200 py-12 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-6 object-contain grayscale opacity-60" />
            </div>
            <p className="text-slate-500 text-sm font-medium text-center md:text-left">
                &copy; 2026 Integra OS. All rights reserved.<br/>
                Software Proprietario progettato in Italia da Concept ADV & Enestar.
            </p>
            <div className="flex gap-4 text-xs font-bold">
                <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-slate-400 hover:text-[#00665E] transition">Privacy Policy (GDPR)</button>
                <a href="#" className="text-slate-400 hover:text-[#00665E] transition">Termini di Servizio</a>
            </div>
        </div>
      </footer>

      {/* ======================================================= */}
      {/* BANNER COOKIE GLOBALE (GDPR COMPLIANT)                  */}
      {/* ======================================================= */}
      {showCookieBanner && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[200] p-4 md:p-6 animate-in slide-in-from-bottom-full">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 text-[#00665E] rounded-xl hidden md:block border border-emerald-100">
                          <Cookie size={24}/>
                      </div>
                      <div>
                          <h3 className="text-slate-900 font-bold mb-1">Impostazioni Privacy & Tracciamento (Ecosistema IntegraOS)</h3>
                          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed font-medium">
                              Utilizziamo cookie tecnici e di profilazione per migliorare la tua navigazione e offrirti contenuti personalizzati. Il consenso prestato qui si estende all'intero ecosistema IntegraOS, inclusa l'Academy. Cliccando su "Accetta Tutti" acconsenti all'uso descritto nella nostra <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#00665E] font-bold underline hover:text-[#004d47]">Privacy Policy GDPR</button>.
                          </p>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
                      <button onClick={() => handleAcceptCookies('essential')} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 text-sm font-bold hover:bg-slate-100 transition whitespace-nowrap">
                          Solo Essenziali
                      </button>
                      <button onClick={() => handleAcceptCookies('all')} className="px-6 py-3 rounded-xl bg-[#00665E] hover:bg-[#004d47] text-white text-sm font-black transition shadow-lg shadow-[#00665E]/20 whitespace-nowrap">
                          Accetta Tutti
                      </button>
                  </div>
              </div>
          </div>
      )}

    </main>
  );
}

function ToolCard({icon, bgIcon, title, desc}: any) {
    return (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 hover:border-[#00665E]/30 hover:shadow-lg hover:-translate-y-1 transition duration-300 group">
            <div className={`${bgIcon} p-3 rounded-xl border border-slate-100 group-hover:scale-110 transition shrink-0`}>
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-500 font-medium">{desc}</p>
            </div>
        </div>
    )
}