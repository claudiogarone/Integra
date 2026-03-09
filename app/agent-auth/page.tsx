'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Mail, Lock, ArrowRight, UserCheck, 
    Loader2, Building2, User, EyeOff, Eye, Briefcase, AlertTriangle // <-- Aggiunto AlertTriangle
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

    // Pulisci sessioni vecchie all'apertura (come fatto per la registrazione admin)
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
        <main className="min-h-screen bg-[#020817] font-sans selection:bg-blue-500 selection:text-white flex flex-col relative overflow-hidden">
            
            {/* EFFETTI LUCE GLOBALI (Sui toni del blu per differenziarsi dall'Admin verde) */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR MINIMALE */}
            <nav className="px-6 md:px-12 py-5 flex justify-between items-center border-b border-white/5 bg-[#020817]/80 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                    <Shield className="text-blue-500" size={28}/>
                    <div className="text-2xl font-black text-white tracking-tighter">INTEGRA<span className="font-light text-slate-500">OS</span></div>
                </Link>
                <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 flex items-center gap-2">
                    <Briefcase size={14}/> Portale Forza Vendita
                </div>
            </nav>

            {/* CONTENUTO PRINCIPALE */}
            <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative z-10 w-full">
                
                <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
                    
                    {/* COLONNA SINISTRA: IL FORM */}
                    <div className="w-full lg:w-1/2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 md:p-10 rounded-3xl shadow-2xl relative">
                        
                        {/* Toggle Login / Registrazione */}
                        <div className="flex p-1 bg-[#020817] rounded-xl mb-8 border border-slate-800">
                            <button onClick={() => setIsLoginMode(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${isLoginMode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                                Accedi
                            </button>
                            <button onClick={() => setIsLoginMode(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${!isLoginMode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                                Nuovo Agente
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-white mb-2">
                                {isLoginMode ? 'Bentornato nel Team.' : 'Unisciti alla Rete.'}
                            </h2>
                            <p className="text-slate-400 text-sm">
                                {isLoginMode 
                                    ? 'Inserisci le credenziali fornite dalla tua azienda per accedere al CRM.' 
                                    : 'Inserisci i tuoi dati e il Codice Azienda per collegarti al tuo datore di lavoro.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
                                <AlertTriangle size={18}/> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            
                            {/* CAMPI EXTRA SOLO PER LA REGISTRAZIONE */}
                            {!isLoginMode && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Nome e Cognome</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                            <input required type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition" placeholder="Mario Rossi" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block flex items-center gap-1">Codice Aziendale (Richiesto) <Lock size={12}/></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18}/>
                                            <input required type="text" value={formData.companyCode} onChange={e=>setFormData({...formData, companyCode: e.target.value})} className="w-full bg-blue-500/5 border border-blue-500/30 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition font-mono uppercase" placeholder="ES: ALFA-9876" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1">Richiedi questo codice all'amministratore del tuo ecosistema.</p>
                                    </div>
                                </>
                            )}

                            {/* CAMPI COMUNI (EMAIL E PASSWORD) */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email Lavorativa</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                    <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500 transition" placeholder="mario.rossi@azienda.it" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                    {isLoginMode && <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Password dimenticata?</a>}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                    <input required type={showPassword ? "text" : "password"} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white outline-none focus:border-blue-500 transition font-mono" placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition mt-6 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                                {loading ? <><Loader2 size={18} className="animate-spin"/> Elaborazione...</> : (isLoginMode ? <><UserCheck size={18}/> Accedi all'Area Agenti</> : <><UserCheck size={18}/> Registra Profilo Agente</>)}
                            </button>
                        </form>
                    </div>

                    {/* COLONNA DESTRA: VANTAGGI PER L'AGENTE */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left">
                        <div className="inline-block bg-blue-500/10 text-blue-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-500/20 mb-6">
                            IntegraOS per i Venditori
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
                            La tua scrivania <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">intelligente e privata.</span>
                        </h2>
                        <p className="text-lg text-slate-400 mb-10 leading-relaxed font-light">
                            Accedi al portale dedicato per gestire i tuoi lead, monitorare le tue provvigioni e utilizzare gli strumenti di intelligenza artificiale messi a disposizione dalla tua azienda.
                        </p>
                        
                        <div className="space-y-6 text-left">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-blue-400">
                                    <Shield size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Dati Isolati e Protetti</h4>
                                    <p className="text-sm text-slate-400">Vedi solo i contatti a te assegnati. Nessun altro agente può accedere al tuo portafoglio clienti.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-emerald-400">
                                    <ArrowRight size={24}/>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">Pipeline Automatica</h4>
                                    <p className="text-sm text-slate-400">Ricevi notifiche in tempo reale quando un tuo cliente interagisce con un'email o scarica un preventivo.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}