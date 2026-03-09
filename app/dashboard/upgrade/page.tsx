'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, ShieldCheck, Zap, Crown, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'

// --- 1. IL CONTENUTO DELLA PAGINA (Sotto-componente) ---
function UpgradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetPlan = searchParams.get('plan') || 'Enterprise' 

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  // NUOVI PREZZI AGGIORNATI
  const pricing: any = {
      'Enterprise': { price: '199', desc: 'Scalabilità e gestione avanzata per aziende strutturate.', icon: <CheckCircle2 className="text-teal-500" size={32}/>, color: 'text-teal-600', bg: 'bg-teal-50' },
      'Ambassador': { price: '499', desc: 'Automazione AI, Cross-Promo e dominanza del mercato.', icon: <Crown className="text-purple-500" size={32}/>, color: 'text-purple-600', bg: 'bg-purple-50' }
  }

  const planData = pricing[targetPlan] || pricing['Enterprise']

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
      else router.push('/login')
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handlePayment = async (e: React.FormEvent) => {
      e.preventDefault()
      setProcessing(true)

      // Simulazione check banca
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Aggiornamento Reale Database
      const { error } = await supabase
          .from('profiles')
          .update({ plan: targetPlan })
          .eq('id', user?.id)

      if (!error) {
          setSuccess(true)
          setTimeout(() => {
              router.push('/dashboard/settings')
          }, 3000)
      } else {
          alert("Errore durante l'aggiornamento del piano: " + error.message)
      }
      setProcessing(false)
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Caricamento Checkout...</div>

  if (success) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F8FAFC] h-full animate-in zoom-in duration-500 w-full">
              <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg border border-gray-100 mt-20">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Zap size={48} className="animate-bounce"/>
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 mb-4">Pagamento Riuscito!</h1>
                  <p className="text-gray-500 text-lg mb-8">Congratulazioni, il tuo account è stato aggiornato al piano <b className={planData.color}>{targetPlan}</b>.</p>
                  <p className="text-sm font-bold text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16}/> Riavvio del CRM in corso...
                  </p>
              </div>
          </div>
      )
  }

  return (
    <div className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans min-h-screen flex justify-center items-start pt-12 pb-20 w-full">
      <div className="max-w-5xl w-full">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-8 transition">
              <ArrowLeft size={20}/> Torna indietro
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                  <div>
                      <h1 className="text-4xl font-black text-gray-900 mb-2">Upgrade Account</h1>
                      <p className="text-gray-500">Stai per sbloccare nuove funzionalità esclusive per il tuo business.</p>
                  </div>

                  <div className={`p-8 rounded-3xl border ${targetPlan === 'Ambassador' ? 'border-purple-200 bg-purple-50/50' : 'border-teal-200 bg-teal-50/50'} shadow-sm`}>
                      <div className="flex items-center gap-4 mb-4">
                          <div className={`p-4 rounded-2xl bg-white shadow-sm ${planData.color}`}>{planData.icon}</div>
                          <div>
                              <h2 className="text-2xl font-black text-gray-900">Piano {targetPlan}</h2>
                              <p className="text-sm text-gray-600">Fatturazione Mensile</p>
                          </div>
                      </div>
                      <p className="text-gray-700 font-medium mb-6">{planData.desc}</p>
                      
                      <div className="border-t border-gray-200/60 pt-6 flex justify-between items-end">
                          <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Totale da pagare oggi</p>
                              <div className="flex items-baseline gap-1">
                                  <span className="text-5xl font-black text-gray-900">€{planData.price}</span>
                                  <span className="text-gray-500 font-bold">/mese + IVA</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <ShieldCheck className="text-green-500" size={24}/>
                      <p>Pagamento sicuro crittografato a 256-bit.<br/>Puoi disdire in qualsiasi momento.</p>
                  </div>
              </div>

              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00665E] to-teal-400"></div>
                  <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      <CreditCard className="text-gray-400"/> Dettagli Pagamento
                  </h3>

                  <form onSubmit={handlePayment} className="space-y-5">
                      <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Intestatario Carta</label><input required type="text" placeholder="Mario Rossi" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E]" /></div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Numero Carta</label>
                          <div className="relative">
                              <input required type="text" placeholder="0000 0000 0000 0000" maxLength={19} className="w-full bg-gray-50 border border-gray-200 p-3 pl-12 rounded-xl outline-none focus:border-[#00665E] font-mono tracking-widest" />
                              <CreditCard className="absolute left-4 top-3.5 text-gray-400" size={18}/>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Scadenza</label><input required type="text" placeholder="MM/AA" maxLength={5} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] font-mono text-center" /></div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase mb-2 block">CVC</label><input required type="text" placeholder="123" maxLength={3} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] font-mono text-center" /></div>
                      </div>

                      <button disabled={processing} type="submit" className="w-full bg-gray-900 text-white font-black text-lg py-4 rounded-xl hover:bg-black transition mt-4 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
                          {processing ? <><Loader2 className="animate-spin" size={24}/> Elaborazione...</> : `Paga €${planData.price}`}
                      </button>
                  </form>
              </div>
          </div>
      </div>
    </div>
  )
}

// --- 2. IL CONTENITORE PRINCIPALE ESPORTATO (Con Suspense per prevenire l'errore) ---
export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-10 text-[#00665E] font-bold animate-pulse w-full">Caricamento Modulo di Pagamento Sicuro...</div>}>
      <UpgradeContent />
    </Suspense>
  )
}