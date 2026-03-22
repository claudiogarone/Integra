'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Mail, Lock, UserCheck, 
    Loader2, User, EyeOff, Eye, AlertTriangle, 
    CheckCircle, ArrowLeft, Info
} from 'lucide-react'

const COURSES_INFO: Record<string, {title: string, desc: string, price: number, color: string}> = {
    'ai-sales-masterclass': { title: 'AI Sales Masterclass', desc: 'Impara a delegare il 90% del follow-up clienti all\'Intelligenza Artificiale.', price: 299, color: 'blue' },
    'integraos-zero-to-hero': { title: 'IntegraOS: Zero to Hero', desc: 'Il corso definitivo per configurare il tuo ecosistema aziendale.', price: 149, color: 'emerald' },
    'marketing-automation': { title: 'Marketing Automation 3.0', desc: 'Crea funnel infallibili collegando WhatsApp, Email e Landing Pages.', price: 199, color: 'purple' }
}

function AcademyAuthForm() {
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const buyParam = searchParams.get('buy')
    const selectedCourse = buyParam ? COURSES_INFO[buyParam] : null

    const [isLoginMode, setIsLoginMode] = useState(true)
    const [loading, setLoading] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    
    // Stati per i messaggi all'utente
    const [error, setError] = useState<string | null>(null)
    const [infoMessage, setInfoMessage] = useState<string | null>(null)
    const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)
    
    const [showPassword, setShowPassword] = useState(false)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    })

    // FUNZIONE DI CONNESSIONE A STRIPE
    const handleStripeCheckout = async (userEmail: string, courseId: string) => {
        try {
            setCheckoutStatus("Connessione sicura al Gateway di Pagamento in corso...")
            
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: courseId, email: userEmail })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || "Errore di connessione al Gateway")

            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error("URL di checkout mancante")
            }

        } catch (err: any) {
            console.error(err)
            window.location.href = '/learning/dashboard'
        }
    }

    useEffect(() => {
        const handleSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                if (buyParam) {
                    await handleStripeCheckout(user.email || '', buyParam)
                } else {
                    window.location.href = '/learning/dashboard'
                }
            } else {
                setCheckingSession(false)
            }
        }
        handleSession()
    }, [buyParam, supabase.auth])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // CONTROLLO DATI MANUALE (Garantisce che il bottone funzioni visivamente sempre)
        setInfoMessage(null)
        setError(null)

        if (!formData.email || !formData.password || (!isLoginMode && !formData.fullName)) {
            setError("Compila tutti i campi per procedere.");
            return;
        }

        setLoading(true)

        try {
            if (isLoginMode) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })
                if (signInError) throw signInError
                
                if (buyParam) {
                    await handleStripeCheckout(formData.email, buyParam)
                } else {
                    window.location.reload()
                }

            } else {
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                })
                if (signUpError) throw signUpError

                if (authData.user) {
                    await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        role: 'student', 
                        subscription_status: 'active'
                    })
                    
                    if (buyParam) {
                        await handleStripeCheckout(formData.email, buyParam)
                        return; 
                    }
                }
                window.location.href = '/learning/dashboard'
            }
        } catch (err: any) {
            setError("Credenziali non valide. Controlla l'email e la password.")
            setLoading(false)
        }
    }

    if (checkingSession || checkoutStatus) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-[#00665E]">
                <Loader2 className="animate-spin mb-4" size={48}/>
                <h2 className="text-xl font-black">{checkoutStatus || "Verifica accessi in corso..."}</h2>
                {checkoutStatus && <p className="text-slate-500 font-medium mt-2 text-sm">Non chiudere questa finestra.</p>}
            </div>
        )
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
            
            {/* COLONNA SINISTRA: IL FORM */}
            <div className="w-full lg:w-1/2 bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative animate-in slide-in-from-left-8">
                
                <div className="flex p-1.5 bg-slate-50 rounded-xl mb-8 border border-slate-200 shadow-inner">
                    <button onClick={() => {setIsLoginMode(true); setError(null); setInfoMessage(null);}} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${isLoginMode ? 'bg-white text-[#00665E] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                        Accedi
                    </button>
                    <button onClick={() => {setIsLoginMode(false); setError(null); setInfoMessage(null);}} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${!isLoginMode ? 'bg-white text-[#00665E] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                        Nuovo Studente
                    </button>
                </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        {isLoginMode ? 'Bentornato in Academy.' : 'Inizia a studiare.'}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                        {isLoginMode 
                            ? 'Inserisci le tue credenziali per accedere ai tuoi corsi e attestati.' 
                            : 'Crea un account gratuito per sbloccare i contenuti e completare gli acquisti.'}
                    </p>
                </div>

                {/* BANNER ERRORE */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 shadow-sm animate-in fade-in">
                        <AlertTriangle size={20} className="shrink-0"/> {error}
                    </div>
                )}

                {/* BANNER INFORMAZIONE (Es. Password dimenticata) */}
                {infoMessage && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl mb-6 text-sm font-bold flex items-start gap-3 shadow-sm animate-in fade-in">
                        <Info size={20} className="shrink-0 mt-0.5"/> {infoMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {!isLoginMode && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome e Cognome</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="Mario Rossi" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="mario.rossi@email.com" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                            {/* FIX: Mostra il Banner Blu invece di ricaricare o usare l'alert del browser */}
                            {isLoginMode && <button type="button" onClick={() => { setError(null); setInfoMessage("La funzione di recupero password automatica è in fase di attivazione. Contatta l'amministratore dell'Academy per resettare i tuoi dati in modo sicuro."); }} className="text-[10px] font-bold text-[#00665E] hover:text-[#004d46] transition">Password dimenticata?</button>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-mono font-bold" placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition mt-8 flex justify-center items-center gap-2 shadow-lg shadow-[#00665E]/20 disabled:opacity-50">
                        {loading ? <><Loader2 size={18} className="animate-spin"/> Elaborazione...</> : (
                            buyParam ? <><Shield size={18}/> Procedi al Pagamento</> : (isLoginMode ? <><UserCheck size={18}/> Accedi all'Academy</> : <><UserCheck size={18}/> Crea Account Gratuito</>)
                        )}
                    </button>
                </form>
            </div>

            {/* COLONNA DESTRA: INFORMAZIONI CORSO */}
            <div className="w-full lg:w-1/2 text-center lg:text-left animate-in slide-in-from-right-8">
                {selectedCourse ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="inline-block bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 mb-6 shadow-sm">
                            Riepilogo Ordine
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
                            {selectedCourse.title}
                        </h2>
                        <p className="text-base text-slate-600 mb-8 font-medium">
                            {selectedCourse.desc}
                        </p>
                        
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 flex justify-between items-center">
                            <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Totale (IVA Inclusa)</span>
                            <span className="text-3xl font-black text-[#00665E]">€{selectedCourse.price}</span>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <CheckCircle size={18} className="text-emerald-500"/> Checkout crittografato SSL
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <CheckCircle size={18} className="text-emerald-500"/> Carte di Credito, Apple Pay e Google Pay
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="inline-block bg-emerald-50 text-[#00665E] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-6 shadow-sm">
                            Portale Studenti
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            La tua crescita <br/>
                            <span className="text-[#00665E]">professionale.</span>
                        </h2>
                    </>
                )}
            </div>
        </div>
    )
}

export default function AcademyLoginPage() {
    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white flex flex-col relative overflow-hidden text-slate-800">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.04] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-2 text-sm font-bold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100 hidden sm:flex">
                        <ArrowLeft size={16}/> Torna al Sito
                    </Link>
                    <Link href="/formazione" className="flex items-center gap-2 hover:opacity-80 transition border-l border-slate-200 pl-4">
                        <img src="/logo-integra.png" alt="IntegraOS Academy" className="h-8 md:h-10 object-contain" onError={(e) => e.currentTarget.src='/logo-integraos.png'} />
                    </Link>
                </div>
                <div className="text-xs font-bold text-[#00665E] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 flex items-center gap-2 shadow-sm">
                    <Shield size={14}/> Checkout Sicuro
                </div>
            </nav>

            <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10 w-full">
                <Suspense fallback={<div className="text-[#00665E] flex flex-col items-center gap-4 mt-20"><Loader2 className="animate-spin" size={40}/><p className="font-black text-lg">Inizializzazione connessione sicura...</p></div>}>
                    <AcademyAuthForm />
                </Suspense>
            </div>
        </main>
    )
}