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

// Dati Iniziali
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

    // LOGICA CHAT AI (Decurtazione Punti)
    const handleAIAction = (text: string, cost: number = 50) => {
        if (aiCredits < cost) {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Crediti insufficienti per questa operazione. Il tuo pacchetto formativo è esaurito.' }])
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
        <main className="min-h-screen bg-[#020817] font-sans selection:bg-indigo-500 selection:text-white flex flex-col h-screen overflow-hidden">
            
            {/* NAVBAR AULA */}
            <nav className="px-6 py-4 flex justify-between items-center border-b border-slate-800 bg-[#020817] shrink-0 z-50">
                <div className="flex items-center gap-4 w-full md:w-1/2">
                    <Link href="/formazione/dashboard" className="text-slate-400 hover:text-white bg-slate-900 p-2 rounded-full transition shrink-0">
                        <ArrowLeft size={20}/>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-white font-black text-lg leading-tight truncate">{courseData.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-bold mt-1 max-w-[200px]">
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{width: `${courseData.progress}%`}}></div>
                            </div>
                            <span className="shrink-0">{courseData.progress}%</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowQuizModal(true)} disabled={courseData.progress < 100} className={`hidden md:flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition ${courseData.progress === 100 ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                        <Award size={14}/> {courseData.progress === 100 ? 'Richiedi Attestato' : 'Completa il corso per l\'Attestato'}
                    </button>
                    <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-slate-400 font-bold">MS</div>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden relative">
                
                {/* COLONNA SINISTRA (75%) */}
                <div className="w-full lg:w-3/4 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    
                    <div className="w-full bg-black aspect-video relative shrink-0 border-b border-slate-800 group">
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
                            <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">
                                <CheckCircle2 size={14}/> Completata
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-6 md:p-10 bg-[#020817]">
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            {currentLesson.title}
                            {currentLesson.completed && <CheckCircle className="text-emerald-500" size={24}/>}
                        </h2>
                        
                        <div className="flex border-b border-slate-800 mb-8 overflow-x-auto custom-scrollbar">
                            <button onClick={() => setActiveTab('lezioni')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'lezioni' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Programma</button>
                            <button onClick={() => setActiveTab('materiale')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'materiale' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Materiale</button>
                            <button onClick={() => setActiveTab('quiz')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'quiz' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Quiz</button>
                            <button onClick={() => setActiveTab('tutor')} className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition ${activeTab === 'tutor' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Contatta Tutor</button>
                        </div>

                        {activeTab === 'lezioni' && (
                            <div className="space-y-6 max-w-3xl">
                                {courseData.modules.map((mod, i) => (
                                    <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                                        <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 font-bold text-white">
                                            {mod.title}
                                        </div>
                                        <div className="divide-y divide-slate-800/50">
                                            {mod.lessons.map(lesson => (
                                                <div 
                                                    key={lesson.id} 
                                                    onClick={() => setCurrentLesson(lesson)}
                                                    className={`px-6 py-4 flex items-center justify-between cursor-pointer transition ${currentLesson.id === lesson.id ? 'bg-indigo-500/10 border-l-4 border-indigo-500' : 'hover:bg-slate-800/30 border-l-4 border-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {lesson.completed ? <CheckCircle size={18} className="text-emerald-500"/> : <PlayCircle size={18} className="text-slate-500"/>}
                                                        <span className={`text-sm font-medium ${currentLesson.id === lesson.id ? 'text-indigo-400' : 'text-slate-300'}`}>{lesson.title}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-mono">{lesson.duration}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'materiale' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                                <div onClick={() => handleDownload('Slide')} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:border-indigo-500 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><FileText size={20}/></div>
                                        <div>
                                            <p className="text-white font-bold text-sm group-hover:text-indigo-400 transition">Slide Lezione</p>
                                            <p className="text-xs text-slate-500">PDF • 2.4 MB</p>
                                        </div>
                                    </div>
                                    {downloadingFile === 'Slide' ? <Loader2 size={18} className="text-indigo-500 animate-spin"/> : <Download size={18} className="text-slate-500 group-hover:text-indigo-400"/>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div className="max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-lg">
                                <Award size={48} className="mx-auto text-indigo-500 mb-4"/>
                                <h3 className="text-xl font-black text-white mb-2">Quiz di Fine Modulo</h3>
                                <p className="text-slate-400 text-sm mb-6">Rispondi alle domande per sbloccare l'attestato. Soglia superamento: 80%.</p>
                                <button onClick={() => setShowQuizModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3 rounded-full transition shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:-translate-y-1">
                                    Inizia il Quiz
                                </button>
                            </div>
                        )}

                        {activeTab === 'tutor' && (
                            <div className="max-w-2xl bg-slate-900 border border-slate-800 p-8 rounded-3xl">
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                                        <img src="https://i.pravatar.cc/150?img=11" alt="Tutor" className="w-full h-full rounded-full object-cover"/>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">Roberto - Senior Tutor</h3>
                                        <p className="text-slate-400 text-sm">Risponde mediamente in 2 ore.</p>
                                    </div>
                                </div>

                                {tutorEmailStatus === 'success' ? (
                                    <div className="text-center py-6">
                                        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4"/>
                                        <h4 className="text-white font-bold text-lg mb-2">Richiesta Inviata!</h4>
                                        <p className="text-slate-400 text-sm">Il tutor riceverà una notifica e ti risponderà alla tua email aziendale il prima possibile.</p>
                                        <button onClick={() => setTutorEmailStatus('idle')} className="mt-6 text-indigo-400 text-sm font-bold">Invia un altro messaggio</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendTutorEmail} className="space-y-4">
                                        <textarea required rows={4} className="w-full bg-[#020817] border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-indigo-500 resize-none" placeholder="Scrivi qui i tuoi dubbi su questa lezione o richiedi un appuntamento per una call..."></textarea>
                                        <button disabled={tutorEmailStatus === 'sending'} type="submit" className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-500 transition disabled:opacity-50">
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
                <div className="hidden lg:flex w-1/4 bg-slate-950 border-l border-slate-800 flex-col h-full relative z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                    
                    {/* Header Chat e Crediti */}
                    <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                        <Bot size={20} className="text-white"/>
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Tutor AI</h3>
                                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Sempre Attivo</p>
                                </div>
                            </div>
                            <div className="bg-[#020817] border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Crediti</div>
                                <div className={`text-sm font-black flex items-center gap-1 ${aiCredits > 100 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    {aiCredits} <Zap size={12}/>
                                </div>
                            </div>
                        </div>

                        {/* Bottoni Azioni Rapide AI (Costi in Punti) */}
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                            <button onClick={() => handleAIAction('Crea una Mappa Concettuale di questo modulo.', 200)} className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"><Network size={12}/> Mappa</button>
                            <button onClick={() => handleAIAction('Trascrivi esattamente tutto quello che dice il video.', 500)} className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"><FileText size={12}/> Transcript</button>
                            <button onClick={() => handleAIAction('Fammi un riassunto a punti.', 100)} className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"><LayoutTemplate size={12}/> Riassunto</button>
                            <button onClick={() => handleAIAction('Traduci in Inglese il testo.', 150)} className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition"><Languages size={12}/> Traduci</button>
                        </div>
                    </div>

                    {/* Area Messaggi */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-90 mix-blend-overlay">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' 
                                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Chat (Costo base in punti) */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        <form onSubmit={(e) => { e.preventDefault(); handleAIAction(chatInput, 50); }} className="relative">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Fai una domanda all'AI (50 ⚡)..." 
                                className="w-full bg-[#020817] border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white outline-none focus:border-indigo-500 transition"
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim() || isTyping || aiCredits <= 0}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-500 transition disabled:opacity-50"
                            >
                                <Send size={14}/>
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {/* MODALE QUIZ */}
            {showQuizModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-[#020817] border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="bg-indigo-600 p-6 text-white text-center">
                            <BrainCircuit size={48} className="mx-auto mb-2 opacity-80"/>
                            <h2 className="text-2xl font-black">Test di Fine Modulo</h2>
                            <p className="text-indigo-200 text-sm">Domanda 1 di 10</p>
                        </div>
                        <div className="p-8">
                            <h3 className="text-lg font-bold text-white mb-6">Qual è la funzione principale di un LLM nel contesto CRM?</h3>
                            <div className="space-y-3">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left px-6 py-4 rounded-xl text-slate-300 transition">A. Inviare email senza alcun testo</button>
                                <button className="w-full bg-slate-900 hover:bg-indigo-500/20 hover:border-indigo-500 border border-slate-700 text-left px-6 py-4 rounded-xl text-slate-300 transition">B. Comprendere il linguaggio naturale del cliente e categorizzare il lead</button>
                                <button className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left px-6 py-4 rounded-xl text-slate-300 transition">C. Calcolare automaticamente le tasse</button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <button onClick={() => setShowQuizModal(false)} className="text-slate-400 font-bold text-sm hover:text-white transition">Annulla ed Esci</button>
                            <button onClick={() => setShowQuizModal(false)} className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-indigo-500 transition">Prossima Domanda</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}