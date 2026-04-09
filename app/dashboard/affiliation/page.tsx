'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
    Users, Plus, Video, Link as LinkIcon, Share2, Edit, Trash2, 
    Youtube, Globe, Phone, Facebook, Instagram, Send, Loader2, PlayCircle, Handshake, UploadCloud, Image as ImageIcon, X, ShieldAlert
} from 'lucide-react'

export default function AffiliationPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({})
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // STATI MODALE E FORM
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  
  // STATO VIDEO PLAYER
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  
  // Limite Piano Base
  const MAX_AFFILIATES = 5;

  const initialForm = {
      name: '', description: '', logo_url: '', video_url: '', 
      website: '', phone: '', social_facebook: '', social_instagram: ''
  }
  const [formData, setFormData] = useState(initialForm)

  // STATI HOST (Azienda Principale)
  const [hostVideo, setHostVideo] = useState('')
  const [hostMeeting, setHostMeeting] = useState('')
  const [savingHost, setSavingHost] = useState(false)

  // STATI UPLOAD FILE
  const [uploadingHostVideo, setUploadingHostVideo] = useState(false)
  const [uploadingPartnerVideo, setUploadingPartnerVideo] = useState(false)
  const [uploadingPartnerLogo, setUploadingPartnerLogo] = useState(false)

  // SIMULAZIONE PUBBLICAZIONE
  const [publishingId, setPublishingId] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if(profData) {
            setProfile(profData)
            setHostVideo(profData.host_video_url || '')
            setHostMeeting(profData.host_meeting_url || '')
        }
        
        const { data: affData } = await supabase.from('affiliates').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        if(affData) setAffiliates(affData)
      }
      setLoading(false)
    }
    getData()
  }, [])

  // --- MOTORE UPLOAD SU SUPABASE STORAGE ---
  const uploadToStorage = async (file: File, folderName: string) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${folderName}/${fileName}`

      const { error } = await supabase.storage.from('media').upload(filePath, file, { upsert: true })
      
      if (error) {
          console.error(error)
          throw new Error("Errore Upload. Hai creato il bucket pubblico 'media' su Supabase?")
      }
      
      const { data } = supabase.storage.from('media').getPublicUrl(filePath)
      return data.publicUrl
  }

  const handleHostVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if(!file) return;
      setUploadingHostVideo(true)
      try { const url = await uploadToStorage(file, 'host_videos'); setHostVideo(url); } 
      catch (err: any) { alert(err.message) }
      setUploadingHostVideo(false)
  }

  const handlePartnerVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if(!file) return;
      setUploadingPartnerVideo(true)
      try { const url = await uploadToStorage(file, 'partner_videos'); setFormData({...formData, video_url: url}); } 
      catch (err: any) { alert(err.message) }
      setUploadingPartnerVideo(false)
  }

  const handlePartnerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if(!file) return;
      setUploadingPartnerLogo(true)
      try { const url = await uploadToStorage(file, 'partner_logos'); setFormData({...formData, logo_url: url}); } 
      catch (err: any) { alert(err.message) }
      setUploadingPartnerLogo(false)
  }

  // --- SALVATAGGIO DATI HOST ---
  const saveHostData = async () => {
      setSavingHost(true)
      await supabase.from('profiles').update({ host_video_url: hostVideo, host_meeting_url: hostMeeting }).eq('id', user.id)
      setSavingHost(false)
      alert("Dati Vetrina Host aggiornati!")
  }

  // --- LOGICA MODALE AFFILIATI ---
  const openNewModal = () => { 
      if(affiliates.length >= MAX_AFFILIATES) return alert(`Hai raggiunto il limite di ${MAX_AFFILIATES} affiliati del Piano Base. Fai l'upgrade per aggiungerne altri!`)
      setEditingId(null); setFormData(initialForm); setIsModalOpen(true) 
  }
  const openEditModal = (aff: any) => { 
      setEditingId(aff.id); setFormData(aff); setIsModalOpen(true) 
  }

  const handleSaveAffiliate = async (e: React.FormEvent) => {
      e.preventDefault(); setSaving(true)
      const payload = { ...formData, user_id: user.id }

      if (editingId) {
          const { error } = await supabase.from('affiliates').update(payload).eq('id', editingId)
          if(!error) setAffiliates(affiliates.map(a => a.id === editingId ? { ...a, ...payload } : a))
      } else {
          const { data, error } = await supabase.from('affiliates').insert(payload).select().single()
          if(!error && data) setAffiliates([...affiliates, data])
      }
      setIsModalOpen(false); setSaving(false)
  }

  const handleDelete = async (id: number) => {
      if(!confirm("Rimuovere questa azienda dal tuo Network?")) return;
      await supabase.from('affiliates').delete().eq('id', id)
      setAffiliates(affiliates.filter(a => a.id !== id))
  }

  const handleCrossPromotion = async (affiliate: any) => {
      setPublishingId(affiliate.id)
      
      try {
          const res = await fetch('/api/affiliation/post-suggest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  affiliateName: affiliate.name,
                  affiliateDesc: affiliate.description,
                  hostName: profile.company_name || 'La nostra azienda',
                  hostIndustry: profile.industry || 'Business'
              })
          })
          const data = await res.json()
          if (!data.postText) throw new Error("AI non ha risposto.")

          await navigator.clipboard.writeText(data.postText)
          setPublishingId(null)
          alert(`✅ POST AI GENERATO!\n\nIl post perfetto è stato copiato negli appunti.\n\nEsempio testo:\n"${data.postText.substring(0,100)}..."\n\n👉 Incollalo sui tuoi social per promuovere il partner!`)
      } catch(e: any) {
          console.error("AI Post Error:", e)
          // Fallback al testo statico se l'AI fallisce
          const fallback = `Siamo fieri di collaborare con ${affiliate.name}! 🤝\n${affiliate.description}`;
          await navigator.clipboard.writeText(fallback)
          setPublishingId(null)
          alert("Post standard copiato (AI non disponibile).")
      }
  }

  // --- LOGICA VIDEO PLAYER ---
  const getYoutubeThumb = (url: string) => {
      if(!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
  }
  
  const getYoutubeEmbedUrl = (url: string) => {
      if(!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  }

  const isYoutube = (url: string) => url?.includes('youtube.com') || url?.includes('youtu.be')

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Caricamento Network...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans pb-20 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3"><Handshake size={32}/> Cross-Promo Network</h1>
          <p className="text-gray-500 text-sm mt-1">Crea la tua community di aziende partner e promuovetevi a vicenda con un clic.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-xl text-xs font-bold border border-purple-200 shadow-sm">
                Slot Piano Base: {affiliates.length} / {MAX_AFFILIATES}
            </div>
            <button onClick={openNewModal} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 transition">
               <Plus size={20}/> Aggiungi Partner
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
          
          {/* --- LA TUA VETRINA HOST --- */}
          <div className="xl:col-span-4 bg-white p-8 rounded-3xl border-2 border-[#00665E]/20 shadow-sm flex flex-col justify-between">
              <div>
                  <div className="flex justify-between items-start mb-6">
                      <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Globe className="text-[#00665E]"/> La tua Vetrina Host</h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-8 leading-relaxed">Questa è la tua vetrina. Inserisci una tua video intervista di 5 minuti e il link al tuo calendario appuntamenti. I tuoi partner useranno questi dati per promuoverti.</p>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><Video size={14}/> Video Intervista (Link o Upload)</label>
                          <div className="flex gap-2">
                              <input type="url" value={hostVideo} onChange={e=>setHostVideo(e.target.value)} placeholder="https://youtube... o carica file" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] text-sm text-gray-900" />
                              <label className="bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center px-4 rounded-xl cursor-pointer transition shadow-sm" title="Carica video da PC">
                                  {uploadingHostVideo ? <Loader2 className="animate-spin text-[#00665E]" size={20}/> : <UploadCloud className="text-gray-600" size={20}/>}
                                  <input type="file" accept="video/*" className="hidden" onChange={handleHostVideoUpload} />
                              </label>
                          </div>
                          {/* Pulsante Play per Host e Disclaimer Legale */}
                          {hostVideo && (
                              <button onClick={() => setPlayingVideo(hostVideo)} className="mt-2 text-xs bg-[#00665E]/10 text-[#00665E] hover:bg-[#00665E] hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition border border-[#00665E]/20">
                                  <PlayCircle size={14}/> Guarda Anteprima
                              </button>
                          )}
                          <p className="text-[10px] text-gray-400 mt-2 flex items-start gap-1">
                              <ShieldAlert size={12} className="shrink-0 mt-0.5 text-amber-500"/>
                              <span>Caricando un link o video, dichiari di possederne i diritti d'autore e che il contenuto rispetta le normative GDPR e sul Copyright europee.</span>
                          </p>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-2"><LinkIcon size={14}/> Meeting Funnel (Calendly, etc)</label>
                          <input type="url" value={hostMeeting} onChange={e=>setHostMeeting(e.target.value)} placeholder="https://calendly.com/tuonome" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] text-sm text-gray-900" />
                      </div>
                  </div>
              </div>
              
              <button onClick={saveHostData} disabled={savingHost} className="w-full mt-8 bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3 rounded-xl transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                  {savingHost ? <Loader2 className="animate-spin" size={18}/> : 'Salva la tua Vetrina'}
              </button>
          </div>

          {/* --- LE AZIENDE AFFILIATE (NETWORK) --- */}
          <div className="xl:col-span-8">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Users className="text-[#00665E]"/> Le Aziende del tuo Network</h2>
              
              {affiliates.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-[80%]">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Users size={32} className="text-gray-400"/></div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">Nessun partner inserito</h3>
                      <p className="text-sm text-gray-500 max-w-sm mb-6">Aggiungi fino a 5 aziende per creare la tua community e iniziare a promuovervi a vicenda.</p>
                      <button onClick={openNewModal} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition">Inizia ora</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {affiliates.map(aff => (
                          <div key={aff.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-lg transition duration-300 relative">
                              
                              {/* DISPLAY VIDEO (Cliccabile) */}
                              <div onClick={() => aff.video_url && setPlayingVideo(aff.video_url)} className="h-40 bg-gray-900 relative flex items-center justify-center overflow-hidden border-b border-gray-100 cursor-pointer">
                                  {isYoutube(aff.video_url) ? (
                                      <>
                                          <img src={getYoutubeThumb(aff.video_url)!} alt="Video" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500" />
                                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                              <PlayCircle size={48} className="text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] group-hover:scale-110 transition" />
                                          </div>
                                      </>
                                  ) : aff.video_url ? (
                                      <>
                                          <video src={aff.video_url} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500" preload="metadata" />
                                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                                              <PlayCircle size={48} className="text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] group-hover:scale-110 transition" />
                                          </div>
                                      </>
                                  ) : (
                                      <div className="text-gray-500 flex flex-col items-center"><Video size={32}/><span className="text-xs font-bold mt-2 uppercase">Nessun Video</span></div>
                                  )}
                                  
                                  {/* LOGO AZIENDA */}
                                  <div className="absolute -bottom-6 left-4 w-16 h-16 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden flex items-center justify-center text-xs font-bold text-gray-400 z-10 pointer-events-none">
                                      {aff.logo_url ? <img src={aff.logo_url} alt="Logo" className="w-full h-full object-cover"/> : aff.name.substring(0,2).toUpperCase()}
                                  </div>
                              </div>

                              {/* AZIONI MODIFICA SOVRAPPOSTE (Fuori dal container cliccabile del video) */}
                              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-20">
                                  <button onClick={(e) => { e.stopPropagation(); openEditModal(aff); }} className="bg-white/90 p-2 rounded-lg text-gray-700 hover:text-[#00665E] backdrop-blur-sm shadow-md"><Edit size={14}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(aff.id); }} className="bg-white/90 p-2 rounded-lg text-red-500 hover:text-red-700 backdrop-blur-sm shadow-md"><Trash2 size={14}/></button>
                              </div>

                              <div className="p-6 pt-8 flex-1 flex flex-col">
                                  <h3 className="font-black text-lg text-gray-900 line-clamp-1">{aff.name}</h3>
                                  <p className="text-xs text-gray-500 mt-2 mb-4 line-clamp-3 leading-relaxed flex-1">{aff.description || 'Nessuna descrizione.'}</p>
                                  
                                  <div className="flex gap-2 mb-6">
                                      {aff.website && <a href={aff.website} target="_blank" className="bg-gray-50 p-2 rounded-lg text-gray-600 hover:text-blue-500 transition"><Globe size={16}/></a>}
                                      {aff.social_facebook && <a href={aff.social_facebook} target="_blank" className="bg-blue-50 p-2 rounded-lg text-blue-600 hover:scale-110 transition"><Facebook size={16}/></a>}
                                      {aff.social_instagram && <a href={aff.social_instagram} target="_blank" className="bg-pink-50 p-2 rounded-lg text-pink-600 hover:scale-110 transition"><Instagram size={16}/></a>}
                                  </div>

                                  <button onClick={() => handleCrossPromotion(aff)} disabled={publishingId === aff.id} className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-50">
                                      {publishingId === aff.id ? <Loader2 className="animate-spin" size={18}/> : <><Share2 size={16}/> Condividi sui tuoi Social</>}
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* --- MODALE AGGIUNGI / MODIFICA PARTNER --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm z-[100]">
             <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                 <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                     <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Handshake className="text-[#00665E]"/> {editingId ? 'Modifica Partner' : 'Aggiungi Azienda Partner'}</h2>
                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full shadow-sm">✕</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8">
                     <form id="affiliate-form" onSubmit={handleSaveAffiliate} className="space-y-6">
                         
                         <div className="grid grid-cols-2 gap-6">
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-xs font-bold text-gray-500 uppercase">Nome Azienda *</label>
                                 <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none focus:border-[#00665E] font-bold" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Es: Studio Legale Rossi"/>
                             </div>
                             
                             <div className="col-span-2 md:col-span-1">
                                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                                     Logo (Immagine)
                                     {uploadingPartnerLogo && <Loader2 className="animate-spin text-[#00665E]" size={14}/>}
                                 </label>
                                 <div className="flex gap-2 mt-1">
                                     <input className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] text-sm" value={formData.logo_url} onChange={e=>setFormData({...formData, logo_url: e.target.value})} placeholder="Inserisci URL o carica..."/>
                                     <label className="bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center px-4 rounded-xl cursor-pointer transition text-gray-600" title="Carica Logo da PC">
                                         <ImageIcon size={18}/>
                                         <input type="file" accept="image/*" className="hidden" onChange={handlePartnerLogoUpload} />
                                     </label>
                                 </div>
                             </div>
                             
                             <div className="col-span-2">
                                 <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                                     <span className="flex items-center gap-1"><Youtube size={14}/> Video Intervista (Link YT o File MP4)</span>
                                     {uploadingPartnerVideo && <span className="flex items-center gap-1 text-blue-600"><Loader2 className="animate-spin" size={14}/> Caricamento...</span>}
                                 </label>
                                 <div className="flex gap-2 mt-1">
                                     <input type="url" className="flex-1 p-3 bg-red-50 border border-red-100 rounded-xl outline-none focus:border-red-500 text-sm" value={formData.video_url} onChange={e=>setFormData({...formData, video_url: e.target.value})} placeholder="https://youtube.com/watch?v=... o carica dal PC"/>
                                     <label className="bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center px-4 rounded-xl cursor-pointer transition text-red-600" title="Carica Video da PC">
                                         <UploadCloud size={20}/>
                                         <input type="file" accept="video/*" className="hidden" onChange={handlePartnerVideoUpload} />
                                     </label>
                                 </div>
                             </div>

                             <div className="col-span-2">
                                 <label className="text-xs font-bold text-gray-500 uppercase">Breve Descrizione (Chi sono e cosa fanno)</label>
                                 <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none focus:border-[#00665E] h-24 resize-none" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Scrivi una breve bio per aiutarci a promuoverli..."/>
                             </div>

                             <div><label className="text-xs font-bold text-gray-500 uppercase"><Globe size={12} className="inline mb-0.5"/> Sito Web</label><input type="url" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none" value={formData.website} onChange={e=>setFormData({...formData, website: e.target.value})}/></div>
                             <div><label className="text-xs font-bold text-gray-500 uppercase"><Phone size={12} className="inline mb-0.5"/> Telefono</label><input type="tel" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mt-1 outline-none" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/></div>
                             
                             <div><label className="text-xs font-bold text-gray-500 uppercase text-blue-600">Facebook</label><input type="url" className="w-full p-3 bg-blue-50 border border-blue-100 rounded-xl mt-1 outline-none" value={formData.social_facebook} onChange={e=>setFormData({...formData, social_facebook: e.target.value})}/></div>
                             <div><label className="text-xs font-bold text-gray-500 uppercase text-pink-600">Instagram</label><input type="url" className="w-full p-3 bg-pink-50 border border-pink-100 rounded-xl mt-1 outline-none" value={formData.social_instagram} onChange={e=>setFormData({...formData, social_instagram: e.target.value})}/></div>
                         
                             {/* DISCLAIMER LEGALE OBBLIGATORIO */}
                             <div className="col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3 mt-2">
                                 <input type="checkbox" required id="legal-check" className="mt-1 w-4 h-4 accent-[#00665E] cursor-pointer" />
                                 <label htmlFor="legal-check" className="text-xs text-amber-900 font-medium cursor-pointer leading-relaxed">
                                     Dichiaro sotto la mia responsabilità che i video, le immagini e i dati caricati o linkati in questa scheda rispettano le normative Europee vigenti sulla Privacy (GDPR) e sul Copyright. Dichiaro inoltre che i contenuti non violano le policy aziendali e non contengono materiale illecito.
                                 </label>
                             </div>
                         </div>
                     </form>
                 </div>
                 
                 <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Annulla</button>
                     <button type="submit" form="affiliate-form" disabled={saving || uploadingPartnerVideo || uploadingPartnerLogo} className="px-8 py-3 bg-[#00665E] text-white font-black rounded-xl hover:bg-[#004d46] shadow-lg transition disabled:opacity-50">
                         {saving ? 'Salvataggio...' : 'Salva Partner'}
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* --- VIDEO PLAYER GLOBALE A TUTTO SCHERMO --- */}
      {playingVideo && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 backdrop-blur-md transition-all animate-in fade-in">
              <button onClick={() => setPlayingVideo(null)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition duration-300 z-50">
                  <X size={28}/>
              </button>
              
              <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative animate-in zoom-in-95">
                  {isYoutube(playingVideo) && getYoutubeEmbedUrl(playingVideo) ? (
                      <iframe 
                          src={getYoutubeEmbedUrl(playingVideo)!} 
                          className="w-full h-full absolute inset-0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                      ></iframe>
                  ) : (
                      <video 
                          src={playingVideo} 
                          className="w-full h-full object-contain outline-none" 
                          controls 
                          autoPlay 
                          playsInline 
                      />
                  )}
              </div>
          </div>
      )}

    </main>
  )
}