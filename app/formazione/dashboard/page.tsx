'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, LogOut, PlayCircle, BookOpen, Clock, 
    Award, CheckCircle, Lock, ArrowRight, Loader2, 
    CreditCard, Check, X, Star,
    Sparkles, Zap, CheckCircle2, User
} from 'lucide-react'

// Gli stessi dati del catalogo (in futuro arriveranno dal database)
const ALL_COURSES = [
    {
        id: 'ai-sales-masterclass',
        title: 'AI Sales Masterclass',
        description: 'Delega il follow-up all\'Intelligenza Artificiale.',
        duration: '12 Ore', lessons: 24, price: 299, color: 'blue', progress: 0
    },
    {
        id: 'integraos-zero-to-hero',
        title: 'IntegraOS: Zero to Hero',
        description: 'Configura il tuo ecosistema aziendale.',
        duration: '6 Ore', lessons: 15, price: 149, color: 'emerald', progress: 0
    },
    {
        id: 'marketing-automation',
        title: 'Marketing Automation 3.0',
        description: 'Crea funnel infallibili collegando WhatsApp e Email.',
        duration: '8 Ore', lessons: 18, price: 199, color: 'rose', progress: 0
    }
]

function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    
    // Corsi posseduti dall'utente
    const [myCourses, setMyCourses] = useState<string[]>([])
    
    // Stato per il modale di pagamento (Checkout)
    const [checkoutCourse, setCheckoutCourse] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
    const [isPaying, setIsPaying] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)

    useEffect(() => {
        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            
            // BYPASS SICUREZZA PER TEST: Se non è loggato, creiamo un utente finto anziché cacciarlo
            if (!user) {
                setUser({ email: 'mario.studente@integraos.it' }) // Utente finto per vedere la UI
            } else {
                setUser(user)
            }

            // Controlla se è atterrato qui con un intento di acquisto (?buy=...)
            const courseToBuyId = searchParams.get('buy')
            if (courseToBuyId) {
                const course = ALL_COURSES.find(c => c.id === courseToBuyId)
                // Se il corso esiste e non ce l'ha già, apri il checkout
                if (course && !myCourses.includes(courseToBuyId)) {
                    setCheckoutCourse(course)
                }
            }

            setLoading(false)
        }
        loadDashboard()
    }, [searchParams, supabase, myCourses])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/formazione')
    }

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault()
        setIsPaying(true)
        
        // Simula il processo di pagamento Stripe/PayPal
        setTimeout(() => {
            setIsPaying(false)
            setPaymentSuccess(true)
            
            // Aggiungi il corso alla libreria dell'utente
            setTimeout(() => {
                setMyCourses(prev => [...prev, checkoutCourse.id])
                setPaymentSuccess(false)
                setCheckoutCourse(null)
                // Pulisce l'URL rimuovendo ?buy=...
                router.replace('/formazione/dashboard')
            }, 2000)
            
        }, 2000)
    }

    // Dividiamo i corsi in "Miei" e "Da Comprare"
    const purchasedCourses = ALL_COURSES.filter(c => myCourses.includes(c.id))
    const availableCourses = ALL_COURSES.filter(c => !myCourses.includes(c.id))

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40}/>
                <h2 className="text-white font-bold text-xl">Caricamento Aula Virtuale...</h2>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#020817] font-sans selection:bg-indigo-500 selection:text-white pb-24 relative overflow-hidden">
            
            {/* EFFETTI LUCE */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR STUDENTE */}
            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-800/50 bg-[#020817]/80 backdrop-blur-md sticky top-0 z-40">
                <Link href="/formazione" className="flex items-center gap-2 hover:opacity-80 transition">
                    <Shield className="text-indigo-500" size={24}/>
                    <div className="text-lg font-black text-white tracking-tighter hidden sm:block">
                        INTEGRA<span className="font-light text-slate-500">OS</span> <span className="text-indigo-400 font-medium tracking-normal ml-1">Academy</span>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-white font-bold text-sm">{user?.email}</p>
                        <p className="text-indigo-400 text-xs">Studente Academy</p>
                    </div>
                    <button onClick={handleLogout} className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 p-2.5 rounded-full transition">
                        <LogOut size={18}/>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
                
                {/* SALUTO HEADER */}
                <div className="mb-12">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        Bentornato in <span className="text-indigo-400">Aula</span>.
                    </h1>
                    <p className="text-slate-400">Riprendi da dove avevi lasciato o esplora nuove competenze per la tua azienda.</p>
                </div>

                {/* SEZIONE 1: I MIEI CORSI (ACQUISTATI) */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-white flex items-center gap-2">
                            <BookOpen className="text-indigo-500"/> La tua Libreria
                        </h2>
                    </div>

                    {purchasedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {purchasedCourses.map(course => (
                                <div key={course.id} className="bg-[#020817] border border-slate-800 rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition">
                                    <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${course.color}-500/10 rounded-full blur-3xl pointer-events-none`}></div>
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 bg-${course.color}-500/20 text-${course.color}-400 rounded-2xl flex items-center justify-center`}>
                                            <PlayCircle size={24}/>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-white mb-2">{course.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6">{course.description}</p>
                                    
                                    {/* Barra di Progresso */}
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                            <span>Progresso</span>
                                            <span className="text-white">0%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-indigo-500 h-full rounded-full" style={{width: '0%'}}></div>
                                        </div>
                                    </div>

                                    <Link href={`/formazione/classroom/${course.id}`} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 border border-slate-700 hover:border-transparent">
                                        Entra in Classe <ArrowRight size={16}/>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-10 text-center">
                            <Award className="mx-auto text-slate-600 mb-4" size={48}/>
                            <h3 className="text-xl font-bold text-white mb-2">Nessun corso attivo</h3>
                            <p className="text-slate-400 max-w-md mx-auto">Non hai ancora sbloccato nessun corso. Esplora il catalogo qui sotto per iniziare la tua formazione.</p>
                        </div>
                    )}
                </div>

                {/* SEZIONE 2: CATALOGO UPSELL (CORSI DA COMPRARE) */}
                {availableCourses.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <Sparkles className="text-emerald-500"/> Corsi Consigliati
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {availableCourses.map(course => (
                                <div key={course.id} className="bg-[#020817] border border-slate-800 rounded-2xl p-6 group hover:border-slate-600 transition flex flex-col relative overflow-hidden">
                                    <div className={`absolute -top-10 -right-10 w-24 h-24 bg-${course.color}-500/5 rounded-full blur-2xl pointer-events-none`}></div>
                                    <h3 className="text-lg font-black text-white mb-2 relative z-10">{course.title}</h3>
                                    <p className="text-slate-400 text-xs mb-6 flex-1 relative z-10">{course.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto relative z-10">
                                        <span className="text-xl font-black text-white">€{course.price}</span>
                                        <button 
                                            onClick={() => setCheckoutCourse(course)}
                                            className="bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1"
                                        >
                                            <Lock size={12}/> Sblocca Ora
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DI CHECKOUT (PAGAMENTO CORSO) */}
            {checkoutCourse && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#020817] border border-slate-700 rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 flex flex-col md:flex-row">
                        
                        <button onClick={() => setCheckoutCourse(null)} className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full">
                            <X size={20}/>
                        </button>

                        {/* Riepilogo Ordine */}
                        <div className="w-full md:w-1/2 p-8 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between relative">
                            <div className={`absolute top-0 right-0 w-full h-full bg-${checkoutCourse.color}-500/5 blur-3xl pointer-events-none`}></div>
                            <div className="relative z-10">
                                <span className={`bg-${checkoutCourse.color}-500/20 text-${checkoutCourse.color}-400 text-xs font-bold px-3 py-1 rounded-md mb-4 inline-block`}>Riepilogo Ordine</span>
                                <h3 className="text-2xl font-black text-white mb-2">{checkoutCourse.title}</h3>
                                <p className="text-slate-400 text-sm mb-8">{checkoutCourse.description}</p>
                                
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-2 text-sm text-slate-300"><Clock size={16} className={`text-${checkoutCourse.color}-500`}/> Accesso Immediato e Illimitato</div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300"><BookOpen size={16} className={`text-${checkoutCourse.color}-500`}/> {checkoutCourse.lessons} Video Lezioni 4K</div>
                                    <div className="flex items-center gap-2 text-sm text-slate-300"><Award size={16} className={`text-${checkoutCourse.color}-500`}/> Certificato Inclusivo</div>
                                </div>
                            </div>
                            
                            <div className="border-t border-slate-800 pt-6 flex justify-between items-center relative z-10">
                                <span className="text-slate-300 font-bold">Totale da pagare</span>
                                <span className="text-4xl font-black text-white">€{checkoutCourse.price}</span>
                            </div>
                        </div>

                        {/* Form Pagamento */}
                        <div className="w-full md:w-1/2 p-8">
                            {paymentSuccess ? (
                                <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in">
                                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                                        <CheckCircle size={40}/>
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Pagamento Riuscito!</h3>
                                    <p className="text-slate-400 text-sm">Corso sbloccato. Ti stiamo portando in aula...</p>
                                </div>
                            ) : (
                                <form onSubmit={handlePayment} className="h-full flex flex-col justify-center">
                                    <h3 className="text-xl font-bold text-white mb-6">Seleziona Metodo</h3>
                                    
                                    <div className="flex gap-4 mb-8">
                                        <div onClick={() => setPaymentMethod('stripe')} className={`flex-1 border-2 rounded-xl p-4 cursor-pointer text-center transition ${paymentMethod === 'stripe' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-[#020817]'}`}>
                                            <CreditCard className={`mx-auto mb-2 ${paymentMethod === 'stripe' ? 'text-indigo-400' : 'text-slate-500'}`}/>
                                            <span className={`text-sm font-bold ${paymentMethod === 'stripe' ? 'text-white' : 'text-slate-400'}`}>Carta di Credito</span>
                                        </div>
                                        <div onClick={() => setPaymentMethod('paypal')} className={`flex-1 border-2 rounded-xl p-4 cursor-pointer text-center transition ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-[#020817]'}`}>
                                            <span className={`text-sm font-bold mt-6 block ${paymentMethod === 'paypal' ? 'text-white' : 'text-slate-400'}`}>PayPal</span>
                                        </div>
                                    </div>

                                    {paymentMethod === 'stripe' && (
                                        <div className="space-y-4 mb-8">
                                            <input required type="text" placeholder="Nome sulla carta" className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 transition" />
                                            <div className="flex gap-2">
                                                <input required type="text" placeholder="0000 0000 0000 0000" maxLength={19} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 font-mono transition" />
                                                <input required type="text" placeholder="MM/AA" maxLength={5} className="w-24 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 font-mono text-center transition" />
                                                <input required type="text" placeholder="CVC" maxLength={3} className="w-20 bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 font-mono text-center transition" />
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'paypal' && (
                                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center mb-8">
                                            <p className="text-slate-400 text-sm">Verrai reindirizzato in modo sicuro al sito di PayPal per completare l'acquisto.</p>
                                        </div>
                                    )}

                                    <button disabled={isPaying} type="submit" className={`w-full bg-${checkoutCourse.color}-600 text-white font-black py-4 rounded-xl hover:bg-${checkoutCourse.color}-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50`}>
                                        {isPaying ? <><Loader2 className="animate-spin" size={20}/> Elaborazione...</> : `Paga €${checkoutCourse.price} Sicuramente`}
                                    </button>
                                    <div className="text-center mt-4 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                                        <Lock size={10}/> Pagamento crittografato AES-256 Stripe
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020817] flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Caricamento...</div>}>
            <DashboardContent />
        </Suspense>
    )
}