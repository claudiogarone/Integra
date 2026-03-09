'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
    ShieldAlert, Lock, Mail, Key, Loader2, ArrowRight, 
    Fingerprint, Server, Activity, AlertTriangle
} from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const supabase = createClient()
    
    const [isLoginMode, setIsLoginMode] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        secretCode: '' // Usato solo per la registrazione
    })

    // Pulizia di eventuali sessioni di studenti o clienti rimaste appese
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
                // LOGICA LOGIN ADMIN
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                })
                if (signInError) throw signInError
                
                // Rotta verso il pannello di controllo
                window.location.href = '/admin/formazione'

            } else {
                // LOGICA REGISTRAZIONE NUOVO ADMIN
                // Misura di sicurezza vitale: Codice di autorizzazione
                if (formData.secretCode !== 'INTEGRA2026') {
                    throw new Error("Codice di Sicurezza non valido. Accesso negato.")
                }
                
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                })
                if (signUpError) throw signUpError

                if (authData.user) {
                    // Creazione profilo con ruolo 'admin' (FONDAMENTALE)
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: 'Nuovo Amministratore',
                        role: 'admin', 
                    })
                    if (profileError) {
                        console.error("Errore salvataggio profilo admin:", profileError)
                        throw new Error("Errore durante la creazione del profilo amministratore.")
                    }
                }

                window.location.href = '/admin/formazione'
            }
        } catch (err: any) {
            setError(err.message || "Credenziali non valide. Accesso di sicurezza negato.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#02050A] font-sans selection:bg-rose-500 selection:text-white flex items-center justify-center relative overflow-hidden p-4">
            
            {/* EFFETTI LUCE "SERVER ROOM" (Rosso/Viola scuro per indicare area critica) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-rose-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-0"></div>

            {/* ELEMENTI GRAFICI DI SFONDO (Simulazione terminale) */}
            <div className="absolute top-10 left-10 text-[10px] text-rose-900/50 font-mono hidden md:block z-0 pointer-events-none">
                <p>&gt; SECURE_SHELL_INIT_v3.4.1</p>
                <p>&gt; ESTABLISHING_ENCRYPTED_CONNECTION...</p>
                <p>&gt; 256-BIT_AES_HANDSHAKE: OK</p>
                <p className="text-rose-500/50 animate-pulse">&gt; WAITING_FOR_ROOT_AUTHORIZATION...</p>
            </div>

            <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(225,29,72,0.05)] relative z-10 overflow-hidden">
                
                {/* HEADER DELLA CASSAFORTE */}
                <div className="p-8 border-b border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50"></div>
                    <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-lg">
                        <ShieldAlert size={32} className="text-rose-500"/>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Root Access</h1>
                    <p className="text-xs text-slate-500 font-mono mt-2 flex items-center justify-center gap-1">
                        <Server size={12}/> INTEGRA<span className="text-rose-500">OS</span> SYSTEM CORE
                    </p>
                </div>

                <div className="p-8">
                    {/* Toggle Login/Registrazione */}
                    <div className="flex p-1 bg-[#02050A] rounded-lg mb-8 border border-slate-800">
                        <button onClick={() => {setIsLoginMode(true); setError(null)}} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${isLoginMode ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}>
                            Accesso Autenticato
                        </button>
                        <button onClick={() => {setIsLoginMode(false); setError(null)}} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${!isLoginMode ? 'bg-slate-800 text-white shadow-md border border-slate-700' : 'text-slate-500 hover:text-white'}`}>
                            Nuovo Manutentore
                        </button>
                    </div>

                    {error && (
                        <div className="bg-rose-950/50 border border-rose-900 text-rose-400 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-3 animate-in shake">
                            <AlertTriangle size={20} className="shrink-0"/> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block font-mono">ID Amministratore (Email)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                                <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-[#02050A] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-rose-500 transition font-mono text-sm" placeholder="root@integraos.it" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block font-mono">Chiave Crittografica (Password)</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                                <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-[#02050A] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-rose-500 transition font-mono text-sm tracking-widest" placeholder="••••••••••••" />
                            </div>
                        </div>

                        {/* CAMPO EXTRA SOLO PER LA REGISTRAZIONE (Codice Segreto) */}
                        {!isLoginMode && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-1 font-mono">
                                    <Fingerprint size={12}/> Autorizzazione di Sistema
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-900" size={16}/>
                                    <input required type="password" value={formData.secretCode} onChange={e=>setFormData({...formData, secretCode: e.target.value})} className="w-full bg-rose-950/20 border border-rose-900/50 rounded-xl py-3 pl-12 pr-4 text-rose-300 outline-none focus:border-rose-500 transition font-mono text-sm placeholder:text-rose-900/50" placeholder="INSERISCI CODICE ROOT" />
                                </div>
                                <p className="text-[9px] text-slate-600 mt-2 font-mono">Solo il personale autorizzato possiede il token di registrazione Master.</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black py-3.5 rounded-xl transition mt-6 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50">
                            {loading ? <><Loader2 size={18} className="animate-spin"/> VERIFICA CREDENZIALI...</> : (isLoginMode ? <><ArrowRight size={18}/> INIZIALIZZA SESSIONE</> : <><Fingerprint size={18}/> REGISTRA AMMINISTRATORE</>)}
                        </button>
                    </form>
                </div>
                
                {/* FOOTER SICUREZZA */}
                <div className="bg-[#02050A] p-4 text-center border-t border-slate-800">
                    <p className="text-[9px] text-slate-600 font-mono flex items-center justify-center gap-1 uppercase">
                        <Activity size={10} className="text-emerald-500"/>
                        Il tuo IP è stato registrato a fini di sicurezza.
                    </p>
                </div>
            </div>
        </main>
    )
}