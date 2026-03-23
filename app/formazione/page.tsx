'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { 
    Shield, LogOut, PlayCircle, BookOpen, Clock, 
    Award, CheckCircle, Lock, ArrowRight, Loader2, 
    CreditCard, Sparkles, CheckCircle2, ArrowLeft,
    ShoppingCart
} from 'lucide-react'

function DashboardContent() {
    const router = useRouter()
    const supabase = createClient()
    
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    
    // Dati reali dal DB
    const [myCourses, setMyCourses] = useState<any[]>([])
    const [availableCourses, setAvailableCourses] = useState<any[]>([])
    
    const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)

    useEffect(() => {
        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                // Se non c'è un utente loggato, lo rimanda al login
                window.location.href = '/formazione/login'
                return
            }
            setUser(user)

            // 1. Prendi tutti i corsi dal DB
            const { data: allCourses } = await supabase.from('academy_courses').select('*').eq('status', 'Pubblicato')
            
            // 2. Prendi gli sblocchi dell'utente
            const { data: progress } = await supabase.from('course_progress').select('*').eq('agent_email', user.email)
            
            if (allCourses && progress) {
                const enrolledIds = progress.map(p => p.course_id)
                
                // Dividi i corsi: quelli che ha e quelli che può comprare
                const owned = allCourses.filter(c => enrolledIds.includes(c.id)).map(c => {
                    const progInfo = progress.find(p => p.course_id === c.id);
                    return { ...c, progressValue: progInfo?.progress || 0, token: progInfo?.access_token }
                })
                
                const available = allCourses.filter(c => !enrolledIds.includes(c.id))

                setMyCourses(owned)
                setAvailableCourses(available)
            }
            
            setLoading(false)
        }
        loadDashboard()
    }, [supabase])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/formazione'
    }

    // FUNZIONE DI ACQUISTO (STRIPE REALE O BYPASS TEST)
    const handleBuyCourse = async (courseId: string) => {
        if (!user || !user.email) return;
        
        try {
            setCheckoutStatus("Connessione sicura al Gateway in corso...")
            
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: courseId, email: user.email })
            })

            const data = await response.json()

            // FIX DEFINITIVO: Se l'API restituisce la modalità simulata (manca Stripe su Vercel),
            // lo sblocchiamo direttamente QUI dal frontend usando la tua sessione autenticata!
            if (data.url && data.url.includes('session_id=simulata')) {
                setCheckoutStatus("Sblocco corso in modalità Test...");
                const magicToken = `tok_${Date.now()}_${Math.floor(Math.random()*1000)}`;

                const { data: existingProgress } = await supabase.from('course_progress')
                    .select('id').eq('course_id', courseId).eq('agent_email', user.email).single();

                if (existingProgress) {
                    await supabase.from('course_progress').update({ access_token: magicToken }).eq('id', existingProgress.id);
                } else {
                    const { error } = await supabase.from('course_progress').insert({
                        course_id: courseId,
                        agent_email: user.email,
                        progress: 0,
                        status: 'assigned',
                        access_token: magicToken
                    });
                    if (error) {
                        alert("Errore DB durante l'assegnazione: " + error.message);
                        setCheckoutStatus(null);
                        return;
                    }
                }
                
                // Ricarica istantaneamente la pagina per mostrare il corso sbloccato in Libreria!
                window.location.reload();
                return;
            }

            if (response.ok && data.url) {
                window.location.href = data.url
            } else {
                throw new Error("URL di checkout mancante")
            }
        } catch (err: any) {
            alert("Errore durante il caricamento del pagamento: " + err.message)
            setCheckoutStatus(null)
        }
    }

    if (loading || checkoutStatus) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#00665E]">
                <Loader2 className="animate-spin mb-4" size={48}/>
                <h2 className="font-black text-xl">{checkoutStatus || "Caricamento Aula Virtuale..."}</h2>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white pb-24 relative overflow-hidden text-slate-800">
            
            {/* EFFETTI LUCE LIGHT THEME */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.04] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR STUDENTE */}
            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
                <Link href="/formazione" className="flex items-center gap-2 hover:opacity-80 transition">
                    <img src="/logo-integraos.png" alt="IntegraOS Academy" className="h-8 md:h-10 object-contain" onError={(e) => e.currentTarget.src='/logo-integra.png'} />
                    <span className="text-xl font-light text-[#00665E] tracking-tight ml-2 hidden sm:block border-l border-slate-200 pl-4">Academy</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-slate-900 font-bold text-sm">{user?.email}</p>
                        <p className="text-[#00665E] text-xs font-medium">Studente Verificato</p>
                    </div>
                    <button onClick={handleLogout} className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition shadow-sm">
                        <LogOut size={18}/>
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
                
                {/* SALUTO HEADER */}
                <div className="mb-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                            Bentornato in <span className="text-[#00665E]">Aula</span>.
                        </h1>
                        <p className="text-slate-500 font-medium">Riprendi da dove avevi lasciato o esplora nuove competenze per la tua azienda.</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2 text-emerald-700 shadow-sm">
                        <CheckCircle2 size={20}/> <span className="font-bold text-sm">Account Attivo</span>
                    </div>
                </div>

                {/* SEZIONE 1: I MIEI CORSI (ACQUISTATI) */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <BookOpen className="text-[#00665E]"/> La tua Libreria
                        </h2>
                    </div>

                    {myCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myCourses.map(course => (
                                <div key={course.id} className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden group hover:border-[#00665E]/50 hover:shadow-xl transition duration-300 flex flex-col">
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-[#00665E]/10 text-[#00665E] rounded-2xl flex items-center justify-center border border-[#00665E]/20">
                                            <PlayCircle size={24}/>
                                        </div>
                                        {course.progressValue === 100 && (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
                                                <Award size={12}/> Completato
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{course.title}</h3>
                                    <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-3 font-medium">{course.description}</p>
                                    
                                    {/* Barra di Progresso */}
                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                            <span>Progresso</span>
                                            <span className="text-[#00665E]">{course.progressValue}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                                            <div className="bg-[#00665E] h-full rounded-full transition-all duration-700" style={{width: `${course.progressValue}%`}}></div>
                                        </div>
                                    </div>

                                    {/* In futuro: porterà a /learning/[token] o alla classe interna */}
                                    <Link href={`/formazione/classroom/${course.id}`} className="w-full bg-slate-50 hover:bg-[#00665E] text-[#00665E] hover:text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 hover:border-transparent shadow-sm">
                                        Entra in Classe <ArrowRight size={16}/>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-10 text-center shadow-sm">
                            <Award className="mx-auto text-slate-300 mb-4" size={48}/>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Nessun corso attivo</h3>
                            <p className="text-slate-500 max-w-md mx-auto font-medium">Non hai ancora sbloccato nessun corso. Esplora il catalogo qui sotto per iniziare la tua formazione.</p>
                        </div>
                    )}
                </div>

                {/* SEZIONE 2: CATALOGO UPSELL (CORSI DA COMPRARE) */}
                {availableCourses.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <ShoppingCart className="text-amber-500"/> Esplora il Catalogo
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {availableCourses.map(course => (
                                <div key={course.id} className="bg-white border border-slate-200 rounded-3xl p-6 group hover:border-[#00665E]/50 hover:shadow-xl transition flex flex-col relative overflow-hidden">
                                    <h3 className="text-xl font-black text-slate-900 mb-2 relative z-10 leading-tight">{course.title}</h3>
                                    <p className="text-slate-500 text-sm mb-6 flex-1 relative z-10 font-medium line-clamp-3">{course.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto relative z-10 pt-4 border-t border-slate-100">
                                        <span className="text-2xl font-black text-[#00665E]">€{course.price}</span>
                                        <button 
                                            onClick={() => handleBuyCourse(course.id)}
                                            className="bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-amber-200 hover:border-transparent shadow-sm"
                                        >
                                            <Lock size={14}/> Acquista Ora
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#00665E]"><Loader2 className="animate-spin mr-2"/> Caricamento...</div>}>
            <DashboardContent />
        </Suspense>
    )
}