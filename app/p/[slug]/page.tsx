'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function PublicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // STATO PER IL CAROSELLO (Volantino)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    const getPage = async () => {
      const { data } = await supabase
        .from('marketing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single()
      
      if (data) {
        setPage(data)
        await supabase.from('marketing_pages').update({ views: (data.views || 0) + 1 }).eq('id', data.id)
      }
      setLoading(false)
    }
    if (slug) getPage()
  }, [slug, supabase])

  // Funzioni Navigazione Volantino
  const nextSlide = () => {
    if (page?.slides && currentSlide < page.slides.length - 1) {
      setCurrentSlide(curr => curr + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1)
    }
  }

  // Funzione per capire se è un PDF
  const isPdf = (url: string) => url.toLowerCase().includes('.pdf')

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div></div>
  if (!page) return <div className="h-screen flex items-center justify-center text-gray-500">Pagina non trovata (404)</div>

  // --- RENDERIZZA LANDING PAGE (Uguale a prima) ---
  if (page.type === 'landing') {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <div className="relative h-[60vh] flex items-center justify-center">
           {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.hero_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover brightness-50" />
          <div className="relative z-10 text-center px-6 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{page.headline}</h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">{page.subheadline}</p>
            {page.cta_link && (
              <a href={page.cta_link} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 px-8 rounded-full text-lg transition shadow-xl transform hover:scale-105">
                {page.cta_text || 'Scopri di più'}
              </a>
            )}
          </div>
        </div>
        <div className="py-10 text-center text-sm text-gray-500 bg-gray-50"><p>© {new Date().getFullYear()} - Powered by Integra</p></div>
      </div>
    )
  }

  // --- RENDERIZZA VOLANTINO SFOGLIABILE (Nuovo Slider) ---
  if (page.type === 'flyer') {
    const totalSlides = page.slides?.length || 0
    const currentUrl = page.slides?.[currentSlide]

    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-4 px-2 md:px-0">
        
        {/* TITOLO */}
        <div className="text-white mb-4 text-center">
          <h1 className="text-xl font-bold">{page.title}</h1>
          <p className="text-xs text-gray-400">Pagina {currentSlide + 1} di {totalSlides}</p>
        </div>

        {/* CONTAINER VIEWER */}
        <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-800 flex items-center justify-center">
          
          {/* CONTENUTO SLIDE */}
          {currentUrl ? (
            isPdf(currentUrl) ? (
              // Visualizzatore PDF (Embed)
              <iframe src={`${currentUrl}#toolbar=0`} className="w-full h-full" title="PDF Viewer"></iframe>
            ) : (
              // Immagine Sfogliabile
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={currentUrl} 
                alt={`Pagina ${currentSlide + 1}`} 
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="text-gray-500">Nessuna pagina caricata.</div>
          )}

          {/* FRECCE NAVIGAZIONE (Solo se ci sono più slide e non è PDF unico) */}
          {totalSlides > 1 && (
            <>
              {/* Freccia SX */}
              <button 
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white backdrop-blur-sm transition ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
              >
                ◀
              </button>

              {/* Freccia DX */}
              <button 
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white backdrop-blur-sm transition ${currentSlide === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
              >
                ▶
              </button>
            </>
          )}

          {/* INDICATORE DOTS IN BASSO */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {page.slides?.map((_: any, idx: number) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-yellow-500 w-4' : 'bg-gray-600'}`}
              />
            ))}
          </div>
        </div>

        {/* CTA BUTTON */}
        {page.cta_link && (
          <div className="mt-8 w-full max-w-lg">
            <a href={page.cta_link} target="_blank" className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-center shadow-lg transition transform active:scale-95">
              📲 {page.cta_text || 'Ordina su WhatsApp'}
            </a>
          </div>
        )}
      </div>
    )
  }
}