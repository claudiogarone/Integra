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
    <main className="min-h-screen bg-[#020817] font-sans selection:bg-emerald-500 selection:text-white text-slate-300 overflow-x-hidden relative">
      
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
              className="fixed bottom-6 left-6 z-[90] bg-slate-900/80 backdrop-blur-md border border-slate-700 p-3 rounded-full text-emerald-500 hover:text-white transition shadow-lg animate-in fade-in"
              title="Musica di Sottofondo"
          >
              <div className="flex gap-1 items-end h-4">
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite]"></span>
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_1.2s_infinite]"></span>
                  <span className="w-1 bg-emerald-500 rounded-full animate-[bounce_0.8s_infinite]"></span>
              </div>
          </button>
      )}

      {/* ======================================================= */}
      {/* MODALE ACQUISIZIONE EMAIL (LEAD GENERATION)             */}
      {/* ======================================================= */}
      {showLeadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
              <div className="bg-gradient-to-br from-[#020817] to-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden transform scale-100 animate-in zoom-in-95">
                  <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-2 rounded-full transition z-10">
                      <X size={20}/>
                  </button>
                  
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                  
                  <div className="p-8 md:p-10 text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                          <Building size={32}/>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Scopri l'Ecosistema IntegraOS</h2>
                      <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                          Inserisci la tua email aziendale. Ti riconosceremo durante la navigazione per mostrarti contenuti personalizzati e ti sbloccheremo l'accesso alla demo completa.
                      </p>

                      <form onSubmit={handleLeadSubmit} className="space-y-4">
                          <input 
                              type="email" 
                              required 
                              value={leadEmail}
                              onChange={(e) => setLeadEmail(e.target.value)}
                              placeholder="La tua email lavorativa (es. info@azienda.it)" 
                              className="w-full bg-black/50 border border-slate-700 rounded-xl py-4 px-5 text-white outline-none focus:border-emerald-500 text-center transition shadow-inner"
                          />
                          <div className="flex items-start gap-3 text-left">
                              <input 
                                  type="checkbox" 
                                  id="privacy" 
                                  checked={leadConsent}
                                  onChange={(e) => setLeadConsent(e.target.checked)}
                                  className="mt-1 shrink-0 accent-emerald-500" 
                              />
                              <label htmlFor="privacy" className="text-[10px] text-slate-500">
                                  Acconsento al trattamento dei dati personali e al tracciamento della mia navigazione sull'ecosistema IntegraOS nel rispetto del GDPR.{' '}
                                  <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-emerald-400 underline hover:text-emerald-300">
                                      Leggi la Privacy Policy
                                  </button>.
                              </label>
                          </div>
                          <button id="leadSubmitBtn" type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] transition transform">
                              Accedi ai Contenuti
                          </button>
                      </form>
                      <button onClick={() => setShowLeadModal(false)} className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition border-b border-transparent hover:border-slate-300 pb-0.5">
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
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-[#020817] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                          <Shield size={20} className="text-emerald-500"/> Informativa sulla Privacy (GDPR)
                      </h2>
                      <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full">
                          <X size={20}/>
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto text-sm text-slate-400 space-y-4 custom-scrollbar bg-[#020817]">
                      <p><strong>1. Titolare del Trattamento:</strong> Il Titolare del trattamento dei dati è IntegraOS (Sviluppato da Concept ADV & Enestar).</p>
                      <p><strong>2. Finalità del Trattamento:</strong> I dati raccolti (es. indirizzo email) verranno utilizzati per: <br/>a) fornire l'accesso ai contenuti e ai servizi richiesti; <br/>b) inviare comunicazioni commerciali (ove esplicitamente acconsentito); <br/>c) monitorare e tracciare la navigazione all'interno dell'intero ecosistema IntegraOS per fini statistici e di profilazione.</p>
                      <p><strong>3. Base Giuridica:</strong> Il trattamento è basato sul consenso esplicito dell'utente (Art. 6 par. 1 lett. a del Regolamento UE 2016/679 - GDPR).</p>
                      <p><strong>4. Conservazione dei Dati:</strong> I dati saranno conservati in server protetti all'interno dell'Unione Europea, fino a revoca del consenso.</p>
                      <p><strong>5. Diritti dell'Interessato:</strong> Ai sensi degli artt. 15-22 del GDPR, in qualità di interessato hai il diritto di accedere ai tuoi dati personali, richiederne la rettifica o la cancellazione contattandoci all'indirizzo email: privacy@integraos.it.</p>
                  </div>
                  <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                      <button onClick={() => setShowPrivacyModal(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg">
                          Ho compreso, Chiudi
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00665E] rounded-full blur-[150px] opacity-20"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[150px] opacity-20"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* --- NAVBAR PREMIUM --- */}
      <nav className="fixed w-full z-40 top-0 border-b border-white/5 bg-[#020817]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <img src="/logo-integra.jpeg" alt="IntegraOS Logo" className="h-8 object-contain" onError={(e) => {
                    e.currentTarget.style.display='none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }} />
                <div className="hidden flex items-center gap-2">
                    <Shield className="text-emerald-500" size={28}/>
                    <div className="text-2xl font-black text-white tracking-tighter cursor-pointer">
                        INTEGRA<span className="font-light text-slate-500">OS</span>
                    </div>
                </div>
            </div>
            
            <div className="hidden lg:flex gap-8 text-sm font-bold text-slate-400">
                <a href="#impatto" className="hover:text-white transition">Vantaggi</a>
                <a href="#ecosistema" className="hover:text-white transition">I Moduli</a>
                <a href="#recensioni" className="hover:text-white transition">Recensioni</a>
                <a href="#academy-esterna" className="hover:text-amber-400 transition">Corsi</a>
                <a href="#piani" className="hover:text-white transition">Prezzi</a>
            </div>

            <div className="flex gap-3 items-center">
                <div className="hidden lg:flex items-center gap-2 mr-4 border-r border-slate-800 pr-4">
                    <Link href="/agent-auth" className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition">
                        <UserCheck size={14}/> Login/Iscrizione Agenti
                    </Link>
                    <span className="text-slate-700">•</span>
                    <Link href="/wallet" className="text-xs font-bold text-slate-400 hover:text-orange-400 flex items-center gap-1 transition">
                        <Smartphone size={14}/> Portale Clienti
                    </Link>
                </div>
                <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full font-bold transition flex items-center gap-2 text-sm border border-white/10">
                    <Building size={16}/> Login Azienda
                </Link>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-40 pb-20 max-w-5xl mx-auto">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20 mb-6 inline-flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Sparkles size={14}/> Il primo Ecosistema AI per il Business
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1] mb-6">
                Gestisci tutto.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Senza fare nulla.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                Non il solito gestionale. IntegraOS è un'Intelligenza Artificiale che automatizza le vendite, analizza il bilancio, gestisce le HR e fidelizza i clienti. Tutto da un'unica Control Room.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-full font-black text-lg shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 transition transform flex items-center justify-center gap-2">
                    Crea Azienda Ora <ArrowRight size={20}/>
                </Link>
                <a href="#demo" className="w-full sm:w-auto bg-slate-800/50 backdrop-blur-md text-white border border-slate-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition flex items-center justify-center gap-2">
                    <PlayCircle size={20}/> Guarda la Demo
                </a>
            </div>
        </div>

        {/* MOCKUP VIDEO DIMOSTRATIVO CORRETTO */}
        <div id="demo" className="mt-20 w-full max-w-4xl relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
            <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent z-20 h-full pointer-events-none"></div>
            <div className="relative rounded-t-3xl bg-slate-900 border border-slate-700 shadow-2xl p-2 pt-4 overflow-hidden">
                <div className="flex gap-2 mb-3 px-4">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                
                <div className="aspect-video bg-black rounded-2xl border border-slate-800 relative overflow-hidden group">
                    {!isVideoPlaying ? (
                        <>
                            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Dashboard Preview" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition duration-700"/>
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={() => setIsVideoPlaying(true)}>
                                <div className="w-20 h-20 bg-emerald-500/80 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-white/20 group-hover:bg-emerald-500 transition duration-300 transform group-hover:scale-110">
                                    <PlayCircle size={44} className="ml-1"/>
                                </div>
                            </div>
                        </>
                    ) : (
                        <video controls autoPlay className="w-full h-full object-cover rounded-2xl relative z-30" src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4">
                            Il tuo browser non supporta il tag video.
                        </video>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- PARTNERS --- */}
      <div className="border-y border-white/5 bg-white/5 backdrop-blur-sm relative z-10 py-10">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Sviluppato e supportato dai partner tecnologici</p>
              <div className="flex flex-wrap justify-center gap-16 md:gap-32 items-center opacity-70 grayscale hover:grayscale-0 transition duration-500">
                  <div className="flex items-center gap-3">
                      <img src="/logo-concept.jpeg" alt="Concept ADV" className="h-10 md:h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <span className="hidden text-2xl font-black text-white">Concept ADV</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <img src="/logo-enestar.jpeg" alt="Enestar" className="h-10 md:h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                      <span className="hidden text-2xl font-black text-white">Enestar</span>
                  </div>
              </div>
          </div>
      </div>

      {/* --- IMPATTO E BENEFICI REALI (ROI) --- */}
      <div id="impatto" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Taglia i costi. Moltiplica i clienti.</h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">Non è solo un software. È un'infrastruttura progettata per sostituire interi reparti inefficaci, risparmiando risorse fisiche ed umane.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-br from-slate-900 to-[#020817] border border-slate-800 p-8 rounded-3xl">
                      <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={28}/></div>
                      <h3 className="text-xl font-black text-white mb-3">Ricerca & Fidelizzazione</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">Usa la <span className="text-white font-bold">Modalità Incognito</span> per tracciare i visitatori anonimi. Confeziona un'offerta su misura col <span className="text-white font-bold">Launchpad Social</span> e tieni i clienti incollati con il modulo <span className="text-white font-bold">Fidelity Card</span> nativo.</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900 to-[#020817] border border-slate-800 p-8 rounded-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10"><Clock size={100}/></div>
                      <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 relative z-10"><Bot size={28}/></div>
                      <h3 className="text-xl font-black text-white mb-3 relative z-10">Risparmio di Risorse Umane</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4 relative z-10">Il <span className="text-white font-bold">Centralino AI Voice</span> risponde ai clienti 24/7. Le <span className="text-white font-bold">Zap Automations</span> fanno il lavoro di 3 segretarie. Il tuo team umano interviene solo per chiudere le trattative ad alto budget.</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-900 to-[#020817] border border-slate-800 p-8 rounded-3xl">
                      <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6"><Zap size={28}/></div>
                      <h3 className="text-xl font-black text-white mb-3">Risparmio Fisico & Strutturale</h3>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">Non affittare nuovi uffici. Il modulo <span className="text-white font-bold">Energy Monitor</span> analizza le tue bollette e taglia gli sprechi di luce e gas. Il <span className="text-white font-bold">CFO AI</span> individua gli abbonamenti inutili e li recide per te.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- L'ECOSISTEMA ESTESO (Tutti i Tool) --- */}
      <div id="ecosistema" className="py-24 relative z-10 bg-slate-900/30 border-y border-white/5">
          <div className="text-center mb-16 max-w-7xl mx-auto px-6">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Tutti i Tool di cui hai bisogno.</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Nessuna integrazione di terze parti necessaria. Tutto nativo. Tutto sincronizzato.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto px-6">
              <ToolCard icon={<MessageSquare className="text-sky-400"/>} title="Inbox Unificata" desc="Tutte le chat in un solo posto." />
              <ToolCard icon={<Database className="text-blue-500"/>} title="CDP & Data Studio" desc="Analisi profonda dei clienti." />
              <ToolCard icon={<EyeOff className="text-indigo-400"/>} title="Incognito Mode" desc="Traccia lead senza cookie." />
              <ToolCard icon={<CreditCard className="text-orange-400"/>} title="Fidelity & Wallet" desc="Raccolta punti e premi VIP." />
              
              <ToolCard icon={<Bot className="text-emerald-400"/>} title="Agenti AI & Voice" desc="Centralini 24/7 intelligenti." />
              <ToolCard icon={<Workflow className="text-amber-400"/>} title="Zap Automations" desc="Il motore logico Drag&Drop." />
              <ToolCard icon={<Palette className="text-purple-400"/>} title="Creative Studio" desc="Design e volantini automatizzati." />
              <ToolCard icon={<Radar className="text-pink-400"/>} title="Radar Media Locali" desc="Ottimizza il budget Pubblicitario." />
              
              <ToolCard icon={<Handshake className="text-teal-400"/>} title="Network Affiliazioni" desc="Cross-promo con altre aziende." />
              <ToolCard icon={<HeartPulse className="text-rose-400"/>} title="Pulse HR & Valutazioni" desc="Analisi e performance venditori." />
              <ToolCard icon={<Landmark className="text-yellow-500"/>} title="Finance ERP" desc="Fatturazione ed emissione SdI." />
              <ToolCard icon={<Zap className="text-green-500"/>} title="Energy Monitor ESG" desc="Taglio costi fissi e bollette." />
          </div>
      </div>

      {/* --- RECENSIONI E SOCIAL PROOF --- */}
      <div id="recensioni" className="py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Chi l'ha provato non torna indietro.</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-[#020817] border border-slate-800 p-8 rounded-3xl relative">
                      <Quote className="text-slate-800 absolute top-6 right-6" size={40}/>
                      <div className="flex gap-1 text-amber-400 mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"Prima usavamo Hubspot per il CRM, Mailchimp per le email e un'agenzia esterna per i volantini. Spendevamo circa 1.200€ al mese solo in software. Ora facciamo il triplo delle azioni, tutto in automatico, dal piano Enterprise."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">M</div>
                          <div><p className="font-bold text-white">Marco Rivolta</p><p className="text-xs text-slate-500">CEO, TechSolutions Srl</p></div>
                      </div>
                  </div>
                  <div className="bg-[#020817] border border-slate-800 p-8 rounded-3xl relative transform md:-translate-y-4 shadow-xl">
                      <Quote className="text-slate-800 absolute top-6 right-6" size={40}/>
                      <div className="flex gap-1 text-amber-400 mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"Il modulo AI Voice ci ha salvati. Durante il Black Friday il centralino AI ha gestito da solo oltre 500 chiamate dei clienti, smistando gli ordini e fissando appuntamenti in agenda senza nessun operatore umano presente."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">L</div>
                          <div><p className="font-bold text-white">Laura Bernardi</p><p className="text-xs text-slate-500">Store Manager, FashionGroup</p></div>
                      </div>
                  </div>
                  <div className="bg-[#020817] border border-slate-800 p-8 rounded-3xl relative">
                      <Quote className="text-slate-800 absolute top-6 right-6" size={40}/>
                      <div className="flex gap-1 text-amber-400 mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"La funzione di Affiliazione B2B è pazzesca. Ci siamo collegati con altre due palestre in città e ora i nostri clienti ricevono in automatico promozioni incrociate. Il network ha generato 15k di fatturato extra nel primo mese."</p>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">G</div>
                          <div><p className="font-bold text-white">Giuseppe V.</p><p className="text-xs text-slate-500">Titolare Network Fitness</p></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- SEZIONE: ACADEMY ESTERNA --- */}
      <div id="academy-esterna" className="py-24 relative z-10 bg-gradient-to-br from-[#1a1408] to-[#020817] border-y border-amber-900/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                  <GraduationCap size={40} className="text-white"/>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Vuoi solo formare il tuo Team?</h2>
              <p className="text-amber-100/70 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                  Non sei pronto per l'intero ecosistema gestionale ma vuoi accedere alla nostra formazione d'élite? Abbiamo creato un portale separato dove puoi acquistare singoli corsi.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/formazione" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black px-8 py-4 rounded-full shadow-lg hover:scale-105 transition transform flex items-center justify-center gap-2">
                      Esplora i Corsi <ArrowRight size={20}/>
                  </Link>
              </div>
          </div>
      </div>

      {/* --- SEZIONE PROTEZIONE E COPYRIGHT --- */}
      <div className="py-20 relative z-10">
          <div className="max-w-5xl mx-auto px-6">
              <div className="bg-gradient-to-r from-slate-900 to-[#020817] border border-slate-800 rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
                  <Lock size={120} className="absolute -top-10 -right-10 text-white/5 rotate-12"/>
                  <Shield size={48} className="text-emerald-500 mx-auto mb-6"/>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Tecnologia Proprietaria. Dati Blindati.</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                      IntegraOS si basa su architetture algoritmiche chiuse. Tutti i dati sono ospitati su server Europei (GDPR Compliance) con crittografia end-to-end.
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-6">IP Registered &copy; Concept ADV & Enestar</p>
              </div>
          </div>
      </div>

      {/* --- PIANI TARIFFARI --- */}
      <div id="piani" className="py-24 relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Scegli la potenza.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* BASE */}
              <div className="bg-[#020817] border border-slate-800 rounded-3xl p-8 hover:border-slate-600 transition flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2">Base</h3>
                  <p className="text-slate-400 text-sm mb-6 h-10">Perfetto per PMI e negozi fisici singoli.</p>
                  <div className="text-4xl font-black text-white mb-6">€99<span className="text-lg text-slate-500 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-300 flex-1">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> CRM & CDP (500 Lead)</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> 3 Automazioni Zap</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> 5 Agenti & Terminale Punti</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Base'); window.location.href = '/register'; }} className="w-full block text-center bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition">
                      Registrati ed Inizia
                  </button>
              </div>

              {/* ENTERPRISE */}
              <div className="bg-gradient-to-b from-[#00665E] to-slate-900 border border-emerald-500/50 rounded-3xl p-8 transform md:-translate-y-4 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">Scelta Popolare</div>
                  <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                  <p className="text-emerald-100/70 text-sm mb-6 h-10">Il controllo totale per aziende strutturate e franchising.</p>
                  <div className="text-4xl font-black text-white mb-6">€199<span className="text-lg text-emerald-100/50 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-white flex-1">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-300"/> Modulo Finance ERP Illimitato</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-300"/> 20 Automazioni Zap</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-300"/> 15 Agenti & Pulse HR Team</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Enterprise'); window.location.href = '/register'; }} className="w-full block text-center bg-emerald-500 text-white font-black py-3 rounded-xl hover:bg-emerald-400 transition shadow-lg">
                      Registrati ed Inizia
                  </button>
              </div>

              {/* AMBASSADOR */}
              <div className="bg-[#020817] border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition flex flex-col group">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">Ambassador <Bot className="text-purple-500" size={20}/></h3>
                  <p className="text-slate-400 text-sm mb-6 h-10">Tutta la potenza dell'Intelligenza Artificiale.</p>
                  <div className="text-4xl font-black text-white mb-6">€499<span className="text-lg text-slate-500 font-normal">/mese</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-300 flex-1">
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> AI Voice (Risponde al telefono)</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> CFO AI (Analisi Bilancio)</li>
                      <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> Limiti Illimitati Ovunque</li>
                  </ul>
                  <button onClick={() => { localStorage.setItem('integra_plan', 'Ambassador'); window.location.href = '/register'; }} className="w-full block text-center bg-purple-600/20 text-purple-400 border border-purple-600/50 font-bold py-3 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                      Registrati ed Inizia
                  </button>
              </div>
          </div>
      </div>

      {/* --- FORM CONTATTI & CTA FINALE --- */}
      <div className="py-24 relative z-10 bg-emerald-900/20 border-t border-emerald-900/30">
          <div className="max-w-4xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-black text-white mb-6">Pronto a fare il salto quantico?</h2>
              <p className="text-emerald-100/70 mb-10 text-lg">Parla con un nostro consulente per scoprire come IntegraOS può automatizzare la tua azienda.</p>
              
              <div className="bg-[#020817] p-8 rounded-3xl border border-slate-800 shadow-2xl max-w-2xl mx-auto text-left">
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Nome Azienda</label>
                              <input required type="text" value={contactName} onChange={e=>setContactName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl mt-1 text-white focus:border-emerald-500 outline-none" placeholder="La tua azienda Srl" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase">Email Aziendale</label>
                              <input required type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl mt-1 text-white focus:border-emerald-500 outline-none" placeholder="info@azienda.it" />
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Di cosa hai bisogno?</label>
                          <textarea required value={contactMessage} onChange={e=>setContactMessage(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl mt-1 text-white focus:border-emerald-500 outline-none min-h-[100px]" placeholder="Vorrei automatizzare le mie vendite..."></textarea>
                      </div>
                      <button type="submit" className="w-full bg-emerald-500 text-white font-black py-4 rounded-xl hover:bg-emerald-400 transition flex items-center justify-center gap-2 shadow-lg">
                          <Mail size={18}/> Invia Richiesta via Mail
                      </button>
                  </form>
              </div>
          </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="border-t border-slate-800 py-12 bg-[#020817] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 opacity-50">
                <Shield size={24}/>
                <span className="text-xl font-black tracking-tighter">INTEGRAOS</span>
            </div>
            <p className="text-slate-600 text-sm font-medium text-center md:text-left">
                &copy; 2026 Integra OS. All rights reserved.<br/>
                Software Proprietario progettato in Italia da Concept ADV & Enestar.
            </p>
            <div className="flex gap-4 text-xs font-bold">
                <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-slate-500 hover:text-emerald-400 transition">Privacy Policy (GDPR)</button>
                <a href="#" className="text-slate-500 hover:text-emerald-400 transition">Termini di Servizio</a>
            </div>
        </div>
      </footer>

      {/* ======================================================= */}
      {/* BANNER COOKIE GLOBALE (GDPR COMPLIANT)                  */}
      {/* ======================================================= */}
      {showCookieBanner && (
          <div className="fixed bottom-0 left-0 w-full bg-slate-950 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[200] p-4 md:p-6 animate-in slide-in-from-bottom-full">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hidden md:block">
                          <Cookie size={24}/>
                      </div>
                      <div>
                          <h3 className="text-white font-bold mb-1">Impostazioni Privacy & Tracciamento (Ecosistema IntegraOS)</h3>
                          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                              Utilizziamo cookie tecnici e di profilazione per migliorare la tua navigazione e offrirti contenuti personalizzati. Il consenso prestato qui si estende all'intero ecosistema IntegraOS, inclusa l'Academy. Cliccando su "Accetta Tutti" acconsenti all'uso descritto nella nostra <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-emerald-400 underline hover:text-emerald-300">Privacy Policy GDPR</button>.
                          </p>
                      </div>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
                      <button onClick={() => handleAcceptCookies('essential')} className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800 transition whitespace-nowrap">
                          Solo Essenziali
                      </button>
                      <button onClick={() => handleAcceptCookies('all')} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap">
                          Accetta Tutti
                      </button>
                  </div>
              </div>
          </div>
      )}

    </main>
  );
}

function ToolCard({icon, title, desc}: any) {
    return (
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl flex items-start gap-4 hover:bg-slate-800/80 transition group">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-inner group-hover:scale-110 transition shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-white text-sm mb-1">{title}</h4>
                <p className="text-xs text-slate-400">{desc}</p>
            </div>
        </div>
    )
}