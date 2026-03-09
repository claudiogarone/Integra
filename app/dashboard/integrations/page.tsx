'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
    Activity, Smartphone, CreditCard, MessageCircle, Wallet, 
    FileText, CheckCircle2, AlertTriangle, Store, Users, X, Loader2, Link2, Wifi
} from 'lucide-react'

export default function NexusHubPage() {
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeApp, setActiveApp] = useState<any>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [connecting, setConnecting] = useState(false)

  // Sincronizzazioni attive (In produzione vengono dal DB)
  const [activeConnections, setActiveConnections] = useState<Record<string, string[]>>({
      'whatsapp_sync': [], 'pos_sumup': []
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: teamData } = await supabase.from('team_members').select('*')
        if (teamData) setTeam(teamData)
      }
      setLoading(false)
    }
    getData()
  }, [])

  const apps = [
      { id: 'whatsapp_sync', name: 'WhatsApp Business API', category: 'agent', icon: <MessageCircle size={32} className="text-[#25D366]"/>, desc: "Sincronizza le chat in tempo reale. L'AI leggerà le conferme d'ordine e aggiornerà la pipeline.", warning: "Richiede SIM Aziendale. IntegraOS tratterà i dati nel rispetto del GDPR.", btn: "Assegna ad Agente" },
      { id: 'smart_quote', name: 'Preventivatore Mobile', category: 'agent', icon: <FileText size={32} className="text-blue-500"/>, desc: "App mobile per l'agente. Crea preventivi da smartphone, traccia aperture e firme.", btn: "Abilita Agente" },
      { id: 'pos_sumup', name: 'SumUp POS', category: 'store', icon: <CreditCard size={32} className="text-slate-800"/>, desc: "Collega il registratore di cassa. Ogni scontrino battuto in negozio aggiornerà il fatturato in IntegraOS.", btn: "Connetti a Negozio" },
      { id: 'pos_nexi', name: 'Nexi SmartPOS', category: 'store', icon: <CreditCard size={32} className="text-blue-700"/>, desc: "Integrazione diretta con i terminali Nexi per tracciare le transazioni fisiche.", btn: "Connetti a Negozio" },
      { id: 'fidelity_wallet', name: 'Fidelity Apple/Google Wallet', category: 'store', icon: <Wallet size={32} className="text-purple-500"/>, desc: "I clienti passano il telefono in cassa. IntegraOS registra l'acquisto e assegna i punti.", btn: "Attiva su Negozio" }
  ]

  const getEligibleTargets = (category: string) => {
      if (category === 'agent') return team.filter(t => t.type === 'human')
      if (category === 'store') return team.filter(t => t.type === 'store')
      return team
  }

  const handleConnect = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedTargetId) return alert("Seleziona a chi assegnare l'integrazione.")
      setConnecting(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      const currentAppConnections = activeConnections[activeApp.id] || []
      setActiveConnections({ ...activeConnections, [activeApp.id]: [...currentAppConnections, selectedTargetId] })
      setConnecting(false); setActiveApp(null); setSelectedTargetId('')
      alert("✅ Integrazione collegata! I dati si aggiorneranno in automatico.")
  }

  // Monitoraggio: Calcola quante connessioni sono attive in totale
  const totalActive = Object.values(activeConnections).flat().length

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Inizializzazione Nexus...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3"><Activity size={32}/> Nexus Hub</h1>
          <p className="text-gray-500 mt-1">Il centro nevralgico del tuo ecosistema aziendale. Connetti strumenti e monitora i flussi di dati.</p>
        </div>
      </div>

      {/* NUOVA SEZIONE: MONITORAGGIO IN TEMPO REALE */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-12">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Wifi className="text-blue-500"/> Stato Sincronizzazioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase">Flussi Attivi</p>
                      <p className="text-2xl font-black text-gray-900">{totalActive}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ultimo Ping (Aggiornamento)</p>
                  <p className="text-lg font-bold text-gray-900 flex items-center gap-2">2 min fa <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">Online</span></p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Dati Ricevuti Oggi</p>
                  <p className="text-lg font-bold text-gray-900">142 Eventi (Scontrini/Chat)</p>
              </div>
          </div>
      </div>

      <div className="space-y-12">
          <section>
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Users className="text-blue-600"/> Automazioni per Agenti e Venditori</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {apps.filter(a => a.category === 'agent').map(app => (
                      <AppCard key={app.id} app={app} team={team} connections={activeConnections[app.id] || []} onConnect={() => setActiveApp(app)} />
                  ))}
              </div>
          </section>

          <section>
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2 border-t pt-8"><Store className="text-orange-500"/> Integrazioni Negozi Fisici e Casse</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {apps.filter(a => a.category === 'store').map(app => (
                      <AppCard key={app.id} app={app} team={team} connections={activeConnections[app.id] || []} onConnect={() => setActiveApp(app)} />
                  ))}
              </div>
          </section>
      </div>

      {activeApp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-xl shadow-sm">{activeApp.icon}</div>
                          <h2 className="text-lg font-black text-gray-900">Configura {activeApp.name}</h2>
                      </div>
                      <button onClick={() => setActiveApp(null)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-full shadow-sm"><X size={16}/></button>
                  </div>
                  
                  <div className="p-8">
                      <p className="text-sm text-gray-600 mb-6">{activeApp.desc}</p>
                      {activeApp.warning && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-start gap-2 mb-6">
                              <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                              <p className="font-medium">{activeApp.warning}</p>
                          </div>
                      )}
                      <form onSubmit={handleConnect} className="space-y-6">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{activeApp.category === 'agent' ? 'Scegli l\'Agente da monitorare' : 'Scegli il Negozio Fisico'}</label>
                              <select required value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#00665E] font-bold text-gray-700">
                                  <option value="" disabled>-- Seleziona --</option>
                                  {getEligibleTargets(activeApp.category).map(t => {
                                      const isAlreadyConnected = (activeConnections[activeApp.id] || []).includes(t.id.toString());
                                      return <option key={t.id} value={t.id} disabled={isAlreadyConnected}>{t.name} {isAlreadyConnected ? '(Già Connesso)' : ''}</option>
                                  })}
                              </select>
                          </div>
                          {activeApp.category === 'store' && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">API Key / Token del POS</label>
                                  <input required type="password" placeholder="Incolla il token" className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-sm" />
                              </div>
                          )}
                          <button disabled={connecting} type="submit" className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
                              {connecting ? <><Loader2 className="animate-spin" size={18}/> Autenticazione in corso...</> : <><Link2 size={18}/> Conferma Assegnazione</>}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </main>
  )
}

function AppCard({ app, team, connections, onConnect }: any) {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition duration-300 flex flex-col h-full relative group">
            <div className="flex items-center gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 group-hover:scale-110 transition duration-300">{app.icon}</div>
                <h3 className="font-black text-gray-900 text-lg leading-tight">{app.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 flex-1">{app.desc}</p>
            {connections.length > 0 && (
                <div className="mb-6 bg-green-50 p-3 rounded-xl border border-green-100">
                    <p className="text-[10px] font-bold text-green-800 uppercase mb-2">Connessioni Attive:</p>
                    <div className="flex flex-wrap gap-2">
                        {connections.map((id: string) => {
                            const member = team.find((t:any) => t.id.toString() === id)
                            return member ? <span key={id} className="bg-white text-green-700 text-xs font-bold px-2 py-1 rounded shadow-sm border border-green-200 flex items-center gap-1"><CheckCircle2 size={12}/> {member.name}</span> : null
                        })}
                    </div>
                </div>
            )}
            <button onClick={onConnect} className="w-full bg-[#00665E] text-white font-bold py-2.5 rounded-xl hover:bg-[#004d46] transition mt-auto flex items-center justify-center gap-2">
                <Link2 size={16}/> {app.btn}
            </button>
        </div>
    )
}