'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
    Shield, Search, BookOpen, Clock, Star, ArrowRight, 
    BrainCircuit, Sparkles, TrendingUp, Users, ArrowLeft,
    MessageSquare, X, CheckCircle2, Play, Cookie, Send,
    MonitorPlay, FileText, CheckCircle
} from 'lucide-react'

// Dati finti: Ora includono un "videoUrl" funzionante!
const COURSES = [
    {
        id: 'ai-sales-masterclass',
        title: 'AI Sales Masterclass',
        description: 'Impara a delegare il 90% del follow-up clienti all\'Intelligenza Artificiale e raddoppia le conversioni.',
        longDescription: 'In questo corso intensivo scoprirai come addestrare un agente AI a rispondere alle email, qualificare i contatti su WhatsApp e fissare appuntamenti sul tuo calendario mentre tu dormi. Include prompt pronti all\'uso e strategie di negoziazione ibrida (Umano + AI).',
        duration: '12 Ore',
        lessons: 24,
        price: 299,
        level: 'Avanzato',
        category: 'Vendite & AI',
        rating: 4.9,
        students: 1240,
        color: 'blue',
        features: ['24 Video Lezioni 4K', '50+ Prompt Copia-Incolla', 'Attestato LinkedIn', 'Supporto Tutor AI'],
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' // Video Demo Reale
    },
    {
        id: 'integraos-zero-to-hero',
        title: 'IntegraOS: Zero to Hero',
        description: 'Il corso definitivo per configurare il tuo ecosistema aziendale, dal CRM alle fatture automatiche.',
        longDescription: 'Non sai da dove iniziare? Questo corso ti prende per mano. Vedremo come importare i tuoi contatti, configurare il gestionale, emettere la prima fattura e collegare le tue caselle email. Perfetto per chi ha appena acquistato la licenza IntegraOS.',
        duration: '6 Ore',
        lessons: 15,
        price: 149,
        level: 'Principiante',
        category: 'Ecosistema',
        rating: 4.8,
        students: 3420,
        color: 'emerald',
        features: ['15 Video Tutorial Pratici', 'Checklist di Setup', 'Attestato di Frequenza', 'Esercizi su Account Demo'],
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' // Video Demo Reale
    },
    {
        id: 'marketing-automation',
        title: 'Marketing Automation 3.0',
        description: 'Crea funnel infallibili collegando WhatsApp, Email e Landing Pages senza scrivere una riga di codice.',
        longDescription: 'Il marketing manuale è morto. Impara a usare gli Zap e i Workflows di IntegraOS per creare sequenze email automatiche, recuperare i carrelli abbandonati e mandare messaggi WhatsApp personalizzati al momento perfetto.',
        duration: '8 Ore',
        lessons: 18,
        price: 199,
        level: 'Intermedio',
        category: 'Marketing',
        rating: 4.7,
        students: 890,
        color: 'purple',
        features: ['18 Lezioni Strategiche', '10 Template Funnel', 'Attestato Ufficiale', 'Accesso a vita'],
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' // Video Demo Reale
    }
]

