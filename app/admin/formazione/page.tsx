'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
    BookOpen, Users, Settings, Plus, Edit, Trash2, 
    Search, CheckCircle2, X, PlayCircle, Loader2,
    Save, FileText, Shield, BarChart3, Download,
    MapPin, LifeBuoy, AlertCircle, TrendingUp, CheckCircle,
    Eye, UserMinus, Sparkles, Star, Globe, MessageSquare, BrainCircuit,
    Zap, LayoutTemplate, MoreVertical, UploadCloud, Send, LogOut,
    Box
} from 'lucide-react'

// --- DATI FINTI SOLO PER STUDENTI E TICKET (I Corsi ora sono veri!) ---
const INITIAL_ENROLLMENTS = [
    { id: '1', user: 'Mario Rossi', company: 'TechSolutions Srl', email: 'mario@tech.it', course: 'AI Sales Masterclass', payment: 'Pagato', progress: 100, quiz: 95, spent: 299, lastActive: 'Oggi', credits: 4500 },
    { id: '2', user: 'Laura Bianchi', company: 'Digital Agency', email: 'laura@digital.it', course: 'IntegraOS: Zero to Hero', payment: 'Pagato', progress: 45, quiz: 0, spent: 149, lastActive: 'Ieri', credits: 120 },
    { id: '3', user: 'Marco Verdi', company: 'Verdi Consulting', email: 'marco@verdi.com', course: 'AI Sales Masterclass', payment: 'In attesa', progress: 0, quiz: 0, spent: 0, lastActive: 'Mai', credits: 5000 },
    { id: '4', user: 'Giulia Neri', company: 'Neri & Co', email: 'giulia@neri.it', course: 'IntegraOS: Zero to Hero', payment: 'Pagato', progress: 80, quiz: 0, spent: 448, lastActive: '3 gg fa', credits: 2300 },
]

const INITIAL_TICKETS = [
    { id: '1', user: 'Laura Bianchi', subject: 'Problema visualizzazione video 3', status: 'Aperto', date: 'Oggi 10:30' },
    { id: '2', user: 'Mario Rossi', subject: 'Dove trovo la fattura?', status: 'Risolto', date: 'Ieri 15:00' }
]

