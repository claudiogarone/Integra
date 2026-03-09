'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Mail, Lock, User, Loader2, ArrowRight, 
    BookOpen, GraduationCap, ArrowLeft, AlertTriangle 
} from 'lucide-react'

function AcademyAuthForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const [isLoginMode, setIsLoginMode] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Controlla se l'utente vuole comprare un corso specifico
    const courseToBuy = searchParams.get('buy')

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    })

    // Pulizia sessioni vecchie all'apertura
    useEffect(() => {
        const cleanSession = async () => { await supabase.auth.signOut() }
        cleanSession()
    }, [supabase.auth])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isLoginMode) {
                // LOGICA LOGIN STUDENTE
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })
                if (signInError) throw signInError
                
                // Vai alla dashboard studente (passando il corso da comprare se presente)
                const redirectUrl = courseToBuy ? `/formazione/dashboard?buy=${courseToBuy}` : '/formazione/dashboard'
                window.location.href = redirectUrl

            } else {
                // LOGICA REGISTRAZIONE NUOVO STUDENTE
                if (!formData.fullName) throw new Error("Inserisci il tuo nome completo o quello dell'azienda.")
                
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                })
                if (signUpError) throw signUpError

                if (authData.user) {
                    // Creazione profilo con ruolo 'student'
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        company_name: formData.fullName, // Usiamo lo stesso campo per comodità
                        role: 'student', // FONDAMENTALE PER L'ISOLAMENTO
                        subscription_status: 'academy_free'
                    })
                    if (profileError) {
                        console.error("Errore salvataggio profilo:", profileError)
                        throw new Error("Errore durante la creazione del profilo studente.")
                    }
                }

                // Vai alla dashboard studente
                const redirectUrl = courseToBuy ? `/formazione/dashboard?buy=${courseToBuy}` : '/formazione/dashboard'
                window.location.href = redirectUrl
            }
        } catch (err: any) {
            setError(err.message || "Credenziali non valide o errore di sistema.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
            
            {/* COLONNA SINISTRA: IL FORM */}
            <div className="w-full lg:w-1/2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(79,70,229,0.1)] relative z-10">
                
                {courseToBuy && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3">
                        <BookOpen size={20} className="shrink-0"/>
                        Stai per accedere al corso. Accedi o registrati per completare l'iscrizione.
                    </div>
                )}

                {/* Toggle Login / Registrazione */}
                <div className="flex p-1 bg-[#020817] rounded-xl mb-8 border border-slate-800">
                    <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${isLoginMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        Accedi
                    </button>
                    <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${!isLoginMode ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                        Crea Account
                    </button>
                </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-black text-white mb-2">
                        {isLoginMode ? 'Bentornato.' : 'Inizia a Imparare.'}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {isLoginMode 
                            ? 'Inserisci le tue credenziali per riprendere i tuoi corsi da dove li avevi lasciati.' 
                            : 'Crea un account gratuito per la tua azienda e accedi al catalogo formativo IntegraOS.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                        <AlertTriangle size={18} className="shrink-0"/> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {!isLoginMode && (
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nome Azienda o Referente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                <input required type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition" placeholder="Es. TechSolutions Srl" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email di Accesso</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                            <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition" placeholder="email@azienda.it" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                            {isLoginMode && <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Password dimenticata?</a>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                            <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition font-mono" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-500 transition mt-6 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50">
                        {loading ? <><Loader2 size={18} className="animate-spin"/> Attendere...</> : (isLoginMode ? <><ArrowRight size={18}/> Accedi all'Aula</> : <><GraduationCap size={18}/> Registrati Gratis</>)}
                    </button>
                    
                    {!isLoginMode && (
                        <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
                            Creando un account accetti la nostra Privacy Policy e i Termini della piattaforma e-learning. L'account base è gratuito.
                        </p>
                    )}
                </form>
            </div>

            {/* COLONNA DESTRA: I VANTAGGI DELL'ACADEMY */}
            <div className="w-full lg:w-1/2 text-center lg:text-left relative z-10">
                <div className="inline-block bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20 mb-6">
                    IntegraOS Academy
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
                    Il tuo portale per<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">crescere e scalare.</span>
                </h2>
                <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                    Accedi all'area riservata per seguire i tuoi corsi in 4K, scaricare il materiale didattico e interagire con i tutor AI disponibili 24/7.
                </p>
                
                <div className="space-y-6 text-left max-w-md mx-auto lg:mx-0">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-indigo-400">
                            <BookOpen size={24}/>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Corsi sempre disponibili</h4>
                            <p className="text-sm text-slate-400">Guarda le lezioni dal tuo computer o smartphone, quando vuoi. Riprendi esattamente da dove avevi lasciato.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-purple-400">
                            <GraduationCap size={24}/>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Certificazioni Ufficiali</h4>
                            <p className="text-sm text-slate-400">Supera i quiz di fine modulo e ottieni attestati ufficiali da condividere sul tuo profilo LinkedIn aziendale.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default function AcademyLoginPage() {
    return (
        <main className="min-h-screen bg-[#020817] font-sans selection:bg-indigo-500 selection:text-white flex flex-col relative overflow-hidden">
            
            {/* Effetti Luce (Indigo per l'Academy) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

            {/* Navbar Semplificata */}
            <nav className="px-6 md:px-12 py-5 flex justify-between items-center border-b border-white/5 bg-[#020817]/80 backdrop-blur-md sticky top-0 z-50">
                <Link href="/formazione" className="flex items-center gap-2 hover:opacity-80 transition">
                    <Shield className="text-indigo-500" size={28}/>
                    <div className="text-2xl font-black text-white tracking-tighter">
                        INTEGRA<span className="font-light text-slate-500">OS</span> <span className="text-indigo-400 font-medium tracking-normal ml-1">Academy</span>
                    </div>
                </Link>
                <Link href="/formazione" className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
                    <ArrowLeft size={14}/> Torna al Catalogo
                </Link>
            </nav>

            {/* Contenuto Form */}
            <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10 w-full">
                <Suspense fallback={<div className="text-indigo-500 flex flex-col items-center gap-4"><Loader2 className="animate-spin" size={40}/><p className="font-bold">Avvio ambiente sicuro...</p></div>}>
                    <AcademyAuthForm />
                </Suspense>
            </div>
        </main>
    )
}