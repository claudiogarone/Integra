'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/login')
      else setUser(user)
    }
    checkUser()
  }, [router, supabase])

  // Stile Link Sidebar
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-4 py-3 px-4 rounded-xl transition-all font-medium text-base"
    if (pathname === path) {
      return `${baseClass} bg-[#00665E]/10 text-[#00665E] border-l-4 border-[#00665E] font-bold`
    }
    return `${baseClass} text-gray-500 hover:bg-gray-50 hover:text-[#00665E]`
  }

  if (!user) return <div className="bg-white h-screen w-screen flex items-center justify-center text-[#00665E] animate-pulse">Caricamento Integra OS...</div>

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-800 font-sans overflow-hidden">
      
      {/* --- SIDEBAR (FIXATA) --- */}
      <aside className="w-80 bg-white flex flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 h-full flex-shrink-0 relative">
        
        {/* LOGO HEADER (Fisso in alto) */}
        <div className="p-8 pb-4 flex flex-col items-center flex-shrink-0">
          <h1 className="text-3xl font-black text-[#00665E] tracking-tighter mb-6">
            INTEGRA<span className="font-light text-gray-400">OS</span>
          </h1>
          
          {/* QR CODE BOX */}
          <div className="bg-white p-2 rounded-xl border-2 border-dashed border-gray-200 w-32 h-32 flex flex-col items-center justify-center mb-2 shadow-inner group cursor-pointer hover:border-[#00665E]">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="/qr-code-placeholder.png" alt="QR" className="w-20 h-20 opacity-30 group-hover:opacity-100 transition" />
             <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest group-hover:text-[#00665E]">Il Tuo QR</span>
          </div>
        </div>

        {/* MENU DI NAVIGAZIONE (Scrollabile internamente) */}
        {/* overflow-y-auto e flex-1 permettono lo scroll SOLO qui dentro se si zooma */}
        <nav className="flex-1 overflow-y-auto px-6 py-2 space-y-8 scrollbar-hide min-h-0">
          
          {/* PERFORMANCES */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">PERFORMANCES</h3>
            <div className="space-y-1">
              <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                <span className="text-2xl">📊</span> Dashboard
              </Link>
            </div>
          </div>

          {/* VENDITA */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">INTEGRA VENDITA</h3>
            <div className="space-y-1">
              <Link href="/dashboard/crm" className={getLinkClass('/dashboard/crm')}>
                <span className="text-2xl">👥</span> CRM Clienti
              </Link>
              <Link href="/dashboard/ecommerce" className={getLinkClass('/dashboard/ecommerce')}>
                <span className="text-2xl">🛍️</span> Vetrina Prodotti
              </Link>
               <Link href="/dashboard/agenda" className={getLinkClass('/dashboard/agenda')}>
                <span className="text-2xl">📅</span> Agenda
              </Link>
              <Link 
  href="/dashboard/quotes" 
  className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition"
>
  {/* Icona Documento / Soldi */}
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
  <span className="font-medium">Preventivi & Fatture</span>
</Link>
            </div>
          </div>

          {/* PROMO */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">INTEGRA PROMO</h3>
            <div className="space-y-1">
              <Link href="/dashboard/flyer" className={getLinkClass('/dashboard/flyer')}>
                <span className="text-2xl">📃</span> Pagine & Volantini
              </Link>
              <Link href="/dashboard/marketing" className={getLinkClass('/dashboard/marketing')}>
                <span className="text-2xl">📧</span> Campagne DEM
              </Link>
            </div>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">INTEGRA SOCIAL</h3>
            <div className="space-y-1">
              <Link href="/dashboard/launchpad" className={getLinkClass('/dashboard/launchpad')}>
                <span className="text-2xl">🚀</span> Launchpad
              </Link>
               <Link href="/dashboard/ai-agent" className={getLinkClass('/dashboard/ai-agent')}>
                <span className="text-2xl">🤖</span> Agente AI
              </Link>
            </div>
          </div>

          {/* AMBASSADOR */}
          <div className="bg-gradient-to-b from-purple-50 to-white p-4 rounded-2xl border border-purple-100">
            <h3 className="text-xs font-black text-purple-800 uppercase tracking-widest mb-3 flex items-center gap-2">
              💎 AMBASSADOR
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard/enterprise?feat=ghost" className={getLinkClass('/dashboard/enterprise?feat=ghost')}>
                <span className="text-2xl">👻</span> Ghost Writer AI
              </Link>
              <Link href="/dashboard/enterprise?feat=simulator" className={getLinkClass('/dashboard/enterprise?feat=simulator')}>
                <span className="text-2xl">🥊</span> Simulatore Sales
              </Link>
              <Link href="/dashboard/enterprise?feat=living" className={getLinkClass('/dashboard/enterprise?feat=living')}>
                <span className="text-2xl">🧬</span> Sito Vivente
              </Link>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-gradient-to-b from-teal-50 to-white p-4 rounded-2xl border border-teal-100">
            <h3 className="text-xs font-black text-[#00665E] uppercase tracking-widest mb-3 flex items-center gap-2">
              ⭐ ENTERPRISE
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard/enterprise?feat=shop100" className={getLinkClass('/dashboard/enterprise?feat=shop100')}>
                <span className="text-2xl">🏬</span> Negozio Online
              </Link>
              <Link href="/dashboard/enterprise?feat=dem" className={getLinkClass('/dashboard/enterprise?feat=dem')}>
                <span className="text-2xl">📨</span> Campagna DEM
              </Link>
              <Link href="/dashboard/enterprise?feat=agents" className={getLinkClass('/dashboard/enterprise?feat=agents')}>
                <span className="text-2xl">💼</span> Rete Agenti
              </Link>
              <Link href="/dashboard/enterprise?feat=affiliate" className={getLinkClass('/dashboard/enterprise?feat=affiliate')}>
                <span className="text-2xl">🤝</span> Affiliazione
              </Link>
              <Link href="/dashboard/enterprise?feat=network" className={getLinkClass('/dashboard/enterprise?feat=network')}>
                <span className="text-2xl">🌐</span> Network
              </Link>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="pb-4">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2">SISTEMA</h3>
             <div className="space-y-1">
               <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
                 <span className="text-2xl">⚙️</span> Impostazioni
               </Link>
             </div>
          </div>

        </nav>

        {/* UTENTE (Fisso in basso) */}
        <div className="p-6 border-t border-gray-100 flex-shrink-0 bg-white z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00665E] flex items-center justify-center text-white font-bold shadow-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm text-gray-900 truncate font-bold">Account</p>
                <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="text-xs text-red-500 hover:underline">Disconnetti</button>
              </div>
           </div>
        </div>
      </aside>

      {/* --- CONTENUTO PRINCIPALE --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] relative min-w-0">
        
        {/* Header Mobile */}
        <header className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 flex-shrink-0">
           <span className="font-black text-[#00665E]">INTEGRA OS</span>
           <button className="text-gray-500">☰</button>
        </header>

        {/* AREA SCROLLABILE CENTRALE */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          
          {/* Contenuto Pagina */}
          <div className="p-2 md:p-0 min-h-[calc(100vh-200px)]">
            {children}
          </div>

          {/* --- FOOTER GLOBALE (Fisso alla fine dello scroll) --- */}
          <footer className="bg-white border-t border-gray-200 py-6 px-8 mt-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* SOCIAL */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest mr-2 hidden lg:block">Seguici su:</span>
                
                {/* Facebook */}
                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition text-gray-700">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.376h3.428l-.538 3.667h-2.89l-.003 7.98h-2.814L9.101 23.691Z"></path></svg>
                </a>
                {/* Instagram */}
                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 hover:bg-[#E4405F] hover:text-white flex items-center justify-center transition text-gray-700">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"></path></svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 hover:bg-black hover:text-white flex items-center justify-center transition text-gray-700">
                   <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.62-1.1-.04 1.82.01 3.64.01 5.46 0 1.14-.17 2.29-.51 3.39-1.14 3.73-5.35 5.76-8.98 4.33C4.1 19.95 2.2 16.53 3.67 12.7c.97-2.52 3.42-4.22 6.1-4.24v4.06c-1.25.04-2.43.83-2.92 1.97-.49 1.14-.23 2.53.64 3.44.87.91 2.29 1.16 3.43.61.79-.38 1.34-1.13 1.44-2.01.07-1.78.03-3.56.03-5.33V.02h.135z"></path></svg>
                </a>
                {/* Email */}
                <a href="mailto:info@integraos.com" className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 hover:bg-[#00665E] hover:text-white flex items-center justify-center transition text-gray-700">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path></svg>
                </a>
              </div>

              {/* PARTNERS */}
              <div className="flex items-center gap-6">
                <div className="h-8 w-[2px] bg-gray-200 hidden md:block"></div>
                
                <a href="https://www.conceptadv.it/" target="_blank" className="flex items-center gap-3 group opacity-100 transition hover:scale-105">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src="/logo-concept.jpeg" alt="Concept" className="h-10 w-auto object-contain" />
                   <span className="text-xs font-black text-gray-900 hidden xl:block uppercase">Partner<br/>Ufficiale</span>
                </a>

                <div className="h-8 w-[2px] bg-gray-200 hidden md:block"></div>

                <a href="https://enestar.it/" target="_blank" className="flex items-center gap-3 group opacity-100 transition hover:scale-105">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img src="/logo-enestar.jpg" alt="Enestar" className="h-10 w-auto object-contain" />
                   <span className="text-xs font-black text-gray-900 hidden xl:block uppercase">Partner<br/>Ufficiale</span>
                </a>
              </div>
            </div>
          </footer>
        
        </div>
      </div>
    </div>
  )
}