export default function SuperAdminAcademyPage() {
    // ========================================================
    // STATI DEI DATI REALI DA SUPABASE
    // ========================================================
    const [courses, setCourses] = useState<any[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(true)

    // Stati Dati Finti (Per ora)
    const [enrollments, setEnrollments] = useState(INITIAL_ENROLLMENTS)
    const [tickets, setTickets] = useState(INITIAL_TICKETS)

    // Stati Navigazione e Filtri
    const [activeTab, setActiveTab] = useState<'overview' | 'corsi' | 'studenti' | 'ticket'>('overview')
    const [timeFilter, setTimeFilter] = useState('mese')
    const [kpiMultiplier, setKpiMultiplier] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    
    // Stati Modali
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
    const [isCreditModalOpen, setIsCreditModalOpen] = useState(false)
    const [studentDetailsModal, setStudentDetailsModal] = useState<any>(null)
    const [replyTicketModal, setReplyTicketModal] = useState<any>(null)
    
    // Stato Form per Creazione/Modifica Corso
    const [editingCourse, setEditingCourse] = useState({
        id: null as string | null,
        title: '', 
        price: '', 
        description: '',
        lessons: [{ id: Date.now(), title: 'Nuova Lezione 1', url: '' }]
    })

    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [creditAmount, setCreditAmount] = useState(1000)
    const [isSaving, setIsSaving] = useState(false)
    const [aiThinking, setAiThinking] = useState(false)
    const [campaignStatus, setCampaignStatus] = useState<'idle' | 'running' | 'success'>('idle')

    // ========================================================
    // HOOK: CARICA I CORSI ALL'AVVIO (SENZA CACHE)
    // ========================================================
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch('/api/courses', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    setCourses(data)
                }
            } catch (error) {
                console.error("Errore caricamento corsi:", error)
            } finally {
                setIsLoadingCourses(false)
            }
        }
        fetchCourses()
    }, [])

    // ========================================================
    // FUNZIONE SALVA CORSO (SU SUPABASE)
    // ========================================================
    const handleSaveCourse = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCourse)
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                let errMsg = errorData.error || "Errore API"
                if (errMsg.includes("schema cache")) {
                    errMsg = "ERRORE CACHE SUPABASE: Vai nel pannello Supabase -> Project Settings -> API -> e clicca 'Reload Schema Cache'. Poi riprova qui!"
                }
                throw new Error(errMsg)
            }

            const responseData = await res.json()
            
            if (editingCourse.id) {
                setCourses(courses.map(c => c.id === editingCourse.id ? responseData.course : c))
            } else {
                setCourses([responseData.course, ...courses])
            }
            
            alert("✅ Corso salvato permanentemente nel Database!")
            setIsCourseModalOpen(false)
            setEditingCourse({ id: null, title: '', price: '', description: '', lessons: [{ id: Date.now(), title: 'Nuova Lezione 1', url: '' }] })
            
        } catch (error: any) {
            console.error("Dettaglio Errore:", error)
            alert(`❌ Errore Backend: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    // ===============================================
    // FUNZIONE PER APRIRE MODALE IN MODIFICA
    // ===============================================
    const handleEditCourse = (course: any) => {
        const formattedLessons = course.academy_lessons && course.academy_lessons.length > 0 
            ? course.academy_lessons.sort((a:any, b:any) => a.lesson_order - b.lesson_order).map((l:any) => ({ id: l.id, title: l.title, url: l.video_url || '' }))
            : [{ id: Date.now(), title: 'Lezione 1', url: '' }];

        setEditingCourse({
            id: course.id,
            title: course.title,
            price: course.price.toString(),
            description: course.description || '',
            lessons: formattedLessons
        });
        setIsCourseModalOpen(true);
    }

    // ===============================================
    // FUNZIONE PER ELIMINARE UN CORSO
    // ===============================================
    const handleDeleteCourse = async (id: string) => {
        if (!confirm("⚠️ Sei sicuro di voler eliminare DEFINITIVAMENTE questo corso e i suoi video? L'azione è irreversibile.")) return;
        
        try {
            const res = await fetch(`/api/courses?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Errore eliminazione");
            
            setCourses(courses.filter(c => c.id !== id));
            
        } catch (error) {
            console.error(error);
            alert("Errore durante l'eliminazione.");
        }
    }

    // --- ALTRE FUNZIONI ---
    const exportToCSV = () => {
        const headers = ['Azienda/Studente,Email,Corso,Stato Pagamento,Progresso (%),Quiz,Crediti Residui\n'];
        const csvData = enrollments.map(e => 
            `"${e.user} - ${e.company}","${e.email}","${e.course}","${e.payment}","${e.progress}","${e.quiz}","${e.credits}"`
        ).join('\n');
        
        const blob = new Blob([headers + csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Report_Academy_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }

    const handleTimeFilter = (filter: string) => {
        setTimeFilter(filter)
        if(filter === 'oggi') setKpiMultiplier(0.1)
        if(filter === '7gg') setKpiMultiplier(0.3)
        if(filter === 'mese') setKpiMultiplier(1)
        if(filter === 'anno') setKpiMultiplier(12)
    }

    const filteredEnrollments = enrollments.filter(e => 
        e.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAddLesson = () => {
        setEditingCourse({...editingCourse, lessons: [...editingCourse.lessons, { id: Date.now(), title: `Nuova Lezione ${editingCourse.lessons.length + 1}`, url: '' }]})
    }
    const handleRemoveLesson = (id: number) => {
        setEditingCourse({...editingCourse, lessons: editingCourse.lessons.filter(l => l.id !== id)})
    }
    const handleLessonChange = (id: number, field: string, value: string) => {
        setEditingCourse({...editingCourse, lessons: editingCourse.lessons.map(l => l.id === id ? { ...l, [field]: value } : l)})
    }

    const handleResolveTicket = (id: string) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, status: 'Risolto' } : t))
    }
    const handleSendTicketReply = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setTimeout(() => {
            setTickets(tickets.map(t => t.id === replyTicketModal.id ? { ...t, status: 'In lavorazione' } : t))
            setIsSaving(false)
            setReplyTicketModal(null)
        }, 1000)
    }

    const handleOpenCreditModal = (student: any) => {
        setSelectedStudent(student)
        setCreditAmount(1000)
        setIsCreditModalOpen(true)
    }

    const handleSaveCredit = (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setTimeout(() => { 
            setEnrollments(enrollments.map(emp => emp.id === selectedStudent.id ? {...emp, credits: emp.credits + creditAmount} : emp))
            setIsSaving(false)
            setIsCreditModalOpen(false) 
        }, 1000)
    }

    const activateAICampaign = () => {
        setCampaignStatus('running')
        setTimeout(() => setCampaignStatus('success'), 2500)
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-gray-900 p-6 md:p-8 lg:p-12 text-gray-900">
            
            {/* --- HEADER ADMIN --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-8">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <img src="/logo-integraos.png" alt="IntegraOS Logo" className="h-[40px] md:h-[48px] object-contain drop-shadow-sm opacity-90" />
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academy Master</h1>
                    </div>
                    <p className="text-gray-500">Pannello Formatori <span className="font-bold text-[#00665E]">IntegraOS</span>: Monitoraggio finanziario e gestione studenti.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Link href="/admin/integraos" className="bg-emerald-600/10 border border-emerald-500/30 hover:bg-emerald-600 text-emerald-400 hover:text-gray-900 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2">
                        <Box size={18}/> Switch to IntegraOs
                    </Link>
                    
                    <button onClick={exportToCSV} className="bg-white border border-gray-200 hover:border-indigo-500 text-slate-300 hover:text-[#00665E] font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg">
                        <Download size={18}/> Esporta Excel
                    </button>
                    
                    <button onClick={() => { setEditingCourse({ id: null, title: '', price: '', description: '', lessons: [{ id: Date.now(), title: 'Nuova Lezione 1', url: '' }] }); setIsCourseModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2">
                        <Plus size={18}/> Nuovo Corso
                    </button>
                    
                    <Link href="/admin/login" className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-gray-900 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg">
                        <LogOut size={18}/> Lock Terminal
                    </Link>
                </div>
            </div>

            {/* --- MENU TABS --- */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'overview' ? 'border-indigo-500 text-[#00665E]' : 'border-transparent text-gray-400 hover:text-slate-300'}`}>
                    <BarChart3 size={18}/> Dashboard Analisi
                </button>
                <button onClick={() => setActiveTab('studenti')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'studenti' ? 'border-indigo-500 text-[#00665E]' : 'border-transparent text-gray-400 hover:text-slate-300'}`}>
                    <Users size={18}/> Iscritti & Pagamenti
                </button>
                <button onClick={() => setActiveTab('corsi')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'corsi' ? 'border-indigo-500 text-[#00665E]' : 'border-transparent text-gray-400 hover:text-slate-300'}`}>
                    <BookOpen size={18}/> Catalogo Corsi
                </button>
                <button onClick={() => setActiveTab('ticket')} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm whitespace-nowrap transition border-b-2 ${activeTab === 'ticket' ? 'border-indigo-500 text-[#00665E]' : 'border-transparent text-gray-400 hover:text-slate-300'}`}>
                    <LifeBuoy size={18}/> Assistenza Ticket 
                    {tickets.filter(t => t.status === 'Aperto').length > 0 && (
                        <span className="bg-rose-500 text-white px-1.5 rounded-full text-[10px] ml-1">
                            {tickets.filter(t => t.status === 'Aperto').length}
                        </span>
                    )}
                </button>
            </div>

            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW & ANALISI                                 */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in">
                    
                    {/* FILTRI TEMPORALI */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 w-fit">
                        {['oggi', '7gg', 'mese', 'anno'].map(f => (
                            <button 
                                key={f} 
                                onClick={() => handleTimeFilter(f)} 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${timeFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-slate-800'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm mb-4">
                                <Eye size={18} className="text-blue-500"/> Visite Vetrina
                            </div>
                            <div className="text-4xl font-black text-gray-900">
                                {Math.round(12450 * kpiMultiplier).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm mb-4">
                                <TrendingUp size={18} className="text-emerald-500"/> Fatturato Generato
                            </div>
                            <div className="text-4xl font-black text-gray-900">
                                €{Math.round(91035 * kpiMultiplier).toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm mb-4">
                                <UserMinus size={18} className="text-rose-500"/> Tasso Abbandono
                            </div>
                            <div className="text-4xl font-black text-gray-900">
                                14%
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
                            <div className="flex items-center gap-3 text-gray-500 font-bold text-sm mb-4">
                                <Star size={18} className="text-amber-400"/> Soddisfazione (CSAT)
                            </div>
                            <div className="text-4xl font-black text-gray-900">
                                4.8<span className="text-lg text-gray-400">/5</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white border border-gray-200 p-8 rounded-3xl flex flex-col">
                            <h3 className="text-gray-900 font-bold mb-8 flex items-center gap-2">
                                <BarChart3 className="text-[#00665E]"/> Andamento Iscrizioni & Entrate
                            </h3>
                            <div className="flex items-end justify-between gap-2 md:gap-4 h-64 mt-auto">
                                {[30, 45, 25, 60, 80, 50, 95].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                        <div className="w-full bg-slate-800/50 rounded-t-xl relative overflow-hidden" style={{height: `${h * (kpiMultiplier > 1 ? 1 : kpiMultiplier)}%`}}>
                                            <div className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl group-hover:opacity-80 transition-opacity h-full"></div>
                                        </div>
                                        <span className="text-xs text-gray-400 font-bold">Mese {i+1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* MOTORE AI ANTI-ABBANDONO */}
                        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-8 rounded-3xl flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(79,70,229,0.1)]">
                            <div className="absolute -right-10 -top-10 text-[#00665E]/10">
                                <BrainCircuit size={150}/>
                            </div>
                            <h3 className="text-gray-900 font-bold mb-2 flex items-center gap-2 relative z-10">
                                <Sparkles className="text-[#00665E]"/> AI Retention Manager
                            </h3>
                            <p className="text-xs text-indigo-200 mb-6 relative z-10">
                                L'AI monitora chi si blocca.
                            </p>

                            <div className="space-y-4 relative z-10 flex-1">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <p className="text-xs text-rose-400 font-bold mb-1">Problema Rilevato</p>
                                    <p className="text-sm text-slate-300">Il 14% degli iscritti abbandona al minuto 12:45 della Lezione 2.</p>
                                </div>
                                <div className="bg-indigo-600/20 p-4 rounded-xl border border-indigo-500/30">
                                    <p className="text-xs text-[#00665E] font-bold mb-1">Azione Consigliata</p>
                                    <p className="text-sm text-slate-300">Invia un Cheat-Sheet PDF semplificato agli utenti inattivi.</p>
                                </div>
                            </div>
                            
                            {campaignStatus === 'success' ? (
                                <div className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 relative z-10">
                                    <CheckCircle2 size={18}/> Campagna Inviata
                                </div>
                            ) : (
                                <button 
                                    onClick={activateAICampaign} 
                                    disabled={campaignStatus === 'running'} 
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl mt-4 transition relative z-10 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {campaignStatus === 'running' ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>} 
                                    Attiva Campagna
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* MAPPA RADAR */}
                        <div className="bg-white border border-gray-200 p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-8">
                            <div className="flex-1 z-10 relative">
                                <h3 className="text-gray-900 font-bold mb-2 flex items-center gap-2">
                                    <MapPin className="text-rose-500"/> Mappa Dislocazione
                                </h3>
                                <div className="space-y-5 mt-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-900 font-bold">Nord Italia</span>
                                            <span className="text-[#00665E] font-black">65%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                                            <div className="bg-indigo-500 h-full w-[65%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-900 font-bold">Centro Italia</span>
                                            <span className="text-emerald-400 font-black">20%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                                            <div className="bg-emerald-500 h-full w-[20%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-900 font-bold">Sud Italia</span>
                                            <span className="text-blue-400 font-black">10%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full">
                                            <div className="bg-blue-500 h-full w-[10%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 aspect-square bg-gray-50 rounded-2xl border border-gray-200 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                <div className="absolute w-[80%] h-[80%] rounded-full border border-indigo-500/20"></div>
                                <div className="absolute w-[50%] h-[50%] rounded-full border border-indigo-500/30"></div>
                                <div className="absolute top-[30%] left-[40%]"><span className="flex h-4 w-4 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,1)]"></span></span></div>
                                <div className="absolute top-[50%] left-[55%]"><span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span></div>
                            </div>
                        </div>

                        {/* TREND E RICERCHE B2B */}
                        <div className="bg-white border border-gray-200 p-8 rounded-3xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-gray-900 font-bold flex items-center gap-2">
                                        <Globe className="text-blue-500"/> Trend Ricerche B2B
                                    </h3>
                                </div>
                                <button onClick={() => {setAiThinking(true); setTimeout(()=>setAiThinking(false), 2000)}} className="p-2 bg-slate-800 text-gray-500 hover:text-[#00665E] rounded-lg">
                                    <Loader2 size={16} className={aiThinking ? "animate-spin text-[#00665E]" : ""}/>
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                    <span className="text-sm font-bold text-gray-900">1. "Automazione Fatture AI"</span>
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+340%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                    <span className="text-sm font-bold text-gray-900">2. "WhatsApp CRM"</span>
                                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+125%</span>
                                </div>
                            </div>
                            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-200 flex items-start gap-3">
                                <BrainCircuit size={24} className="text-[#00665E] shrink-0"/>
                                <p><strong>Consiglio AI:</strong> Crea un mini-corso gratuito sull'"Automazione Fatture" come Lead Magnet.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: STUDENTI E PAGAMENTI                               */}
            {/* ========================================================= */}
            {activeTab === 'studenti' && (
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
                    <div className="p-6 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Cerca studente o azienda..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="text-gray-500 text-xs uppercase tracking-widest font-bold border-b border-gray-200 bg-gray-50">
                                    <th className="p-6">Azienda / Studente</th>
                                    <th className="p-6">Corso & Progresso</th>
                                    <th className="p-6">Stato Pagamento</th>
                                    <th className="p-6">LTV & Attività</th>
                                    <th className="p-6">Crediti AI</th>
                                    <th className="p-6 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredEnrollments.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-800/20 transition group">
                                        <td className="p-6">
                                            <p className="font-bold text-gray-900 text-base">{emp.user}</p>
                                            <p className="text-xs text-gray-500 mt-1"><span className="text-[#00665E]">{emp.company}</span> • {emp.email}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-gray-900 font-bold mb-2">{emp.course}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-500 h-full" style={{width: `${emp.progress}%`}}></div>
                                                </div>
                                                <span className="text-xs text-gray-500 font-bold">{emp.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border inline-block ${emp.payment === 'Pagato' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                {emp.payment}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs text-gray-500 mb-1">Spesa Tot.: <strong className="text-gray-900">€{emp.spent}</strong></p>
                                            <p className="text-xs text-gray-500">Accesso: <strong className={emp.lastActive === 'Oggi' ? 'text-emerald-400' : 'text-slate-300'}>{emp.lastActive}</strong></p>
                                        </td>
                                        <td className="p-6">
                                            <div className={`flex items-center gap-1.5 font-black px-3 py-1.5 rounded-lg inline-flex ${emp.credits < 500 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-amber-400 border border-gray-200'}`}>
                                                {emp.credits} <Zap size={14}/>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button onClick={() => handleOpenCreditModal(emp)} className="bg-indigo-600/20 hover:bg-indigo-600 text-white border border-indigo-500/30 px-3 py-2 text-xs font-bold rounded-lg transition inline-flex items-center gap-1">
                                                <Zap size={14}/> Ricarica
                                            </button>
                                            <button onClick={() => setStudentDetailsModal(emp)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition inline-flex items-center gap-1">
                                                <MoreVertical size={14}/> Dettagli
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: GESTIONE CONTENUTI REALI (DATABASE SUPABASE)       */}
            {/* ========================================================= */}
            {activeTab === 'corsi' && (
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-widest font-bold">
                                <th className="p-6">Nome Corso</th>
                                <th className="p-6">Metriche</th>
                                <th className="p-6">Prezzo</th>
                                <th className="p-6">Stato</th>
                                <th className="p-6 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {isLoadingCourses ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">
                                        <Loader2 className="animate-spin mx-auto mb-4 text-[#00665E]" size={32}/>
                                        Recupero corsi dal Database...
                                    </td>
                                </tr>
                            ) : courses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 font-bold">
                                        Nessun corso presente nel database. Creane uno per iniziare!
                                    </td>
                                </tr>
                            ) : (
                                courses.map((course: any) => (
                                    <tr key={course.id} className="hover:bg-slate-800/20 transition">
                                        <td className="p-6 font-bold text-gray-900 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-indigo-500/10 text-[#00665E] rounded-xl flex items-center justify-center border border-indigo-500/20"><PlayCircle size={24}/></div>
                                            <div>
                                                {course.title}
                                                <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: {course.id.substring(0,8)}...</div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-slate-300 font-bold">{course.enrollments || 0} Iscritti</p>
                                        </td>
                                        <td className="p-6 font-black text-gray-900 text-lg">€{course.price}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${course.status === 'Pubblicato' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                {course.status || 'Bozza'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right space-x-2">
                                            <button 
                                                onClick={() => handleEditCourse(course)} 
                                                className="px-4 py-2.5 bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition border border-gray-200 hover:border-transparent"
                                            >
                                                Modifica
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCourse(course.id)} 
                                                className="px-4 py-2.5 bg-slate-800 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition border border-gray-200 hover:border-transparent"
                                            >
                                                Elimina
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: HELP DESK E TICKET                                 */}
            {/* ========================================================= */}
            {activeTab === 'ticket' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className={`bg-white border p-6 rounded-3xl transition ${ticket.status === 'Aperto' ? 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${ticket.status === 'Aperto' ? 'bg-rose-500/20 text-rose-400' : (ticket.status === 'Risolto' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-xs text-gray-400 font-bold">{ticket.date}</span>
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-gray-500 mb-6 flex items-center gap-2"><Users size={14}/> {ticket.user}</p>
                            
                            {ticket.status !== 'Risolto' && (
                                <div className="flex gap-2">
                                    <button onClick={() => setReplyTicketModal(ticket)} className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white transition flex items-center justify-center gap-1"><Send size={14}/> Rispondi</button>
                                    <button onClick={() => handleResolveTicket(ticket.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1"><CheckCircle2 size={14}/> Risolvi</button>
                                </div>
                            )}
                        </div>
                    ))}
                    {tickets.length === 0 && <p className="text-gray-400">Nessun ticket presente.</p>}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODALI (TUTTI INCLUSI E BEN FORMATTATI)                   */}
            {/* ========================================================= */}
            
            {/* MODALE: CREA / MODIFICA CORSO (CONNESSO A SUPABASE) */}
            {isCourseModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <Settings className="text-[#00665E]"/> {editingCourse.id ? 'Modifica Corso' : 'Configurazione Nuovo Corso'}
                            </h2>
                            <button onClick={() => setIsCourseModalOpen(false)} className="text-gray-500 hover:text-gray-900 p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <form id="courseForm" onSubmit={handleSaveCourse} className="space-y-8">
                                <div>
                                    <h3 className="text-gray-900 font-bold mb-4 border-b border-gray-200 pb-2">Informazioni Base</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Titolo del Corso</label>
                                            <input required type="text" value={editingCourse.title} onChange={e=>setEditingCourse({...editingCourse, title: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-indigo-500" placeholder="Es. Nuova Masterclass" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Prezzo (€)</label>
                                            <input required type="number" value={editingCourse.price} onChange={e=>setEditingCourse({...editingCourse, price: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-indigo-500" placeholder="199" />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Descrizione</label>
                                        <textarea required value={editingCourse.description} onChange={e=>setEditingCourse({...editingCourse, description: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-indigo-500" placeholder="Di cosa parla il corso?"></textarea>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                                        <h3 className="text-gray-900 font-bold">Curriculum Lezioni</h3>
                                        <button type="button" onClick={handleAddLesson} className="text-xs font-bold text-[#00665E] hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg"><Plus size={14}/> Aggiungi Lezione</button>
                                    </div>
                                    
                                    {editingCourse.lessons.map((lesson, index) => (
                                        <div key={lesson.id} className="bg-white border border-gray-200 p-4 rounded-xl mb-4 relative group">
                                            {editingCourse.lessons.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveLesson(lesson.id)} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500"><Trash2 size={16}/></button>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Titolo Lezione {index+1}</label>
                                                    <input type="text" value={lesson.title} onChange={e => handleLessonChange(lesson.id, 'title', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 mt-1" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase font-bold">Video (Link URL)</label>
                                                    <input type="url" placeholder="https://..." value={lesson.url} onChange={e => handleLessonChange(lesson.id, 'url', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm text-slate-300 outline-none focus:border-indigo-500 mt-1 font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-200 bg-white/50 flex justify-end gap-3">
                            <button onClick={() => setIsCourseModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 transition">Annulla</button>
                            <button form="courseForm" disabled={isSaving} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50">
                                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {editingCourse.id ? 'Aggiorna Corso' : 'Salva nel Database'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE: DETTAGLI STUDENTE */}
            {studentDetailsModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50">
                            <h2 className="text-xl font-black text-gray-900">Scheda Studente</h2>
                            <button onClick={() => setStudentDetailsModal(null)} className="text-gray-500 hover:text-gray-900"><X size={20}/></button>
                        </div>
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-black text-gray-900">
                                    {studentDetailsModal.user.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{studentDetailsModal.user}</h3>
                                    <p className="text-gray-500 text-sm">{studentDetailsModal.company} • {studentDetailsModal.email}</p>
                                </div>
                            </div>
                            <div className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Corso Iscritto</span><span className="font-bold text-gray-900">{studentDetailsModal.course}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Stato Pagamento</span><span className="font-bold text-emerald-400">{studentDetailsModal.payment}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Totale Speso (LTV)</span><span className="font-bold text-gray-900">€{studentDetailsModal.spent}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Ultimo Accesso</span><span className="font-bold text-gray-900">{studentDetailsModal.lastActive}</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                    <span className="text-gray-500">Punteggio Quiz</span><span className="font-bold text-gray-900">{studentDetailsModal.quiz}/100</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Crediti AI</span><span className="font-bold text-amber-400">{studentDetailsModal.credits} ⚡</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE: RISPONDI A TICKET */}
            {replyTicketModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Send size={20} className="text-[#00665E]"/> Rispondi al Cliente</h2>
                            <button onClick={() => setReplyTicketModal(null)} className="text-gray-500 hover:text-gray-900"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSendTicketReply} className="p-8">
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase font-bold">Oggetto Ticket</p>
                                <p className="text-gray-900 font-bold">{replyTicketModal.subject}</p>
                            </div>
                            <textarea required rows={5} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 outline-none focus:border-indigo-500 resize-none mb-6" placeholder="Scrivi la risposta che arriverà via email al cliente..."></textarea>
                            <button disabled={isSaving} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} Invia Risposta
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODALE RICARICA CREDITI AI */}
            {isCreditModalOpen && selectedStudent && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/50">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><Zap className="text-amber-400"/> Ricarica Crediti AI</h2>
                            <button onClick={() => setIsCreditModalOpen(false)} className="text-gray-500 hover:text-gray-900 p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-8">
                            <div className="mb-6 text-center">
                                <h3 className="text-lg font-bold text-gray-900">{selectedStudent.user}</h3>
                                <p className="text-sm text-gray-500">Credito attuale: <strong className="text-gray-900">{selectedStudent.credits} ⚡</strong></p>
                            </div>
                            <form onSubmit={handleSaveCredit} className="space-y-4">
                                <div className="flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => setCreditAmount(1000)} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${creditAmount === 1000 ? 'bg-indigo-600 border-indigo-500 text-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>+ 1000</button>
                                    <button type="button" onClick={() => setCreditAmount(5000)} className={`px-4 py-2 rounded-lg font-bold text-sm border transition ${creditAmount === 5000 ? 'bg-indigo-600 border-indigo-500 text-gray-900' : 'bg-white border-gray-200 text-gray-500'}`}>+ 5000</button>
                                </div>
                                <button disabled={isSaving} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-6 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Zap fill="currentColor" size={18}/>} Ricarica e Notifica
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}