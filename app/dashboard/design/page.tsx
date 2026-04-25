'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Palette, PackageOpen, LayoutTemplate, Sparkles, 
    BrainCircuit, Loader2, Download, Eye, Activity, 
    Wand2, Image as ImageIcon, CheckCircle2, RefreshCw, 
    Layers, ScanEye, Upload, X, FileArchive, Link as LinkIcon
} from 'lucide-react'

export default function DesignStudioPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // LIMITI PIANO
  const aiCreditsLimit: any = { 'Base': 50, 'Enterprise': 500, 'Ambassador': 'Illimitati' }
  const [creditsUsed, setCreditsUsed] = useState(45)

  // STATI UI
  const [activeTab, setActiveTab] = useState<'packaging' | 'rebranding' | 'neuromarketing'>('packaging')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState('')
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null)

  // STATI FORM PACKAGING
  const [productType, setProductType] = useState('Cosmetica - Crema Viso')
  const [targetAudience, setTargetAudience] = useState('Donne 25-40, Eco-friendly')
  const [vibe, setVibe] = useState('Minimalista e Naturale')

  // STATI FORM REBRANDING
  const [oldLogo, setOldLogo] = useState<string | null>(null)
  const [brandValues, setBrandValues] = useState('Affidabilità, Innovazione')
  const [rebrandStyle, setRebrandStyle] = useState('Corporate / Moderno')

  // STATI FORM NEUROMARKETING
  const [neuroSource, setNeuroSource] = useState<'upload' | 'launchpad'>('upload')
  const [neuroFile, setNeuroFile] = useState<string | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState('Landing Page Black Friday')

  // RISULTATI GENERATI
  const [generatedResults, setGeneratedResults] = useState<any>(null)

  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          setUser(user)
          const { data: profile } = await supabase.from('profiles').select('plan, company_name').eq('id', user.id).single()
          if (profile) setCurrentPlan(profile.plan || 'Base')
          
          // Carica progetti esistenti
          const { data: projData } = await supabase.from('creative_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
          if (projData) setProjects(projData)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  // GESTORI UPLOAD FILE FINTI
  const handleLogoUpload = (e: any) => {
      if(e.target.files[0]) setOldLogo(e.target.files[0].name)
  }
  const handleNeuroUpload = (e: any) => {
      if(e.target.files[0]) setNeuroFile(e.target.files[0].name)
  }

  // 🔥 DOWNLOAD REALE (Genera un file Blob al volo e lo scarica sul PC)
  const triggerRealDownload = (fileName: string) => {
      // Testo contenuto nel file scaricato
      const fileContent = `=========================================
INTEGRA OS - AI CREATIVE STUDIO
=========================================
File richiesto: ${fileName}
Data generazione: ${new Date().toLocaleString('it-IT')}

Questo è un file di test generato dal tuo browser.
In un ambiente di produzione reale, questo file conterrà:
- I rendering ad alta risoluzione (JPG/PNG).
- I file vettoriali originali (SVG/AI).
- Il report completo del neuromarketing in PDF.

Grazie per aver utilizzato IntegraOS!`;

      // Cambiamo l'estensione in .txt per assicurarci che il PC dell'utente lo legga senza errori
      const safeFileName = fileName.replace('.jpg', '.txt').replace('.zip', '.txt');

      // Creazione tecnica del file e avvio download automatico
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = safeFileName;
      document.body.appendChild(a);
      a.click(); // Simula il click sul link
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
  }

  // MOTORE GENERATIVO REALE
  const handleGenerate = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (currentPlan !== 'Ambassador' && creditsUsed >= aiCreditsLimit[currentPlan]) {
          return alert(`Hai esaurito i tuoi ${aiCreditsLimit[currentPlan]} Crediti. Fai l'upgrade al piano Enterprise!`)
      }

      setIsGenerating(true)
      
      const generationTexts = {
          packaging: 'Analisi mercato e rendering 3D...',
          rebranding: 'Vettorializzazione e studio font...',
          neuromarketing: 'Eye-Tracking predittivo in corso...'
      };
      setGenerationStep(generationTexts[activeTab]);

      try {
          const resp = await fetch('/api/ai/creative', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: activeTab,
                  companyName: user.user_metadata?.company_name || 'La Tua Azienda',
                  inputs: activeTab === 'packaging' ? { productType, targetAudience, vibe } : 
                          activeTab === 'rebranding' ? { brandValues, rebrandStyle, oldLogo } : 
                          { selectedCampaign, fileName: neuroFile }
              })
          });

          const aiResult = await resp.json();
          if (aiResult.error) throw new Error(aiResult.error);

          const finalResult = { ...aiResult, type: activeTab };
          setGeneratedResults(finalResult);

          // SALVATAGGIO SU SUPABASE
          await supabase.from('creative_projects').insert({
              user_id: user.id,
              type: activeTab,
              input_params: { productType, targetAudience, vibe, brandValues, rebrandStyle, selectedCampaign },
              result_json: finalResult
          });

          // Aggiorna crediti locali (e potenzialmente nel profilo DB)
          setCreditsUsed(prev => prev + 5);
          
      } catch (err: any) {
          console.error('Creative Studio error:', err)
          const msg = err.message || 'Errore sconosciuto'
          if (msg.toLowerCase().includes('gemini') || msg.toLowerCase().includes('chiave')) {
              alert(`⚠️ Errore configurazione AI: La chiave API Gemini potrebbe non essere attiva.\n\nDettaglio: ${msg}\n\nContatta il supporto IntegraOS se il problema persiste.`)
          } else {
              alert(`Errore AI Creative Studio: ${msg}`)
          }
      } finally {
          setIsGenerating(false)
      }
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Avvio Motore Grafico AI...</div>

  return (
    <main className="flex-1 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20 relative">
      
      {/* HEADER & CREDITS */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 relative">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-[#00665E]">
              <Palette size={32} className="text-purple-600"/> AI Creative Studio
          </h1>
          <p className="text-gray-500 text-sm mt-1">Direzione artistica basata sui dati. Analizza, disegna e converti.</p>
        </div>
        
        <div className="flex flex-col items-end mt-4 md:mt-0">
            <div className="bg-purple-50 border border-purple-100 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <Sparkles className={currentPlan === 'Ambassador' ? "text-purple-500" : creditsUsed >= aiCreditsLimit[currentPlan] * 0.9 ? "text-rose-500" : "text-purple-500"} size={20}/>
                <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold text-purple-800 uppercase tracking-widest">Crediti Generativi ({currentPlan})</span>
                    <span className={`font-bold text-sm ${currentPlan === 'Ambassador' ? 'text-purple-600' : creditsUsed >= aiCreditsLimit[currentPlan] * 0.9 ? 'text-rose-600' : 'text-purple-900'}`}>
                        {currentPlan === 'Ambassador' ? 'Illimitati' : `${creditsUsed} / ${aiCreditsLimit[currentPlan]}`}
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="px-8 py-4 flex flex-wrap gap-2 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
          <button onClick={() => {setActiveTab('packaging'); setGeneratedResults(null)}} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'packaging' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><PackageOpen size={16}/> Sviluppo Packaging</button>
          <button onClick={() => {setActiveTab('rebranding'); setGeneratedResults(null)}} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'rebranding' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutTemplate size={16}/> Rebranding & Logo</button>
          <button onClick={() => {setActiveTab('neuromarketing'); setGeneratedResults(null)}} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${activeTab === 'neuromarketing' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}><ScanEye size={16}/> Neuro-Marketing (Heatmap)</button>
      </div>

      <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNA SINISTRA: WIZARD CONFIGURAZIONE */}
          <div className="lg:col-span-4 xl:col-span-5 space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <h2 className="text-xl font-black text-[#00665E] mb-6 flex items-center gap-2 relative z-10">
                      <Wand2 className="text-purple-600"/> 
                      {activeTab === 'packaging' ? 'Generatore Packaging 3D' : activeTab === 'rebranding' ? 'Studio Vettoriale Logo' : 'Eye-Tracking Predittivo'}
                  </h2>

                  <form onSubmit={handleGenerate} className="space-y-5 relative z-10">
                      
                      {activeTab === 'packaging' && (
                          <div className="animate-in fade-in space-y-4">
                              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Cosa vuoi confezionare?</label><input required type="text" value={productType} onChange={e=>setProductType(e.target.value)} placeholder="Es. Bottiglia Olio EVO, Scatola Scarpe..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm font-bold"/></div>
                              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Target Clienti (Per chi è?)</label><input required type="text" value={targetAudience} onChange={e=>setTargetAudience(e.target.value)} placeholder="Es. Millenials, Alta capacità di spesa..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm"/></div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Stile Grafico Desiderato</label>
                                  <select value={vibe} onChange={e=>setVibe(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm cursor-pointer shadow-sm">
                                      <option value="Minimalista">Minimalista e Naturale</option>
                                      <option value="Luxury">Luxury ed Esclusivo (Oro/Nero)</option>
                                      <option value="Pop">Pop Art e Colori Accesi</option>
                                  </select>
                              </div>
                          </div>
                      )}

                      {activeTab === 'rebranding' && (
                          <div className="animate-in fade-in space-y-4">
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-800 mb-4">L'AI analizzerà la struttura del tuo vecchio logo e ne genererà versioni vettoriali moderne rispettando i valori inseriti.</div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Carica Logo Attuale (Opzionale)</label>
                                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 flex items-center justify-center relative hover:border-[#00665E] transition cursor-pointer">
                                      <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                      <div className="flex flex-col items-center">
                                          <Upload size={20} className="text-purple-400 mb-1"/>
                                          <span className="text-xs font-bold text-purple-600">{oldLogo ? oldLogo : 'Carica Immagine'}</span>
                                      </div>
                                  </div>
                              </div>
                              <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Valori del Brand</label><input required type="text" value={brandValues} onChange={e=>setBrandValues(e.target.value)} placeholder="Es. Sicurezza, Lusso, Velocità" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm"/></div>
                              <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Stile Rebranding</label>
                                  <select value={rebrandStyle} onChange={e=>setRebrandStyle(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm cursor-pointer shadow-sm">
                                      <option value="Corporate">Corporate e Moderno (B2B)</option>
                                      <option value="Creativo">Creativo e Organico</option>
                                      <option value="Flat">Flat Design (Minimal)</option>
                                  </select>
                              </div>
                          </div>
                      )}

                      {activeTab === 'neuromarketing' && (
                          <div className="animate-in fade-in space-y-4">
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-xs text-purple-800 leading-relaxed">
                                  <b>Vuoi lanciare una campagna o stampare dei volantini?</b> L'AI simulerà lo sguardo umano per dirti cosa verrà letto e cosa verrà ignorato dal cliente.
                              </div>
                              
                              <div className="flex bg-gray-100 p-1 rounded-lg">
                                  <button type="button" onClick={() => setNeuroSource('upload')} className={`flex-1 text-xs py-2 rounded-md font-bold transition ${neuroSource === 'upload' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>Carica Immagine</button>
                                  <button type="button" onClick={() => setNeuroSource('launchpad')} className={`flex-1 text-xs py-2 rounded-md font-bold transition flex items-center justify-center gap-1 ${neuroSource === 'launchpad' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}><LinkIcon size={12}/> Da Launchpad</button>
                              </div>

                              {neuroSource === 'upload' ? (
                                  <div>
                                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-[#00665E] hover:bg-purple-50 transition relative">
                                          <input type="file" required onChange={handleNeuroUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                          <ImageIcon size={32} className="text-purple-400 mb-2"/>
                                          <span className="text-sm font-bold text-purple-600">{neuroFile ? neuroFile : 'Sfoglia File dal PC'}</span>
                                      </div>
                                  </div>
                              ) : (
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Analizza Asset CRM IntegraOS</label>
                                      <select value={selectedCampaign} onChange={e=>setSelectedCampaign(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:border-[#00665E] text-sm cursor-pointer shadow-sm font-medium">
                                          <option value="Landing Page Black Friday">Landing Page "Black Friday"</option>
                                          <option value="Newsletter Promozionale">Layout Newsletter Mensile</option>
                                          <option value="Social Post">Design Post Instagram Vendita</option>
                                      </select>
                                  </div>
                              )}
                          </div>
                      )}

                      <button 
                          type="submit" 
                          disabled={isGenerating}
                          className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-6"
                      >
                          {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <BrainCircuit size={18}/>}
                          {isGenerating ? 'Elaborazione Motore Grafico...' : 'Genera con AI (5 Crediti)'}
                      </button>
                  </form>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                  <Activity className="absolute -right-4 -bottom-4 text-slate-700" size={100} opacity={0.5}/>
                  <h3 className="font-black flex items-center gap-2 mb-3 relative z-10"><Activity size={18} className="text-emerald-400"/> Tips di Re-Marketing</h3>
                  <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                      Sapevi che un restyling del packaging o un layout analizzato dal neuromarketing aumenta le conversioni a scaffale dell'<b>11.5%</b>? Usa questo strumento prima di mandare in stampa i materiali e sprecare soldi.
                  </p>
              </div>

              {/* CRONOLOGIA PROGETTI */}
              {projects.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                        <RefreshCw size={16} className="text-[#00665E]"/> Progetti Recenti
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {projects.map((p) => (
                            <button 
                                key={p.id} 
                                onClick={() => setGeneratedResults(p.result_json)}
                                className="w-full text-left p-3 rounded-xl hover:bg-purple-50 border border-transparent hover:border-purple-100 transition group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-black uppercase text-purple-600">{p.type}</span>
                                    <span className="text-[9px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs font-bold text-gray-800 truncate group-hover:text-purple-900">{p.result_json.title || 'Senza Titolo'}</p>
                            </button>
                        ))}
                    </div>
                </div>
              )}
          </div>

          {/* COLONNA DESTRA: L'AREA DI RENDER / RISULTATI */}
          <div className="lg:col-span-8 xl:col-span-7 flex flex-col h-full">
              
              {!isGenerating && !generatedResults ? (
                  <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400 p-10 min-h-[500px] bg-white/50">
                      <Layers size={64} className="mb-4 opacity-20"/>
                      <h3 className="text-xl font-black text-gray-900 mb-2 text-center">La Tela AI è Vuota</h3>
                      <p className="text-sm text-center max-w-md">Compila i parametri a sinistra. Il super-computer grafico genererà rendering fotorealistici, loghi vettoriali o mappe di calore basate sullo sguardo umano.</p>
                  </div>
              ) : isGenerating ? (
                  <div className="flex-1 bg-white border border-gray-200 rounded-3xl flex flex-col items-center justify-center shadow-xl min-h-[500px] relative overflow-hidden">
                      <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6 relative">
                          <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-ping opacity-20"></div>
                          <RefreshCw size={40} className="text-[#00665E] animate-spin"/>
                      </div>
                      <h3 className="text-2xl font-black text-[#00665E] mb-2">Motore Grafico in funzione</h3>
                      <p className="text-purple-600 font-bold text-sm tracking-widest uppercase animate-pulse">{generationStep}</p>
                  </div>
              ) : (
                  <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                      
                      <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
                          <h2 className="text-xl font-black flex items-center gap-2"><CheckCircle2 className="text-emerald-400"/> {generatedResults.title}</h2>
                          <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Score Efficacia</span>
                              <span className={`font-black ${generatedResults.score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{generatedResults.score}/100</span>
                          </div>
                      </div>

                      <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                          
                          <div className="bg-purple-50 border border-purple-100 p-5 rounded-2xl mb-6 relative">
                              <BrainCircuit className="absolute top-4 right-4 text-purple-200 opacity-50" size={40}/>
                              <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Razionale Strategico AI</p>
                              <p className="text-sm font-medium text-purple-900 leading-relaxed pr-8">{generatedResults.rationale}</p>
                          </div>

                          <div className={`grid gap-4 ${generatedResults.type === 'neuromarketing' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                              {generatedResults.images.map((img: string, idx: number) => (
                                  <div key={idx} className={`relative group rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white ${generatedResults.type === 'neuromarketing' ? 'aspect-video' : 'aspect-square'}`}>
                                      
                                      <img src={img} alt="AI Generated" className="w-full h-full object-cover group-hover:scale-105 transition duration-700"/>
                                      
                                      {generatedResults.type === 'neuromarketing' && (
                                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,0,0,0.6)_0%,rgba(255,165,0,0.4)_25%,rgba(0,255,0,0.1)_50%,transparent_70%)] mix-blend-multiply pointer-events-none z-10"></div>
                                      )}
                                      
                                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center gap-4 backdrop-blur-sm z-20">
                                          <button onClick={() => setFullscreenImg(img)} className="bg-white text-gray-900 p-3 rounded-full hover:scale-110 transition shadow-lg" title="Espandi a schermo intero"><Eye size={20}/></button>
                                          <button onClick={() => triggerRealDownload(`Generazione_AI_${idx+1}.jpg`)} className="bg-[#00665E] text-white p-3 rounded-full hover:scale-110 transition shadow-lg" title="Scarica Alta Risoluzione"><Download size={20}/></button>
                                      </div>
                                      
                                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded z-20">
                                          {generatedResults.type === 'neuromarketing' ? 'Mappa di Calore Attiva' : `Variante ${idx + 1}`}
                                      </div>
                                  </div>
                              ))}
                          </div>

                      </div>

                      <div className="p-5 border-t border-gray-200 bg-white shrink-0 flex justify-between items-center">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden md:block"><Sparkles size={12} className="inline mr-1"/> Diritti d'uso commerciali inclusi</p>
                          <button onClick={() => triggerRealDownload('Pacchetto_Creativo_Completo.zip')} className="w-full md:w-auto bg-gray-900 text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-black transition shadow-md flex items-center justify-center gap-2">
                              <FileArchive size={16}/> Scarica Pacchetto Completo (ZIP)
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* LIGHTBOX MODAL (Schermo intero) */}
      {fullscreenImg && (
          <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setFullscreenImg(null)}>
              <button onClick={() => setFullscreenImg(null)} className="absolute top-6 right-6 text-white hover:text-purple-400 transition"><X size={32}/></button>
              <div className="relative max-w-5xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                  <img src={fullscreenImg} alt="Fullscreen" className="w-full h-full object-contain" />
                  
                  {generatedResults?.type === 'neuromarketing' && (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(255,0,0,0.6)_0%,rgba(255,165,0,0.4)_25%,rgba(0,255,0,0.1)_50%,transparent_70%)] mix-blend-multiply pointer-events-none z-10"></div>
                  )}

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                      <button onClick={() => triggerRealDownload('Immagine_HD.jpg')} className="bg-[#00665E] text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg hover:bg-[#004d46] transition">
                          <Download size={18}/> Scarica HD
                      </button>
                  </div>
              </div>
          </div>
      )}

    </main>
  )
}