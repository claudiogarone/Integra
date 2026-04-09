'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, Minus, Plus, X, Search,
  RefreshCw, Sparkles, CheckCircle2, Clock, AlertCircle, Globe,
  TrendingUp, TrendingDown, Filter, ChevronRight, Send, BarChart3, Award
} from 'lucide-react'

type SentimentType = 'Tutti' | 'Positivo' | 'Neutro' | 'Negativo'
type PlatformType = 'Tutti' | 'Google' | 'Trustpilot' | 'Facebook' | 'TripAdvisor' | 'Manuale'

const PLATFORMS = ['Tutti', 'Google', 'Trustpilot', 'Facebook', 'TripAdvisor', 'Manuale']
const PLATFORM_ICONS: Record<string, string> = { Google: '🔴', Trustpilot: '🟢', Facebook: '🔵', TripAdvisor: '🟡', Manuale: '⚫' }

const sentimentStyle = (s: string) => {
  if (s === 'Positivo') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Negativo') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

const replyStatusStyle = (s: string) => {
  if (s === 'Pubblicato') return 'bg-emerald-100 text-emerald-700'
  if (s === 'Bozza AI') return 'bg-purple-100 text-purple-700'
  if (s === 'Da Rispondere') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-500'
}

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}/>
    ))}
  </div>
)

