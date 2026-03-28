'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { 
  Bot, Database, Trash2, MessageSquare, Send, Sparkles, Loader2, 
  CheckCircle2, ShieldCheck, BookOpen, AlertTriangle, UploadCloud, RefreshCw, X, FileText, CheckCircle, File
} from 'lucide-react'

const MAX_MB_LIMIT = 5; 
const MAX_KB_LIMIT = MAX_MB_LIMIT * 1024; 
const MAX_CHAR_LIMIT = 50000; 

export default function AITrainingPage() {
  const [activeTab, setActiveTab] = useState<'train' | 'test'>('train')
  const [user, setUser] = useState<any>(null)
  
  const [knowledgeText, setKnowledgeText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<{name: string, content: string, sizeKB: number}[]>([]) 
  
  const [isTraining, setIsTraining] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [trainStatus, setTrainStatus] = useState<{success: boolean, msg: string} | null>(null)
  const [legalConsent, setLegalConsent] = useState(false)

  const [usedKB, setUsedKB] = useState(0) 

  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{role: 'ai' | 'user', text: string, contextFound?: boolean}[]>([
      { role: 'ai', text: 'Ciao! Sono il tuo Assistente Virtuale. Insegnami tutto sulla tua azienda nella scheda "Base di Conoscenza" caricando i tuoi file o usando i pulsanti automatici, poi testami facendomi una domanda!' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    const initUser = async () => {
        const devUserId = '00000000-0000-0000-0000-000000000000';
        setUser({ id: devUserId })
        setUsedKB(12) 
    }
    initUser()
  }, [supabase])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const textKB = new Blob([knowledgeText]).size / 1024;
  const filesKB = attachedFiles.reduce((acc, f) => acc + f.sizeKB, 0);
  const totalProjectedKB = usedKB + textKB + filesKB;
  const textLength = knowledgeText.length;

  // =========================================================================
  // MEGA-SYNC: ESTRAE DATI DA TUTTO L'ECOSISTEMA (CRM, SHOP, CAMPAGNE E SOCIAL)
  // =========================================================================
  const handleAutoSync = async () => {
      setIsSyncing(true);
      try {
          let syncText = `\n--- DATI AZIENDALI ESTRATTI IN AUTOMATICO ---\n\n`;

          // 1. PROFILO E CONTATTI
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profile) {
              syncText += `📍 INFORMAZIONI AZIENDA E SEDE:\n`;
              syncText += `Nome Azienda: ${profile.company_name || 'La Tua Azienda'}\n`;
              if(profile.company_email) syncText += `Email Ufficiale: ${profile.company_email}\n`;
              if(profile.whatsapp_number) syncText += `Telefono / WhatsApp: ${profile.whatsapp_number}\n`;
              if(profile.address) syncText += `Sede Legale/Operativa: ${profile.address}, ${profile.city || ''}\n`;
              
              if(profile.websites) {
                  syncText += `\n🌐 SITI WEB UFFICIALI:\n`;
                  if(profile.websites.main) syncText += `- Sito Principale: ${profile.websites.main}\n`;
                  if(profile.websites.ecommerce) syncText += `- Shop Online: ${profile.websites.ecommerce}\n`;
              }

              // SOCIAL NETWORK
              if(profile.social_links) {
                  syncText += `\n📱 CANALI SOCIAL E LINK:\n`;
                  const socials = profile.social_links;
                  if(socials.facebook) syncText += `- Facebook: ${socials.facebook}\n`;
                  if(socials.instagram) syncText += `- Instagram: ${socials.instagram}\n`;
                  if(socials.linkedin) syncText += `- LinkedIn: ${socials.linkedin}\n`;
                  if(socials.tiktok) syncText += `- TikTok: ${socials.tiktok}\n`;
                  if(socials.youtube) syncText += `- YouTube: ${socials.youtube}\n`;
                  if(profile.google_review_link || socials.google) syncText += `- Recensioni Google: ${profile.google_review_link || socials.google}\n`;
              }
          }

          // 2. E-COMMERCE
          const { data: products } = await supabase.from('products').select('*').eq('user_id', user.id).neq('is_deleted', true);
          if (products && products.length > 0) {
              syncText += `\n🛍️ CATALOGO PRODOTTI E PREZZI:\n`;
              products.forEach(p => {
                  syncText += `- Prodotto: ${p.name} | Categoria: ${p.category} | Prezzo: €${p.price}\n  Descrizione: ${p.description}\n`;
              });
          }

          // 3. CAMPAGNE MARKETING
          const { data: campaigns } = await supabase.from('campaigns').select('title, content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
          if (campaigns && campaigns.length > 0) {
              syncText += `\n📣 ULTIME PROMOZIONI ATTIVE:\n`;
              campaigns.forEach(c => {
                  syncText += `- Promozione: "${c.title}". Testo: ${c.content.substring(0, 150)}...\n`;
              });
          }

          setKnowledgeText(prev => prev ? prev + '\n\n' + syncText : syncText);
          alert("✅ Dati estratti con successo! Ora ci sono anche i link social e i siti web.");
      } catch (err) {
          alert("Errore durante la sincronizzazione dei dati.");
      } finally {
          setIsSyncing(false);
      }
  }

  // =========================================================================
  // GESTIONE FILE ALLEGATI (SBLOCCATO PER PDF, DOCX, PPTX)
  // =========================================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      let newAttachedFiles = [...attachedFiles];

      files.forEach(file => {
          const fileSizeKB = file.size / 1024;
          const isComplex = file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.name.endsWith('.pptx') || file.name.endsWith('.docx');
          
          if (isComplex) {
              alert(`⚠️ Hai caricato un file ${file.name.split('.').pop()?.toUpperCase()}. Il sistema proverà a leggerne il testo grezzo. Assicurati che non sia una scansione a immagini.`);
          }

          const reader = new FileReader();
          reader.onload = (event) => {
              const content = event.target?.result as string;
              newAttachedFiles.push({
                  name: file.name,
                  content: content,
                  sizeKB: fileSizeKB
              });
              setAttachedFiles([...newAttachedFiles]);
          };
          reader.readAsText(file);
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const removeAttachedFile = (index: number) => {
      setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  }

  const handleTrainAI = async () => {
      if (!knowledgeText.trim() && attachedFiles.length === 0) return alert("Devi scrivere un testo o allegare almeno un file.");
      if (!legalConsent) return alert("Devi accettare l'informativa sulla responsabilità prima di procedere.");
      if (totalProjectedKB > MAX_KB_LIMIT) return alert(`Hai superato il limite di ${MAX_MB_LIMIT}MB totali per azienda.`);

      setIsTraining(true); setTrainStatus(null);
      
      try {
          let finalTrainingText = knowledgeText;
          attachedFiles.forEach(f => {
              finalTrainingText += `\n\n--- INIZIO DOCUMENTO ALLEGATO: ${f.name} ---\n${f.content}\n--- FINE DOCUMENTO ---`;
          });

          const res = await fetch('/api/ai/train', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: finalTrainingText, namespace: user?.id })
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error);
          
          setUsedKB(totalProjectedKB);
          setTrainStatus({ success: true, msg: `Addestramento Riuscito! L'AI ha letto e imparato ${data.chunksLearned} paragrafi della tua azienda.` });
          
          setKnowledgeText(''); 
          setAttachedFiles([]);
          setLegalConsent(false);

      } catch (err: any) {
          setTrainStatus({ success: false, msg: "Errore Backend: " + err.message });
      } finally { 
          setIsTraining(false); 
      }
  }

  const handleResetAI = async () => {
      if(!confirm("⚠️ Vuoi davvero rasare al suolo il cervello dell'AI per questa azienda?")) return;
      setIsResetting(true)
      try {
          const res = await fetch('/api/ai/reset', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ namespace: user?.id })
          });
          if (!res.ok) throw new Error("Errore durante il reset")
          
          alert("✅ Memoria Database azzerata con successo.")
          setUsedKB(0);
          setTrainStatus(null)
      } catch (err: any) { alert("Errore: " + err.message) } finally { setIsResetting(false) }
  }

  const handleChatTest = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!chatInput.trim() || isTyping) return;
      
      const userQuestion = chatInput;
      setMessages(prev => [...prev, { role: 'user', text: userQuestion }]);
      setChatInput(''); setIsTyping(true);

      try {
          const res = await fetch('/api/ai/rag-chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: userQuestion, namespace: user?.id })
          });
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          
          setMessages(prev => [...prev, { role: 'ai', text: data.response, contextFound: data.contextFound }]);
      } catch (err: any) {
          setMessages(prev => [...prev, { role: 'ai', text: "❌ Si è verificato un errore di connessione col server: " + err.message }]);
      } finally { setIsTyping(false); }
  }

  const limitPercentage = Math.min((totalProjectedKB / MAX_KB_LIMIT) * 100, 100);

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6 bg-white p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><Bot size={32} className="text-blue-600"/> Addestramento Agente AI</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Insegna alla tua Intelligenza Artificiale tutto ciò che c'è da sapere sulla tua azienda.</p>
        </div>
        <div className="flex flex-col items-end">
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shadow-sm">
                <button onClick={() => setActiveTab('train')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'train' ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><Database size={16}/> Caricamento Dati</button>
                <button onClick={() => setActiveTab('test')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'test' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><MessageSquare size={16}/> Test della Chat</button>
            </div>
            
            <div className="mt-4 w-full text-right">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Spazio Memoria: {(totalProjectedKB / 1024).toFixed(2)} MB / {MAX_MB_LIMIT} MB</p>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${limitPercentage > 90 ? 'bg-red-500' : 'bg-[#00665E]'}`} style={{width: `${limitPercentage}%`}}></div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
          {activeTab === 'train' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-left-4">
                  <div className="lg:col-span-8 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner"><BookOpen size={24}/></div>
                              <div><h2 className="text-xl font-black text-gray-900">Nozioni Aziendali</h2><p className="text-xs text-gray-500 mt-1 font-medium">L'AI userà queste regole per rispondere ai clienti.</p></div>
                          </div>
                          <div className="flex gap-2">
                              {/* INPUT ACCETTA TUTTI I FILE ADESSO */}
                              <input type="file" multiple ref={fileInputRef} accept=".txt,.csv,.json,.pdf,.docx,.pptx" onChange={handleFileUpload} className="hidden"/>
                              <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm flex items-center gap-1.5"><UploadCloud size={14}/> Allega Qualsiasi File</button>
                              <button onClick={handleAutoSync} disabled={isSyncing} className="text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl hover:bg-blue-100 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50">
                                  {isSyncing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>} {isSyncing ? 'Estrazione...' : 'Estrai da Ecosistema'}
                              </button>
                          </div>
                      </div>

                      {attachedFiles.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                              {attachedFiles.map((file, i) => (
                                  <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600">
                                      <FileText size={12} className="text-blue-500"/>
                                      <span>{file.name}</span> <span className="text-[10px] text-gray-400 font-normal">({file.sizeKB.toFixed(1)} KB)</span>
                                      <button onClick={() => removeAttachedFile(i)} className="ml-2 text-red-400 hover:text-red-600"><X size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      <div className="relative flex-1 flex flex-col">
                          <textarea 
                              className={`w-full flex-1 min-h-[250px] bg-gray-50 border rounded-2xl p-6 outline-none focus:bg-white transition text-sm text-gray-800 resize-none shadow-inner leading-relaxed ${textLength > MAX_CHAR_LIMIT ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#00665E]'}`}
                              placeholder="Puoi usare il pulsante 'Estrai da Ecosistema' qui sopra, allegare dei PDF/Word, oppure semplicemente scrivere a mano le regole." 
                              value={knowledgeText} 
                              onChange={(e) => setKnowledgeText(e.target.value)}
                          />
                          <div className={`absolute bottom-4 right-4 text-[10px] font-black px-2 py-1 rounded-lg border shadow-sm ${textLength > MAX_CHAR_LIMIT ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-400 border-gray-200'}`}>
                              {textLength} / {MAX_CHAR_LIMIT} caratteri
                          </div>
                      </div>
                      
                      <div className="mt-6 bg-red-50/50 p-4 rounded-xl border border-red-100">
                          <label className="flex items-start gap-3 cursor-pointer group">
                              <input type="checkbox" className="mt-1 w-4 h-4 accent-[#00665E] shrink-0 cursor-pointer" checked={legalConsent} onChange={e => setLegalConsent(e.target.checked)}/>
                              <span className="text-[10px] text-red-800 font-medium leading-relaxed">
                                  Dichiaro di avere i diritti sui testi e sui documenti (inclusi PDF o Word) forniti all'Intelligenza Artificiale. Sollevo la piattaforma IntegraOS da ogni responsabilità legale.
                              </span>
                          </label>
                      </div>

                      <div className="mt-6 flex flex-col md:flex-row justify-between items-center pt-6 border-t border-gray-100 gap-4">
                          <button onClick={handleResetAI} disabled={isResetting || isTraining} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2">
                              {isResetting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Formatta Intero Database
                          </button>
                          
                          <button onClick={handleTrainAI} disabled={isTraining || (!knowledgeText.trim() && attachedFiles.length === 0) || !legalConsent || limitPercentage >= 100 || textLength > MAX_CHAR_LIMIT} className="w-full md:w-auto bg-[#00665E] text-white px-8 py-4 rounded-xl font-black hover:bg-[#004d46] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,102,94,0.2)]">
                              {isTraining ? <Loader2 size={20} className="animate-spin"/> : <Sparkles size={20}/>} 
                              {isTraining ? 'Studia ed Elabora Vettori...' : 'Salva nella Memoria AI'}
                          </button>
                      </div>
                      
                      {trainStatus && (
                          <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 ${trainStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                              {trainStatus.success ? <CheckCircle className="shrink-0 mt-0.5 text-emerald-500"/> : <AlertTriangle className="shrink-0 mt-0.5 text-rose-500"/>}
                              <p className="text-sm font-bold">{trainStatus.msg}</p>
                          </div>
                      )}
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                      <div className="bg-[#00665E] p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                          <ShieldCheck size={180} className="absolute -right-10 -bottom-10 opacity-10 text-emerald-300"/>
                          <h3 className="text-2xl font-black mb-4 flex items-center gap-2 relative z-10"><ShieldCheck className="text-emerald-300"/> Database Isolato</h3>
                          <div className="space-y-4 text-sm text-emerald-50 font-medium relative z-10 leading-relaxed">
                              <p>L'Intelligenza Artificiale non si inventa nulla. Quando un cliente farà una domanda, il sistema cercherà matematicamente la risposta solo nei documenti che hai caricato in questa pagina.</p>
                              <p>La tua "Memoria Aziendale" è <b>completamente invisibile</b> alle altre aziende sulla piattaforma. È il tuo segreto industriale.</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'test' && (
              <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[700px] max-w-4xl mx-auto">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between z-10 shadow-sm shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg border border-blue-400"><Bot size={24} className="text-white"/></div>
                          <div>
                              <h3 className="font-black text-lg text-gray-900 leading-tight">Simulatore Agente Customer Care</h3>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1 mt-1">Connesso alla Memoria <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span></p>
                          </div>
                      </div>
                      <button onClick={() => setMessages([{ role: 'ai', text: 'Chat riavviata. Fai finta di essere un cliente e mettiti alla prova!' }])} className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-4 py-2 rounded-xl hover:text-gray-900 hover:bg-gray-100 transition shadow-sm">Svuota Chat</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC] custom-scrollbar space-y-6">
                      {messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                  <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#00665E] text-white rounded-tr-sm border border-transparent' : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'}`}>
                                      {msg.text}
                                  </div>
                                  {msg.role === 'ai' && i > 0 && (
                                      <div className={`mt-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 px-2.5 py-1 rounded-md border ${msg.contextFound ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                          {msg.contextFound ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                                          {msg.contextFound ? 'Risposta estratta dai tuoi documenti' : 'Informazione NON presente (Risposta generica o rifiuto)'}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      {isTyping && (
                          <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200 flex gap-1.5 shadow-sm"><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span></div></div>
                      )}
                      <div ref={chatEndRef} />
                  </div>
                  
                  <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                      <form onSubmit={handleChatTest} className="relative max-w-3xl mx-auto flex gap-2">
                          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Esempio: Quanto costano le spedizioni?" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-5 pr-16 text-sm outline-none focus:border-blue-500 font-bold transition shadow-inner" />
                          <button type="submit" disabled={!chatInput.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:bg-blue-700 transition shadow-md">
                              <Send size={18}/>
                          </button>
                      </form>
                  </div>
              </div>
          )}
      </div>
    </main>
  )
}