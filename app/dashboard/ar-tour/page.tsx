'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import {
  ScanLine, Plus, QrCode, Box, Trash2, Eye, X, Copy,
  Check, Download, Loader2, Globe, Upload, Settings2
} from 'lucide-react'

interface ArTour {
  id: string
  name: string
  description: string
  model_url: string
  poster_url: string
  cta_label: string
  cta_url: string
  slug: string
  company_name: string
  created_at: string
}

export default function ArTourPage() {
  const [user, setUser] = useState<any>(null)
  const [tours, setTours] = useState<ArTour[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTour, setEditingTour] = useState<ArTour | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [qrToShow, setQrToShow] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    model_url: '',
    poster_url: '',
    cta_label: 'Acquista Ora',
    cta_url: '',
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        setUser(u)
        const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', u.id).single()
        const { data } = await supabase.from('ar_tours').select('*').eq('user_id', u.id).order('created_at', { ascending: false })
        if (data) setTours(data as ArTour[])
      }
      setLoading(false)
    }
    getData()
  }, [])

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)

  const openModal = (tour?: ArTour) => {
    if (tour) {
      setEditingTour(tour)
      setForm({
        name: tour.name, description: tour.description,
        model_url: tour.model_url, poster_url: tour.poster_url || '',
        cta_label: tour.cta_label || 'Acquista Ora', cta_url: tour.cta_url || '',
      })
    } else {
      setEditingTour(null)
      setForm({ name: '', description: '', model_url: '', poster_url: '', cta_label: 'Acquista Ora', cta_url: '' })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Inserisci un nome per il tour AR.')
    if (!form.model_url.trim()) return alert('Inserisci un URL del modello 3D (.glb, .gltf, Sketchfab embed...)')
    setSaving(true)
    const slug = editingTour?.slug || generateSlug(form.name)
    const payload = { user_id: user.id, ...form, slug }
    if (editingTour) {
      await supabase.from('ar_tours').update(payload).eq('id', editingTour.id)
    } else {
      await supabase.from('ar_tours').insert(payload)
    }
    const { data } = await supabase.from('ar_tours').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setTours(data as ArTour[])
    setSaving(false)
    setIsModalOpen(false)
    alert('✅ Tour AR salvato!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo tour AR?')) return
    await supabase.from('ar_tours').delete().eq('id', id)
    setTours(prev => prev.filter(t => t.id !== id))
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/ar/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const downloadQR = (slug: string) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/ar/' + slug)}&format=png&color=00665E`
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-ar-${slug}.png`
    a.click()
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Caricamento AR Tour...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
            <ScanLine size={28}/> AR Tour & QR Code
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Crea tour 3D interattivi del tuo prodotto e genera QR code da stampare.</p>
        </div>
        <button onClick={() => openModal()} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 hover:scale-[1.02] transition">
          <Plus size={18}/> Crea Tour AR
        </button>
      </div>

      {/* EXPLAINER */}
      <div className="mb-8 bg-gradient-to-r from-[#00665E]/10 to-teal-50 border border-[#00665E]/20 rounded-3xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Carica il modello 3D', desc: 'Inserisci un link .glb/.gltf o un link embed Sketchfab del tuo prodotto', icon: <Upload size={20}/> },
            { step: '2', title: 'Genera il QR Code', desc: 'Scarica il QR Code brandizzato da stampare su packaging, volantini o vetrine', icon: <QrCode size={20}/> },
            { step: '3', title: 'Scansiona e guarda in 3D', desc: 'Il cliente scansiona il QR e vede il prodotto in 3D interattivo sul browser', icon: <Box size={20}/> },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#00665E] text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">{s.step}</div>
              <div>
                <p className="font-black text-gray-900 text-sm flex items-center gap-1">{s.icon} {s.title}</p>
                <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOURS GRID */}
      {tours.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Box size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="font-bold text-lg">Nessun Tour AR creato</p>
          <p className="text-sm mt-1">Crea il tuo primo tour 3D per un prodotto!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {tours.map(tour => (
            <div key={tour.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl transition p-6 flex flex-col group">
              {/* PREVIEW 3D MINI */}
              <div className="h-40 bg-gradient-to-br from-[#00665E]/10 to-teal-50 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-[#00665E]/20">
                <Box size={56} className="text-[#00665E]/30"/>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <a href={`/ar/${tour.slug}`} target="_blank" className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                    <Eye size={16}/> Apri Tour 3D
                  </a>
                </div>
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-[9px] font-black text-[#00665E] uppercase tracking-widest border border-[#00665E]/20">3D / AR</div>
              </div>

              <h3 className="font-black text-gray-900 text-lg mb-1">{tour.name}</h3>
              {tour.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tour.description}</p>}

              {/* QR MINI PREVIEW */}
              <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/ar/' + tour.slug : '/ar/' + tour.slug)}&color=00665E`}
                  alt="QR Code" className="w-12 h-12 rounded-lg border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link AR</p>
                  <p className="text-xs text-gray-600 font-mono truncate">/ar/{tour.slug}</p>
                </div>
                <button onClick={() => copyLink(tour.slug)} className="text-[#00665E] hover:text-emerald-800 p-1">
                  {copiedSlug === tour.slug ? <Check size={16}/> : <Copy size={16}/>}
                </button>
              </div>

              <div className="flex gap-2 mt-auto">
                <button onClick={() => downloadQR(tour.slug)} className="flex-1 flex items-center justify-center gap-1 bg-[#00665E] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#004d46] transition shadow-sm">
                  <Download size={14}/> Scarica QR
                </button>
                <button onClick={() => openModal(tour)} className="flex items-center justify-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-gray-100 transition">
                  <Settings2 size={14}/>
                </button>
                <button onClick={() => handleDelete(tour.id)} className="flex items-center justify-center p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREA/MODIFICA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#00665E] to-teal-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black">{editingTour ? 'Modifica Tour AR' : 'Nuovo Tour AR'}</h2>
                  <p className="text-teal-200 text-sm mt-1">Configura il tour 3D e genera il QR code</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl"><X size={20}/></button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome Prodotto / Tour</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Es: Sedia Ergonomica Pro X200" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:border-[#00665E]"/>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrizione (opzionale)</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    rows={2} placeholder="Descrizione breve del prodotto..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E] resize-none"/>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest block mb-1">URL Modello 3D (.glb / .gltf) *</label>
                <input value={form.model_url} onChange={e => setForm({...form, model_url: e.target.value})}
                  placeholder="https://cdn.esempio.com/prodotto.glb" className="w-full p-3 bg-white border border-blue-200 rounded-xl font-medium text-gray-900 outline-none focus:border-blue-500 text-sm"/>
                <p className="text-[10px] text-blue-600 mt-2 font-medium">
                  💡 Puoi usare Google Poly Archive, Sketchfab, o caricare su Supabase Storage e incollare il link pubblico.
                  Formati supportati: .glb, .gltf
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">URL Immagine Poster (anteprima statica, opzionale)</label>
                <input value={form.poster_url} onChange={e => setForm({...form, poster_url: e.target.value})}
                  placeholder="https://..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Testo CTA (Call to Action)</label>
                  <input value={form.cta_label} onChange={e => setForm({...form, cta_label: e.target.value})}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E] text-sm"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">URL Destinazione CTA</label>
                  <input value={form.cta_url} onChange={e => setForm({...form, cta_url: e.target.value})}
                    placeholder="https://..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]"/>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <p className="text-xs text-gray-400 font-medium">🌐 La pagina AR sarà accessibile pubblicamente via link e QR code</p>
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm">Annulla</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#00665E] text-white font-black rounded-xl hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <ScanLine size={16}/>} Salva Tour AR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
