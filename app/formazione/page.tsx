'use client'

import { useState, useEffect } from 'react'
import { 
    Shield, Search, BookOpen, Clock, Star, ArrowRight, 
    BrainCircuit, MessageSquare, X, CheckCircle2, Play, Cookie,
    ArrowLeft, CheckCircle
} from 'lucide-react'

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
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
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
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' 
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
        videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' 
    }
]

export default function FormazioneCatalogPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('Tutti')
    const [showContactModal, setShowContactModal] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [contactFormStatus, setContactFormStatus] = useState<'idle' | 'sending' | 'success'>('idle')
    const categories = ['Tutti', 'Ecosistema', 'Vendite & AI', 'Marketing']

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setContactFormStatus('sending')
        setTimeout(() => {
            setContactFormStatus('success')
            setTimeout(() => { setShowContactModal(false); setContactFormStatus('idle') }, 3000)
        }, 1500)
    }

    const filteredCourses = COURSES.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'Tutti' || course.category === activeCategory;
        return matchesSearch && matchesCategory;
    })

    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white pb-24 relative overflow-hidden text-slate-800">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-[#00665E] rounded-full blur-[150px] opacity-[0.04] pointer-events-none -z-10"></div>

            <nav className="px-6 md:px-12 py-4 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-6">
                    <a href="/" className="text-slate-500 hover:text-slate-800 transition flex items-center gap-2 text-sm font-bold bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100">
                        <ArrowLeft size={16}/> Torna a IntegraOS
                    </a>
                    <div className="hidden md:flex items-center gap-2 border-l border-slate-200 pl-6">
                        <img src="/logo-integraos.png" alt="IntegraOS" className="h-8 object-contain" onError={(e) => e.currentTarget.src='/logo-integra.png'} />
                        <div className="text-xl font-light text-[#00665E] tracking-tight ml-1">Academy</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setShowContactModal(true)} className="text-sm font-bold text-slate-500 hover:text-[#00665E] transition flex items-center gap-2">
                        <MessageSquare size={16}/> Consulenza
                    </button>
                    {/* FIX ANTI-LOOP: Link Diretto senza Next.js cache */}
                    <a href="/formazione/login" className="bg-[#00665E] hover:bg-[#004d46] text-white text-sm font-black px-6 py-2.5 rounded-full transition shadow-md">
                        Area Studenti
                    </a>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 mt-16 md:mt-24 relative z-10 text-center mb-16">
                <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full text-[#00665E] text-xs font-black uppercase tracking-widest mb-8 shadow-sm">
                    Oltre 5.000 Manager Formati
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
                    Domina il tuo Mercato.<br/>
                    <span className="text-[#00665E]">Guidato dall'AI.</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
                    Corsi intensivi e operativi. Impara a sfruttare al 100% l'ecosistema IntegraOS.
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => document.getElementById('catalogo')?.scrollIntoView({behavior: 'smooth'})} className="bg-[#00665E] text-white px-8 py-4 rounded-full font-black text-lg shadow-xl hover:-translate-y-1 transition">
                        Esplora i Corsi
                    </button>
                </div>
            </div>

            <div id="catalogo" className="max-w-7xl mx-auto px-6 relative z-10 bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-12 shadow-xl">
                
                <div className="max-w-2xl mx-auto relative group mb-10 -mt-16">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                        <Search className="text-slate-400 group-focus-within:text-[#00665E] transition" size={24}/>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Cerca un corso..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 text-slate-900 rounded-full py-5 pl-16 pr-6 outline-none focus:border-[#00665E] transition shadow-lg text-lg font-bold"
                    />
                </div>

                <div className="flex flex-wrap gap-3 mb-12 justify-center">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-[#00665E] text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCourses.map((course) => (
                        <div key={course.id} onClick={() => setSelectedCourse(course)} className="group flex flex-col h-full bg-white border border-slate-200 rounded-3xl p-8 transition-all hover:border-[#00665E]/30 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-${course.color}-50 text-${course.color}-700 border-${course.color}-200`}>
                                    {course.category}
                                </span>
                                <div className="flex items-center gap-1 text-amber-500 text-sm font-black bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                    <Star size={14} fill="currentColor"/> {course.rating}
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#00665E] transition leading-tight">{course.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 font-medium">{course.description}</p>
                            <div className="pt-2 flex items-center justify-between mt-auto">
                                <span className="text-3xl font-black text-slate-900">€{course.price}</span>
                                <div className={`px-6 py-3 rounded-xl bg-${course.color}-600 text-white font-bold text-sm shadow-md`}>Vedi Dettagli</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedCourse && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl shadow-2xl relative overflow-hidden my-auto animate-in zoom-in-95">
                        <button onClick={() => setSelectedCourse(null)} className="absolute top-6 right-6 z-50 bg-white/80 backdrop-blur-md text-slate-500 border border-slate-200 p-2 rounded-full hover:text-slate-900 transition shadow-sm"><X size={20}/></button>

                        <div className="flex flex-col lg:flex-row h-full">
                            <div className="w-full lg:w-3/5 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 relative">
                                <span className={`inline-block mb-4 text-xs font-black uppercase px-3 py-1 rounded-lg border bg-${selectedCourse.color}-50 text-${selectedCourse.color}-700 border-${selectedCourse.color}-200`}>
                                    {selectedCourse.category}
                                </span>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">{selectedCourse.title}</h2>
                                <div className="w-full aspect-video bg-black rounded-2xl relative overflow-hidden mb-8 shadow-xl">
                                    <video src={selectedCourse.videoUrl} controls autoPlay className="w-full h-full object-cover" controlsList="nodownload"></video>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-3">Cosa imparerai</h4>
                                <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base mb-8">{selectedCourse.longDescription}</p>
                            </div>

                            <div className="w-full lg:w-2/5 p-8 lg:p-10 bg-slate-50 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-200">
                                        <div className="text-slate-500 font-black uppercase text-xs">Prezzo Unico</div>
                                        <div className="text-4xl font-black text-[#00665E]">€{selectedCourse.price}</div>
                                    </div>
                                    <h4 className="text-slate-900 font-black mb-6">Il corso include:</h4>
                                    <div className="space-y-4 mb-10">
                                        {selectedCourse.features.map((feat: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                                                <CheckCircle size={18} className={`text-${selectedCourse.color}-600 mt-0.5`}/>
                                                <span>{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* FIX ANTI-LOOP: Link HTML nativo per pulire la cache al click su ACQUISTA */}
                                <a href={`/formazione/login?buy=${selectedCourse.id}`} className={`w-full bg-${selectedCourse.color}-600 text-white text-center font-black py-4 rounded-xl shadow-lg hover:-translate-y-1 transition`}>
                                    Iscriviti e Accedi <ArrowRight size={20} className="inline"/>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}