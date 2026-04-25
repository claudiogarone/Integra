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
  const [autopilotDay, setAutopilotDay] = useState('Venerdì')
  const [autopilotTime, setAutopilotTime] = useState('17:00')
  
  // STATO PREVIEW MESSAGGIO
  const [activeMessage, setActiveMessage] = useState<number>(1)

  // DATABASE GENERATIVO AI (MOCK rimosso, caricamento da DB)
  const [campaignData, setCampaignData] = useState<any[]>([])

  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
            if (profile) setCurrentPlan(profile.plan || 'Base')

            // Carica ultima campagna salvata
            const { data: campaign, error: campError } = await supabase
              .from('nurturing_campaigns')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
            
            if (campError) {
              console.warn('Tabella nurturing_campaigns non trovata o errore:', campError.message)
              // Non blocchiamo l'utente: il form è comunque disponibile per generare
            } else if (campaign) {
                setCampaignData(campaign.content || [])
                setIndustry(campaign.industry || 'Ristorazione')
                setToneOfVoice(campaign.tone || 'Amichevole ed Empatico')
                setIsConfigOpen(false)
            }
        }
      } catch (err) {
        console.error('Errore inizializzazione Nurturing:', err)
      } finally {
        setLoading(false)
      }
    }
    getData()
  }, [])

  const generateCampaign = async () => {
      setIsGenerating(true)
      try {
          const res = await fetch('/api/ai/nurturing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ industry, toneOfVoice, customInstructions })
          })
          const data = await res.json()
          if (data.campaign) {
              setCampaignData(data.campaign)
              setActiveMessage(1)
              setIsConfigOpen(false)
          } else {
              alert("Errore nella generazione: " + data.error)
          }
      } catch (e) {
          alert("Errore di connessione all'API AI")
      } finally {
          setIsGenerating(false)
      }
  }

  const toggleAutopilot = () => {
      if (!autopilotActive) {
          alert(`🚀 Autopilot ATTIVATO!\n\nL'AI invierà automaticamente i messaggi ogni ${autopilotDay} alle ${autopilotTime} a tutta la tua lista contatti.\n\nPuoi modificare il giorno e l'orario in qualsiasi momento dal pannello.`)
      } else {
          alert(`⏸️ Autopilot DISATTIVATO. I messaggi sono in pausa.`)
      }
      setAutopilotActive(!autopilotActive)
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-white text-[#00665E] font-bold animate-pulse">Inizializzazione Nurturing AI...</div>

  const currentPreview = campaignData.length > 0 
    ? (campaignData.find((m: any) => m.id === activeMessage) || campaignData[0])
    : null

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER E LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
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
                      {campaignData.length > 0 ? (
                        campaignData.map((item: any) => (
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
                      ))
                    ) : (
                        <div className="md:col-span-2 p-12 bg-white border border-dashed border-gray-200 rounded-3xl text-center">
                            <p className="text-gray-400 font-bold text-sm">Nessuna campagna attiva. Configura il settore e clicca "Scrivi Mese" per iniziare.</p>
                        </div>
                    )}
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
                  
                  {/* CONFIGURAZIONE GIORNO E ORA */}
                  <div className={`grid grid-cols-2 gap-3 mb-4 ${autopilotActive ? 'opacity-70' : ''}`}>
                      <div>
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${autopilotActive ? 'text-emerald-100' : 'text-gray-400'}`}>Giorno</label>
                          <select
                              value={autopilotDay}
                              onChange={e => setAutopilotDay(e.target.value)}
                              disabled={autopilotActive}
                              className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer transition ${autopilotActive ? 'bg-emerald-400 border-emerald-300 text-white' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-purple-500'}`}
                          >
                              {['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'].map(d => (
                                  <option key={d} value={d}>{d}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${autopilotActive ? 'text-emerald-100' : 'text-gray-400'}`}>Orario</label>
                          <input
                              type="time"
                              value={autopilotTime}
                              onChange={e => setAutopilotTime(e.target.value)}
                              disabled={autopilotActive}
                              className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition ${autopilotActive ? 'bg-emerald-400 border-emerald-300 text-white' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-purple-500'}`}
                          />
                      </div>
                  </div>

                  <p className={`text-sm font-medium leading-relaxed ${autopilotActive ? 'text-emerald-50' : 'text-gray-500'}`}>
                      {autopilotActive 
                          ? `✅ Attivo. Messaggi programmati ogni ${autopilotDay} alle ${autopilotTime} per tutti i contatti CRM.` 
                          : 'Spento. Configura giorno e orario, poi attiva per inviare automaticamente.'}
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
                      <div className="bg-[#E5DDD5] p-4 overflow-y-auto flex flex-col gap-4 relative rounded-b-[28px] pb-10">
                          {/* Pattern Background WhatsApp */}
                          <div className="absolute inset-0 opacity-10 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] mix-blend-multiply pointer-events-none"></div>
                          
                          {currentPreview ? (
                              <>
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
                              </>
                          ) : (
                              <div className="flex-1 flex items-center justify-center text-gray-400 text-center text-xs p-4 relative z-10">
                                  Configura una campagna per vedere l'anteprima qui.
                              </div>
                          )}
                      </div>
              </div>

          </div>
      </div>
    </main>
  )
}