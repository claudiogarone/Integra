'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '../../../../utils/supabase/client'

export default function ArPublicPage() {
  const params = useParams()
  const slug = params?.id as string
  const [tour, setTour] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!slug) return
    supabase.from('ar_tours').select('*').eq('slug', slug).single()
      .then(({ data }) => { setTour(data); setLoading(false) })
  }, [slug])

  useEffect(() => {
    // Dynamically load model-viewer web component
    const script = document.createElement('script')
    script.type = 'module'
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js'
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-[#00665E] font-bold animate-pulse text-xl">Caricamento Tour 3D...</div>
    </div>
  )

  if (!tour) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500 font-bold text-xl">Tour AR non trovato</p>
      <p className="text-gray-400 text-sm">Il link potrebbe essere scaduto o errato.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#001a18] to-black flex flex-col items-center justify-start pt-0 font-sans">
      {/* HEADER */}
      <div className="w-full bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00665E] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">{tour.name}</p>
            <p className="text-white/40 text-[10px] font-medium">Tour 3D Interattivo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-[#00665E] bg-[#00665E]/20 border border-[#00665E]/40 px-3 py-1 rounded-full">AR Ready</span>
        </div>
      </div>

      {/* 3D VIEWER */}
      <div className="w-full flex-1 relative" style={{ minHeight: '70vh' }}>
        {/* @ts-ignore */}
        <model-viewer
          src={tour.model_url}
          poster={tour.poster_url || ''}
          alt={`Modello 3D di ${tour.name}`}
          auto-rotate
          camera-controls
          ar
          ar-modes="webxr scene-viewer quick-look"
          environment-image="neutral"
          shadow-intensity="1"
          style={{
            width: '100%',
            height: '70vh',
            background: 'transparent'
          }}
          loading="eager"
        >
          {/* AR BUTTON */}
          {/* @ts-ignore */}
          <button slot="ar-button" style={{
            background: '#00665E',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '50px',
            fontWeight: '900',
            fontSize: '14px',
            position: 'absolute',
            bottom: '24px',
            right: '24px',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(0,102,94,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🪄 Prova in Realtà Aumentata
          </button>
          {/* POSTER FALLBACK */}
          <div slot="poster" style={{
            background: 'linear-gradient(135deg, #001a18 0%, #003028 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ color: '#00665E', fontSize: '64px', opacity: 0.4 }}>⬡</div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '14px' }}>Caricamento modello 3D...</p>
          </div>
        {/* @ts-ignore */}
        </model-viewer>
      </div>

      {/* INFO FOOTER */}
      <div className="w-full max-w-2xl mx-auto px-6 py-8 flex flex-col items-center text-center gap-6">
        {tour.description && (
          <p className="text-white/60 text-sm leading-relaxed max-w-lg">{tour.description}</p>
        )}

        {tour.cta_url && (
          <a
            href={tour.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#00665E] hover:bg-[#004d46] text-white font-black px-8 py-4 rounded-2xl transition shadow-[0_10px_40px_rgba(0,102,94,0.4)] text-lg hover:scale-105"
          >
            {tour.cta_label || 'Scopri di Più'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        )}

        <div className="flex items-center gap-2 text-white/30 text-xs">
          <span>Powered by</span>
          <span className="font-black text-[#00665E]">IntegraOS</span>
          <span>• Tour 3D & AR</span>
        </div>

        {/* CONTROLS HINT */}
        <div className="flex flex-wrap gap-4 justify-center text-[10px] text-white/30 font-medium">
          <span>🖱️ Trascina per ruotare</span>
          <span>🔍 Pizzica per zoom</span>
          <span>📱 AR disponibile su mobile</span>
        </div>
      </div>
    </div>
  )
}
