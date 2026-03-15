'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Mail, Lock, ArrowRight, UserCheck, 
    Loader2, Building2, User, EyeOff, Eye, Briefcase, AlertTriangle 
} from 'lucide-react'

export default function AgentAuthPage() {
    const router = useRouter()
    const supabase = createClient()
    
    const [isLoginMode, setIsLoginMode] = useState(true) // True = Login, False = Iscrizione
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    // Dati Form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        companyCode: '' // IL CODICE MAGICO PER AGGANCIARE L'AZIENDA
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
                
                // Vai alla dashboard dell'agente
                window.location.href = '/dashboard'

            } else {
                // LOGICA DI REGISTRAZIONE NUOVO AGENTE
                if (!formData.companyCode) throw new Error("Il Codice Azienda è obbligatorio per registrarsi.")
                
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                })
                if (signUpError) throw signUpError

                // Creazione del profilo AGENTE nel database
                if (authData.user) {
                    await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: formData.fullName,
                        role: 'agent', // Tassativo: è un agente, non un admin!
                        company_code: formData.companyCode, // Aggancio all'azienda madre
                        subscription_status: 'active'
                    })
                }

                // Invia l'agente alla sua scrivania
                window.location.href = '/dashboard'
            }
        } catch (err: any) {
            setError(err.message || "Credenziali non valide o errore di sistema.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-500 selection:text-white flex flex-col relative overflow-hidden text-slate-800">
            
            {/* EFFETTI LUCE GLOBALI (Sui toni del blu chiaro) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-500 rounded-full blur-[150px] opacity-[0.05] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR PREMIUM LIGHT */}
            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                    <img src="/logo-integra.png" alt="IntegraOS Logo" className="h-8 md:h-10 object-contain" />
                </Link>
                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 flex items-center gap-2 shadow-sm">
                    <Briefcase size={14}/> Portale Forza Vendita
                </div>
            </nav>

            {/* CONTENUTO PRINCIPALE */}
            <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10 w-full">
                
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
                    
                    {/* COLONNA SINISTRA: IL FORM */}
                    <div className="w-full lg:w-1/2 bg-white border border-slate-200 p-8 md:p-10 rounded-3xl shadow-xl relative animate-in slide-in-from-left-8">
                        
                        {/* Toggle Login / Registrazione */}
                        <div className="flex p-1.5 bg-slate-50 rounded-xl mb-8 border border-slate-200 shadow-inner">
                            <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${isLoginMode ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                                Accedi
                            </button>
                            <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${!isLoginMode ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                                Nuovo Agente
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">
                                {isLoginMode ? 'Bentornato nel Team.' : 'Unisciti alla Rete.'}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium">
                                {isLoginMode 
                                    ? 'Inserisci le credenziali fornite dalla tua azienda per accedere al CRM.' 
                                    : 'Inserisci i tuoi dati e il Codice Azienda per collegarti al tuo datore di lavoro.'}
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
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome e Cognome</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                            <input required type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-bold" placeholder="Mario Rossi" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block flex items-center gap-1 ml-1">Codice Aziendale (Richiesto) <Lock size={12}/></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                                            <input required type="text" value={formData.companyCode} onChange={e=>setFormData({...formData, companyCode: e.target.value})} className="w-full bg-blue-50 border border-blue-200 rounded-xl py-3.5 pl-12 pr-4 text-blue-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono font-black uppercase shadow-inner" placeholder="ES: ALFA-9876" />
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-500 mt-1.5 ml-1">Richiedi questo codice all'amministratore del tuo ecosistema.</p>
                                    </div>
                                </>
                            )}

                            {/* CAMPI COMUNI (EMAIL E PASSWORD) */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Lavorativa</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-bold" placeholder="mario.rossi@azienda.it" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                    {isLoginMode && <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition">Password dimenticata?</a>}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono font-bold" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition mt-8 flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50">
                                {loading ? <><Loader2 size={18} className="animate-spin"/> Elaborazione...</> : (isLoginMode ? <><UserCheck size={18}/> Accedi all'Area Agenti</> : <><UserCheck size={18}/> Registra Profilo Agente</>)}
                            </button>
                        </form>
                    </div>

                    {/* COLONNA DESTRA: VANTAGGI PER L'AGENTE */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left animate-in slide-in-from-right-8">
                        <div className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200 mb-6 shadow-sm">
                            IntegraOS per i Venditori
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                            La tua scrivania <br/>
                            <span className="text-blue-600">intelligente e privata.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                            Accedi al portale dedicato per gestire i tuoi lead, monitorare le tue provvigioni e utilizzare gli strumenti di intelligenza artificiale messi a disposizione dalla tua azienda.
                        </p>
                        
                        <div className="space-y-6 text-left max-w-xl mx-auto lg:mx-0">
                            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-blue-600">
                                    <Shield size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 font-black mb-1">Dati Isolati e Protetti</h4>
                                    <p className="text-sm text-slate-500 font-medium">Vedi solo i contatti a te assegnati. Nessun altro agente può accedere al tuo portafoglio clienti.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 shadow-inner text-emerald-600">
                                    <ArrowRight size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 font-black mb-1">Pipeline Automatica</h4>
                                    <p className="text-sm text-slate-500 font-medium">Ricevi notifiche in tempo reale quando un tuo cliente interagisce con un'email o scarica un preventivo.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}