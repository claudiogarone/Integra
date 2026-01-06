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
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [router, supabase])

  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 py-2 px-3 rounded-lg transition-all text-sm"
    if (pathname === path) {
      return `${baseClass} bg-yellow-600 text-black font-bold shadow-lg shadow-yellow-600/20`
    }
    return `${baseClass} text-gray-400 hover:text-white hover:bg-gray-800`
  }

  if (!user) return <div className="bg-black h-screen w-screen"></div>

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* SIDEBAR MASTER */}
      <aside className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col hidden md:flex flex-shrink-0">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-yellow-500 tracking-wider">INTEGRA</h2>
          <p className="text-xs text-gray-500 mt-1">Business OS v1.0</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          
          {/* HOME */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">Home</h3>
            <div className="space-y-1">
              <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                <span>📊</span> Dashboard
              </Link>
              <Link href="/dashboard/launchpad" className={getLinkClass('/dashboard/launchpad')}>
                <span>🚀</span> Launchpad Social
              </Link>
              <Link href="/dashboard/tutorial" className={getLinkClass('/dashboard/tutorial')}>
                <span>🎓</span> Video Tutorial
              </Link>
            </div>
          </div>

          {/* VENDITA */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">Vendita & Clienti</h3>
            <div className="space-y-1">
              <Link href="/dashboard/crm" className={getLinkClass('/dashboard/crm')}>
                <span>👥</span> CRM Contatti
              </Link>
              <Link href="/dashboard/agenda" className={getLinkClass('/dashboard/agenda')}>
                <span>📅</span> Agenda Smart
              </Link>
              <Link href="/dashboard/ecommerce" className={getLinkClass('/dashboard/ecommerce')}>
                <span>🛍️</span> Vetrina Prodotti
              </Link>
              <Link href="/dashboard/orders" className={getLinkClass('/dashboard/orders')}>
                <span>💰</span> Ordini & Incassi
              </Link>
            </div>
          </div>

          {/* MARKETING & AI */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">Marketing & AI</h3>
            <div className="space-y-1">
              <Link href="/dashboard/ai-agent" className={getLinkClass('/dashboard/ai-agent')}>
                <span>🤖</span> AI Sales Agent
              </Link>
              <Link href="/dashboard/social-inbox" className={getLinkClass('/dashboard/social-inbox')}>
                <span>💬</span> Social Inbox
              </Link>
              <Link href="/dashboard/marketing" className={getLinkClass('/dashboard/marketing')}>
                <span>📧</span> Email Marketing
              </Link>
              <Link href="/dashboard/flyer" className={getLinkClass('/dashboard/flyer')}>
                <span>📃</span> Pagine & Volantini
              </Link>
            </div>
          </div>

          {/* CONFIGURAZIONE */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-2">Configurazione</h3>
            <div className="space-y-1">
              <Link href="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
                <span>⚙️</span> Impostazioni Azienda
              </Link>
              <Link href="/dashboard/billing" className={getLinkClass('/dashboard/billing')}>
                <span>💳</span> Abbonamento
              </Link>
            </div>
          </div>

        </nav>

        <div className="p-4 border-t border-gray-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-black font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-white truncate font-bold">Il tuo Account</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              </div>
           </div>
           <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="w-full py-2 text-xs text-center border border-gray-700 rounded hover:bg-red-900/20 hover:text-red-400 transition">Disconnetti</button>
        </div>
      </aside>

      {/* CONTENUTO PAGINE */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>

    </div>
  )
}