'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stato del Piano Utente (Inizia Base, poi si aggiorna)
  const [userPlan, setUserPlan] = useState<'Base' | 'Enterprise' | 'Ambassador'>('Base')

  // Stati Modale
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: Scrittura, 2: Selezione

  // Stati Editor
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  
  // Stati AI
  const [aiTopic, setAiTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Stati Invio & Selezione
  const [sending, setSending] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null)

  // Ref per Importazione
  const importInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // --- LEGGI IL PIANO REALE DAL DB ---
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      if (profile && profile.plan) {
         setUserPlan(profile.plan)
      }
      // -------------------------------------------------------------

      // Fetch Campagne
      const { data: campaignsData } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
      if (campaignsData) setCampaigns(campaignsData)

      // Fetch Contatti
      fetchContacts()

      setLoading(false)
    }
    getData()
  }, [router, supabase])

  const fetchContacts = async () => {
      const { data: contactsData } = await supabase.from('contacts').select('*').order('score', { ascending: false })
      if (contactsData) setContacts(contactsData)
  }

  // --- LOGICA AI WRITER ---
  const handleAiGenerate = async () => {
      if(!aiTopic) return alert("Inserisci un argomento per l'AI!");
      setIsGenerating(true);
      try {
          const res = await fetch('/api/generate-marketing-email', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ topic: aiTopic, tone: 'Persuasivo e Professionale' })
          });
          const data = await res.json();
          if(data.subject) {
              setSubject(data.subject);
              setContent(data.content.replace(/<br>/g, '\n').replace(/<b>/g, '').replace(/<\/b>/g, ''));
          }
      } catch(e) {
          alert("Errore AI");
      } finally {
          setIsGenerating(false);
      }
  }

  // --- LOGICA SELEZIONE ---
  const toggleContact = (id: number) => {
    selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id])
  }

  const toggleSelectAll = () => {
      if (selectedIds.length === contacts.length) {
          setSelectedIds([]) // Deseleziona tutto
      } else {
          setSelectedIds(contacts.map(c => c.id)) // Seleziona tutto
      }
  }

  const selectHotLeads = () => {
      // Controllo Rigoroso del Piano
      if(userPlan === 'Base') {
          alert("Funzionalità Enterprise! 🚀\nPassa al livello superiore per il targeting automatico.");
          return;
      }
      
      const hotIds = contacts.filter(c => (c.score || 0) >= 50).map(c => c.id);
      setSelectedIds(hotIds);
      if(hotIds.length === 0) alert("Nessun Hot Lead trovato (>50 punti).");
  }

  // --- IMPORTAZIONE SOCIAL AL VOLO ---
  const handleSocialImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
            const rows: any[] = results.data
            const newContacts = rows.map((row: any) => ({
                name: row.Nome || row.Name || row['First Name'] || 'Contatto Social',
                email: row.Email || row.email || row['E-mail Address'] || '',
                value: 0, 
                status: 'Nuovo', 
                score: 5,
                user_id: user.id
            })).filter((c: any) => c.email && c.email.includes('@'))

            if(newContacts.length === 0) return alert("Nessun contatto valido trovato nel file.")

            const { data, error } = await supabase.from('contacts').insert(newContacts).select()
            
            if (!error && data) {
                const allContacts = [...data, ...contacts]
                setContacts(allContacts)
                
                const newIds = data.map((c: any) => c.id)
                setSelectedIds([...selectedIds, ...newIds])
                
                alert(`✅ Importati e Selezionati ${data.length} contatti da Social!`)
            } else {
                alert('Errore importazione: ' + error?.message)
            }
        }
    })
    if (importInputRef.current) importInputRef.current.value = ''
  }

  // --- LOGICA INVIO ---
  const handleSendCampaign = async () => {
    if (selectedIds.length === 0) return alert("Seleziona almeno un destinatario!")
    setSending(true)

    const recipientsList = contacts.filter(c => selectedIds.includes(c.id))
    const recipientEmails = recipientsList.map(c => c.email).filter(email => email && email.includes('@'))

    if (recipientEmails.length === 0) { setSending(false); return alert("Nessuna email valida!") }

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, emails: recipientEmails })
      })

      if (!response.ok) throw new Error('Errore server')

      const { data, error } = await supabase.from('campaigns').insert({
          title: subject, content: content, status: 'Inviata',
          sent_count: recipientEmails.length, recipients_details: recipientsList, user_id: user.id
        }).select()

      if (!error && data) {
        setCampaigns([data[0], ...campaigns])
        setIsModalOpen(false)
        setSubject(''); setContent(''); setSelectedIds([]); setStep(1);
        alert(`Campagna inviata a ${recipientEmails.length} contatti! 🚀`)
      }
    } catch (err: any) {
      alert('Errore invio: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Marketing...</div>

  // Statistiche
  const totalSent = campaigns.reduce((acc, curr) => acc + (curr.sent_count || 0), 0);

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
        <div>
           <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Email Marketing</h1>
                {/* Badge Piano */}
                <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded cursor-default ${userPlan === 'Base' ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm'}`}>
                    Piano {userPlan} {userPlan !== 'Base' && '👑'}
                </div>
           </div>
           <p className="text-gray-500 text-sm mt-1">Crea, invia e analizza le tue campagne.</p>
        </div>
        
        <div className="flex gap-4">
             <div className="bg-white px-5 py-2 rounded-xl border border-gray-200 shadow-sm text-center hidden md:block">
                 <p className="text-xs text-gray-400 uppercase font-bold">Inviate</p>
                 <p className="text-xl font-black text-[#00665E]">{totalSent}</p>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="bg-[#00665E] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2 h-full">
                📢 Nuova Campagna
             </button>
        </div>
      </div>

      {/* LISTA CAMPAGNE */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-20">
        {campaigns.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <div className="text-6xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-900">Inizia ora</h3>
              <p className="text-gray-500 text-sm">Lancia la tua prima campagna email.</p>
           </div>
        ) : (
           campaigns.map((camp) => (
             <div key={camp.id} className="bg-white border border-gray-200 p-6 rounded-2xl hover:shadow-md transition group">
                <div className="flex justify-between items-start mb-3">
                   <div>
                       <h3 className="text-lg font-bold text-gray-900">{camp.title}</h3>
                       <p className="text-xs text-gray-400 mt-1">{new Date(camp.created_at).toLocaleDateString('it-IT', {day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit'})}</p>
                   </div>
                   <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Inviata</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-4">
                   <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">📬 {camp.sent_count} Destinatari</span>
                   <button onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)} className="text-[#00665E] font-bold text-xs hover:underline">
                     {expandedCampaignId === camp.id ? 'Chiudi' : 'Dettagli'}
                   </button>
                </div>
                {expandedCampaignId === camp.id && camp.recipients_details && (
                   <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                      <div className="flex flex-wrap gap-2">
                          {camp.recipients_details.map((recipient: any, idx: number) => (
                             <span key={idx} className="bg-white border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded-md">
                                {recipient.email}
                             </span>
                          ))}
                      </div>
                   </div>
                )}
             </div>
           ))
        )}
      </div>

      {/* --- WIZARD MODALE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative flex overflow-hidden h-[600px]">
             
             {/* SIDEBAR STEPS */}
             <div className="w-64 bg-gray-50 border-r border-gray-100 p-8 flex flex-col justify-between hidden md:flex">
                <div>
                    <h2 className="text-xl font-black text-[#00665E] mb-8">Campagna<br/>Wizard</h2>
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 p-3 rounded-xl transition ${step === 1 ? 'bg-white shadow text-[#00665E] font-bold' : 'text-gray-400'}`}>
                            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">1</span> Contenuto
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-xl transition ${step === 2 ? 'bg-white shadow text-[#00665E] font-bold' : 'text-gray-400'}`}>
                            <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">2</span> Destinatari
                        </div>
                    </div>
                </div>
             </div>

             {/* MAIN */}
             <div className="flex-1 p-8 overflow-y-auto relative flex flex-col">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">✕</button>

                {/* STEP 1: SCRITTURA */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900">Il tuo messaggio</h3>
                        
                        {/* AI BOX */}
                        <div className={`p-4 rounded-2xl border transition-all ${userPlan === 'Base' ? 'bg-gray-100 border-gray-200' : 'bg-indigo-50 border-indigo-100'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`text-xs font-bold uppercase ${userPlan === 'Base' ? 'text-gray-500' : 'text-indigo-600'}`}>✨ Integra AI Writer</span>
                                {userPlan === 'Base' && <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded">LOCKED</span>}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" placeholder={userPlan === 'Base' ? "Funzione Enterprise..." : "Argomento (es. Sconto Estivo)..."} disabled={userPlan === 'Base'} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-indigo-500" />
                                <button onClick={handleAiGenerate} disabled={userPlan === 'Base' || isGenerating} className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition ${userPlan === 'Base' ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isGenerating ? '...' : 'Genera'}</button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Oggetto</label>
                            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white border border-gray-200 p-3 rounded-xl mt-1 outline-none focus:border-[#00665E]" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Testo Email</label>
                            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-40 bg-white border border-gray-200 p-3 rounded-xl mt-1 outline-none focus:border-[#00665E] resize-none" />
                        </div>

                        <div className="flex justify-end pt-4 mt-auto">
                            <button onClick={() => setStep(2)} disabled={!subject || !content} className="bg-[#00665E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#004d46] disabled:opacity-50 transition">Avanti ➝</button>
                        </div>
                    </div>
                )}

                {/* STEP 2: SELEZIONE & IMPORT */}
                {step === 2 && (
                    <div className="space-y-4 h-full flex flex-col">
                        <h3 className="text-2xl font-bold text-gray-900">Scegli Destinatari</h3>
                        
                        {/* TOOLBAR AZIONI */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                             {/* 1. SELEZIONA TUTTO */}
                             <button onClick={toggleSelectAll} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
                                 {selectedIds.length === contacts.length ? '☒ Deseleziona' : '☑ Seleziona Tutti'}
                             </button>
                             
                             {/* 2. HOT LEADS */}
                             <button onClick={selectHotLeads} className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 whitespace-nowrap transition ${userPlan === 'Base' ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100'}`}>
                                 🔥 Hot Leads (+50)
                             </button>

                             {/* 3. IMPORT SOCIAL (NUOVO) */}
                             <div className="relative">
                                 <button onClick={() => importInputRef.current?.click()} className="px-3 py-2 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 text-xs font-bold hover:bg-blue-100 whitespace-nowrap flex items-center gap-1">
                                     📥 Importa da Social
                                 </button>
                                 <input type="file" accept=".csv" ref={importInputRef} onChange={handleSocialImport} className="hidden" />
                             </div>
                        </div>

                        {/* LISTA CONTATTI */}
                        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl">
                            {contacts.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-xs">Nessun contatto. Importane uno dai Social!</div>
                            ) : (
                                contacts.map(contact => (
                                    <div key={contact.id} onClick={() => toggleContact(contact.id)} className={`flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer transition ${selectedIds.includes(contact.id) ? 'bg-[#00665E]/5' : 'hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs text-white ${selectedIds.includes(contact.id) ? 'bg-[#00665E] border-[#00665E]' : 'border-gray-300'}`}>
                                                {selectedIds.includes(contact.id) && '✓'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{contact.name}</p>
                                                <p className="text-xs text-gray-400">{contact.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Badge "Nuovo" per importati */}
                                            {contact.status === 'Nuovo' && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">NEW</span>}
                                            {contact.score >= 50 && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-bold">HOT</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                            <button onClick={() => setStep(1)} className="text-gray-400 font-bold text-sm hover:text-gray-600">← Indietro</button>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-500">
                                    <strong className="text-[#00665E] text-lg">{selectedIds.length}</strong> selezionati
                                </span>
                                <button onClick={handleSendCampaign} disabled={sending || selectedIds.length === 0} className="bg-[#00665E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#004d46] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#00665E]/20">
                                    {sending ? 'Invio...' : '🚀 Invia'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

             </div>
          </div>
        </div>
      )}
    </main>
  )
}