export default function ReputationPage() {
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingReply, setGeneratingReply] = useState<string | null>(null)

  // Filters
  const [filterPlatform, setFilterPlatform] = useState<PlatformType>('Tutti')
  const [filterSentiment, setFilterSentiment] = useState<SentimentType>('Tutti')
  const [filterStatus, setFilterStatus] = useState('Tutti')
  const [search, setSearch] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [activeReview, setActiveReview] = useState<any>(null)
  const [replyDraft, setReplyDraft] = useState('')

  const [addForm, setAddForm] = useState({
    platform: 'Google', reviewer_name: '', rating: 5, review_text: '', review_date: new Date().toISOString().split('T')[0], sentiment: 'Positivo'
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return;
      setUser(user)
      await fetchReviews(user.id)
    }
    getData()
  }, [])

  const fetchReviews = async (uid: string) => {
    setLoading(true)
    const { data, error } = await supabase.from('reputation_reviews').select('*').eq('user_id', uid).order('review_date', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('reputation_reviews').insert({ ...addForm, user_id: user.id })
    if (error) { alert('Errore: ' + error.message); setSaving(false); return }
    await fetchReviews(user.id)
    setIsAddModalOpen(false); setSaving(false)
    setAddForm({ platform: 'Google', reviewer_name: '', rating: 5, review_text: '', review_date: new Date().toISOString().split('T')[0], sentiment: 'Positivo' })
  }

  const generateAIReply = async (review: any) => {
    setGeneratingReply(review.id)
    setActiveReview(review)
    setReplyDraft('')

    try {
      const response = await fetch('/api/reputation/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: review.review_text,
          reviewerName: review.reviewer_name,
          rating: review.rating,
          sentiment: review.sentiment,
          platform: review.platform
        })
      })
      const data = await response.json()
      if (data.reply) {
        setReplyDraft(data.reply)
        // Aggiorna status in DB
        await supabase.from('reputation_reviews').update({ reply_text: data.reply, reply_status: 'Bozza AI' }).eq('id', review.id)
        await fetchReviews(user.id)
      }
    } catch (err: any) {
      // In demo mode, genera una risposta placeholder
      const demoReply = review.rating >= 4
        ? `Gentile ${review.reviewer_name}, la ringraziamo di cuore per la sua recensione e per aver condiviso la sua esperienza positiva. È una grande soddisfazione sapere che siamo stati all'altezza delle sue aspettative. Speriamo di rivederla presto!\n\nCordialmente, Il Team`
        : `Gentile ${review.reviewer_name}, la ringraziamo per il suo feedback. Ci dispiace sinceramente che l'esperienza non sia stata all'altezza delle sue aspettative. Le chiediamo di contattarci direttamente in modo che possiamo trovare la soluzione migliore per lei. La sua soddisfazione è la nostra priorità.\n\nCordialmente, Il Team`
      setReplyDraft(demoReply)
      await supabase.from('reputation_reviews').update({ reply_text: demoReply, reply_status: 'Bozza AI' }).eq('id', review.id)
      await fetchReviews(user.id)
    }
    setGeneratingReply(null)
  }

  const publishReply = async () => {
    if (!activeReview || !replyDraft) return
    await supabase.from('reputation_reviews').update({
      reply_text: replyDraft, reply_status: 'Pubblicato', reply_date: new Date().toISOString()
    }).eq('id', activeReview.id)
    await fetchReviews(user.id)
    setActiveReview(null); setReplyDraft('')
  }

  // Filtered reviews
  const filtered = reviews.filter(r => {
    if (filterPlatform !== 'Tutti' && r.platform !== filterPlatform) return false
    if (filterSentiment !== 'Tutti' && r.sentiment !== filterSentiment) return false
    if (filterStatus !== 'Tutti' && r.reply_status !== filterStatus) return false
    if (search && !r.review_text?.toLowerCase().includes(search.toLowerCase()) && !r.reviewer_name?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // STATS
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / totalReviews).toFixed(1) : '0.0'
  const unanswered = reviews.filter(r => r.reply_status === 'Da Rispondere').length
  const positiveRate = totalReviews > 0 ? Math.round((reviews.filter(r => r.sentiment === 'Positivo').length / totalReviews) * 100) : 0

  if (loading) return <div className="p-10 text-teal-700 font-bold animate-pulse">Caricamento Reputation Manager...</div>

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3">
            <Star size={28}/> Reputation Manager
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitora e gestisci tutte le recensioni online con l'assistenza dell'AI</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20 shrink-0">
          <Plus size={18}/> Aggiungi Recensione
        </button>
      </div>

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rating Medio</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black text-amber-500">{avgRating}</span>
            <span className="text-gray-300 text-lg font-bold mb-1">/ 5</span>
          </div>
          <StarRating rating={Math.round(Number(avgRating))} size={12}/>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Totale Recensioni</p>
          <p className="text-4xl font-black text-[#00665E]">{totalReviews}</p>
          <p className="text-xs text-gray-400 mt-1">su tutte le piattaforme</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Da Rispondere</p>
          <p className={`text-4xl font-black ${unanswered > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{unanswered}</p>
          <p className="text-xs text-gray-400 mt-1">{unanswered > 0 ? '⚠️ Richiede attenzione' : '✅ Tutto in regola'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sentiment Positivo</p>
          <p className="text-4xl font-black text-emerald-500">{positiveRate}%</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${positiveRate}%` }}></div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca recensioni..."
            className="pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E] w-52"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setFilterPlatform(p as PlatformType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterPlatform === p ? 'bg-[#00665E] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {PLATFORM_ICONS[p] && p !== 'Tutti' ? `${PLATFORM_ICONS[p]} ` : ''}{p}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          {['Tutti', 'Da Rispondere', 'Bozza AI', 'Pubblicato'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${filterStatus === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS LIST */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Star size={48} className="mx-auto mb-4 text-gray-300"/>
          <p className="font-bold text-gray-500">Nessuna recensione trovata</p>
          <p className="text-sm text-gray-400 mt-1">Aggiungi recensioni manualmente o connetti le tue piattaforme.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center font-black text-lg text-gray-500 shrink-0">
                  {review.reviewer_name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="font-black text-gray-900">{review.reviewer_name}</p>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs font-bold text-gray-400">{PLATFORM_ICONS[review.platform]} {review.platform}</span>
                    <span className="text-xs text-gray-400">{review.review_date ? new Date(review.review_date).toLocaleDateString('it-IT') : ''}</span>
                    <StarRating rating={review.rating} size={13}/>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.review_text || <em className="text-gray-400">Nessun testo</em>}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${sentimentStyle(review.sentiment)}`}>{review.sentiment}</span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${replyStatusStyle(review.reply_status)}`}>{review.reply_status}</span>
                  </div>

                  {/* Bozza risposta esistente */}
                  {review.reply_text && (
                    <div className="mt-4 p-4 bg-[#00665E]/5 border border-[#00665E]/20 rounded-xl">
                      <p className="text-[10px] font-black text-[#00665E] uppercase mb-2 flex items-center gap-1"><MessageSquare size={12}/> Risposta Aziendale</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{review.reply_text}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {review.reply_status !== 'Pubblicato' && (
                    <button
                      onClick={() => generateAIReply(review)}
                      disabled={generatingReply === review.id}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-purple-500/20">
                      {generatingReply === review.id ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                      {generatingReply === review.id ? 'Generando...' : 'Rispondi con AI'}
                    </button>
                  )}
                  {review.reply_status === 'Pubblicato' && (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold px-4 py-2.5">
                      <CheckCircle2 size={14}/> Risposto
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: REPLY EDITOR (when AI generates a draft) */}
      {activeReview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Sparkles size={20} className="text-purple-600"/> Bozza Risposta AI</h2>
                <p className="text-xs text-gray-500 mt-0.5">Revisiona e pubblica la risposta generata dall'intelligenza artificiale</p>
              </div>
              <button onClick={() => { setActiveReview(null); setReplyDraft('') }} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm"><X size={16}/></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Original review context */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={activeReview.rating} size={14}/>
                  <span className="text-sm font-bold text-gray-700">{activeReview.reviewer_name}</span>
                  <span className="text-xs text-gray-400">{PLATFORM_ICONS[activeReview.platform]} {activeReview.platform}</span>
                </div>
                <p className="text-sm text-gray-600 italic">"{activeReview.review_text}"</p>
              </div>

              {/* Reply Editor */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Testo Risposta (modificabile)</label>
                {generatingReply === activeReview.id ? (
                  <div className="flex items-center gap-3 p-8 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                    <RefreshCw size={20} className="text-purple-600 animate-spin shrink-0"/>
                    <div>
                      <p className="font-bold text-purple-900">L'AI sta elaborando una risposta personalizzata...</p>
                      <p className="text-xs text-purple-600 mt-0.5">Ottimizzazione del tono per {activeReview.platform}</p>
                    </div>
                  </div>
                ) : (
                  <textarea value={replyDraft} onChange={e => setReplyDraft(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl outline-none focus:border-[#00665E] resize-none h-40 text-sm leading-relaxed" />
                )}
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 bg-white">
              <button onClick={() => { setActiveReview(null); setReplyDraft('') }} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                Salva Bozza
              </button>
              <button onClick={publishReply} disabled={!replyDraft} className="flex-1 bg-[#00665E] text-white py-3 rounded-xl font-black hover:bg-[#004d46] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#00665E]/20">
                <Send size={16}/> Segna come Pubblicato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD REVIEW */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-black text-[#00665E] flex items-center gap-2"><Star size={20}/> Aggiungi Recensione</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>
            <form id="addReviewForm" onSubmit={addReview} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Piattaforma</label>
                  <select value={addForm.platform} onChange={e => setAddForm({...addForm, platform: e.target.value})} className="input-field">
                    {['Google', 'Trustpilot', 'Facebook', 'TripAdvisor', 'Manuale'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-xs">Voto (1-5)</label>
                  <input type="number" min="1" max="5" required value={addForm.rating} onChange={e => setAddForm({...addForm, rating: Number(e.target.value), sentiment: Number(e.target.value) >= 4 ? 'Positivo' : Number(e.target.value) <= 2 ? 'Negativo' : 'Neutro'})} className="input-field"/>
                </div>
              </div>
              <div>
                <label className="label-xs">Nome Recensore *</label>
                <input required value={addForm.reviewer_name} onChange={e => setAddForm({...addForm, reviewer_name: e.target.value})} className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Testo Recensione</label>
                <textarea value={addForm.review_text} onChange={e => setAddForm({...addForm, review_text: e.target.value})} className="input-field h-28 resize-none"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-xs">Data</label>
                  <input type="date" value={addForm.review_date} onChange={e => setAddForm({...addForm, review_date: e.target.value})} className="input-field"/>
                </div>
                <div>
                  <label className="label-xs">Sentiment</label>
                  <select value={addForm.sentiment} onChange={e => setAddForm({...addForm, sentiment: e.target.value})} className="input-field">
                    {['Positivo', 'Neutro', 'Negativo', 'Misto'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </form>
            <div className="p-5 border-t bg-white">
              <button type="submit" form="addReviewForm" disabled={saving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50">
                {saving ? 'Salvataggio...' : 'Aggiungi Recensione'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .label-xs { display: block; font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-left: 4px; margin-bottom: 4px; }
        .input-field { width: 100%; background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 14px; border-radius: 12px; outline: none; font-size: 14px; transition: border-color 0.2s; }
        .input-field:focus { border-color: #00665E; background: white; }
      `}</style>
    </main>
  )
}
