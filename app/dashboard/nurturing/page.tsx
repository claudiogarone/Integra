'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Gift, CalendarDays, Sparkles, Wand2, 
    Send, Loader2, Infinity, Tag, 
    HeartHandshake, User, Eye, Settings2, MessageSquareQuote, ChevronDown, CheckCircle2
} from 'lucide-react'

export default function NurturingEnginePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // LIMITI PIANO
  const limits: any = { 'Base': 500, 'Enterprise': 2500, 'Ambassador': 'Illimitati' }
  const contactsReached = 350

  // STATI ENGINE E CONFIGURAZIONE AZIENDALE
  const [industry, setIndustry] = useState('Ristorazione')
  const [toneOfVoice, setToneOfVoice] = useState('Amichevole ed Empatico')
  const [customInstructions, setCustomInstructions] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(true) // Per aprire/chiudere le impostazioni

  const [isGenerating, setIsGenerating] = useState(false)
  const [autopilotActive, setAutopilotActive] = useState(false)
  
  // STATO PREVIEW MESSAGGIO
  const [activeMessage, setActiveMessage] = useState<number>(1)

  // DATABASE GENERATIVO AI ESPANSO (Mock per dimostrazione)
  const aiContentDb: any = {
      'Ristorazione': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Ricetta Veloce', title: 'Risotto Autunnale', text: "Ciao {{Nome}}! 🍁 Questo weekend le temperature si abbassano. Ecco un'idea veloce per scaldare la serata: Risotto zucca, salsiccia e rosmarino (trovi la ricetta completa nel link). \n\nE se non hai voglia di cucinare... il nostro delivery è attivo e ti abbiamo riservato il dolce in omaggio se ordini stasera! 🍷 Buona serata dallo staff!" },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Curiosità Vino', title: 'Abbinamento Perfetto', text: "Ciao {{Nome}}! 🍷 Sapevi che il vino rosso strutturato non va mai abbinato a cibi troppo piccanti perché ne esalta il bruciore? \n\nQuesto weekend nel nostro locale abbiamo aperto una bottiglia speciale. Passa a trovarci per un calice offerto dalla casa!" },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Dietro le quinte', title: 'I nostri ingredienti', text: "Buongiorno {{Nome}}! 🍅 Oggi siamo stati al mercato agricolo alle 5 del mattino per scegliere i pomodori migliori per il nostro sugo. Crediamo che la qualità parta da qui.\n\nVieni ad assaggiare i nuovi piatti fuori menu questo fine settimana!" },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Regalo Esclusivo', title: 'Secret Menu', text: "Ciao {{Nome}}! 🤫 Solo per i nostri clienti VIP iscritti alla newsletter: questo weekend c'è un piatto 'Secret Menu' che non troverai in carta (Tagliata al tartufo nero). \n\nMostra questo messaggio al cameriere per ordinarlo in esclusiva!" }
      ],
      'Fitness': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Tip Allenamento', title: 'Mal di schiena da PC?', text: "Ciao {{Nome}}! 💻 Lavori tante ore al computer? Ecco 3 esercizi di stretching da 1 minuto da fare direttamente sulla sedia per sciogliere la cervicale.\n\nRicordati che la postura è tutto! Ti aspettiamo in palestra lunedì per il corso di Posturale." },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Nutrizione', title: 'Snack Pre-Workout', text: "Buongiorno {{Nome}}! 🍌 Non sai mai cosa mangiare prima di allenarti? Il mix perfetto è: 1 banana + un cucchiaino di burro d'arachidi, 45 minuti prima dello sforzo.\n\nTi darà energia immediata. Provalo oggi prima del tuo turno!" },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Mindset', title: 'La regola dei 5 minuti', text: "Ciao {{Nome}}! 🧠 Oggi non hai voglia di allenarti? Usa la regola dei 5 minuti: indossa le scarpe da ginnastica e inizia per soli 5 minuti. Il 90% delle volte... continuerai!\n\nNoi siamo qui fino alle 22:00. Ti aspettiamo!" },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Sfida Mensile', title: 'Challenge Addominali', text: "Ehi {{Nome}}! 🔥 Sei pronto per la sfida di fine mese? Plank challenge: quanti secondi riesci a resistere? \n\nRispondi a questo messaggio col tuo tempo. I 3 migliori vinceranno una borraccia termica del nostro club!" }
      ],
      'Beauty': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Skincare', title: 'Sbalzi di Temperatura', text: "Ciao {{Nome}}! ✨ Lo sapevi che il passaggio dal freddo esterno al riscaldamento dell'ufficio disidrata la pelle del 30%? \n\nUsa sempre una crema con acido ialuronico. Abbiamo ancora 2 posti liberi domani per il trattamento idratante intensivo!" },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Beauty Hack', title: 'Scrub fai da te', text: "Buongiorno {{Nome}}! 🍯 Vuoi labbra morbidissime? Mescola un cucchiaino di zucchero di canna, uno di miele e una goccia d'olio d'oliva. Massaggia e risciacqua!\n\nUn piccolo tip casalingo per te dal nostro team. A presto!" },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Trend', title: 'Colori della Stagione', text: "Ciao {{Nome}}! 💇‍♀️ Il trend assoluto di questa stagione è il 'Caramel Balayage', perfetto per illuminare il viso.\n\nHai voglia di cambiare look? Scrivici per una consulenza d'immagine gratuita." },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Relax', title: 'Digital Detox', text: "Ciao {{Nome}}! 🧘‍♀️ Spegni il telefono per un'ora questo weekend, metti una maschera viso e accendi una candela. \n\nE se vuoi un relax totale, ti ricordiamo il nostro pacchetto Spa in promo per le clienti fedeli." }
      ],
      'Abbigliamento': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Stile', title: 'Come vestirsi a strati', text: "Ciao {{Nome}}! 🧥 Le temperature impazziscono? Il segreto è il 'Layering' (vestirsi a strati). Usa un capo base traspirante, una maglia in lana leggera e un capospalla anti-vento.\n\nPassa in store questo weekend per scoprire la nuova maglieria!" },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Cura dei capi', title: 'Come lavare la lana', text: "Buongiorno {{Nome}}! 🧶 Hai paura di restringere i tuoi maglioni preferiti? Lavali sempre a freddo (max 30°) e asciugali stesi in orizzontale, mai appesi!\n\nUna dritta utile per far durare i tuoi capi per sempre." },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Trend', title: 'Il colore dell\'anno', text: "Ciao {{Nome}}! 🎨 Il verde salvia è ufficialmente il colore di tendenza di questo mese. Si abbina perfettamente al denim e ai colori neutri.\n\nAbbiamo appena ricevuto i nuovi arrivi, vieni a provarli!" },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Regalo VIP', title: 'Sconto Privato', text: "Ehi {{Nome}}! 🤫 I saldi non sono ancora iniziati, ma per te che sei un cliente fedele abbiamo attivato un -20% segreto su tutto il nuovo campionario.\n\nMostra questo messaggio in cassa entro domenica!" }
      ],
      'Immobiliare': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Mercato', title: 'Tassi dei Mutui', text: "Buongiorno {{Nome}}! 🏦 Breve aggiornamento dal mercato: i tassi fissi sui mutui stanno subendo una lieve flessione. Se stavi pensando di comprare, questo potrebbe essere il trimestre giusto per muoversi.\n\nContattaci per una consulenza gratuita." },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Home Decor', title: 'Aumentare il valore', text: "Ciao {{Nome}}! 🛋️ Lo sapevi che ridipingere le pareti con colori neutri (come il tortora o il greige) può far percepire la tua casa come un 15% più spaziosa e moderna ai potenziali acquirenti?\n\nPiccoli trucchi che fanno la differenza!" },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Quartieri', title: 'Dove investire', text: "Ciao {{Nome}}! 📈 I dati di questo mese mostrano che la zona Nord della città sta registrando un +4% sul valore degli immobili grazie ai nuovi collegamenti.\n\nStai pensando di vendere? Scopri quanto vale la tua casa oggi." },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Tool', title: 'Valutazione Gratuita', text: "Ehi {{Nome}}! 🏠 Hai mai curiosato per sapere a quanto potresti vendere casa tua nel mercato attuale? \n\nRispondi a questo messaggio con il tuo indirizzo e ti manderemo una stima gratuita in 24 ore, senza impegno." }
      ],
      'Officina': [
          { id: 1, week: 'Settimana 1', date: 'Venerdì 6', type: 'Sicurezza', title: 'Spia Motore', text: "Ciao {{Nome}}! ⚠️ Spia motore accesa? Non farti prendere dal panico. Spesso è solo un sensore sporco, ma ignorarla può causare danni costosi.\n\nPassa in officina per una diagnosi elettronica rapida in 5 minuti. Il caffè te lo offriamo noi!" },
          { id: 2, week: 'Settimana 2', date: 'Venerdì 13', type: 'Risparmio', title: 'Pressione Gomme', text: "Buongiorno {{Nome}}! 🚗 Sapevi che gomme sgonfie anche solo del 15% ti fanno consumare il 5% in più di carburante e si usurano prima?\n\nControlla la pressione questo weekend, o passa da noi per un check-up gratuito dei livelli." },
          { id: 3, week: 'Settimana 3', date: 'Venerdì 20', type: 'Stagionalità', title: 'Preparazione al freddo', text: "Ciao {{Nome}}! ❄️ L'inverno sta arrivando. La tua batteria ha più di 3 anni? Col freddo perde il 30% della sua potenza. \n\nMeglio verificarla ora prima di restare a piedi la mattina presto!" },
          { id: 4, week: 'Settimana 4', date: 'Venerdì 27', type: 'Promo', title: 'Check-up Freni', text: "Ehi {{Nome}}! 🛑 La sicurezza della tua famiglia prima di tutto. Questa settimana offriamo a tutti i nostri clienti storici un controllo gratuito dell'impianto frenante.\n\nPrenota il tuo appuntamento rispondendo a questo messaggio." }
      ]
  }

  const [campaignData, setCampaignData] = useState(aiContentDb['Ristorazione'])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
      }
      setLoading(false)
    }
    getData()
  }, [])

  const generateCampaign = () => {
      setIsGenerating(true)
      setTimeout(() => {
          setIsGenerating(false)
          setCampaignData(aiContentDb[industry])
          setActiveMessage(1)
          setIsConfigOpen(false) // Chiude le impostazioni per mostrare il risultato
      }, 2500)
  }

  const toggleAutopilot = () => {
      if (!autopilotActive) {
          alert(`🚀 Autopilot ATTIVATO! L'AI leggerà le tue istruzioni e invierà i messaggi automaticamente ogni venerdì alle 17:00 a tutta la tua lista contatti.`)
      } else {
          alert(`⏸️ Autopilot DISATTIVATO. I messaggi sono in pausa.`)
      }
      setAutopilotActive(!autopilotActive)
  }

  if (loading) return <div className="p-10 text-purple-600 font-bold animate-pulse">Inizializzazione Nurturing AI...</div>

  const currentPreview = campaignData.find((m: any) => m.id === activeMessage) || campaignData[0]

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER E LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
              <Gift size={32} className="text-purple-500"/> AI Nurturing Engine
          </h1>
          <p className="text-gray-500 text-sm mt-1">Fidelizzazione automatica. L'AI regala valore ai tuoi clienti in base al tuo brand.</p>
        </div>
        
        <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <HeartHandshake className="text-purple-500" size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Clienti Raggiunti ({currentPlan})</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : 'text-gray-800'}`}>
                        {currentPlan === 'Ambassador' ? <span className="flex items-center gap-1"><Infinity size={14}/> Illimitati</span> : `${contactsReached} / ${limits[currentPlan]}`}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: CONFIGURAZIONE E CALENDARIO */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* PANNELLO CONFIGURAZIONE E ISTRUZIONI AZIENDALI */}
              <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden transition-all duration-300">
                  <div 
                      className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition"
                      onClick={() => setIsConfigOpen(!isConfigOpen)}
                  >
                      <h3 className="font-black text-gray-900 flex items-center gap-2">
                          <Settings2 className="text-purple-500"/> 1. Contesto e Istruzioni Aziendali
                      </h3>
                      <ChevronDown size={20} className={`text-gray-500 transition-transform duration-300 ${isConfigOpen ? 'rotate-180' : ''}`}/>
                  </div>
                  
                  {isConfigOpen && (
                      <div className="p-6 space-y-5 animate-in slide-in-from-top-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Settore Operativo</label>
                                  <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:border-purple-500 text-sm font-bold text-gray-800 cursor-pointer shadow-sm">
                                      <option value="Ristorazione">🍽️ Ristorazione / Food</option>
                                      <option value="Fitness">🏋️ Palestre / Fitness</option>
                                      <option value="Beauty">💆‍♀️ Estetica / Parrucchieri</option>
                                      <option value="Abbigliamento">👗 Abbigliamento / Retail</option>
                                      <option value="Immobiliare">🏠 Agenzia Immobiliare</option>
                                      <option value="Officina">🛠️ Officina / Concessionaria</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Tono di Voce dell'AI</label>
                                  <select value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:border-purple-500 text-sm font-bold text-gray-800 cursor-pointer shadow-sm">
                                      <option value="Amichevole ed Empatico">Amichevole ed Empatico (Usa Emoji)</option>
                                      <option value="Formale e Professionale">Formale e Professionale (Nessuna Emoji)</option>
                                      <option value="Ironico e Divertente">Ironico e Divertente</option>
                                      <option value="Informativo e Diretto">Informativo e Diretto</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 mb-2">
                                  <MessageSquareQuote size={12}/> Istruzioni Aggiuntive per l'AI (Prompt)
                              </label>
                              <textarea 
                                  value={customInstructions}
                                  onChange={e => setCustomInstructions(e.target.value)}
                                  placeholder="Es. Ricorda sempre ai clienti che la domenica siamo chiusi e che le consegne partono dalle 18:00. Usa il nome 'Marco' per firmare i messaggi."
                                  rows={3}
                                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-purple-500 text-sm resize-none"
                              ></textarea>
                          </div>
                          
                          <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-start gap-3">
                              <Sparkles size={16} className="text-purple-500 shrink-0 mt-0.5"/>
                              <div>
                                  <p className="text-xs font-bold text-purple-900">Motore Generativo AI</p>
                                  <p className="text-[10px] text-purple-700 mt-1">L'Intelligenza Artificiale analizzerà le tue istruzioni e il tuo settore per scrivere un calendario editoriale mensile di altissimo valore per i tuoi clienti.</p>
                              </div>
                          </div>

                          <button 
                              onClick={generateCampaign}
                              disabled={isGenerating}
                              className="w-full bg-purple-600 text-white font-black py-3.5 rounded-xl hover:bg-purple-500 transition shadow-[0_0_15px_rgba(168,85,247,0.4)] flex justify-center items-center gap-2 disabled:opacity-50"
                          >
                              {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Wand2 size={18}/>}
                              {isGenerating ? 'L\'AI sta scrivendo i contenuti...' : 'Scrivi Mese di Fidelizzazione'}
                          </button>
                      </div>
                  )}
              </div>

              {/* CALENDARIO DELLE SPEDIZIONI */}
              <div>
                  <div className="flex justify-between items-end mb-4">
                      <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                          <CalendarDays className="text-[#00665E]"/> 2. Calendario Generato
                      </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campaignData.map((item: any) => (
                          <div 
                              key={item.id} 
                              onClick={() => setActiveMessage(item.id)}
                              className={`p-5 rounded-2xl border-2 cursor-pointer transition duration-300 relative overflow-hidden group ${activeMessage === item.id ? 'bg-purple-50 border-purple-400 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm'}`}
                          >
                              {activeMessage === item.id && <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl"><Eye size={12} className="inline mr-1"/> ANTEPRIMA</div>}
                              
                              <div className="flex justify-between items-center mb-3">
                                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.week}</span>
                                  <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-600 flex items-center gap-1"><CalendarDays size={12}/> {item.date}</span>
                              </div>
                              <h4 className="font-black text-md text-gray-900 mb-1">{item.title}</h4>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  <Tag size={10}/> {item.type}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>

          </div>

          {/* COLONNA DESTRA: SMARTPHONE PREVIEW E AUTOPILOT */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 sticky top-24">
              
              {/* PANNELLO AUTOPILOT */}
              <div className={`p-6 rounded-3xl border-2 transition duration-500 shadow-lg ${autopilotActive ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-black flex items-center gap-2 ${autopilotActive ? 'text-white' : 'text-gray-900'}`}>
                          <Send size={20}/> Pilota Automatico
                      </h3>
                      <button 
                          onClick={toggleAutopilot}
                          className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex ${autopilotActive ? 'bg-white justify-end' : 'bg-gray-300 justify-start'}`}
                      >
                          <div className={`w-6 h-6 rounded-full shadow-md flex items-center justify-center ${autopilotActive ? 'bg-emerald-500' : 'bg-white'}`}>
                              {autopilotActive && <CheckCircle2 size={14} className="text-white"/>}
                          </div>
                      </button>
                  </div>
                  <p className={`text-sm font-medium leading-relaxed ${autopilotActive ? 'text-emerald-50' : 'text-gray-500'}`}>
                      {autopilotActive 
                          ? 'Attivo. Il sistema prenderà i dati dal CRM e invierà automaticamente i consigli personalizzati ogni venerdì alle 17:00.' 
                          : 'Spento. L\'AI ha generato il contenuto, ma non lo invierà finché non attivi questa spunta.'}
                  </p>
              </div>

              {/* SIMULATORE SMARTPHONE WHATSAPP */}
              <div className="flex-1 bg-gray-900 rounded-[40px] p-3 shadow-2xl relative border-[8px] border-gray-800 mx-auto w-full max-w-[320px] min-h-[500px] flex flex-col">
                  {/* Notch Telefono */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                  
                  {/* Header WhatsApp */}
                  <div className="bg-[#075E54] p-4 pt-10 rounded-t-[28px] text-white flex items-center gap-3 shrink-0 relative z-10">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <User size={20} className="text-white"/>
                      </div>
                      <div>
                          <p className="font-bold text-sm">Il tuo Brand</p>
                          <p className="text-[10px] text-teal-100">Account Business</p>
                      </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 bg-[#E5DDD5] p-4 overflow-y-auto flex flex-col gap-4 relative rounded-b-[28px] pb-10">
                      {/* Pattern Background WhatsApp */}
                      <div className="absolute inset-0 opacity-10 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] mix-blend-multiply pointer-events-none"></div>
                      
                      <div className="flex justify-center relative z-10">
                          <span className="bg-[#D4EAF4] text-gray-600 text-[10px] px-3 py-1 rounded-lg shadow-sm">
                              Oggi (Anteprima per: {currentPreview.date})
                          </span>
                      </div>

                      <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm max-w-[95%] self-start relative z-10 animate-in slide-in-from-left-2 fade-in duration-300">
                          <div className="text-sm text-gray-800 whitespace-pre-line leading-snug">
                              {currentPreview.text.replace('{{Nome}}', 'Marco')}
                          </div>
                          <div className="text-right mt-1">
                              <span className="text-[9px] text-gray-400">17:00</span>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </main>
  )
}