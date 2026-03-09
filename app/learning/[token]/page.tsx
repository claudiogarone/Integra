'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Play, CheckCircle, FileText, Download, Award, Clock, ArrowRight, Monitor, StickyNote, Palette, Lock, Printer, Building } from 'lucide-react'

export default function StudentPortal() {
  const params = useParams()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [liveEvent, setLiveEvent] = useState<any>(null) 
  const [agentName, setAgentName] = useState('')
  
  // Dati Azienda Admin
  const [companyProfile, setCompanyProfile] = useState<any>({ name: 'Academy', logo: '' })
  
  const [courseNotes, setCourseNotes] = useState('')
  const [whiteboardImg, setWhiteboardImg] = useState('') 

  const [activeView, setActiveView] = useState<'intro' | 'lesson' | 'quiz' | 'certificate' | 'live' | 'materials'>('intro')
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({})

  // Tracking del tempo in piattaforma (per l'analitica dell'admin)
  const [secondsSpent, setSecondsSpent] = useState(0)
  const secondsRef = useRef(0)

  const supabase = createClient()

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  // Timer: salva il tempo passato sulla piattaforma ogni 15 secondi (Silenzioso)
  useEffect(() => {
      if (!assignment || assignment.type === 'live') return;
      const interval = setInterval(() => {
          secondsRef.current += 1;
          setSecondsSpent(secondsRef.current);
          if (secondsRef.current % 15 === 0) {
              supabase.from('course_progress').update({ time_spent_seconds: secondsRef.current }).eq('id', assignment.id).then(); 
          }
      }, 1000);
      return () => clearInterval(interval);
  }, [assignment])

  const fetchData = async () => {
    // 1. Cerca se è un CORSO
    const { data: courseAssign } = await supabase.from('course_progress').select('*').eq('access_token', token).single()
    
    if (courseAssign) {
        setAssignment({ type: 'course', ...courseAssign })
        secondsRef.current = courseAssign.time_spent_seconds || 0
        setSecondsSpent(secondsRef.current)
        
        // Recupera Nome Agente
        const { data: agentData } = await supabase.from('team_members').select('name').eq('email', courseAssign.agent_email).single()
        setAgentName(agentData?.name || courseAssign.agent_email.split('@')[0])

        // Recupera Dati Corso Completi (Incluso il Quiz)
        const { data: courseData } = await supabase.from('courses').select('*, lessons(*), quizzes(*, quiz_questions(*))').eq('id', courseAssign.course_id).single()
        
        // Ordiniamo le lezioni per visualizzarle corrette
        if(courseData && courseData.lessons) {
            courseData.lessons.sort((a:any, b:any) => a.id - b.id);
        }
        setCourse(courseData)

        const { data: materialsData } = await supabase.from('course_materials').select('*').eq('course_id', courseAssign.course_id)
        if(materialsData) {
            const note = materialsData.find(m => m.type === 'shared_note')
            const board = materialsData.find(m => m.type === 'whiteboard')
            if(note) setCourseNotes(note.content)
            if(board) setWhiteboardImg(board.content)
        }

        // Recupera Logo e Nome dell'Azienda (L'Admin che ha creato il corso)
        if(courseData) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', courseData.user_id).single()
            if(profile) {
                setCompanyProfile({ name: profile.company_name || 'Academy', logo: profile.logo_url || profile.company_logo || '' })
            }
        }

        // Trova l'ultimo quiz creato (ignoriamo vecchie bozze)
        const latestQuiz = courseData?.quizzes?.length > 0 ? courseData.quizzes[courseData.quizzes.length - 1] : null;

        // Decide la vista iniziale in base al progresso
        if(courseAssign.progress >= 100 && (!latestQuiz || courseAssign.quiz_score >= latestQuiz.passing_score)) {
            setActiveView('certificate')
        } else {
            setActiveView('intro')
        }

    } else {
        // 2. Cerca se è una DIRETTA LIVE
        const { data: liveAssign } = await supabase.from('live_attendance').select('*').eq('access_token', token).single()
        
        if (liveAssign) {
            setAssignment({ type: 'live', ...liveAssign })
            const { data: agentData } = await supabase.from('team_members').select('name').eq('email', liveAssign.agent_email).single()
            setAgentName(agentData?.name || liveAssign.agent_email.split('@')[0])
            
            const { data: eventData } = await supabase.from('live_events').select('*').eq('id', liveAssign.live_event_id).single()
            setLiveEvent(eventData)

            const { data: materialsData } = await supabase.from('course_materials').select('*').eq('live_event_id', liveAssign.live_event_id)
            if(materialsData) {
                const note = materialsData.find(m => m.type === 'shared_note')
                const board = materialsData.find(m => m.type === 'whiteboard')
                if(note) setCourseNotes(note.content)
                if(board) setWhiteboardImg(board.content)
            }

            if(eventData) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', eventData.user_id).single()
                if(profile) {
                    setCompanyProfile({ name: profile.company_name || 'Academy', logo: profile.logo_url || profile.company_logo || '' })
                }
            }
            
            if (liveAssign.present) setActiveView('certificate')
            else setActiveView('live')
        }
    }
    setLoading(false)
  }

  // Estraiamo sempre l'ultimo quiz valido
  const currentQuiz = course?.quizzes?.length > 0 ? course.quizzes[course.quizzes.length - 1] : null;

  // --- LOGICA AVANZAMENTO PERCENTUALE VIDEO REALE ---
  const handleMarkLessonComplete = async () => {
      const totalLessons = course.lessons.length;
      // Calcola la nuova percentuale basata sulla lezione corrente
      const targetProgress = Math.round(((activeLessonIndex + 1) / totalLessons) * 100);
      
      // Aggiorniamo solo se il nuovo progresso è maggiore di quello salvato (per evitare che si abbassi se rivede un video)
      if (targetProgress > assignment.progress) {
          const { error } = await supabase.from('course_progress').update({ progress: targetProgress }).eq('id', assignment.id);
          if (!error) {
              setAssignment({ ...assignment, progress: targetProgress });
          }
      }

      // Passa alla lezione successiva o al quiz
      if (activeLessonIndex < totalLessons - 1) {
          setActiveLessonIndex(activeLessonIndex + 1);
      } else {
          if (currentQuiz) {
              setActiveView('quiz');
          } else {
              // Se non c'è quiz ed è l'ultima lezione, sblocca attestato
              if (targetProgress >= 100) setActiveView('certificate');
          }
      }
  }

  // --- LOGICA QUIZ INFALLIBILE ---
  const handleQuizSubmit = async () => {
      if(!currentQuiz || !currentQuiz.quiz_questions || currentQuiz.quiz_questions.length === 0) {
          return alert("Errore: Impossibile caricare le domande del test.");
      }

      let correctCount = 0;
      currentQuiz.quiz_questions.forEach((q:any, i:number) => {
          if(quizAnswers[i] === q.correct_option_index) correctCount++;
      });

      const score = Math.round((correctCount / currentQuiz.quiz_questions.length) * 100);

      // Aggiorna sempre il punteggio nel DB
      await supabase.from('course_progress').update({ quiz_score: score }).eq('id', assignment.id)
      setAssignment((prev: any) => ({...prev, quiz_score: score}))

      if(score >= currentQuiz.passing_score) {
          alert(`🎉 Complimenti! Hai superato il test con ${score}%. L'attestato è sbloccato.`);
          setActiveView('certificate');
      } else {
          alert(`⚠️ Test non superato. Punteggio: ${score}%. Minimo richiesto: ${currentQuiz.passing_score}%. Riprova.`);
      }
  }

  // --- LOGICA DIRETTA LIVE AUTOMATICA ---
  const handleJoinLive = async () => {
      // 1. Registra in automatico la presenza nel database Admin
      await supabase.from('live_attendance').update({ present: true, notes: 'Accesso tramite portale' }).eq('id', assignment.id);
      setAssignment((prev: any) => ({...prev, present: true}));
      
      // 2. Apre il link della diretta (Zoom/Meet) in una nuova scheda
      window.open(liveEvent.platform_link, '_blank');
      
      // 3. Sposta la vista sull'attestato
      alert("✅ Presenza registrata con successo! L'attestato sarà disponibile al termine della sessione.");
      setActiveView('certificate');
  }

  const getYoutubeEmbedUrl = (url: string) => {
      if(!url) return '';
      let videoId = '';
      if(url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      else if(url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  if (loading) return <div className="p-10 text-center text-[#00665E] animate-pulse font-bold mt-20">Accesso sicuro al portale formativo...</div>
  if (!course && !liveEvent) return <div className="p-10 text-center text-red-500 font-bold mt-20">Link non valido, scaduto o revocato dall'amministratore.</div>

  const target = course || liveEvent;
  
  // VERIFICA SBLOCCO ATTESTATO
  const isCertUnlocked = assignment?.type === 'live' 
      ? assignment.present 
      : (assignment.progress >= 100 && (!currentQuiz || assignment.quiz_score >= currentQuiz.passing_score));

  // Modello di attestato di default nel caso l'admin non ne abbia salvato uno
  const defaultTemplate = {
      title: 'Attestato di Partecipazione',
      signer: `Direzione ${companyProfile.name}`,
      logo_show: true
  };
  
  const certificateTemplate = target?.certificate_template || defaultTemplate;

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* ========================================================= */}
      {/* SIDEBAR NAVIGAZIONE STUDENTE */}
      {/* ========================================================= */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm shrink-0 print:hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
              {companyProfile.logo ? (
                  <img src={companyProfile.logo} alt="Logo" className="h-12 mb-4 object-contain" crossOrigin="anonymous" />
              ) : (
                  <div className="h-12 w-12 bg-[#00665E] text-white font-black rounded-xl mb-4 flex items-center justify-center text-xl shadow-md uppercase">{companyProfile.name.substring(0,2)}</div>
              )}
              <h2 className="font-black text-gray-900 text-lg leading-tight">{target.title}</h2>
              {course && (
                  <div className="mt-4 w-full">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-widest">
                          <span>Progresso Video</span>
                          <span className="text-[#00665E]">{assignment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#00665E] h-full transition-all duration-500" style={{width: `${assignment.progress}%`}}></div>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {course && (
                  <>
                      <button onClick={() => setActiveView('intro')} className={`w-full text-left p-3 rounded-xl text-sm font-bold transition ${activeView === 'intro' ? 'bg-[#00665E]/10 text-[#00665E]' : 'text-gray-600 hover:bg-gray-50'}`}>🏠 Introduzione</button>
                      <button onClick={() => setActiveView('materials')} className={`w-full text-left p-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeView === 'materials' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><FileText size={16}/> Materiali & Lavagna</button>
                      
                      <div className="pt-4 pb-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Moduli Video</p></div>
                      {course.lessons?.map((lesson:any, idx:number) => {
                          const lessonThreshold = Math.round(((idx + 1) / course.lessons.length) * 100);
                          const isCompleted = assignment.progress >= lessonThreshold;
                          
                          return (
                              <button key={lesson.id} onClick={() => { setActiveView('lesson'); setActiveLessonIndex(idx); }} className={`w-full text-left p-3 rounded-xl text-sm flex items-center gap-3 transition ${activeView === 'lesson' && activeLessonIndex === idx ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-700 bg-white border border-gray-100 hover:border-[#00665E]'}`}>
                                  {isCompleted ? <CheckCircle size={16} className="text-emerald-500 shrink-0"/> : <Play size={14} className={activeView === 'lesson' && activeLessonIndex === idx ? 'text-white shrink-0' : 'text-[#00665E] shrink-0'}/>}
                                  <span className="truncate flex-1 font-medium">{idx+1}. {lesson.title}</span>
                              </button>
                          )
                      })}

                      {currentQuiz && (
                          <div className="mt-4">
                              <div className="pt-2 pb-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3">Valutazione</p></div>
                              <button onClick={() => setActiveView('quiz')} className={`w-full text-left p-3 rounded-xl text-sm font-bold border-2 transition flex items-center justify-between ${activeView === 'quiz' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-white border-orange-100 text-orange-600 hover:bg-orange-50'}`}>
                                  <span className="flex items-center gap-2"><CheckCircle size={16}/> Test Finale</span>
                                  {assignment.quiz_score !== null && <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded">{assignment.quiz_score}%</span>}
                              </button>
                          </div>
                      )}
                  </>
              )}
              {liveEvent && (
                  <>
                      <button onClick={() => setActiveView('live')} className={`w-full text-left p-3 rounded-xl text-sm font-bold transition ${activeView === 'live' ? 'bg-[#00665E]/10 text-[#00665E]' : 'text-gray-600 hover:bg-gray-50'}`}>📡 Aula Diretta Streaming</button>
                      <button onClick={() => setActiveView('materials')} className={`w-full text-left p-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${activeView === 'materials' ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}><FileText size={16}/> Materiali Condivisi</button>
                  </>
              )}

              <div className="pt-6">
                  {/* Il tasto per l'attestato c'è SEMPRE se sbloccato */}
                  <button onClick={() => setActiveView('certificate')} className={`w-full p-4 rounded-2xl text-sm font-bold border-2 transition flex flex-col items-center justify-center gap-2 text-center ${
                      activeView === 'certificate' ? 'bg-green-50 border-green-500 text-green-700 shadow-md' : 
                      isCertUnlocked ? 'bg-white border-green-200 text-green-600 hover:bg-green-50 hover:border-green-400' : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                      {isCertUnlocked ? <Award size={24} className="text-green-500"/> : <Lock size={24} className="text-gray-300"/>}
                      {isCertUnlocked ? 'Visualizza e Scarica Attestato' : 'Attestato Bloccato'}
                      {!isCertUnlocked && <span className="text-[9px] font-medium mt-1">Completa tutto per sbloccarlo</span>}
                  </button>
              </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-slate-900 text-xs text-center text-slate-400 flex flex-col items-center">
              <span>Accesso Autenticato</span>
              <b className="text-white text-sm mt-1">{agentName}</b>
          </div>
      </div>

      {/* ========================================================= */}
      {/* AREA PRINCIPALE CONTENUTI */}
      {/* ========================================================= */}
      <div className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="max-w-5xl mx-auto p-8 py-12 print:p-0 print:max-w-full">
              
              {/* VISTA: INTRODUZIONE CORSO */}
              {activeView === 'intro' && course && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="h-72 w-full bg-gray-200 rounded-3xl overflow-hidden mb-8 shadow-lg relative">
                          <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                              <h1 className="text-4xl font-black text-white leading-tight">{course.title}</h1>
                          </div>
                      </div>
                      
                      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                          <h3 className="font-black text-gray-900 text-xl mb-4">Informazioni sul modulo</h3>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                          
                          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Lezioni</p><p className="font-black text-lg text-[#00665E]">{course.lessons.length}</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Quiz Finale</p><p className="font-black text-lg text-orange-500">{currentQuiz ? 'Sì' : 'No'}</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Punteggio Min.</p><p className="font-black text-lg text-gray-800">{currentQuiz?.passing_score || 0}%</p></div>
                              <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Azienda Erogatrice</p><p className="font-black text-lg text-gray-800">{companyProfile.name}</p></div>
                          </div>
                      </div>
                      <button onClick={() => { setActiveView('lesson'); setActiveLessonIndex(0); }} className="mt-4 bg-[#00665E] text-white px-10 py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-[#004d46] transition flex items-center gap-3 hover:scale-105">Inizia la prima lezione <ArrowRight size={24}/></button>
                  </div>
              )}

              {/* VISTA: MATERIALI CONDIVISI */}
              {activeView === 'materials' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                      <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3"><FileText className="text-purple-600"/> Materiali di Supporto</h1>
                      
                      {target?.attachment_url && (
                          <div className="bg-blue-600 border border-blue-700 p-8 rounded-3xl flex items-center justify-between shadow-xl text-white">
                              <div><h3 className="font-black text-2xl">Dispensa Ufficiale</h3><p className="text-blue-200 mt-1 font-medium">Scarica le slide o il manuale in formato PDF per studiare offline.</p></div>
                              <a href={target.attachment_url} target="_blank" className="bg-white text-blue-700 px-8 py-4 rounded-xl font-black shadow-lg hover:bg-gray-50 flex items-center gap-2"><Download size={20}/> Download</a>
                          </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-3xl shadow-sm flex flex-col">
                              <h3 className="font-black text-xl text-yellow-900 mb-4 flex items-center gap-2"><StickyNote className="text-yellow-600"/> Appunti e Link Utili</h3>
                              {courseNotes ? <p className="text-yellow-900 whitespace-pre-wrap leading-relaxed bg-white p-6 rounded-2xl border border-yellow-100 shadow-inner flex-1 font-medium text-sm">{courseNotes}</p> : <div className="flex-1 flex items-center justify-center text-yellow-600/50 italic bg-white/50 rounded-2xl border border-dashed border-yellow-200">Nessuna nota condivisa dal docente.</div>}
                          </div>
                          <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-sm flex flex-col">
                              <h3 className="font-black text-xl text-purple-900 mb-4 flex items-center gap-2"><Palette className="text-purple-600"/> Lavagna Virtuale</h3>
                              {whiteboardImg ? <img src={whiteboardImg} alt="Lavagna" className="w-full rounded-2xl border border-gray-200 shadow-inner" /> : <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">Lavagna vuota</div>}
                          </div>
                      </div>
                  </div>
              )}

              {/* VISTA: DIRETTA LIVE */}
              {activeView === 'live' && liveEvent && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center min-h-[60vh]">
                      <div className="bg-red-50 border-4 border-red-100 p-12 rounded-[3rem] text-center mb-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 opacity-5"><Monitor size={250}/></div>
                          <Monitor size={64} className="text-red-500 mx-auto mb-6 relative z-10"/>
                          <h1 className="text-4xl font-black text-red-900 mb-4 leading-tight relative z-10">{liveEvent.title}</h1>
                          <div className="inline-flex bg-white px-6 py-2 rounded-full border border-red-200 text-red-700 font-bold text-lg relative z-10 shadow-sm mb-8">
                              <Clock className="mr-2" size={20}/> Inizio: {new Date(liveEvent.start_time).toLocaleString('it-IT', {day: '2-digit', month: 'long', hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <p className="text-red-800 font-medium mb-8 relative z-10">Cliccando sul pulsante accederai all'aula. <b>La tua presenza verrà registrata automaticamente a fini certificativi.</b></p>
                          
                          <button onClick={handleJoinLive} className="w-full bg-red-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:bg-red-700 transition hover:-translate-y-1 flex justify-center items-center gap-3 relative z-10">
                              <Play size={24}/> Accedi alla Diretta Ora
                          </button>
                      </div>
                  </div>
              )}

              {/* VISTA: LEZIONI VIDEO */}
              {activeView === 'lesson' && course?.lessons[activeLessonIndex] && (
                  <div className="animate-in fade-in slide-in-from-right">
                      <div className="flex justify-between items-end mb-6">
                          <div>
                              <p className="text-[#00665E] font-black uppercase tracking-widest text-xs mb-1">Modulo {activeLessonIndex + 1} di {course.lessons.length}</p>
                              <h1 className="text-3xl font-black text-gray-900">{course.lessons[activeLessonIndex].title}</h1>
                          </div>
                      </div>

                      <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-8 border-4 border-slate-800">
                          {course.lessons[activeLessonIndex].video_type === 'youtube' ? 
                              <iframe width="100%" height="100%" src={getYoutubeEmbedUrl(course.lessons[activeLessonIndex].video_url)} frameBorder="0" allowFullScreen></iframe> 
                              : 
                              <video src={course.lessons[activeLessonIndex].video_url} controls className="w-full h-full object-cover bg-black" controlsList="nodownload"></video>
                          }
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                          <p className="text-gray-500 text-sm font-medium">Assicurati di aver compreso gli argomenti trattati nel video prima di procedere.</p>
                          
                          <button onClick={handleMarkLessonComplete} className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-black shadow-lg hover:bg-emerald-600 transition hover:scale-105 flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center">
                              <CheckCircle size={20}/> Segna come Completato e Procedi
                          </button>
                      </div>
                  </div>
              )}

              {/* VISTA: QUIZ FINALE */}
              {activeView === 'quiz' && currentQuiz && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
                          <div className="text-center mb-12 border-b border-gray-100 pb-10">
                              <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Award size={40}/></div>
                              <h1 className="text-4xl font-black text-gray-900 mb-4">{currentQuiz.title}</h1>
                              <div className="inline-flex bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 font-medium text-gray-700 gap-2">
                                  Punteggio minimo richiesto: <b className="text-orange-600 text-lg">{currentQuiz.passing_score}%</b>
                              </div>
                          </div>
                          
                          <div className="space-y-8">
                              {(!currentQuiz.quiz_questions || currentQuiz.quiz_questions.length === 0) && (
                                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                      <p className="text-gray-500 font-medium">Il docente non ha inserito domande per questo test.</p>
                                  </div>
                              )}
                              
                              {currentQuiz.quiz_questions?.map((q:any, i:number) => (
                                  <div key={q.id} className="bg-gray-50 p-6 md:p-8 rounded-3xl border border-gray-200">
                                      <h3 className="font-bold text-xl text-gray-900 mb-6">{i+1}. {q.question_text}</h3>
                                      <div className="space-y-3">
                                          {q.options.map((opt:string, optIdx:number) => (
                                              <label key={optIdx} className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer border-2 transition ${quizAnswers[i] === optIdx ? 'border-orange-500 bg-orange-50 shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white hover:border-orange-200'}`}>
                                                  <input type="radio" name={`question_${i}`} className="w-6 h-6 accent-orange-500" checked={quizAnswers[i] === optIdx} onChange={() => setQuizAnswers({...quizAnswers, [i]: optIdx})} />
                                                  <span className="font-bold text-gray-800 text-lg">{opt}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                          
                          {currentQuiz.quiz_questions && currentQuiz.quiz_questions.length > 0 && (
                              <div className="mt-12 pt-8 text-center">
                                  <button onClick={handleQuizSubmit} className="bg-orange-500 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-[0_10px_30px_rgba(249,115,22,0.3)] hover:bg-orange-600 transition hover:-translate-y-1 w-full md:w-auto">
                                      Consegna il Test per la Valutazione
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* VISTA: ATTESTATO (PDF NATIVO) */}
              {activeView === 'certificate' && (
                  <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center pb-20 print:p-0">
                      
                      <div className="text-center mb-8 print:hidden">
                          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Award size={48}/></div>
                          <h1 className="text-4xl font-black text-green-700 mb-2">Traguardo Raggiunto!</h1>
                          <p className="text-gray-600 font-medium">Il tuo attestato ufficiale è stato emesso ed è registrato nei sistemi aziendali.</p>
                      </div>
                      
                      <button onClick={() => window.print()} className="print:hidden mb-10 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-black transition hover:scale-105 flex items-center gap-3">
                          <Printer size={24}/> Stampa / Salva in PDF
                      </button>

                      {/* IL FOGLIO A4 ORIZZONTALE (LANDSCAPE) */}
                      <div className="print-container bg-white border border-gray-200 shadow-2xl relative flex flex-col justify-center items-center print:border-none print:shadow-none" style={{ width: '297mm', minHeight: '210mm', padding: '15mm', boxSizing: 'border-box' }}>
                          <div className="border-8 border-double border-gray-300 w-full h-full p-16 text-center relative flex flex-col justify-center items-center">
                              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"><Award size={500}/></div>
                              
                              {certificateTemplate.logo_show && ( 
                                  companyProfile.logo ? 
                                  <img src={companyProfile.logo} alt="Logo Azienda" className="h-28 object-contain mb-10 mx-auto relative z-10" crossOrigin="anonymous" /> 
                                  : 
                                  <h2 className="text-4xl font-black text-gray-800 uppercase tracking-widest mb-10 relative z-10 flex items-center justify-center gap-3"><Building size={36}/> {companyProfile.name}</h2>
                              )}
                              
                              <h3 className="font-serif text-6xl font-black text-[#00665E] tracking-widest leading-tight uppercase mb-10 relative z-10">{certificateTemplate.title}</h3>
                              <p className="text-gray-600 italic text-2xl mb-6 relative z-10">Si certifica ufficialmente che</p>
                              <p className="font-bold text-5xl border-b-4 border-gray-300 pb-3 px-20 mb-10 text-gray-900 uppercase relative z-10">{agentName}</p>
                              <p className="text-gray-600 text-2xl mb-6 relative z-10">ha completato con profitto e superato la valutazione di:</p>
                              <p className="font-black text-gray-900 text-4xl uppercase mb-24 relative z-10">{target.title}</p>
                              
                              <div className="mt-auto w-96 mx-auto text-center relative z-10 flex justify-between items-end">
                                  <div className="text-left">
                                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Data Rilascio</p>
                                      <p className="font-black text-xl text-gray-800 border-t-2 border-gray-300 pt-2 w-32 text-center">{new Date().toLocaleDateString('it-IT')}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-cursive text-5xl text-gray-800 leading-none mb-4" style={{fontFamily: "'Brush Script MT', cursive, sans-serif"}}>{certificateTemplate.signer}</p>
                                      <div className="border-t-2 border-gray-500 w-full mb-2"></div>
                                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Firma Autorizzata</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* STILI PER STAMPA PDF PERFETTA */}
      <style dangerouslySetInnerHTML={{ __html: `
        .print-only { display: none; }
        @media print {
            @page { size: A4 landscape; margin: 0; }
            body * { visibility: hidden; }
            .print\\:hidden { display: none !important; }
            main, .flex-1, .h-screen { height: auto !important; overflow: visible !important; display: block !important; padding: 0 !important; background: white !important; }
            .print-container { 
                visibility: visible; 
                position: absolute; 
                left: 0; top: 0; 
                width: 297mm !important; 
                height: 210mm !important; 
                padding: 10mm !important;
                margin: 0 !important;
            }
            .print-container * { visibility: visible; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />
    </div>
  )
}