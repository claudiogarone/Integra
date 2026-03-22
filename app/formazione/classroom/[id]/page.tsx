'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
    ArrowLeft, PlayCircle, FileText, CheckCircle, 
    MessageSquare, Send, Bot, Calendar, Download, 
    Award, ChevronRight, Loader2, Sparkles, Zap, 
    BrainCircuit, Languages, LayoutTemplate, Network, CheckCircle2,
    Mail
} from 'lucide-react'

// Dati Iniziali (Mockati per struttura visiva)
const INITIAL_COURSE_DATA = {
    title: 'AI Sales Masterclass',
    description: 'Impara a delegare il 90% del follow-up clienti all\'AI.',
    progress: 0,
    modules: [
        {
            title: 'Modulo 1: Le Basi dell\'AI nel CRM',
            lessons: [
                { id: 1, title: 'Benvenuto e Mindset', duration: '00:05', completed: false, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
                { id: 2, title: 'Come ragiona un LLM', duration: '12:45', completed: false, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
            ]
        },
        {
            title: 'Modulo 2: Automazioni WhatsApp',
            lessons: [
                { id: 3, title: 'Collegare l\'API di Meta', duration: '18:20', completed: false, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
                { id: 4, title: 'Prompt per il recupero carrello', duration: '22:10', completed: false, videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
            ]
        }
    ]
}

export default function ClassroomPage() {
    const params = useParams()
    const router = useRouter()
    
    // Stati del Corso
    const [courseData, setCourseData] = useState(INITIAL_COURSE_DATA)
    const [activeTab, setActiveTab] = useState('lezioni')
    const [currentLesson, setCurrentLesson] = useState(courseData.modules[0].lessons[0])
    
    // Stati Modali e Download
    const [showQuizModal, setShowQuizModal] = useState(false)
    const [tutorEmailStatus, setTutorEmailStatus] = useState<'idle' | 'sending' | 'success'>('idle')
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null)
    
    // SISTEMA A CREDITI (5€ = 5000 Crediti)
    const [aiCredits, setAiCredits] = useState(5000) 
    const [chatInput, setChatInput] = useState('')
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Ciao! Sono il tuo Tutor AI. Hai a disposizione 5000 ⚡ Crediti per farmi analizzare le lezioni, generare mappe concettuali, riassunti o farti da assistente. Come posso aiutarti oggi?' }
    ])
    const [isTyping, setIsTyping] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Scroll chat automatico
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // LOGICA COMPLETAMENTO VIDEO
    const handleVideoEnd = () => {
        const updatedModules = courseData.modules.map(mod => ({
            ...mod,
            lessons: mod.lessons.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l)
        }))
        
        const totalLessons = updatedModules.reduce((acc, m) => acc + m.lessons.length, 0)
        const completedLessons = updatedModules.reduce((acc, m) => acc + m.lessons.filter(l => l.completed).length, 0)
        const newProgress = Math.round((completedLessons / totalLessons) * 100)

        setCourseData({ ...courseData, modules: updatedModules, progress: newProgress })
        setCurrentLesson(prev => ({ ...prev, completed: true }))
    }

    // LOGICA DOWNLOAD
    const handleDownload = (fileName: string) => {
        setDownloadingFile(fileName)
        setTimeout(() => setDownloadingFile(null), 1500)
    }

    // LOGICA EMAIL TUTOR
    const handleSendTutorEmail = (e: React.FormEvent) => {
        e.preventDefault()
        setTutorEmailStatus('sending')
        setTimeout(() => setTutorEmailStatus('success'), 2000)
    }

    // LOGICA CHAT AI
    const handleAIAction = (text: string, cost: number = 50) => {
        if (aiCredits < cost) {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Crediti insufficienti per questa operazione. Ricarica il tuo conto.' }])
            return
        }

        setAiCredits(prev => prev - cost)
        setMessages(prev => [...prev, { role: 'user', text }])
        setChatInput('')
        setIsTyping(true)

        setTimeout(() => {
            setIsTyping(false)
            setMessages(prev => [...prev, { role: 'ai', text: `Ecco il risultato richiesto.\n\n[Generazione completata. Costo: ${cost} ⚡]` }])
        }, 2000)
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white flex flex-col h-screen overflow-hidden text-slate-800">
            
            {/* NAVBAR AULA LIGHT */}
            <nav className="px-6 py-4 flex justify-between items-center border-b border-slate-200 bg-white shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-1/2">
                    <Link href="/formazione/dashboard" className="text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-full transition shrink-0 hover:bg-slate-100">
                        <ArrowLeft size={20}/>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-slate-900 font-black text-lg leading-tight truncate">{courseData.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1 max-w-[200px]">
                            <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                                <div className="bg-[#00665E] h-full rounded-full transition-all duration-700" style={{width: `${courseData.progress}%`}}></div>
                            </div>
                            <span className="shrink-0 text-[#00665E]">{courseData.progress}%</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowQuizModal(true)} disabled={courseData.progress < 100} className={`hidden md:flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full transition shadow-sm ${courseData.progress === 100 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        <Award size={14}/> {courseData.progress === 100 ? 'Richiedi Attestato' : 'Completa il corso per l\'Attestato'}
                    </button>
                    <div className="w-10 h-10 bg-[#00665E]/10 rounded-full border border-[#00665E]/20 flex items-center justify-center text-[#00665E] font-black shadow-sm">MS</div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden relative">
                
                {/* COLONNA SINISTRA (75%) */}
                <div className="w-full lg:w-3/4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    
                    <div className="w-full bg-slate-900 aspect-video relative shrink-0 border-b border-slate-200 group flex items-center justify-center">
                        <video 
                            key={currentLesson.videoUrl} 
                            src={currentLesson.videoUrl} 
                            controls 
                            autoPlay 
                            onEnded={handleVideoEnd}
                            className="w-full h-full object-contain"
                            controlsList="nodownload"
                        >
                            Browser non supportato.
                        </video>
                        {currentLesson.completed && (
                            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">
                                <CheckCircle2 size={14}/> Completata
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-6 md:p-10 bg-[#F8FAFC]">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            {currentLesson.title}
                            {currentLesson.completed && <CheckCircle className="text-emerald-500" size={24}/>}
                        </h2>
                        
                        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar">
                            <button onClick={() => setActiveTab('lezioni')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'lezioni' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Programma</button>
                            <button onClick={() => setActiveTab('materiale')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'materiale' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Materiale</button>
                            <button onClick={() => setActiveTab('quiz')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'quiz' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Quiz</button>
                            <button onClick={() => setActiveTab('tutor')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'tutor' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Contatta Tutor</button>
                        </div>

                        {activeTab === 'lezioni' && (
                            <div className="space-y-6 max-w-3xl">
                                {courseData.modules.map((mod, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 font-black text-slate-800">
                                            {mod.title}
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {mod.lessons.map(lesson => (
                                                <div 
                                                    key={lesson.id} 
                                                    onClick={() => setCurrentLesson(lesson)}
                                                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition ${currentLesson.id === lesson.id ? 'bg-[#00665E]/5 border-l-4 border-[#00665E]' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {lesson.completed ? <CheckCircle size={18} className="text-emerald-500"/> : <PlayCircle size={18} className="text-slate-400"/>}
                                                        <span className={`text-sm font-bold ${currentLesson.id === lesson.id ? 'text-[#00665E]' : 'text-slate-700'}`}>{lesson.title}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-mono font-medium">{lesson.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'materiale' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                                <div onClick={() => handleDownload('Slide')} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-[#00665E] transition shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg"><FileText size={20}/></div>
                                        <div>
                                            <p className="text-slate-900 font-black text-sm group-hover:text-[#00665E] transition">Slide Lezione</p>
                                            <p className="text-xs text-slate-500 font-medium">PDF • 2.4 MB</p>
                                        </div>
                                    </div>
                                    {downloadingFile === 'Slide' ? <Loader2 size={18} className="text-[#00665E] animate-spin"/> : <Download size={18} className="text-slate-400 group-hover:text-[#00665E]"/>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div className="max-w-2xl bg-white border border-slate-200 p-10 rounded-3xl text-center shadow-md">
                                <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                                    <Award size={48}/>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Quiz di Fine Modulo</h3>
                                <p className="text-slate-500 text-sm mb-8 font-medium">Rispondi alle domande per verificare le tue competenze e sbloccare l'attestato ufficiale.</p>
                                <button onClick={() => setShowQuizModal(true)} className="bg-[#00665E] hover:bg-[#004d46] text-white font-black px-10 py-4 rounded-xl transition shadow-[0_10px_20px_rgba(0,102,94,0.2)] hover:-translate-y-1">
                                    Inizia il Quiz
                                </button>
                            </div>
                        )}

                        {activeTab === 'tutor' && (
                            <div className="max-w-2xl bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 shadow-inner">
                                        <img src="https://i.pravatar.cc/150?img=11" alt="Tutor" className="w-full h-full rounded-full object-cover"/>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Roberto - Senior Tutor</h3>
                                        <p className="text-slate-500 text-sm font-medium">Risponde mediamente in 2 ore lavorative.</p>
                                    </div>
                                </div>

                                {tutorEmailStatus === 'success' ? (
                                    <div className="text-center py-6 animate-in zoom-in">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner"><CheckCircle2 size={40}/></div>
                                        <h4 className="text-slate-900 font-black text-xl mb-2">Richiesta Inviata!</h4>
                                        <p className="text-slate-500 text-sm font-medium">Il tutor riceverà una notifica e ti risponderà alla tua email aziendale il prima possibile.</p>
                                        <button onClick={() => setTutorEmailStatus('idle')} className="mt-8 text-[#00665E] text-sm font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">Scrivi un altro messaggio</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendTutorEmail} className="space-y-4">
                                        <textarea required rows={4} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl p-4 outline-none focus:border-[#00665E] focus:bg-white transition resize-none shadow-inner" placeholder="Scrivi qui i tuoi dubbi su questa lezione o richiedi un appuntamento..."></textarea>
                                        <button disabled={tutorEmailStatus === 'sending'} type="submit" className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#004d46] transition disabled:opacity-50 shadow-lg shadow-[#00665E]/20">
                                            {tutorEmailStatus === 'sending' ? <Loader2 size={18} className="animate-spin"/> : <Mail size={18}/>}
                                            Invia Email al Tutor
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLONNA DESTRA: TUTOR AI CHAT (25%) */}
                <div className="hidden lg:flex w-1/4 bg-white border-l border-slate-200 flex-col h-full relative z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
                    
                    {/* Header Chat e Crediti */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                        <Bot size={20} className="text-white"/>
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-black text-sm">Tutor AI</h3>
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Online</p>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-right shadow-sm">
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Crediti</div>
                                <div className={`text-sm font-black flex items-center gap-1 ${aiCredits > 100 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {aiCredits} <Zap size={12}/>
                                </div>
                            </div>
                        </div>

                        {/* Bottoni Azioni Rapide AI */}
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                            <button onClick={() => handleAIAction('Crea una Mappa Concettuale.', 200)} className="shrink-0 bg-white border border-slate-200 hover:border-[#00665E] hover:text-[#00665E] text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"><Network size={12}/> Mappa</button>
                            <button onClick={() => handleAIAction('Trascrivi il video.', 500)} className="shrink-0 bg-white border border-slate-200 hover:border-[#00665E] hover:text-[#00665E] text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"><FileText size={12}/> Transcript</button>
                            <button onClick={() => handleAIAction('Fammi un riassunto.', 100)} className="shrink-0 bg-white border border-slate-200 hover:border-[#00665E] hover:text-[#00665E] text-slate-600 text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm"><LayoutTemplate size={12}/> Riassunto</button>
                        </div>
                    </div>

                    {/* Area Messaggi */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border ${
                                    msg.role === 'user' 
                                    ? 'bg-[#00665E] text-white rounded-br-sm border-transparent' 
                                    : 'bg-white text-slate-700 rounded-bl-sm border-slate-200'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-bl-sm border border-slate-200 shadow-sm flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Chat */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <form onSubmit={(e) => { e.preventDefault(); handleAIAction(chatInput, 50); }} className="relative">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Fai una domanda all'AI (50 ⚡)..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-12 text-sm text-slate-900 font-bold outline-none focus:border-[#00665E] focus:bg-white transition shadow-inner"
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim() || isTyping || aiCredits <= 0}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#00665E] rounded-lg flex items-center justify-center text-white hover:bg-[#004d46] transition disabled:opacity-50 shadow-md"
                            >
                                <Send size={16}/>
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {/* MODALE QUIZ */}
            {showQuizModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative overflow-hidden">
                            <BrainCircuit size={120} className="absolute -right-4 -bottom-4 opacity-10"/>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
                                <Award size={32}/>
                            </div>
                            <h2 className="text-3xl font-black relative z-10">Test di Fine Modulo</h2>
                            <p className="text-blue-100 text-sm font-bold uppercase tracking-widest mt-2 relative z-10">Domanda 1 di 10</p>
                        </div>
                        <div className="p-10">
                            <h3 className="text-xl font-black text-slate-900 mb-8 leading-tight">Qual è la funzione principale di un LLM nel contesto CRM?</h3>
                            <div className="space-y-4">
                                <button className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left px-6 py-5 rounded-xl text-slate-700 font-bold transition shadow-sm">A. Inviare email senza alcun testo</button>
                                <button className="w-full bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-left px-6 py-5 rounded-xl text-slate-700 hover:text-indigo-900 font-bold transition shadow-sm">B. Comprendere il linguaggio naturale del cliente e categorizzare il lead</button>
                                <button className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-left px-6 py-5 rounded-xl text-slate-700 font-bold transition shadow-sm">C. Calcolare automaticamente le tasse</button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                            <button onClick={() => setShowQuizModal(false)} className="text-slate-500 font-bold text-sm hover:text-slate-800 transition px-4 py-2 rounded-lg hover:bg-slate-200">Annulla ed Esci</button>
                            <button onClick={() => setShowQuizModal(false)} className="bg-[#00665E] text-white font-black px-8 py-3.5 rounded-xl hover:bg-[#004d46] transition shadow-lg shadow-[#00665E]/20">Prossima Domanda</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}