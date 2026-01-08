'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function PublicPage() {
  const { slug } = useParams()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const getPage = async () => {
      const { data } = await supabase.from('marketing_pages').select('*').eq('slug', slug).single()
      if (data) {
        setPage(data)
        // Incrementa visualizzazioni
        await supabase.from('marketing_pages').update({ views: (data.views || 0) + 1 }).eq('id', data.id)
      }
      setLoading(false)
    }
    if (slug) getPage()
  }, [slug, supabase])

  // --- GESTIONE STILI ---
  const getThemeClasses = () => {
    const t = page?.style_config?.theme || 'modern'
    if (t === 'bold') return 'bg-gray-900 text-white'
    if (t === 'elegant') return 'bg-[#FAF9F6] text-gray-800'
    return 'bg-white text-gray-900'
  }
  const getFontClass = () => {
    const f = page?.style_config?.font || 'sans'
    if (f === 'serif') return 'font-serif'; if (f === 'mono') return 'font-mono'
    return 'font-sans'
  }
  const titleStyle = { color: page?.style_config?.titleColor || 'inherit' }
  const textStyle = { color: page?.style_config?.textColor || 'inherit' }

  // --- NAVIGAZIONE VOLANTINO ---
  const nextSlide = () => { if (page?.slides && currentSlide < page.slides.length - 1) setCurrentSlide(c => c + 1) }
  const prevSlide = () => { if (currentSlide > 0) setCurrentSlide(c => c - 1) }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><div className="animate-spin h-10 w-10 border-b-2 border-[#00665E] rounded-full"></div></div>
  if (!page) return <div className="h-screen flex items-center justify-center">Pagina non trovata (404)</div>

  return (
    <div className={`min-h-screen flex flex-col ${getThemeClasses()} ${getFontClass()}`}>
      
      {/* --- HEADER COMUNE (LOGO) --- */}
      <header className="p-6 flex justify-center border-b border-black/5">
         {page.company_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.company_logo} alt="Logo Azienda" className="h-20 object-contain" />
         ) : (
            <h1 className="text-2xl font-bold uppercase tracking-widest">{page.title}</h1>
         )}
      </header>

      <main className="flex-1">
        
        {/* === CASO 1: LANDING PAGE === */}
        {page.type === 'landing' && (
          <div className="max-w-5xl mx-auto w-full px-6 py-10 space-y-20">
            {page.sections?.map((sec: any, i: number) => (
              <div key={i} className={`flex flex-col gap-10 ${i % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight" style={titleStyle}>{sec.title}</h2>
                  <p className="text-lg md:text-xl leading-relaxed opacity-90 whitespace-pre-line" style={textStyle}>{sec.text}</p>
                </div>
                {sec.media && (
                  <div className="flex-1 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sec.media} alt={sec.title} className="w-full rounded-3xl shadow-2xl object-cover aspect-video hover:scale-[1.02] transition duration-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* === CASO 2: VOLANTINO EVOLUTO === */}
        {page.type === 'flyer' && (
          <div className="flex flex-col items-center py-10 px-4">
            
            {/* Titolo e Descrizione Volantino */}
            <div className="max-w-2xl text-center mb-8">
               <h1 className="text-3xl font-bold mb-4" style={titleStyle}>{page.title}</h1>
               {page.subheadline && <p className="text-lg opacity-80 whitespace-pre-line" style={textStyle}>{page.subheadline}</p>}
            </div>

            {/* Viewer Volantino */}
            <div className="relative w-full max-w-xl aspect-[3/4] bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-800 flex items-center justify-center mb-4">
              {page.slides?.[currentSlide] ? (
                 page.slides[currentSlide].includes('.pdf') ? (
                   <iframe src={`${page.slides[currentSlide]}#toolbar=0`} className="w-full h-full border-none"/>
                 ) : (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={page.slides[currentSlide]} className="w-full h-full object-contain" alt="slide"/>
                 )
              ) : <div className="text-gray-500">Nessuna pagina caricata</div>}

              {/* Frecce Navigazione */}
              {(page.slides?.length || 0) > 1 && (
                <>
                  <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full hover:bg-[#00665E] transition backdrop-blur-sm">◀</button>
                  <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-black/60 text-white rounded-full hover:bg-[#00665E] transition backdrop-blur-sm">▶</button>
                  
                  {/* Indicatore Pagine */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {page.slides.map((_:any, i:number) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-[#00665E] w-6' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs opacity-50 uppercase tracking-widest">Pagina {currentSlide + 1} di {page.slides?.length || 0}</p>
          </div>
        )}

        {/* --- INTEGRAZIONI (Comuni a entrambi) --- */}
        {(page.show_appointments || page.show_products) && (
          <div className="py-16 bg-black/5 text-center mt-10 border-t border-black/5">
            <h3 className="text-2xl font-bold mb-8">I Nostri Servizi Online</h3>
            <div className="flex justify-center gap-6 flex-wrap px-4">
              {page.show_appointments && (
                <a href="/prenota" target="_blank" className="bg-[#00665E] text-white px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition transform flex items-center gap-2 text-lg">
                  📅 Prenota Appuntamento
                </a>
              )}
              {page.show_products && (
                <a href="/negozio" target="_blank" className="bg-yellow-500 text-black px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition transform flex items-center gap-2 text-lg">
                  🛍️ Visita lo Shop
                </a>
              )}
            </div>
          </div>
        )}

      </main>

      {/* --- FOOTER COMPLETO (Comune a entrambi) --- */}
      <footer className="bg-[#111] text-white py-16 px-6 mt-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h4 className="font-bold text-xl mb-8 uppercase tracking-widest text-gray-400">Resta in contatto</h4>
          
          {/* Social Icons Loop */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            {page.client_socials?.facebook && (
              <a href={page.client_socials.facebook} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.376h3.428l-.538 3.667h-2.89l-.003 7.98h-2.814L9.101 23.691Z"></path></svg>
              </a>
            )}
            {page.client_socials?.instagram && (
              <a href={page.client_socials.instagram} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-[#E4405F] flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"></path></svg>
              </a>
            )}
            {page.client_socials?.tiktok && (
              <a href={page.client_socials.tiktok} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-black hover:shadow-white/20 hover:shadow-lg flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.62-1.1-.04 1.82.01 3.64.01 5.46 0 1.14-.17 2.29-.51 3.39-1.14 3.73-5.35 5.76-8.98 4.33C4.1 19.95 2.2 16.53 3.67 12.7c.97-2.52 3.42-4.22 6.1-4.24v4.06c-1.25.04-2.43.83-2.92 1.97-.49 1.14-.23 2.53.64 3.44.87.91 2.29 1.16 3.43.61.79-.38 1.34-1.13 1.44-2.01.07-1.78.03-3.56.03-5.33V.02h.135z"></path></svg>
              </a>
            )}
            {page.client_socials?.linkedin && (
              <a href={page.client_socials.linkedin} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-[#0077b5] flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h5v-8.306c0-4.613 5.432-5.185 5.432 0v8.306h5v-10.593c0-7.718-8.208-7.486-10.464-3.651v-1.761z"/></svg>
              </a>
            )}
            {page.client_socials?.youtube && (
              <a href={page.client_socials.youtube} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
              </a>
            )}
            {page.client_socials?.email && (
              <a href={`mailto:${page.client_socials.email}`} className="w-12 h-12 rounded-full bg-white/10 hover:bg-green-600 flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path></svg>
              </a>
            )}
            {page.client_socials?.website && (
              <a href={page.client_socials.website} target="_blank" className="w-12 h-12 rounded-full bg-white/10 hover:bg-blue-400 flex items-center justify-center transition text-white hover:-translate-y-1">
                 <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 10a4 4 0 1 1 4-4 4 4 0 0 1-4 4z"/></svg>
              </a>
            )}
          </div>
          
          {/* COPYRIGHT & BRANDING */}
          <div className="border-t border-white/10 pt-8 flex flex-col items-center gap-3 opacity-60">
            <span className="text-sm font-light">© 2026 Tutti i diritti riservati.</span>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-400">
              <span>Powered by</span>
              {/* Logo Integra OS (Public) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-integra.png" alt="Integra OS" className="h-5 object-contain filter invert opacity-80" />
              <span>INTEGRA OS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}