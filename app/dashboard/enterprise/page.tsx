'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { 
    CheckCircle2, Sparkles, Lock, Unlock, X, ArrowRight, 
    Zap, Crown, Check, Minus, Infinity, Activity 
} from 'lucide-react'

// --- DATABASE FUNZIONI PREMIUM DI INTEGRA OS ---
const featuresData = {
  // FUNZIONI ENTERPRISE
  agents: { id: 'agents', type: 'ENTERPRISE', emoji: '💼', title: 'Nexus Hub & Agent Portal', subtitle: 'Gestisci la forza vendita.', desc: 'Crea portali privati per i tuoi agenti o negozi. Assegna app come il Terminale Punti e il Preventivatore Smart Quote.', color: 'from-teal-600 to-emerald-600' },
  automations: { id: 'automations', type: 'ENTERPRISE', emoji: '⚡', title: 'Zap Automations', subtitle: 'Il motore logico visivo.', desc: 'Costruisci flussi automatizzati stile Zapier. (Es: Se carrello abbandonato -> Invia SMS dopo 2 ore).', color: 'from-amber-500 to-orange-500', isNew: true },
  finance: { id: 'finance', type: 'ENTERPRISE', emoji: '📊', title: 'Finance ERP', subtitle: 'Emissione Fatture SdI.', desc: 'Modulo amministrativo per fatturazione elettronica, DDT, monitoraggio costi e ricavi.', color: 'from-blue-600 to-indigo-600' },
  energy: { id: 'energy', type: 'ENTERPRISE', emoji: '🌱', title: 'Energy & ESG Monitor', subtitle: 'Controllo sprechi energetici.', desc: 'Analizza le bollette tramite OCR AI. Trova sprechi occulti e genera il report europeo ESG di sostenibilità.', color: 'from-green-500 to-emerald-700', isNew: true },
  affiliate: { id: 'affiliate', type: 'ENTERPRISE', emoji: '🤝', title: 'Cross-Promo & Affiliazioni', subtitle: 'Alleanze strategiche B2B.', desc: 'Collegati ad altre aziende su IntegraOS, scambiatevi visibilità e dividete automaticamente le commissioni.', color: 'from-pink-600 to-rose-500' },
  pulse: { id: 'pulse', type: 'ENTERPRISE', emoji: '❤️', title: 'Pulse Check-in (HR)', subtitle: 'Prevenzione Burnout Team.', desc: 'Monitora il morale dei dipendenti a fine turno per intervenire tempestivamente sui cali di performance.', color: 'from-red-500 to-rose-600' },
  
  // FUNZIONI AMBASSADOR (AI AVANZATA)
  voice: { id: 'voice', type: 'AMBASSADOR', emoji: '🎙️', title: 'AI Voice Centralino', subtitle: 'Risponde al telefono per te.', desc: 'Un assistente vocale AI che risponde alle chiamate 24/7, capisce il cliente e fissa appuntamenti in agenda.', color: 'from-purple-600 to-fuchsia-600', isNew: true },
  cfo: { id: 'cfo', type: 'AMBASSADOR', emoji: '🧠', title: 'CFO AI', subtitle: 'Il tuo Direttore Finanziario.', desc: 'L\'AI analizza i bilanci del Finance ERP e ti suggerisce esattamente quali costi tagliare per aumentare l\'utile.', color: 'from-indigo-600 to-violet-800' },
  radar: { id: 'radar', type: 'AMBASSADOR', emoji: '📡', title: 'Radar Media & AI Planner', subtitle: 'Pianifica le tue pubblicità.', desc: 'Trova radio e TV locali. Inserisci il tuo budget e l\'AI genererà il Media Plan ideale massimizzando il ROI.', color: 'from-sky-500 to-blue-700' },
  heatmap: { id: 'heatmap', type: 'AMBASSADOR', emoji: '🔥', title: 'AI Neuro-Marketing', subtitle: 'Mappe di calore predittive.', desc: 'Simula lo sguardo umano sui tuoi volantini prima di stamparli, per capire cosa guarderà davvero il cliente.', color: 'from-orange-500 to-red-600' },
  nurturing: { id: 'nurturing', type: 'AMBASSADOR', emoji: '🎁', title: 'Nurturing Engine AI', subtitle: 'Regali e consigli automatici.', desc: 'L\'AI scrive e invia consigli utili via WhatsApp ai tuoi clienti (es. ricette, manutenzione) per fidelizzarli.', color: 'from-yellow-400 to-amber-600', isNew: true }
}

