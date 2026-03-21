'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Mail, Lock, ArrowRight, UserCheck, 
    Loader2, User, EyeOff, Eye, AlertTriangle, 
    BookOpen, CheckCircle, GraduationCap, ArrowLeft
} from 'lucide-react'

// Dati mockati per mostrare il riepilogo del corso in fase di acquisto
const COURSES_INFO: Record<string, {title: string, desc: string, price: number, color: string}> = {
    'ai-sales-masterclass': { title: 'AI Sales Masterclass', desc: 'Impara a delegare il 90% del follow-up clienti all\'Intelligenza Artificiale.', price: 299, color: 'blue' },
    'integraos-zero-to-hero': { title: 'IntegraOS: Zero to Hero', desc: 'Il corso definitivo per configurare il tuo ecosistema aziendale.', price: 149, color: 'emerald' },
    'marketing-automation': { title: 'Marketing Automation 3.0', desc: 'Crea funnel infallibili collegando WhatsApp, Email e Landing Pages.', price: 199, color: 'purple' }
}

function AcademyAuthForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const buyParam = searchParams.get('buy')
    const selectedCourse = buyParam ? COURSES_INFO[buyParam] : null

    const [isLoginMode, setIsLoginMode] = useState(true) // True = Login, False = Iscrizione
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    // Dati Form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    })

    // Pulisci sessioni vecchie all'apertura
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
                // LOGICA DI LOGIN
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })
                if (signInError) throw signInError
                
                // Se c'è un parametro 'buy', mandiamo al checkout, altrimenti alla dashboard studente
                window.location.href = buyParam ? `/formazione/checkout?course=${buyParam}` : '/learning/dashboard'

            } else {
                // LOGICA DI REGISTRAZIONE NUOVO STUDENTE
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                })
                if (signUpError) throw signUpError

                // Creazione del profilo STUDENTE nel database
                if (authData.user) {
                    await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        role: 'student', 
                        subscription_status: 'active'
                    })
                }

                window.location.href = buyParam ? `/formazione/checkout?course=${buyParam}` : '/learning/dashboard'
            }
        } catch (err: any) {
            setError(err.message || "Credenziali non valide o errore di sistema.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
            
            {/* COLONNA SINISTRA: IL FORM */}
            <div className="w-full lg:w-1/2 bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative animate-in slide-in-from-left-8">
                
                {/* Toggle Login / Registrazione */}
                <div className="flex p-1.5 bg-slate-50 rounded-xl mb-8 border border-slate-200 shadow-inner">
                    <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${isLoginMode ? 'bg-white text-[#00665E] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                        Accedi
                    </button>
                    <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${!isLoginMode ? 'bg-white text-[#00665E] shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
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

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 shadow-sm">
                        <AlertTriangle size={18}/> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* CAMPI EXTRA SOLO PER LA REGISTRAZIONE */}
                    {!isLoginMode && (
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome e Cognome</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input required type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="Mario Rossi" />
                            </div>
                        </div>
                    )}

                    {/* CAMPI COMUNI (EMAIL E PASSWORD) */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="mario.rossi@email.com" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                            {isLoginMode && <a href="#" className="text-[10px] font-bold text-[#00665E] hover:text-[#004d46] transition">Password dimenticata?</a>}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-mono font-bold" placeholder="••••••••" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition mt-8 flex justify-center items-center gap-2 shadow-lg shadow-[#00665E]/20 disabled:opacity-50">
                        {loading ? <><Loader2 size={18} className="animate-spin"/> Elaborazione...</> : (isLoginMode ? <><UserCheck size={18}/> Accedi all'Academy</> : <><UserCheck size={18}/> Crea Account Gratuito</>)}
                    </button>
                </form>
            </div>

            {/* COLONNA DESTRA: INFORMAZIONI CORSO O VANTAGGI GENERALI */}
            <div className="w-full lg:w-1/2 text-center lg:text-left animate-in slide-in-from-right-8">
                
                {selectedCourse ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="inline-block bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 mb-6 shadow-sm">
                            In fase di acquisto
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
                                <CheckCircle size={18} className="text-emerald-500"/> Accesso immediato e a vita alle videolezioni
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <CheckCircle size={18} className="text-emerald-500"/> Materiale PDF e prompt scaricabili
                            </div>
                            <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                                <CheckCircle size={18} className="text-emerald-500"/> Rilascio Attestato Finale di Competenza
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-8 italic text-center lg:text-left">
                            {isLoginMode ? 'Accedi per completare il pagamento sicuro.' : 'Crea l\'account per sbloccare l\'offerta e pagare in modo sicuro.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="inline-block bg-emerald-50 text-[#00665E] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 mb-6 shadow-sm">
                            Portale Studenti & Aziende
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            La tua crescita <br/>
                            <span className="text-[#00665E]">professionale.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                            Accedi al tuo spazio personale per seguire i corsi, scaricare i materiali didattici, partecipare alle sessioni live e scaricare i tuoi attestati ufficiali.
                        </p>
                        
                        <div className="space-y-6 text-left max-w-xl mx-auto lg:mx-0">
                            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-blue-600">
                                    <BookOpen size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 font-black mb-1">Corsi Sempre Disponibili</h4>
                                    <p className="text-sm text-slate-500 font-medium">Riprendi lo studio da dove l'avevi lasciato, su qualsiasi dispositivo, PC o Smartphone.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-amber-600">
                                    <GraduationCap size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 font-black mb-1">Attestati Ufficiali</h4>
                                    <p className="text-sm text-slate-500 font-medium">Supera i test finali per generare automaticamente il tuo attestato di partecipazione stampabile in PDF.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}

// Layout principale della pagina
export default function AcademyLoginPage() {
    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white flex flex-col relative overflow-hidden text-slate-800">
            
            {/* EFFETTI LUCE GLOBALI (Light Theme) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.04] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR PREMIUM LIGHT CON PULSANTE HOME FISATO */}
            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-2 text-sm font-bold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100 hidden sm:flex">
                        <ArrowLeft size={16}/> Torna al Sito
                    </Link>
                    <Link href="/formazione" className="flex items-center gap-2 hover:opacity-80 transition border-l border-slate-200 pl-4">
                        <img src="/logo-integraos.png" alt="IntegraOS Academy" className="h-8 md:h-10 object-contain" onError={(e) => e.currentTarget.src='/logo-integra.png'} />
                    </Link>
                </div>
                <div className="text-xs font-bold text-[#00665E] bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 flex items-center gap-2 shadow-sm">
                    <Shield size={14}/> Area Studenti Sicura
                </div>
            </nav>

            {/* CONTENUTO PRINCIPALE CON SUSPENSE */}
            <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10 w-full">
                <Suspense fallback={<div className="text-[#00665E] flex flex-col items-center gap-4 mt-20"><Loader2 className="animate-spin" size={40}/><p className="font-black text-lg">Inizializzazione connessione sicura...</p></div>}>
                    <AcademyAuthForm />
                </Suspense>
            </div>

        </main>
    )
}