export default function FormazioneCatalogPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Tutti')
    
    // Stati per Modali
    const [showCookieBanner, setShowCookieBanner] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showTrailer, setShowTrailer] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    
    const [contactFormStatus, setContactFormStatus] = useState<'idle' | 'sending' | 'success'>('idle')
    const categories = ['Tutti', 'Ecosistema', 'Vendite & AI', 'Marketing', 'Finanza']

    useEffect(() => {
        const cookiesAccepted = localStorage.getItem('integra_cookies_accepted')
        if (!cookiesAccepted) setTimeout(() => setShowCookieBanner(true), 1500)
    }, [])

    const acceptCookies = () => {
        localStorage.setItem('integra_cookies_accepted', 'true')
        setShowCookieBanner(false)
    }

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setContactFormStatus('sending')
        // Più avanti qui metteremo la chiamata VERA all'API Resend
        setTimeout(() => {
            setContactFormStatus('success')
            setTimeout(() => {
                setShowContactModal(false)
                setContactFormStatus('idle')
            }, 3000)
        }, 1500)
    }

    const filteredCourses = COURSES.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'Tutti' || course.category === activeCategory;
        return matchesSearch && matchesCategory;
    })

    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white pb-24 relative overflow-hidden text-slate-800">
            
            {/* EFFETTI LUCE GLOBALI (Light Theme) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.04] pointer-events-none -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0"></div>

            {/* NAVBAR */}
            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-2 text-sm font-bold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100">
                        <ArrowLeft size={16}/> Torna a IntegraOS
                    </Link>
                    <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-6">
                        <img src="/logo-integraos.png" alt="IntegraOS" className="h-8 object-contain" onError={(e) => e.currentTarget.src='/logo-integra.png'} />
                        <div className="text-xl font-light text-[#00665E] tracking-tight ml-1">
                            Academy
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setShowContactModal(true)} className="text-sm font-bold text-slate-500 hover:text-[#00665E] transition flex items-center gap-2">
                        <MessageSquare size={16}/> Consulenza
                    </button>
                    <Link href="/formazione/login" className="bg-[#00665E] hover:bg-[#004d46] text-white text-sm font-black px-6 py-2.5 rounded-full transition shadow-md shadow-[#00665E]/20">
                        Area Aziende
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="max-w-7xl mx-auto px-6 mt-16 md:mt-24 relative z-10 text-center mb-16">
                <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full text-[#00665E] text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00665E] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00665E]"></span>
                    </span>
                    Oltre 5.000 Manager Formati
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
                    Domina il tuo Mercato.<br/>
                    <span className="text-[#00665E]">Guidato dall'AI.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
                    Corsi intensivi e operativi. Impara a sfruttare al 100% l'ecosistema IntegraOS per automatizzare e scalare il tuo business.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({behavior: 'smooth'})} className="bg-[#00665E] hover:bg-[#004d46] text-white px-8 py-4 rounded-full font-black text-lg transition shadow-xl shadow-[#00665E]/20 hover:-translate-y-1 w-full sm:w-auto">
                        Esplora i Corsi
                    </button>
                    {/* BOTTONE TRAILER CHE APRE IL MODALE */}
                    <button onClick={() => setShowTrailer(true)} className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition flex items-center justify-center gap-2 group w-full sm:w-auto shadow-sm">
                        <Play fill="currentColor" size={18} className="text-[#00665E] group-hover:scale-110 transition"/> Guarda Trailer
                    </button>
                </div>
            </div>

            {/* SEZIONE FILTRI E CATALOGO */}
            <div id="catalogo" className="max-w-7xl mx-auto px-6 relative z-10 bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-xl">
                
                {/* SEARCH BAR */}
                <div className="max-w-2xl mx-auto relative group mb-10 -mt-16">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-[#00665E] transition" size={24}/>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Cerca un corso, un argomento o competenza..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 text-slate-900 rounded-full py-5 pl-16 pr-6 outline-none focus:border-[#00665E] focus:ring-4 focus:ring-[#00665E]/10 transition shadow-lg text-lg font-bold placeholder:font-medium placeholder:text-slate-400"
                    />
                </div>

                {/* CATEGORIE */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-12">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                                activeCategory === cat 
                                ? 'bg-[#00665E] text-white shadow-md' 
                                : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* GRIGLIA CORSI */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                        <div 
                            key={course.id} 
                            onClick={() => setSelectedCourse(course)}
                            className="group flex flex-col h-full bg-white border border-slate-200 rounded-3xl p-8 transition-all duration-300 hover:border-[#00665E]/30 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden cursor-pointer"
                        >
                            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-${course.color}-100 rounded-full blur-3xl group-hover:bg-${course.color}-200 transition duration-500 pointer-events-none`}></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-${course.color}-50 text-${course.color}-700 border-${course.color}-200 shadow-sm`}>
                                    {course.category}
                                </span>
                                <div className="flex items-center gap-1 text-amber-500 text-sm font-black bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                    <Star size={14} fill="currentColor"/> {course.rating}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#00665E] transition relative z-10 leading-tight">{course.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 relative z-10 font-medium">
                                {course.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold"><Clock size={16} className={`text-${course.color}-600`}/> {course.duration}</div>
                                <div className="flex items-center gap-2 text-slate-700 text-xs font-bold"><BookOpen size={16} className={`text-${course.color}-600`}/> {course.lessons} Lez.</div>
                            </div>

                            <div className="pt-2 flex items-center justify-between mt-auto relative z-10">
                                <span className="text-3xl font-black text-slate-900">€{course.price}</span>
                                <div className={`flex items-center justify-center px-6 py-3 rounded-xl bg-${course.color}-600 text-white font-bold text-sm shadow-md group-hover:bg-${course.color}-700 transition`}>
                                    Vedi Dettagli
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                            <BrainCircuit size={48} className="mx-auto text-slate-300 mb-4"/>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Nessun corso trovato</h3>
                            <p className="text-slate-500 font-medium">Prova a cercare termini diversi o esplora altre categorie.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALE DETTAGLIO CORSO CON VIDEO REALE --- */}
            {selectedCourse && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95 duration-300">
                        
                        {/* Botton Chiudi */}
                        <button onClick={() => setSelectedCourse(null)} className="absolute top-6 right-6 z-50 bg-white/80 backdrop-blur-md text-slate-500 border border-slate-200 p-2 rounded-full hover:text-slate-900 hover:bg-slate-100 transition shadow-sm">
                            <X size={20}/>
                        </button>

                        <div className="flex flex-col lg:flex-row h-full">
                            {/* Colonna Sinistra: Video e Info */}
                            <div className="w-full lg:w-3/5 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 relative">
                                <span className={`inline-block mb-4 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg border bg-${selectedCourse.color}-50 text-${selectedCourse.color}-700 border-${selectedCourse.color}-200`}>
                                    {selectedCourse.category}
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">{selectedCourse.title}</h2>
                                
                                {/* VERO PLAYER VIDEO HTML5 (Autoplay & Controls) */}
                                <div className="w-full aspect-video bg-black rounded-2xl border border-slate-200 relative overflow-hidden mb-8 shadow-xl">
                                    <video 
                                        src={selectedCourse.videoUrl} 
                                        controls 
                                        autoPlay 
                                        className="w-full h-full object-cover"
                                        controlsList="nodownload"
                                    >
                                        Il tuo browser non supporta la riproduzione video.
                                    </video>
                                </div>

                                <h4 className="text-xl font-black text-slate-900 mb-3">Cosa imparerai</h4>
                                <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base mb-8">
                                    {selectedCourse.longDescription}
                                </p>
                            </div>

                            {/* Colonna Destra: Checkout e Features */}
                            <div className="w-full lg:w-2/5 p-8 lg:p-10 bg-slate-50 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-200">
                                        <div className="text-slate-500 font-black uppercase tracking-widest text-xs">Prezzo Unico</div>
                                        <div className="text-4xl font-black text-[#00665E]">€{selectedCourse.price}</div>
                                    </div>

                                    <h4 className="text-slate-900 font-black mb-6">Il corso include:</h4>
                                    <div className="space-y-4 mb-10">
                                        {selectedCourse.features.map((feat: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                                                <CheckCircle size={18} className={`text-${selectedCourse.color}-600 shrink-0 mt-0.5`}/>
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BOTTONE CHE PORTA ALLA REGISTRAZIONE STUDENTE */}
                                <Link 
                                    href={`/formazione/login?buy=${selectedCourse.id}`} 
                                    className={`w-full bg-${selectedCourse.color}-600 hover:bg-${selectedCourse.color}-700 text-white text-center font-black py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:-translate-y-1`}
                                >
                                    Iscriviti e Accedi <ArrowRight size={20}/>
                                </Link>
                                <p className="text-center text-xs font-bold text-slate-400 mt-4 flex items-center justify-center gap-1">
                                    <Shield size={12}/> Pagamento sicuro Stripe / PayPal.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALE TRAILER GENERALE (Video Funzionante) --- */}
            {showTrailer && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[150] flex flex-col items-center justify-center p-4">
                    <button onClick={() => setShowTrailer(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-white p-3 rounded-full transition z-50 shadow-md">
                        <X size={24}/>
                    </button>
                    
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl border-4 border-white shadow-2xl relative overflow-hidden">
                        {/* VERO PLAYER VIDEO PER IL TRAILER */}
                        <video 
                            src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
                            controls 
                            autoPlay 
                            className="w-full h-full object-cover"
                        >
                            Il tuo browser non supporta la riproduzione video.
                        </video>
                    </div>
                    <p className="text-white font-bold tracking-widest uppercase mt-6 drop-shadow-md">Trailer Ufficiale IntegraOS Academy</p>
                </div>
            )}

            {/* --- MODALE CONTATTI --- */}
            {showContactModal && (
               <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                   <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 overflow-hidden">
                       <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
                           <div className="absolute -right-4 -top-4 text-[#00665E]/10"><MessageSquare size={100}/></div>
                           <div className="relative z-10">
                               <h3 className="font-black text-slate-900 text-xl">Parla con un Tutor</h3>
                               <p className="text-sm text-slate-500 mt-1 font-medium">Siamo qui per guidarti verso il corso perfetto.</p>
                           </div>
                           <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-700 relative z-10 bg-white border border-slate-200 p-2 rounded-full shadow-sm"><X size={20}/></button>
                       </div>
                       <div className="p-8">
                           {contactFormStatus === 'success' ? (
                               <div className="text-center py-8">
                                   <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={40}/></div>
                                   <h4 className="text-2xl font-black text-slate-900 mb-2">Richiesta Inviata!</h4>
                                   <p className="text-slate-500 font-medium">Un nostro tutor ti contatterà via email.</p>
                               </div>
                           ) : (
                               <form onSubmit={handleContactSubmit} className="space-y-5">
                                   <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-[#00665E] font-bold transition" placeholder="Nome Azienda o Referente" />
                                   <input required type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-[#00665E] font-bold transition" placeholder="Email Lavorativa" />
                                   <textarea required rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 outline-none focus:border-[#00665E] font-medium transition resize-none" placeholder="Di cosa hai bisogno?"></textarea>
                                   <button disabled={contactFormStatus === 'sending'} type="submit" className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition disabled:opacity-50 shadow-lg shadow-[#00665E]/20">
                                       Invia Richiesta
                                   </button>
                               </form>
                           )}
                       </div>
                   </div>
               </div>
            )}

            {/* --- COOKIE BANNER --- */}
            {showCookieBanner && (
                <div className="fixed bottom-0 left-0 w-full z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-24">
                    <div className="max-w-5xl mx-auto bg-white border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                        <div className="flex items-start gap-4">
                            <div className="bg-slate-50 border border-slate-100 text-[#00665E] p-3 rounded-2xl shrink-0"><Cookie size={24}/></div>
                            <div>
                                <h4 className="text-slate-900 font-black text-lg mb-1">Privacy & Cookie</h4>
                                <p className="text-sm text-slate-500 font-medium">Utilizziamo cookie per il funzionamento della piattaforma. Leggi la Policy.</p>
                            </div>
                        </div>
                        <button onClick={acceptCookies} className="bg-[#00665E] hover:bg-[#004d46] text-white px-8 py-3.5 rounded-xl font-black transition w-full md:w-auto shadow-md">
                            Accetta Tutti
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}