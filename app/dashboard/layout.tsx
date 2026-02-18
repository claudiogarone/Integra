'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
// UNICO IMPORT PULITO DI TUTTE LE ICONE
import { 
  LayoutDashboard, Users, ShoppingBag, Calendar, MessageSquare, FileText, 
  Send, Rocket, Bot, Award, Settings, LogOut, CreditCard, 
  GraduationCap, UserCog, Printer, Map
} from 'lucide-react'

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
    const baseClass = "flex items-center gap-3 py-3 px-4 rounded-xl transition-all font-medium text-sm group"
    if (pathname === path) {
      return `${baseClass} bg-[#00665E]/10 text-[#00665E] font-bold shadow-sm`
    }
    return `${baseClass} text-gray-500 hover:bg-gray-50 hover:text-[#00665E]`
  }

  if (!user) return <div className="bg-white h-screen w-screen flex items-center justify-center text-[#00665E] animate-pulse">Caricamento Integra OS...</div>

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-800 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-white flex flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 h-full flex-shrink-0">
        
        {/* LOGO */}
        <div className="p-6 flex flex-col items-center flex-shrink-0 border-b border-gray-50">
          <h1 className="text-2xl font-black text-[#00665E] tracking-tighter">
            INTEGRA<span className="font-light text-gray-400">OS</span>
          </h1>
        </div>

        {/* MENU SCROLLABILE */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          
          {/* SEZIONE 1: ANALISI */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">Business Intelligence</h3>
            <div className="space-y-1">
              <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link href="/dashboard/crm" className={getLinkClass('/dashboard/crm')}>
                <Users size={18} /> CRM & Funnel
              </Link>
            </div>
          </div>

          {/* SEZIONE 2: VENDITA & FIDELITY */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">Vendita & Clienti</h3>
            <div className="space-y-1">
              <Link href="/dashboard/loyalty" className={getLinkClass('/dashboard/loyalty')}>
                 <Award size={18} className="text-orange-500"/> Fidelity Card
              </Link>
              <Link href="/dashboard/loyalty/terminal" className={getLinkClass('/dashboard/loyalty/terminal')}>
                 <CreditCard size={18} /> Terminale Punti
              </Link>
              <Link href="/dashboard/agenda" className={getLinkClass('/dashboard/agenda')}>
                <Calendar size={18} /> Agenda
              </Link>
              <Link href="/dashboard/ecommerce" className={getLinkClass('/dashboard/ecommerce')}>
                <ShoppingBag size={18} /> Prodotti
              </Link>
              <Link href="/dashboard/quotes" className={getLinkClass('/dashboard/quotes')}>
                <FileText size={18} /> Preventivi
              </Link>
            </div>
          </div>

          {/* SEZIONE 3: MARKETING & FORMAZIONE (Nuova Academy qui) */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">Crescita</h3>
            <div className="space-y-1">
              <Link href="/dashboard/inbox" className={getLinkClass('/dashboard/inbox')}>
                 <MessageSquare size={18} /> Inbox Unificata
              </Link>
              <Link href="/dashboard/marketing" className={getLinkClass('/dashboard/marketing')}>
                 <Send size={18} /> Campagne Email
              </Link>
              <Link href="/dashboard/launchpad" className={getLinkClass('/dashboard/launchpad')}>
                 <Rocket size={18} /> Launchpad Social
              </Link>
              {/* NUOVO LINK ACADEMY */}
              <Link href="/dashboard/academy" className={getLinkClass('/dashboard/academy')}>
                 <GraduationCap size={18} /> Academy <span className="ml-auto text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">NEW</span>
              </Link>
            </div>
          </div>

          {/* SEZIONE 4: STRUMENTI AZIENDALI (Nuovi Link qui) */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">Strumenti</h3>
            <div className="space-y-1">
                <Link href="/dashboard/agents" className={getLinkClass('/dashboard/agents')}>
                    <UserCog size={18} /> Agenti & Team
                </Link>
                <Link href="/dashboard/flyer" className={getLinkClass('/dashboard/flyer')}>
                    <Printer size={18} /> Crea Volantino
                </Link>
                <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
                    <Settings size={18} /> Configurazione
                </Link>
            </div>
          </div>

          {/* SEZIONE 5: ENTERPRISE & AI */}
          <div className="bg-gradient-to-b from-teal-50/50 to-transparent p-3 rounded-xl border border-teal-50 mx-1">
            <h3 className="text-[10px] font-black text-[#00665E] uppercase tracking-widest mb-2 flex items-center gap-2">
               ✨ Enterprise AI
            </h3>
            <div className="space-y-1">
               <Link href="/dashboard/ai-agent" className={getLinkClass('/dashboard/ai-agent')}>
                 <Bot size={18} /> Agente AI
               </Link>
            </div>
          </div>

        </nav>

        {/* UTENTE FOOTER */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00665E] text-white flex items-center justify-center font-bold text-sm shadow-md">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs text-gray-900 truncate font-bold">{user.email}</p>
                <Link href="/dashboard/settings" className="text-[10px] text-gray-500 hover:text-[#00665E] flex items-center gap-1">
                   <Settings size={10} /> Impostazioni
                </Link>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="text-gray-400 hover:text-red-500 transition">
                 <LogOut size={16} />
              </button>
           </div>
        </div>

      </aside>

      {/* --- AREA CONTENUTO --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] relative min-w-0">
        
        {/* Header Mobile */}
        <header className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 flex-shrink-0">
           <span className="font-black text-[#00665E]">INTEGRA OS</span>
           <button className="text-gray-500">☰</button>
        </header>

        {/* CONTENUTO SCROLLABILE */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="min-h-[calc(100vh-100px)]">
            {children}
          </div>

          {/* FOOTER */}
          <footer className="bg-white border-t border-gray-200 py-6 px-8 mt-10 text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                <p>© 2024 Integra OS. All rights reserved.</p>
                <div className="flex gap-4">
                  <span>Partner: Concept ADV</span>
                  <span>•</span>
                  <span>Partner: Enestar</span>
                </div>
              </div>
          </footer>
        </div>

      </div>
    </div>
  )
}