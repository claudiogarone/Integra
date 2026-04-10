'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
    ShieldAlert, Lock, Mail, Key, Loader2, ArrowRight, 
    Fingerprint, Server, Activity, AlertTriangle, ShieldCheck
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
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white flex items-center justify-center relative p-4">
            
            {/* ELEMENTI GRAFICI DI SFONDO (Trasparenze) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00665E]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-xl relative z-10 overflow-hidden">
                
                {/* HEADER DELLA CASSAFORTE */}
                <div className="p-8 border-b border-gray-100 text-center relative overflow-hidden bg-gray-50/50">
                    <div className="flex justify-center mb-6 relative">
                        <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-[48px] object-contain drop-shadow-sm" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Root Access</h1>
                    <p className="text-xs text-gray-500 font-bold mt-2 flex items-center justify-center gap-1 uppercase tracking-widest">
                        <Server size={14} className="text-[#00665E]"/> Area Riservata
                    </p>
                </div>

                <div className="p-8">
                    {/* Toggle Login/Registrazione */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-8 border border-gray-200 shadow-inner">
                        <button onClick={() => {setIsLoginMode(true); setError(null)}} className={`flex-1 py-2 text-xs font-black rounded-lg transition uppercase tracking-widest ${isLoginMode ? 'bg-white text-[#00665E] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                            Accesso Admin
                        </button>
                        <button onClick={() => {setIsLoginMode(false); setError(null)}} className={`flex-1 py-2 text-xs font-black rounded-lg transition uppercase tracking-widest ${!isLoginMode ? 'bg-white text-[#00665E] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                            Registrazione
                        </button>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold flex items-center gap-3 animate-in shake shadow-sm">
                            <AlertTriangle size={20} className="shrink-0 text-rose-500"/> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Email Amministratore</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition font-medium text-sm placeholder:text-gray-400 font-sans" placeholder="root@integraos.it" />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Password Sicura</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                <input required type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition font-medium text-sm tracking-widest placeholder:text-gray-400 font-sans" placeholder="••••••••••••" />
                            </div>
                        </div>

                        {/* CAMPO EXTRA SOLO PER LA REGISTRAZIONE (Codice Segreto) */}
                        {!isLoginMode && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                <label className="text-[10px] font-black text-[#00665E] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <ShieldCheck size={14}/> Codice Di Autorizzazione
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00665E]" size={18}/>
                                    <input required type="password" value={formData.secretCode} onChange={e=>setFormData({...formData, secretCode: e.target.value})} className="w-full bg-[#00665E]/5 border border-[#00665E]/20 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/20 transition font-bold text-sm placeholder:text-gray-500" placeholder="INSERISCI AUTH CODE" />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 font-medium">L'accesso è limitato ai manutentori autorizzati di IntegraOS.</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-black py-4 rounded-2xl transition mt-6 flex justify-center items-center gap-2 shadow-lg shadow-[#00665E]/20 disabled:opacity-50">
                            {loading ? <><Loader2 size={20} className="animate-spin"/> VERIFICA CREDENZIALI...</> : (isLoginMode ? <><ArrowRight size={20}/> ACCEDI AL PANNELLO</> : <><Fingerprint size={20}/> REGISTRA AMMINISTRATORE</>)}
                        </button>
                    </form>
                </div>
                
                {/* FOOTER SICUREZZA */}
                <div className="bg-gray-50 p-5 text-center border-t border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1.5 uppercase tracking-widest">
                        <Activity size={14} className="text-[#00665E]"/>
                        Connessione protetta
                    </p>
                </div>
            </div>
        </main>
    )
}