const PLAN_LEVELS: Record<string, number> = { 'Base': 0, 'Enterprise': 1, 'Ambassador': 2 }
const FEAT_LEVELS: Record<string, number> = { 'ENTERPRISE': 1, 'AMBASSADOR': 2 }

export default function EnterprisePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const featParam = searchParams.get('feat')

  const [currentPlan, setCurrentPlan] = useState<string>('Base')
  const [loading, setLoading] = useState(true)
  
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
        if (data && data.plan) setCurrentPlan(data.plan)
      }
      setLoading(false)
    }
    fetchPlan()
  }, [])

  const enterpriseList = Object.values(featuresData).filter(f => f.type === 'ENTERPRISE')
  const ambassadorList = Object.values(featuresData).filter(f => f.type === 'AMBASSADOR')

  const handleFeatureClick = (feature: any) => {
      const userLevel = PLAN_LEVELS[currentPlan] || 0
      const reqLevel = FEAT_LEVELS[feature.type]

      if (userLevel >= reqLevel) {
          alert(`Hai già sbloccato questa funzione con il tuo piano ${currentPlan}! Puoi usarla dal menu di sinistra.`)
      } else {
          setSelectedFeature(feature)
          setUpgradeModalOpen(true)
      }
  }

  const handleCheckoutRedirect = (planName: string) => {
      router.push(`/dashboard/upgrade?plan=${planName}`)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse flex items-center gap-2"><Activity className="animate-spin"/> Verifica permessi ecosistema...</div>

  return (
    <main className="min-h-full p-6 md:p-12 font-sans flex flex-col items-center animate-fadeIn bg-[#F8FAFC] pb-24 relative overflow-hidden">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="text-center max-w-3xl mb-16 relative z-10">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
          Sblocca il vero potenziale del tuo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00665E] to-teal-500">Business</span>
        </h1>
        <p className="text-xl text-gray-600 font-light leading-relaxed mb-6">
          Il tuo piano attuale è: <span className="font-bold text-gray-900 uppercase tracking-widest bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm ml-2">{currentPlan}</span>
        </p>
      </div>

      {/* --- SEZIONE ENTERPRISE --- */}
      <section className="w-full max-w-6xl mb-24 relative z-10">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-teal-400 to-[#00665E] p-3.5 rounded-2xl text-white shadow-lg"><CheckCircle2 size={32}/></div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Piano Enterprise</h2>
                    <p className="text-gray-500">Gestione totale del team, amministrazione ERP, Automazioni e Sostenibilità.</p>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enterpriseList.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} highlight={featParam === feature.id} currentPlan={currentPlan} onClick={() => handleFeatureClick(feature)}/>
            ))}
        </div>
      </section>

      {/* --- SEZIONE AMBASSADOR --- */}
      <section className="w-full max-w-6xl mb-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3.5 rounded-2xl text-white shadow-lg"><Sparkles size={32}/></div>
                <div>
                    <h2 className="text-3xl font-black text-gray-900">Piano Ambassador (AI)</h2>
                    <p className="text-gray-500">Il futuro: Intelligenza Artificiale Generativa e Agenti Vocali Autonomi.</p>
                </div>
            </div>
            <div className="bg-white border border-purple-200 shadow-md px-5 py-3.5 rounded-2xl flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-600"><Crown size={20}/></div>
                <p className="text-xs font-bold text-gray-700 leading-tight">Il piano Ambassador include<br/><span className="text-purple-600">tutte le funzioni Enterprise.</span></p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ambassadorList.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} highlight={featParam === feature.id} currentPlan={currentPlan} onClick={() => handleFeatureClick(feature)} />
            ))}
        </div>
      </section>

      {/* --- TABELLA COMPARATIVA LIMITI (AGGIORNATA) --- */}
      <section className="w-full max-w-6xl mb-10 relative z-10">
          <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Confronta i Limiti dei Piani</h2>
              <p className="text-gray-500">Trasparenza totale su risorse e capacità del tuo ecosistema IntegraOS.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr>
                          <th className="p-6 bg-gray-50 border-b border-r w-1/4">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Risorsa / Modulo</span>
                          </th>
                          <th className="p-6 bg-white border-b border-r text-center w-1/4">
                              <h3 className="font-black text-xl text-gray-900">Base</h3>
                              <p className="text-gray-500 font-bold mt-1">€99 <span className="text-xs font-normal">/mese</span></p>
                          </th>
                          <th className="p-6 bg-teal-50/30 border-b border-r text-center border-t-4 border-t-teal-500 w-1/4 relative">
                              <h3 className="font-black text-xl text-teal-700">Enterprise</h3>
                              <p className="text-gray-500 font-bold mt-1">€199 <span className="text-xs font-normal">/mese</span></p>
                          </th>
                          <th className="p-6 bg-purple-50/30 border-b text-center border-t-4 border-t-purple-500 w-1/4 relative">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-b-lg shadow-sm">Scelta Vincente</div>
                              <h3 className="font-black text-xl text-purple-700 mt-2">Ambassador</h3>
                              <p className="text-gray-500 font-bold mt-1">€499 <span className="text-xs font-normal">/mese</span></p>
                          </th>
                      </tr>
                  </thead>
                  <tbody className="text-sm font-medium text-gray-700 divide-y divide-gray-100">
                      
                      {/* VENDITE E CRM */}
                      <tr><td colSpan={4} className="bg-gray-50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Vendite & CRM</td></tr>
                      <TableRow label="Fidelity Card Attive" base="500" ent="5.000" amb="20.000" />
                      <TableRow label="Agenti / Operatori (Agent Portal)" base="5" ent="15" amb="50" />
                      <TableRow label="Sedi / Punti Vendita" base="3" ent="10" amb="30" />
                      <TableRow label="Preventivi Inviati (Smart Quote)" base="100" ent="1.000" amb={<Infinity size={18} className="mx-auto"/>} />
                      <TableRow label="Aziende Affiliate (Cross-Promo)" base="5" ent="20" amb={<Infinity size={18} className="mx-auto"/>} />
                      
                      {/* AUTOMAZIONI E AMMINISTRAZIONE */}
                      <tr><td colSpan={4} className="bg-gray-50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Amministrazione & Automazioni</td></tr>
                      <TableRow label="Fatture ERP / SdI" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent="Ilimitate" amb={<Infinity size={18} className="mx-auto"/>} />
                      <TableRow label="Operazioni Zap Automations" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent="1.000 / mese" amb="10.000 / mese" />
                      <TableRow label="Audit Energetici ESG" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent="10 / mese" amb={<Infinity size={18} className="mx-auto"/>} />
                      <TableRow label="Spazio Database Storage" base="500 MB" ent="5 GB" amb="50 GB" />

                      {/* MARKETING E DESIGN */}
                      <tr><td colSpan={4} className="bg-gray-50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Marketing & Pubblicità</td></tr>
                      <TableRow label="Landing Pages Generate" base="3" ent="15" amb={<Infinity size={18} className="mx-auto"/>} />
                      <TableRow label="Volantini Digitali" base="10" ent="50" amb={<Infinity size={18} className="mx-auto"/>} />
                      <TableRow label="Crediti Creative Studio" base="10 / mese" ent="50 / mese" amb="200 / mese" />
                      <TableRow label="Radar Media Locali (Scansioni)" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent={<Minus size={18} className="mx-auto text-gray-300"/>} amb="Illimitate" />

                      {/* INTELLIGENZA ARTIFICIALE (Con nuova riga Performance AI) */}
                      <tr><td colSpan={4} className="bg-purple-50/50 p-2 text-center text-[10px] font-black uppercase tracking-widest text-purple-400">Intelligenza Artificiale (AI)</td></tr>
                      
                      {/* NUOVA RIGA AGGIUNTA QUI */}
                      <TableRow label="Valutazioni AI & Coaching (HR)" base="5 / mese" ent="20 / mese" amb="Illimitate" />
                      
                      <TableRow label="Interazioni AI Chat (Agenti Omnicanale)" base="1.000" ent="5.000" amb="30.000" />
                      <TableRow label="Contatti Nurturing AI (Regali/Consigli)" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent={<Minus size={18} className="mx-auto text-gray-300"/>} amb="5.000 / mese" />
                      <TableRow label="Analisi CFO AI (Finanza)" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent={<Minus size={18} className="mx-auto text-gray-300"/>} amb={<Check size={18} className="mx-auto text-green-500"/>} />
                      <TableRow label="Heatmaps (Neuro-Marketing)" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent={<Minus size={18} className="mx-auto text-gray-300"/>} amb="Illimitate" />
                      <TableRow label="Minuti AI Voice (Centralino Telefonico)" base={<Minus size={18} className="mx-auto text-gray-300"/>} ent={<Minus size={18} className="mx-auto text-gray-300"/>} amb="500 Min / mese" />
                  </tbody>
                  <tfoot>
                      <tr>
                          <td className="p-6 border-r border-t bg-gray-50"></td>
                          <td className="p-6 border-r border-t bg-white text-center">
                              {currentPlan === 'Base' ? <span className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-xs">Piano Attuale</span> : null}
                          </td>
                          <td className="p-6 border-r border-t bg-teal-50/30 text-center">
                              {currentPlan === 'Enterprise' ? <span className="bg-teal-200 text-teal-800 px-4 py-2 rounded-lg font-bold text-xs shadow-sm">Piano Attuale</span> : 
                               <button onClick={() => handleCheckoutRedirect('Enterprise')} className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition w-full shadow-lg">Scegli Enterprise</button>}
                          </td>
                          <td className="p-6 border-t bg-purple-50/30 text-center">
                               {currentPlan === 'Ambassador' ? <span className="bg-purple-200 text-purple-800 px-4 py-2 rounded-lg font-bold text-xs shadow-sm">Piano Attuale</span> : 
                               <button onClick={() => handleCheckoutRedirect('Ambassador')} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition w-full shadow-lg shadow-purple-500/30">Scegli Ambassador</button>}
                          </td>
                      </tr>
                  </tfoot>
              </table>
          </div>
      </section>

      {/* --- MODALE UPGRADE DINAMICO --- */}
      {upgradeModalOpen && selectedFeature && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                
                <div className={`p-8 bg-gradient-to-br ${selectedFeature.color} text-white relative`}>
                    <button onClick={() => setUpgradeModalOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full transition"><X size={20}/></button>
                    <div className="text-5xl mb-4">{selectedFeature.emoji}</div>
                    <h2 className="text-2xl font-black mb-1">Sblocca "{selectedFeature.title}"</h2>
                    <p className="font-medium opacity-90 text-sm">Questa funzione richiede un aggiornamento del tuo piano attuale ({currentPlan}).</p>
                </div>

                <div className="p-8 bg-gray-50 flex flex-col gap-4">
                    <p className="text-gray-700 text-center font-bold mb-2">Scegli il piano a cui vuoi passare:</p>
                    
                    {currentPlan === 'Base' && selectedFeature.type === 'ENTERPRISE' && (
                        <div onClick={() => handleCheckoutRedirect('Enterprise')} className="bg-white border-2 border-teal-500 rounded-2xl p-5 shadow-md flex items-center justify-between group hover:bg-teal-50 cursor-pointer transition">
                            <div>
                                <h3 className="text-xl font-black text-teal-700 flex items-center gap-2">Enterprise <CheckCircle2 size={18}/></h3>
                                <p className="text-xs text-gray-500 mt-1">Sblocca {selectedFeature.title} e le funzioni business.</p>
                            </div>
                            <button className="bg-teal-600 text-white font-bold px-4 py-2 rounded-xl group-hover:bg-teal-700 transition shadow-sm flex items-center gap-1">Acquista <ArrowRight size={14}/></button>
                        </div>
                    )}

                    <div onClick={() => handleCheckoutRedirect('Ambassador')} className="bg-white border-2 border-purple-500 rounded-2xl p-5 shadow-md flex items-center justify-between group hover:bg-purple-50 cursor-pointer transition relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg">Scelta Migliore</div>
                        <div>
                            <h3 className="text-xl font-black text-purple-700 flex items-center gap-2">Ambassador <Sparkles size={18}/></h3>
                            <p className="text-xs text-gray-500 mt-1">Sblocca TUTTO: Enterprise + Intelligenza Artificiale.</p>
                        </div>
                        <button className="bg-purple-600 text-white font-bold px-4 py-2 rounded-xl group-hover:bg-purple-700 transition shadow-sm flex items-center gap-1">Acquista <ArrowRight size={14}/></button>
                    </div>

                    <button onClick={() => setUpgradeModalOpen(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 mt-4">Ci penserò più tardi</button>
                </div>
            </div>
        </div>
      )}

    </main>
  )
}

function TableRow({ label, base, ent, amb }: any) {
    return (
        <tr className="hover:bg-gray-50/50 transition">
            <td className="p-4 border-r border-gray-100">{label}</td>
            <td className="p-4 border-r border-gray-100 text-center">{base}</td>
            <td className="p-4 border-r border-gray-100 text-center font-bold text-teal-700">{ent}</td>
            <td className="p-4 text-center font-bold text-purple-700">{amb}</td>
        </tr>
    )
}

function FeatureCard({ feature, highlight, currentPlan, onClick }: { feature: any, highlight: boolean, currentPlan: string, onClick: () => void }) {
    const userLevel = PLAN_LEVELS[currentPlan] || 0
    const reqLevel = FEAT_LEVELS[feature.type]
    const isUnlocked = userLevel >= reqLevel

    return (
      <div onClick={onClick} className={`bg-white rounded-3xl shadow-xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full relative cursor-pointer ${highlight ? 'ring-4 ring-offset-2 ring-indigo-500 scale-[1.02]' : 'border-gray-100'}`}>
        {feature.isNew && <div className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black uppercase py-1 px-3 rounded-full z-10 shadow-lg animate-pulse">Novità</div>}
        <div className={`absolute top-4 right-4 text-[10px] font-black uppercase py-1 px-3 rounded-full z-10 shadow-sm flex items-center gap-1 backdrop-blur-md ${isUnlocked ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white'}`}>
            {isUnlocked ? <><Unlock size={12}/> Attivo</> : <><Lock size={12}/> Chiuso</>}
        </div>
        <div className={`bg-gradient-to-br ${feature.color} p-8 flex justify-center items-center relative overflow-hidden h-40 shrink-0 ${!isUnlocked && 'grayscale-[30%]'}`}>
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="text-6xl relative z-10 filter drop-shadow-md transform transition group-hover:scale-110 duration-300">{feature.emoji}</div>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <h3 className="text-xl font-black text-gray-900 mb-1 leading-tight">{feature.title}</h3>
            <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-700 uppercase tracking-wider">{feature.subtitle}</p>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-grow">{feature.desc}</p>
          <div className="mt-auto">
            <button className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isUnlocked ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : `text-white shadow-md transform active:scale-95 bg-gradient-to-r ${feature.color} hover:brightness-110`}`}>
              {isUnlocked ? <><CheckCircle2 size={16}/> Sbloccato nel tuo Piano</> : <><Zap size={16}/> Sblocca Funzione</>}
            </button>
          </div>
        </div>
      </div>
    )
}