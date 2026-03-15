'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, Building, Mail, Lock, ArrowRight, CreditCard, 
    CheckCircle, Loader2, ArrowLeft, Eye, EyeOff, Check, X,
    AlertTriangle, Server, FileText
} from 'lucide-react'

function RegisterForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const [step, setStep] = useState(1) 
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        companyName: '', email: '', password: '', confirmPassword: '', plan: 'Base'
    })

    // PULIZIA SESSIONE E LETTURA PIANO DA LOCALSTORAGE
    useEffect(() => {
        const initRegister = async () => {
            await supabase.auth.signOut({ scope: 'local' });
            if (typeof window !== 'undefined') {
                document.cookie.split(";").forEach((c) => {
                    if(c.includes('supabase')) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    }
                });
            }
            const savedPlan = typeof window !== 'undefined' ? localStorage.getItem('integra_plan') : null;
            const urlPlan = searchParams.get('plan');
            const planToSet = urlPlan || savedPlan || 'Base';
            
            const formatted = planToSet.charAt(0).toUpperCase() + planToSet.slice(1).toLowerCase();
            if (['Base', 'Enterprise', 'Ambassador'].includes(formatted)) {
                setFormData(prev => ({ ...prev, plan: formatted }));
            }
        };
        initRegister();
    }, [searchParams, supabase.auth]);

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
    const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)
    
    const [agreements, setAgreements] = useState({ terms: false, privacy: false })
    const [showTermsModal, setShowTermsModal] = useState(false)
    const [showPrivacyModal, setShowPrivacyModal] = useState(false)

    const planDetails: any = {
        'Base': { price: 99, desc: 'CRM, 3 Zaps, 5 Agenti, Fidelity' },
        'Enterprise': { price: 199, desc: 'Finance ERP, 20 Zaps, 15 Agenti' },
        'Ambassador': { price: 499, desc: 'AI Voice, CFO AI, Limiti Illimitati' }
    }
    const currentPrice = planDetails[formData.plan]?.price || 99

    const pwdCriteria = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[^A-Za-z0-9]/.test(formData.password)
    }
    const isPwdValid = Object.values(pwdCriteria).every(Boolean)
    const doPasswordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.companyName || !formData.email) return setError("Compila i dati aziendali.")
        if (!isPwdValid) return setError("La password non rispetta i requisiti minimi di sicurezza.")
        if (!doPasswordsMatch) return setError("Le password non coincidono.")
        if (!agreements.terms || !agreements.privacy) return setError("Devi accettare Termini e Privacy Policy per proseguire.")
        
        setError(null)
        setStep(2)
    }

    const generateCompanyCode = (name: string) => {
        const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'COMP';
        const randomNum = Math.floor(1000 + Math.random() * 9000); 
        return `${prefix}-${randomNum}`;
    }

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setCheckoutStatus(`Connessione sicura a ${paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'} in corso...`)

        try {
            await supabase.auth.signOut();

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })
            if (authError) throw authError

            if (authData.user) {
                const newCompanyCode = generateCompanyCode(formData.companyName);
                
                const { error: profileError } = await supabase.from('profiles').insert({
                    id: authData.user.id,
                    company_name: formData.companyName, 
                    plan: formData.plan,
                    role: 'admin',
                    subscription_status: 'active',
                    company_code: newCompanyCode 
                })
                
                if (profileError) {
                    throw new Error("Errore nel salvataggio del database: " + profileError.message);
                }
            }

            // Notifica fittizia
            try {
                await fetch('/api/notify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'NEW_SUBSCRIPTION', company: formData.companyName, email: formData.email, plan: formData.plan, revenue: currentPrice })
                })
            } catch (err) {}

            setTimeout(() => {
                setCheckoutStatus("Autorizzazione in corso. Creazione Ecosistema...")
                setTimeout(() => {
                    setCheckoutStatus(null)
                    setLoading(false)
                    setStep(3) 
                    setTimeout(() => { window.location.href = '/login?registered=true' }, 4000)
                }, 2000)
            }, 1500)

        } catch (err: any) {
            setLoading(false)
            setCheckoutStatus(null)
            if (err.message.includes('already registered')) {
                setError("Questa email è già registrata. Vai alla pagina di Login.")
            } else {
                setError(err.message || "Errore durante la creazione. Riprova.")
            }
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start relative z-10">
            
            {/* COLONNA SINISTRA: FORM */}
            <div className="w-full lg:w-3/5">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2 animate-in fade-in shadow-sm">
                        <AlertTriangle size={18}/> {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl animate-in slide-in-from-left-8">
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Crea Account e Attiva <span className="text-[#00665E]">{formData.plan}</span></h2>
                        <p className="text-slate-500 text-sm mb-8 font-medium">Compila i dati in modo sicuro per generare il tuo nuovo ecosistema.</p>

                        <form onSubmit={handleNextStep} className="space-y-6" autoComplete="off">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome Azienda</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input required type="text" name="new-company" autoComplete="off" value={formData.companyName} onChange={e=>setFormData({...formData, companyName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="Es. TechSolutions Srl" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Lavorativa</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input required type="email" name="new-email" autoComplete="new-email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-bold" placeholder="admin@azienda.it" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Crea Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input required type={showPassword ? "text" : "password"} name="new-password" autoComplete="new-password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-12 text-slate-900 outline-none focus:border-[#00665E] focus:ring-1 focus:ring-[#00665E] transition font-mono font-bold" placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Conferma Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input required type={showConfirmPassword ? "text" : "password"} name="confirm-password" autoComplete="new-password" value={formData.confirmPassword} onChange={e=>setFormData({...formData, confirmPassword: e.target.value})} className={`w-full bg-slate-50 border rounded-xl py-3 pl-12 pr-12 text-slate-900 outline-none transition font-mono font-bold ${formData.confirmPassword.length > 0 ? (doPasswordsMatch ? 'border-emerald-500 focus:ring-emerald-500' : 'border-red-500 focus:ring-red-500') : 'border-slate-200 focus:border-[#00665E] focus:ring-[#00665E]'}`} placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                                            {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap gap-x-6 gap-y-2">
                                <p className="w-full text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-black">Requisiti di Sicurezza:</p>
                                <span className={`text-xs font-bold flex items-center gap-1 ${pwdCriteria.length ? 'text-[#00665E]' : 'text-slate-400'}`}>{pwdCriteria.length ? <Check size={14}/> : <X size={14}/>} Min. 8 caratteri</span>
                                <span className={`text-xs font-bold flex items-center gap-1 ${pwdCriteria.uppercase ? 'text-[#00665E]' : 'text-slate-400'}`}>{pwdCriteria.uppercase ? <Check size={14}/> : <X size={14}/>} 1 Maiuscola</span>
                                <span className={`text-xs font-bold flex items-center gap-1 ${pwdCriteria.number ? 'text-[#00665E]' : 'text-slate-400'}`}>{pwdCriteria.number ? <Check size={14}/> : <X size={14}/>} 1 Numero</span>
                                <span className={`text-xs font-bold flex items-center gap-1 ${pwdCriteria.special ? 'text-[#00665E]' : 'text-slate-400'}`}>{pwdCriteria.special ? <Check size={14}/> : <X size={14}/>} 1 Simbolo speciale</span>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                        <input type="checkbox" checked={agreements.terms} onChange={e=>setAgreements({...agreements, terms: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-[#00665E] checked:border-[#00665E] transition cursor-pointer" />
                                        <Check size={14} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 leading-tight group-hover:text-slate-700 transition">
                                        Dichiaro di aver letto e accettato i <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#00665E] font-bold underline hover:text-[#004d47]">Termini e Condizioni di Servizio</button> e l'accordo di abbonamento ricorrente.*
                                    </span>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                        <input type="checkbox" checked={agreements.privacy} onChange={e=>setAgreements({...agreements, privacy: e.target.checked})} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-[#00665E] checked:border-[#00665E] transition cursor-pointer" />
                                        <Check size={14} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 leading-tight group-hover:text-slate-700 transition">
                                        Acconsento al trattamento dei dati personali ai sensi del GDPR stipulato nella <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-[#00665E] font-bold underline hover:text-[#004d47]">Privacy Policy</button>.*
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition mt-6 flex justify-center items-center gap-2 shadow-lg shadow-[#00665E]/20">
                                Prosegui al Pagamento Sicuro <ArrowRight size={18}/>
                            </button>
                        </form>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl animate-in slide-in-from-right-8 relative overflow-hidden">
                        
                        {loading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in">
                                <Loader2 size={48} className="animate-spin text-[#00665E] mb-4"/>
                                <p className="text-slate-900 font-black text-lg text-center max-w-xs">{checkoutStatus}</p>
                                <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-1"><Lock size={14}/> Handshake sicuro in corso...</p>
                            </div>
                        )}

                        <button onClick={() => setStep(1)} disabled={loading} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-xs font-bold mb-6 transition bg-slate-100 hover:bg-slate-200 py-2 px-4 rounded-xl"><ArrowLeft size={14}/> Indietro</button>
                        <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-2"><Lock className="text-[#00665E]"/> Scegli come pagare</h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">Il gateway esterno si occuperà di prelevare in automatico la quota mensile. Potrai disdire in autonomia con un click in qualsiasi momento.</p>

                        <form onSubmit={handleCheckout} className="space-y-6">
                            <div className="flex gap-4 mb-6">
                                <div onClick={() => setPaymentMethod('stripe')} className={`flex-1 border-2 rounded-2xl p-4 cursor-pointer text-center transition ${paymentMethod === 'stripe' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <CreditCard size={24} className={`mx-auto mb-2 ${paymentMethod === 'stripe' ? 'text-indigo-600' : 'text-slate-400'}`}/>
                                    <span className={`text-sm font-black ${paymentMethod === 'stripe' ? 'text-indigo-900' : 'text-slate-500'}`}>Stripe (Carte)</span>
                                </div>
                                <div onClick={() => setPaymentMethod('paypal')} className={`flex-1 border-2 rounded-2xl p-4 cursor-pointer text-center transition ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                                    <svg className={`mx-auto mb-2 w-6 h-6 ${paymentMethod === 'paypal' ? 'fill-blue-600' : 'fill-slate-400'}`} viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106a.64.64 0 0 1-.632.74zM10.231 16h1.996c3.08 0 5.48-.823 6.326-3.858.03-.11.058-.219.085-.328.217-1.428-.15-2.731-1.04-3.744C16.634 6.96 14.86 6.4 12.38 6.4h-5.07L5.59 17.337h2.246l.823-5.234a1.272 1.272 0 0 1 1.258-1.077h1.002c3.27 0 5.592 1.321 6.368 4.673.082.327.132.659.148.995a5.572 5.572 0 0 1-.168 1.487c-.506 2.062-2.128 3.033-4.664 3.033H10.51l-.279 1.785z"/></svg>
                                    <span className={`text-sm font-black ${paymentMethod === 'paypal' ? 'text-blue-900' : 'text-slate-500'}`}>PayPal</span>
                                </div>
                            </div>

                            {paymentMethod === 'stripe' ? (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                                    <div className="absolute top-3 right-4 text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase tracking-widest"><Shield size={12}/> Powered by Stripe</div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block mt-2">Intestatario Carta</label>
                                    <input required type="text" className="w-full bg-transparent border-b border-slate-300 py-2 text-slate-900 font-bold outline-none focus:border-indigo-500 transition mb-6" placeholder="NOME COGNOME" />
                                    
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Dati Carta</label>
                                    <div className="flex bg-white border border-slate-300 rounded-xl p-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition shadow-sm">
                                        <input required type="text" maxLength={19} className="w-full bg-transparent text-slate-900 outline-none font-mono font-bold tracking-widest" placeholder="0000 0000 0000 0000" />
                                        <input required type="text" maxLength={5} className="w-16 bg-transparent text-slate-900 outline-none font-mono font-bold text-center border-l border-slate-200 ml-2 pl-2" placeholder="MM/AA" />
                                        <input required type="text" maxLength={3} className="w-12 bg-transparent text-slate-900 outline-none font-mono font-bold text-center border-l border-slate-200 ml-2 pl-2" placeholder="CVC" />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50 p-8 rounded-2xl border border-blue-200 text-center">
                                    <p className="text-blue-800 font-bold text-sm mb-2">Verrai reindirizzato in modo sicuro.</p>
                                    <p className="text-blue-600/70 text-xs font-medium">Completerai il pagamento direttamente sul sito di PayPal.</p>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className={`w-full text-white font-black py-4 rounded-xl hover:scale-[1.02] transition mt-6 flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:scale-100 ${paymentMethod === 'stripe' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
                                Procedi verso {paymentMethod === 'stripe' ? 'Stripe' : 'PayPal'} <ArrowRight size={18}/>
                            </button>
                            <p className="text-center text-[10px] text-slate-500 mt-4 leading-relaxed px-4 font-medium">
                                Autorizzi un addebito ricorrente mensile di €{currentPrice}. Puoi annullare il rinnovo dal pannello impostazioni entro il giorno precedente la scadenza del mese in corso (30 giorni esatti dall'ora di iscrizione), senza penali.
                            </p>
                        </form>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-3xl shadow-2xl text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-emerald-200 relative z-10">
                            <CheckCircle size={48} strokeWidth={3}/>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 relative z-10">Pagamento Autorizzato!</h2>
                        <p className="text-emerald-800 mb-2 relative z-10 text-lg font-medium">Il tuo account <span className="font-black text-emerald-900">{formData.companyName}</span> è ora attivo col piano {formData.plan}.</p>
                        <p className="text-emerald-700/80 mb-8 relative z-10 text-sm font-medium">Ti abbiamo appena inviato un'email ufficiale di benvenuto con il riepilogo e i link di accesso rapido. Controlla la posta!</p>
                        
                        <div className="flex items-center justify-center gap-3 text-white font-bold relative z-10 bg-[#00665E] py-3 px-6 rounded-full w-max mx-auto shadow-lg">
                            <Loader2 size={18} className="animate-spin"/> Ti stiamo portando alla Control Room...
                        </div>
                    </div>
                )}
            </div>

            {/* COLONNA DESTRA: RIEPILOGO CARRELLO FISSO */}
            <div className="w-full lg:w-2/5">
                <div className="bg-white border border-slate-200 p-8 rounded-3xl sticky top-24 shadow-xl">
                    <h3 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center gap-2"><Server size={20} className="text-[#00665E]"/> Riepilogo Abbonamento</h3>
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="font-black text-slate-900 text-lg">IntegraOS <span className="text-[#00665E] uppercase tracking-wider">{formData.plan}</span></p>
                            <p className="text-xs font-medium text-slate-500 mt-1">{planDetails[formData.plan]?.desc || 'Software Gestionale All-in-one'}</p>
                        </div>
                        <p className="text-3xl font-black text-[#00665E]">€{currentPrice}</p>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600 mb-8 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <span className="font-medium">Ciclo di Fatturazione</span>
                        <span className="font-black text-slate-900">Mensile Automatico</span>
                    </div>

                    <div className="space-y-5 mb-8">
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 p-1 rounded-full text-emerald-600 shrink-0 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Setup Iniziale Immediato</p>
                                <p className="text-xs text-slate-500 font-medium">I tuoi moduli saranno operativi tra pochi secondi.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 p-1 rounded-full text-emerald-600 shrink-0 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Nessun Vincolo a Lungo Termine</p>
                                <p className="text-xs text-slate-500 font-medium">Disdetta gratuita entro le 24h prima del rinnovo.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-emerald-100 p-1 rounded-full text-emerald-600 shrink-0 mt-0.5"><Check size={14} strokeWidth={3}/></div>
                            <div>
                                <p className="text-sm font-black text-slate-900">Email di Benvenuto Ufficiale</p>
                                <p className="text-xs text-slate-500 font-medium">Riceverai tutto il necessario appena completato l'ordine.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                        <span className="text-slate-600 font-black text-lg">Totale Oggi</span>
                        <div className="text-right">
                            <span className="text-4xl font-black text-slate-900">€{currentPrice}</span>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">+ IVA se applicabile</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALE TERMINI E CONDIZIONI */}
            {showTermsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-slate-900 flex items-center gap-2"><FileText size={20} className="text-[#00665E]"/> Termini e Condizioni</h3>
                            <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto text-sm text-slate-600 space-y-5 leading-relaxed custom-scrollbar bg-white">
                            <p className="font-black text-slate-900 text-base">1. Accettazione dei Termini</p>
                            <p className="font-medium">Utilizzando i servizi di IntegraOS, l'utente accetta di essere vincolato ai presenti Termini di Servizio. L'abbonamento sottoscritto è di natura mensile ricorrente.</p>
                            
                            <p className="font-black text-slate-900 text-base mt-4">2. Fatturazione e Addebiti</p>
                            <p className="font-medium">L'addebito di €{currentPrice} (più eventuale IVA) avverrà automaticamente ogni mese nel medesimo giorno in cui è stata effettuata la prima iscrizione. In caso di mancato pagamento, il sistema sospenderà l'accesso all'infrastruttura entro 48 ore.</p>
                            
                            <p className="font-black text-slate-900 text-base mt-4">3. Diritto di Recesso e Disdetta</p>
                            <p className="font-medium">Il cliente può disdire il proprio abbonamento in qualsiasi momento dal pannello "Impostazioni". Affinché il rinnovo automatico non venga addebitato, la disdetta deve avvenire almeno 24 ore prima dell'orario e data esatta del rinnovo mensile. Non sono previsti rimborsi per mesi parzialmente utilizzati.</p>
                            
                            <p className="font-black text-slate-900 text-base mt-4">4. Limitazione di Responsabilità</p>
                            <p className="font-medium">IntegraOS non è responsabile per la mancata consegna di messaggi automatizzati dovuta a disservizi di API terze (es. Meta, WhatsApp, provider Email). L'intelligenza artificiale lavora in modalità probabilistica, è cura dell'amministratore monitorarne l'andamento.</p>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0">
                            <button onClick={() => {setAgreements({...agreements, terms: true}); setShowTermsModal(false)}} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">Ho capito e accetto i Termini</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE PRIVACY POLICY */}
            {showPrivacyModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="font-black text-slate-900 flex items-center gap-2"><Shield size={20} className="text-[#00665E]"/> Privacy Policy (GDPR)</h3>
                            <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto text-sm text-slate-600 space-y-5 leading-relaxed custom-scrollbar bg-white">
                            <p className="font-black text-slate-900 text-base">1. Trattamento dei Dati</p>
                            <p className="font-medium">IntegraOS (in qualità di Data Processor) tratterà i dati dei tuoi clienti nel pieno rispetto del Regolamento UE 2016/679 (GDPR). I dati caricati nel CRM appartengono alla tua Azienda (Data Controller).</p>
                            
                            <p className="font-black text-slate-900 text-base mt-4">2. Infrastruttura Server e Sicurezza</p>
                            <p className="font-medium">Tutti i database sono ospitati su server protetti situati all'interno dello Spazio Economico Europeo (EEA). Utilizziamo la crittografia AES-256 per i dati at-rest e TLS 1.3 per i dati in transito.</p>
                            
                            <p className="font-black text-slate-900 text-base mt-4">3. Utilizzo dell'Intelligenza Artificiale</p>
                            <p className="font-medium">I dati aziendali inviati all'Intelligenza Artificiale (es. Analisi bilancio, addestramento chatbot) non vengono utilizzati in alcun modo per allenare modelli linguistici aperti al pubblico. L'infrastruttura AI garantisce il segreto industriale.</p>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl shrink-0">
                            <button onClick={() => {setAgreements({...agreements, privacy: true}); setShowPrivacyModal(false)}} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">Acconsento al Trattamento Dati</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

// Layout della pagina
export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white flex flex-col relative overflow-hidden text-slate-800">
        
        {/* EFFETTI LUCE GLOBALI (Light Theme) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.03] pointer-events-none -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

        {/* NAVBAR PREMIUM LIGHT */}
        <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                <img src="/logo-integra.png" alt="IntegraOS Logo" className="h-8 md:h-10 object-contain" />
            </Link>
            <Link href="/login" className="text-xs font-bold text-[#00665E] hover:text-white transition flex items-center gap-1.5 bg-emerald-50 hover:bg-[#00665E] px-5 py-2.5 rounded-full border border-emerald-200 hover:border-[#00665E] shadow-sm">
                Hai già un account? <span className="font-black ml-1">Accedi</span>
            </Link>
        </nav>

        {/* CONTENUTO PRINCIPALE */}
        <div className="flex-1 p-6 md:p-12 lg:p-16 flex items-start justify-center relative z-10 w-full">
            <Suspense fallback={<div className="text-[#00665E] flex flex-col items-center gap-4 mt-20"><Loader2 className="animate-spin" size={40}/><p className="font-black text-lg">Inizializzazione connessione sicura...</p></div>}>
                <RegisterForm />
            </Suspense>
        </div>

    </main>
  )
}