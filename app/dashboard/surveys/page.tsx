'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import {
  ClipboardList, Plus, Eye, Trash2, Share2, BarChart3, X,
  CheckSquare, AlignLeft, Star, MousePointerClick, Link2,
  Copy, Check, Loader2, Users, TrendingUp, ArrowRight, Edit
} from 'lucide-react'

type BlockType = 'multiple_choice' | 'text' | 'rating' | 'cta'

interface SurveyBlock {
  id: string
  type: BlockType
  question: string
  options?: string[]
  ctaLabel?: string
  ctaUrl?: string
}

interface Survey {
  id: string
  title: string
  description: string
  blocks: SurveyBlock[]
  responses: number
  created_at: string
  slug: string
}

const BLOCK_TYPES = [
  { type: 'multiple_choice' as BlockType, label: 'Scelta Multipla', icon: <CheckSquare size={18}/>, color: 'bg-blue-50 border-blue-200 text-blue-600' },
  { type: 'text' as BlockType, label: 'Risposta Libera', icon: <AlignLeft size={18}/>, color: 'bg-purple-50 border-purple-200 text-purple-600' },
  { type: 'rating' as BlockType, label: 'Valutazione (1-5★)', icon: <Star size={18}/>, color: 'bg-amber-50 border-amber-200 text-amber-600' },
  { type: 'cta' as BlockType, label: 'Call to Action', icon: <MousePointerClick size={18}/>, color: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
]

export default function SurveysPage() {
  const [user, setUser] = useState<any>(null)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Builder State
  const [surveyTitle, setSurveyTitle] = useState('')
  const [surveyDesc, setSurveyDesc] = useState('')
  const [blocks, setBlocks] = useState<SurveyBlock[]>([])
  const [activeBlockIdx, setActiveBlockIdx] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (u) {
        setUser(u)
        const { data } = await supabase.from('surveys').select('*').eq('user_id', u.id).order('created_at', { ascending: false })
        if (data) setSurveys(data as Survey[])
      }
      setLoading(false)
    }
    getData()
  }, [])

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString(36)

  const addBlock = (type: BlockType) => {
    const newBlock: SurveyBlock = {
      id: Date.now().toString(),
      type,
      question: type === 'cta' ? 'Scopri di più!' : 'La tua domanda...',
      options: type === 'multiple_choice' ? ['Opzione 1', 'Opzione 2'] : undefined,
      ctaLabel: type === 'cta' ? 'Clicca qui' : undefined,
      ctaUrl: type === 'cta' ? 'https://' : undefined,
    }
    setBlocks(prev => [...prev, newBlock])
    setActiveBlockIdx(blocks.length)
  }

  const updateBlock = (idx: number, updates: Partial<SurveyBlock>) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, ...updates } : b))
  }

  const removeBlock = (idx: number) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx))
    setActiveBlockIdx(null)
  }

  const openBuilder = (survey?: Survey) => {
    if (survey) {
      setEditingSurvey(survey)
      setSurveyTitle(survey.title)
      setSurveyDesc(survey.description)
      setBlocks(survey.blocks || [])
    } else {
      setEditingSurvey(null)
      setSurveyTitle('')
      setSurveyDesc('')
      setBlocks([])
    }
    setActiveBlockIdx(null)
    setIsBuilderOpen(true)
  }

  const handleSave = async () => {
    if (!surveyTitle.trim()) return alert('Inserisci un titolo per il sondaggio.')
    if (blocks.length === 0) return alert('Aggiungi almeno un blocco.')
    setSaving(true)
    const slug = editingSurvey?.slug || generateSlug(surveyTitle)
    const payload = {
      user_id: user.id,
      title: surveyTitle,
      description: surveyDesc,
      blocks,
      slug,
      responses: editingSurvey?.responses || 0,
    }
    if (editingSurvey) {
      await supabase.from('surveys').update(payload).eq('id', editingSurvey.id)
    } else {
      await supabase.from('surveys').insert(payload)
    }
    const { data } = await supabase.from('surveys').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setSurveys(data as Survey[])
    setSaving(false)
    setIsBuilderOpen(false)
    alert('✅ Sondaggio salvato!')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo sondaggio?')) return
    await supabase.from('surveys').delete().eq('id', id)
    setSurveys(prev => prev.filter(s => s.id !== id))
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/survey/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Caricamento Sondaggi...</div>

  const activeBlock = activeBlockIdx !== null ? blocks[activeBlockIdx] : null

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
            <ClipboardList size={28}/> Sondaggi, Test & Landing
          </h1>
          <p className="text-gray-500 text-sm mt-1">Crea landing page con questionari, test e call-to-action collegati al tuo CRM.</p>
        </div>
        <button onClick={() => openBuilder()} className="bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 transition hover:scale-[1.02]">
          <Plus size={18}/> Crea Nuovo Sondaggio
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={24}/></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sondaggi Attivi</p>
            <p className="text-3xl font-black text-gray-900">{surveys.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={24}/></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Risposte Totali</p>
            <p className="text-3xl font-black text-emerald-600">{surveys.reduce((a, s) => a + (s.responses || 0), 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Blocchi Totali</p>
            <p className="text-3xl font-black text-purple-600">{surveys.reduce((a, s) => a + (s.blocks?.length || 0), 0)}</p>
          </div>
        </div>
      </div>

      {/* SURVEYS LIST */}
      {surveys.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30"/>
          <p className="font-bold">Nessun sondaggio creato.</p>
          <p className="text-sm">Crea il tuo primo questionario o landing page!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{survey.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(survey.created_at).toLocaleDateString('it-IT')}</p>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">{survey.blocks?.length || 0} blocchi</span>
              </div>
              {survey.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{survey.description}</p>}
              <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <Link2 size={14} className="text-gray-400 shrink-0"/>
                <span className="text-xs text-gray-600 truncate flex-1 font-mono">/survey/{survey.slug}</span>
                <button onClick={() => copyLink(survey.slug)} className="text-[#00665E] hover:text-emerald-800 transition shrink-0">
                  {copiedSlug === survey.slug ? <Check size={16}/> : <Copy size={16}/>}
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1"><Users size={12}/> {survey.responses || 0} risposte</span>
                <span className="font-bold text-[#00665E]">Attivo</span>
              </div>
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                <button onClick={() => openBuilder(survey)} className="flex-1 flex items-center justify-center gap-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold py-2 rounded-xl hover:bg-gray-100 transition">
                  <Edit size={14}/> Modifica
                </button>
                <a href={`/survey/${survey.slug}`} target="_blank" className="flex-1 flex items-center justify-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold py-2 rounded-xl hover:bg-blue-100 transition">
                  <Eye size={14}/> Anteprima
                </a>
                <button onClick={() => handleDelete(survey.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BUILDER MODAL */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-black/80 flex z-50 backdrop-blur-sm">
          <div className="flex w-full max-w-7xl mx-auto h-full flex-col md:flex-row overflow-hidden rounded-none md:rounded-3xl m-0 md:m-4 bg-white shadow-2xl animate-in zoom-in-95">

            {/* SIDEBAR BLOCCHI */}
            <div className="w-full md:w-72 bg-gray-50 border-r border-gray-200 p-6 flex flex-col shrink-0 overflow-y-auto">
              <h2 className="text-lg font-black text-[#00665E] mb-2">Survey Builder</h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">Aggiungi blocchi alla tua landing page</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tipi di Blocco</p>
              <div className="space-y-2">
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${bt.color} hover:scale-[1.02] transition font-bold text-sm`}>
                    {bt.icon} {bt.label}
                  </button>
                ))}
              </div>
              <div className="mt-auto pt-6 border-t border-gray-200 space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Blocchi Aggiunti ({blocks.length})</p>
                {blocks.map((b, i) => (
                  <div key={b.id} onClick={() => setActiveBlockIdx(i)}
                    className={`p-2 rounded-xl cursor-pointer text-xs font-bold flex items-center gap-2 transition ${activeBlockIdx === i ? 'bg-[#00665E] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-[#00665E]'}`}>
                    {BLOCK_TYPES.find(bt => bt.type === b.type)?.icon}
                    <span className="truncate flex-1">{b.question}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(i) }} className="opacity-60 hover:opacity-100">
                      <X size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* EDITOR CENTRALE */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                  <input value={surveyTitle} onChange={e => setSurveyTitle(e.target.value)}
                    placeholder="Titolo del Sondaggio / Landing..." className="text-2xl font-black text-gray-900 outline-none border-b-2 border-transparent focus:border-[#00665E] bg-transparent w-full transition" />
                  <input value={surveyDesc} onChange={e => setSurveyDesc(e.target.value)}
                    placeholder="Sottotitolo o descrizione breve..." className="text-sm text-gray-500 outline-none border-b border-transparent focus:border-gray-300 bg-transparent w-full mt-1 transition" />
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button onClick={() => setPreviewOpen(true)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 flex items-center gap-2"><Eye size={16}/> Preview</button>
                  <button onClick={handleSave} disabled={saving} className="bg-[#00665E] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#004d46] flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={16}/> : null} Salva
                  </button>
                  <button onClick={() => setIsBuilderOpen(false)} className="bg-gray-100 p-2 rounded-xl text-gray-500 hover:text-red-500"><X size={18}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                {blocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                    <ClipboardList size={48} className="mb-4"/>
                    <p className="font-bold">Aggiungi un blocco dalla colonna sinistra</p>
                  </div>
                ) : (
                  blocks.map((block, idx) => (
                    <div key={block.id} onClick={() => setActiveBlockIdx(idx)}
                      className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition ${activeBlockIdx === idx ? 'border-[#00665E] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{BLOCK_TYPES.find(bt => bt.type === block.type)?.label}</p>
                      <p className="font-bold text-gray-900 mb-3">{block.question}</p>
                      {block.type === 'multiple_choice' && (
                        <div className="space-y-2">{block.options?.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded border-2 border-gray-300 shrink-0"/>
                            <span className="text-sm text-gray-600">{opt}</span>
                          </div>
                        ))}</div>
                      )}
                      {block.type === 'rating' && (
                        <div className="flex gap-2">{[1,2,3,4,5].map(n => <div key={n} className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">{n}</div>)}</div>
                      )}
                      {block.type === 'text' && (
                        <div className="h-12 bg-gray-50 border border-gray-200 rounded-xl"/>
                      )}
                      {block.type === 'cta' && (
                        <div className="bg-[#00665E] text-white text-center py-3 px-6 rounded-xl font-bold inline-block">{block.ctaLabel}</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PANNELLO PROPRIETÀ */}
            {activeBlock && activeBlockIdx !== null && (
              <div className="w-full md:w-72 bg-white border-l border-gray-200 p-6 shrink-0 overflow-y-auto">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Edit size={16} className="text-[#00665E]"/> Proprietà Blocco
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Domanda / Titolo</label>
                    <textarea value={activeBlock.question} onChange={e => updateBlock(activeBlockIdx, { question: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-[#00665E] resize-none" rows={3}/>
                  </div>

                  {activeBlock.type === 'multiple_choice' && (
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Opzioni</label>
                      {activeBlock.options?.map((opt, oi) => (
                        <div key={oi} className="flex gap-2 mb-2">
                          <input value={opt} onChange={e => {
                            const newOpts = [...(activeBlock.options || [])]
                            newOpts[oi] = e.target.value
                            updateBlock(activeBlockIdx, { options: newOpts })
                          }} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#00665E]"/>
                          <button onClick={() => {
                            const newOpts = activeBlock.options?.filter((_, i) => i !== oi)
                            updateBlock(activeBlockIdx, { options: newOpts })
                          }} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                        </div>
                      ))}
                      <button onClick={() => updateBlock(activeBlockIdx, { options: [...(activeBlock.options || []), 'Nuova opzione'] })}
                        className="text-xs font-bold text-[#00665E] hover:underline flex items-center gap-1"><Plus size={12}/> Aggiungi Opzione</button>
                    </div>
                  )}

                  {activeBlock.type === 'cta' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Testo Pulsante</label>
                        <input value={activeBlock.ctaLabel || ''} onChange={e => updateBlock(activeBlockIdx, { ctaLabel: e.target.value })}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#00665E]"/>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">URL Destinazione</label>
                        <input value={activeBlock.ctaUrl || ''} onChange={e => updateBlock(activeBlockIdx, { ctaUrl: e.target.value })}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00665E]" placeholder="https://..."/>
                      </div>
                    </>
                  )}

                  <button onClick={() => removeBlock(activeBlockIdx)} className="w-full py-2 text-sm font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 flex items-center justify-center gap-2">
                    <Trash2 size={14}/> Rimuovi Blocco
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center rounded-t-3xl">
              <h3 className="font-black text-gray-900">Anteprima Landing</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 p-2 rounded-full"><X size={16}/></button>
            </div>
            <div className="p-8">
              <h1 className="text-2xl font-black text-gray-900 mb-2">{surveyTitle || 'Titolo Sondaggio'}</h1>
              {surveyDesc && <p className="text-gray-500 mb-6">{surveyDesc}</p>}
              <div className="space-y-6">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="border border-gray-200 rounded-2xl p-5">
                    <p className="font-bold text-gray-900 mb-3">{block.question}</p>
                    {block.type === 'multiple_choice' && (
                      <div className="space-y-2">{block.options?.map((opt, oi) => (
                        <label key={oi} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                          <input type="radio" name={`q${idx}`} className="accent-[#00665E]"/>
                          <span className="text-sm">{opt}</span>
                        </label>
                      ))}</div>
                    )}
                    {block.type === 'rating' && (
                      <div className="flex gap-2">{[1,2,3,4,5].map(n => (
                        <button key={n} className="w-10 h-10 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 font-bold text-sm transition">{n}</button>
                      ))}</div>
                    )}
                    {block.type === 'text' && (
                      <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00665E]" rows={3} placeholder="La tua risposta..."/>
                    )}
                    {block.type === 'cta' && (
                      <a href={block.ctaUrl || '#'} target="_blank" className="inline-flex items-center gap-2 bg-[#00665E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#004d46] transition">
                        {block.ctaLabel} <ArrowRight size={16}/>
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {blocks.length > 0 && (
                <button className="w-full mt-6 bg-[#00665E] text-white py-4 rounded-xl font-black text-lg hover:bg-[#004d46] transition shadow-lg">
                  Invia Risposte
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
