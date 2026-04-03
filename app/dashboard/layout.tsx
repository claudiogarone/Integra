'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, Sparkles, Zap, Landmark, Leaf, 
  Palette, Gift, Workflow, Link2, BookOpen, 
  Settings, Crown, Bot, ShieldCheck, CreditCard, LogOut, 
  Database, Calendar, BarChart3, Megaphone, Image as ImageIcon, 
  Radar, EyeOff, Handshake, UserCog, GraduationCap, Mic, 
  ShoppingBag, FileText, MessageSquare, BarChart, Target, Building,
  BrainCircuit
} from 'lucide-react'

type MenuItem = {
    name: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    highlight?: boolean;
};

type MenuGroup = {
    title: string;
    items: MenuItem[];
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<{name: string, logo: string} | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchGlobalData = async () => {
      const devUserId = '00000000-0000-0000-0000-000000000000';
      setUser({ email: 'admin@integraos.it', id: devUserId });

      const { data } = await supabase
        .from('profiles')
        .select('company_name, logo_url')
        .eq('id', devUserId)
        .single();

      if (data) {
          setCompanyProfile({
              name: data.company_name || 'La Tua Azienda',
              logo: data.logo_url || ''
          });
      }
    }
    fetchGlobalData()
  }, [supabase])

  if (!user) return <div className="bg-white h-screen w-screen flex items-center justify-center text-[#00665E] font-bold animate-pulse">Inizializzazione Ecosistema...</div>

  const menuGroups: MenuGroup[] = [
      {
          title: 'Dati & Comunicazione',
          items: [
              { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18}/> },
              { name: 'Inbox Unificata', href: '/dashboard/inbox', icon: <MessageSquare size={18}/>, badge: 'Nuovo' },
              { name: 'Data Studio', href: '/dashboard/data-studio', icon: <BarChart3 size={18}/> },
              { name: 'Agenda', href: '/dashboard/agenda', icon: <Calendar size={18}/> },
          ]
      },
      {
          title: 'Vendite & CRM',
          items: [
              { name: 'CRM & Pipeline', href: '/dashboard/crm', icon: <Users size={18}/> },
              { name: 'CDP (Customer Data)', href: '/dashboard/cdp', icon: <Database size={18}/> },
              { name: 'E-commerce', href: '/dashboard/ecommerce', icon: <ShoppingBag size={18}/> },
              { name: 'Preventivi (Quotes)', href: '/dashboard/quotes', icon: <FileText size={18}/> },
          ]
      },
      {
          title: 'Fidelity & Marketing',
          items: [
              { name: 'Fidelity Card & Punti', href: '/dashboard/loyalty', icon: <CreditCard size={18}/> },
              { name: 'Report Fedeltà', href: '/dashboard/loyalty/report', icon: <BarChart size={18}/> },
              { name: 'Campagne Marketing', href: '/dashboard/marketing', icon: <Megaphone size={18}/> },
              { name: 'Launchpad Social', href: '/dashboard/launchpad', icon: <Sparkles size={18}/> },
              { name: 'Radar Media Locali', href: '/dashboard/radar', icon: <Radar size={18}/> },
          ]
      },
      {
          title: 'Design & Intelligenza AI',
          items: [
              { name: 'Creative Studio', href: '/dashboard/design', icon: <Palette size={18}/> },
              { name: 'Volantini & Landing', href: '/dashboard/flyer', icon: <ImageIcon size={18}/> },
              { name: 'Agenti AI', href: '/dashboard/ai-agent', icon: <Bot size={18}/> },
              { name: 'Voice & Chat AI', href: '/dashboard/voice', icon: <Mic size={18}/> },
              { name: 'Nurturing Engine', href: '/dashboard/nurturing', icon: <Gift size={18}/>, badge: 'AI' },
              { name: 'Modalità Incognito', href: '/dashboard/incognito', icon: <EyeOff size={18}/>, badge: 'PRO' },
          ]
      },
      {
          title: 'Automazioni & Connessioni',
          items: [
              { name: 'Zap Automations', href: '/dashboard/automations', icon: <Zap size={18}/> },
              { name: 'Workflows', href: '/dashboard/workflows', icon: <Workflow size={18}/> },
              { name: 'Integrations (Nexus)', href: '/dashboard/integrations', icon: <Link2 size={18}/> },
              { name: 'Affiliation Network', href: '/dashboard/affiliation', icon: <Handshake size={18}/> },
          ]
      },
      {
          title: 'Team, HR & Amministrazione',
          items: [
              { name: 'Agenti & Teams', href: '/dashboard/agents', icon: <UserCog size={18}/> },
              { name: 'Valutazione Performance', href: '/dashboard/performance', icon: <Target size={18}/>, badge: 'Nuovo' },
              { name: 'Wellness Aziendale', href: '/dashboard/wellness', icon: <Leaf size={18}/> },
              { name: 'Finance & CFO', href: '/dashboard/finance', icon: <Landmark size={18}/> },
              { name: 'Energy Monitor', href: '/dashboard/energy', icon: <Zap size={18}/> },
          ]
      },
      {
          title: 'Sistema & Formazione',
          items: [
              { name: 'Impostazioni', href: '/dashboard/settings', icon: <Settings size={18}/> },
              { name: 'Academy Corsi', href: '/dashboard/academy', icon: <GraduationCap size={18}/> },
              { name: 'Addestramento AI', href: '/dashboard/ai-training', icon: <BrainCircuit size={18}/>, badge: 'RAG' },
              { name: 'Tutorial & Manuale', href: '/dashboard/tutorial', icon: <BookOpen size={18}/> },
              { name: 'Piani & Upgrade', href: '/dashboard/enterprise', icon: <Crown size={18}/>, highlight: true },
          ]
      }
  ]

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-gray-800 font-sans overflow-hidden">
      
      <aside className="w-72 bg-white flex flex-col border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 h-full flex-shrink-0">
        
        {/* LOGO INTEGRAOS FISSO IN ALTO */}
        <div className="p-6 flex flex-col items-center flex-shrink-0 border-b border-gray-50 bg-white sticky top-0 z-10 min-h-[88px] justify-center">
            <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-10 object-contain" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6 custom-scrollbar pb-24">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-4">{group.title}</h3>
              <div className="space-y-0.5">
                {group.items.map(item => {
                   const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
                   
                   let linkClass = "flex items-center gap-3 py-2 px-4 rounded-xl transition-all font-medium text-sm group "
                   if (isActive) {
                     linkClass += "bg-[#00665E]/10 text-[#00665E] font-bold shadow-sm"
                   } else if (item.highlight) {
                     linkClass += "text-amber-500 hover:bg-amber-50 hover:text-amber-600 font-bold"
                   } else {
                     linkClass += "text-gray-500 hover:bg-gray-50 hover:text-[#00665E]"
                   }

                   return (
                     <Link key={item.name} href={item.href} className={linkClass}>
                       <span className={`${isActive ? 'text-[#00665E]' : item.highlight ? 'text-amber-500' : 'text-gray-400 group-hover:text-[#00665E]'} transition-colors`}>
                         {item.icon}
                       </span>
                       <span className="flex-1 truncate">{item.name}</span>
                       
                       {item.badge && (
                         <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                             item.badge === 'AI' ? 'bg-purple-100 text-purple-600' :
                             item.badge === 'PRO' ? 'bg-amber-100 text-amber-600' :
                             'bg-blue-100 text-blue-600'
                         }`}>
                             {item.badge}
                         </span>
                       )}
                     </Link>
                   )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* PROFILO AZIENDALE IN BASSO CON IL SUO LOGO */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 sticky bottom-0 z-10">
           <div className="flex items-center gap-3">
              {companyProfile?.logo ? (
                  <img src={companyProfile.logo} alt={companyProfile.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md bg-white shrink-0" />
              ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00665E] to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 border-2 border-white">
                    {companyProfile?.name ? companyProfile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-xs text-gray-900 truncate font-black">{companyProfile?.name || 'La Tua Azienda'}</p>
                <Link href="/dashboard/settings" className="text-[10px] text-gray-500 hover:text-[#00665E] flex items-center gap-1 mt-0.5">
                   <Settings size={10} /> Gestisci Azienda
                </Link>
              </div>
              <button onClick={() => router.push('/login')} className="text-gray-400 hover:text-red-500 transition shrink-0 bg-white p-2 rounded-lg border border-gray-200 shadow-sm" title="Esci">
                 <LogOut size={14} />
              </button>
           </div>
        </div>

      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC] relative min-w-0">
        
        <header className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 flex-shrink-0">
           <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-8 object-contain" />
           <button className="text-gray-500">☰</button>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth relative">
          <div className="min-h-[calc(100vh-100px)]">
            {children}
          </div>

          <footer className="bg-white border-t border-gray-200 py-6 px-8 mt-10 text-center md:text-left shrink-0">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-medium">
                <p>© 2026 {companyProfile?.name || 'La Tua Azienda'}. Tutti i diritti riservati.</p>
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                  <span className="flex items-center gap-2">
                    Powered by 
                    <img src="/logo-integraos.png" alt="IntegraOS" className="h-4 object-contain grayscale opacity-80" />
                  </span>
                  <span className="hidden md:inline-block text-gray-200">|</span>
                  <div className="flex items-center gap-3">
                    <img src="/logo-concept.jpeg" alt="Concept ADV" className="h-5 object-contain grayscale opacity-60 hover:grayscale-0 transition" onError={(e) => { e.currentTarget.style.display='none' }} />
                    <img src="/logo-enestar.jpeg" alt="Enestar" className="h-5 object-contain grayscale opacity-60 hover:grayscale-0 transition" onError={(e) => { e.currentTarget.style.display='none' }} />
                  </div>
                </div>
              </div>
          </footer>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  )
}