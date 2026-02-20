'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { Play, CheckCircle, FileText, Download, Award, Clock, ArrowRight } from 'lucide-react'
import { toPng } from 'html-to-image'

export default function StudentPortal({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [agentName, setAgentName] = useState('')
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  const [activeView, setActiveView] = useState<'intro' | 'lesson' | 'quiz' | 'certificate'>('intro')
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  
  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: number}>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Tracking Tempo
  const [secondsSpent, setSecondsSpent] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const certificateRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
    // Timer di permanenza (si attiva ogni secondo)
    timerRef.current = setInterval(() => {
        setSecondsSpent(prev => prev + 1)
    }, 1000)

    return () => {
        if(timerRef.current) clearInterval(timerRef.current)
        saveProgress() // Salva quando chiude la pagina
    }
  }, [])

  // Salva i secondi nel DB ogni 30 secondi per sicurezza
  useEffect(() => {
      if(secondsSpent > 0 && secondsSpent % 30 === 0) { saveProgress() }
  }, [secondsSpent])

  const fetchData = async () => {
    // 1. Trova l'assegnazione tramite il Token
    const { data: assignData, error: assignError } = await supabase.from('course_progress').select('*').eq('access_token', params.token).single()
    if(assignError || !assignData) return setLoading(false)
    
    setAssignment(assignData)
    setSecondsSpent(assignData.time_spent_seconds || 0)

    // 2. Trova il nome dell'agente
    const { data: agentData } = await supabase.from('team_members').select('name').eq('email', assignData.agent_email).single()
    setAgentName(agentData?.name || assignData.agent_email.split('@')[0])

    // 3. Carica il Corso, Lezioni e Quiz
    const { data: courseData } = await supabase.from('courses').select('*, lessons(*), quizzes(*, quiz_questions(*))').eq('id', assignData.course_id).single()
    setCourse(courseData)

    // 4. Carica l'autore del corso (per il logo dell'azienda)
    if(courseData) {
        const { data: profile } = await supabase.from('profiles').select('logo_url').eq('id', courseData.user_id).single()
        if(profile) setCompanyLogo(profile.logo_url)
    }

    if(assignData.progress === 100) setActiveView('certificate')
    setLoading(false)
  }

  const saveProgress = async () => {
      if(!assignment) return;
      await supabase.from('course_progress').update({
          time_spent_seconds: secondsSpent,
          last_accessed: new Date().toISOString()
      }).eq('id', assignment.id)
  }

  // --- TRASFORMA YOUTUBE URL IN EMBED ---
  const getYoutubeEmbedUrl = (url: string) => {
      let videoId = '';
      if(url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      else if(url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  // --- GESTIONE QUIZ ---
  const handleQuizSubmit = async () => {
      const quiz = course.quizzes[0];
      if(!quiz) return;

      let correctCount = 0;
      quiz.quiz_questions.forEach((q:any, i:number) => {
          if(quizAnswers[i] === q.correct_option_index) correctCount++;
      });

      const score = Math.round((correctCount / quiz.quiz_questions.length) * 100);
      setQuizScore(score);

      // Valuta Superamento
      if(score >= quiz.passing_score) {
          // Ha superato il corso!
          await supabase.from('course_progress').update({
              progress: 100,
              quiz_score: score,
              status: 'completed',
              certificate_issued: true
          }).eq('id', assignment.id)
          setActiveView('certificate')
          alert(`Complimenti! Hai superato il test con ${score}%!`)
      } else {
          // Non superato
          await supabase.from('course_progress').update({ quiz_score: score }).eq('id', assignment.id)
          alert(`Test non superato. Punteggio: ${score}%. Richiesto: ${quiz.passing_score}%. Riprova.`)
      }
  }

  // --- DOWNLOAD ATTESTATO ---
  const downloadCertificate = async () => {
      if (certificateRef.current === null) return
      try {
        const dataUrl = await toPng(certificateRef.current, { quality: 1, pixelRatio: 3 })
        const link = document.createElement('a')
        link.download = `Attestato_${course.title.replace(/\s/g, '_')}.png`
        link.href = dataUrl
        link.click()
      } catch (err) { alert("Errore download") }
  }

  if (loading) return <div className="p-10 text-center text-[#00665E] animate-pulse font-bold mt-20">Accesso alla piattaforma in corso...</div>
  if (!course) return <div className="p-10 text-center text-red-500 font-bold mt-20">Link non valido o scaduto.</div>

  const formatTime = (totalSeconds: number) => {
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* SIDEBAR (Indice) */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="p-6 border-b border-gray-100">
              {companyLogo && <img src={companyLogo} alt="Logo" className="h-10 mb-4 object-contain" />}
              <h2 className="font-black text-[#00665E] text-lg leading-tight">{course.title}</h2>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Clock size={12}/> Tempo studio: {formatTime(secondsSpent)}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button onClick={() => setActiveView('intro')} className={`w-full text-left p-3 rounded-xl text-sm font-bold transition ${activeView === 'intro' ? 'bg-[#00665E]/10 text-[#00665E]' : 'text-gray-600 hover:bg-gray-50'}`}>
                  🏠 Introduzione
              </button>
              
              <div className="pt-2 pb-1"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3">Moduli</p></div>
              
              {course.lessons?.map((lesson:any, idx:number) => (
                  <button key={lesson.id} onClick={() => { setActiveView('lesson'); setActiveLessonIndex(idx); }} className={`w-full text-left p-3 rounded-xl text-sm flex items-center gap-3 transition ${activeView === 'lesson' && activeLessonIndex === idx ? 'bg-[#00665E] text-white shadow-md' : 'text-gray-700 bg-white border border-gray-100 hover:border-[#00665E]'}`}>
                      <Play size={14} className={activeView === 'lesson' && activeLessonIndex === idx ? 'text-white' : 'text-[#00665E]'}/>
                      <span className="truncate flex-1 font-medium">{lesson.title}</span>
                  </button>
              ))}

              {course.quizzes?.length > 0 && (
                  <button onClick={() => setActiveView('quiz')} className={`w-full mt-4 text-left p-3 rounded-xl text-sm font-bold border-2 transition flex items-center gap-2 ${activeView === 'quiz' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-white border-orange-100 text-orange-600 hover:bg-orange-50'}`}>
                      <CheckCircle size={16}/> Test Finale
                  </button>
              )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-center text-gray-400">
              Agente: <b>{agentName}</b>
          </div>
      </div>

      {/* AREA PRINCIPALE */}
      <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 py-12">
              
              {/* VISTA: INTRODUZIONE */}
              {activeView === 'intro' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="h-64 w-full bg-gray-200 rounded-3xl overflow-hidden mb-8 shadow-sm">
                          <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                      <h1 className="text-4xl font-black text-gray-900 mb-4">Benvenuto nel corso</h1>
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                          <h3 className="font-bold text-gray-800 mb-2">Descrizione</h3>
                          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">{course.description}</p>
                      </div>

                      {course.attachment_url && (
                          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-center justify-between">
                              <div>
                                  <h3 className="font-bold text-blue-900">Dispensa Ufficiale</h3>
                                  <p className="text-xs text-blue-700 mt-1">Materiale PDF necessario per seguire le lezioni.</p>
                              </div>
                              <a href={course.attachment_url} target="_blank" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2"><Download size={16}/> Scarica File</a>
                          </div>
                      )}

                      <button onClick={() => { setActiveView('lesson'); setActiveLessonIndex(0); }} className="mt-8 bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#004d46] transition flex items-center gap-2">
                          Inizia la prima lezione <ArrowRight size={20}/>
                      </button>
                  </div>
              )}

              {/* VISTA: LEZIONE VIDEO */}
              {activeView === 'lesson' && course.lessons[activeLessonIndex] && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <h1 className="text-3xl font-black text-gray-900 mb-6">{course.lessons[activeLessonIndex].title}</h1>
                      
                      {/* PLAYER VIDEO */}
                      <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-xl mb-8 border-4 border-gray-900">
                          {course.lessons[activeLessonIndex].video_type === 'youtube' ? (
                              <iframe width="100%" height="100%" src={getYoutubeEmbedUrl(course.lessons[activeLessonIndex].video_url)} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                          ) : (
                              <video src={course.lessons[activeLessonIndex].video_url} controls className="w-full h-full object-cover bg-black" controlsList="nodownload"></video>
                          )}
                      </div>

                      <div className="flex justify-between items-center mt-8">
                          {activeLessonIndex > 0 ? (
                              <button onClick={() => setActiveLessonIndex(activeLessonIndex - 1)} className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Precedente</button>
                          ) : <div></div>}
                          
                          {activeLessonIndex < course.lessons.length - 1 ? (
                              <button onClick={() => setActiveLessonIndex(activeLessonIndex + 1)} className="px-6 py-3 bg-[#00665E] text-white rounded-xl font-bold shadow-lg hover:bg-[#004d46]">Prossima Lezione</button>
                          ) : (
                              <button onClick={() => setActiveView('quiz')} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 flex items-center gap-2">Vai al Test Finale <CheckCircle size={18}/></button>
                          )}
                      </div>
                  </div>
              )}

              {/* VISTA: QUIZ FINALE */}
              {activeView === 'quiz' && course.quizzes[0] && (
                  <div className="animate-in fade-in slide-in-from-bottom-4">
                      <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
                          <div className="text-center mb-10 border-b border-gray-100 pb-8">
                              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32}/></div>
                              <h1 className="text-3xl font-black text-gray-900">{course.quizzes[0].title}</h1>
                              <p className="text-gray-500 mt-2">Punteggio minimo per superare: <b className="text-gray-900">{course.quizzes[0].passing_score}%</b></p>
                          </div>

                          <div className="space-y-8">
                              {course.quizzes[0].quiz_questions?.map((q:any, i:number) => (
                                  <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                      <h3 className="font-bold text-lg text-gray-800 mb-4">{i+1}. {q.question_text}</h3>
                                      <div className="space-y-3">
                                          {q.options.map((opt:string, optIdx:number) => (
                                              <label key={optIdx} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition ${quizAnswers[i] === optIdx ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-200'}`}>
                                                  <input type="radio" name={`question_${i}`} className="w-5 h-5 accent-orange-500" checked={quizAnswers[i] === optIdx} onChange={() => setQuizAnswers({...quizAnswers, [i]: optIdx})} />
                                                  <span className="font-medium text-gray-700">{opt}</span>
                                              </label>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                              <button onClick={handleQuizSubmit} className="bg-orange-500 text-white px-10 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-orange-600 transition hover:scale-105">
                                  Consegna Test & Scopri Risultato
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* VISTA: ATTESTATO (Premio Finale) */}
              {activeView === 'certificate' && course.certificate_template && (
                  <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center">
                      
                      <div className="text-center mb-8">
                          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><Award size={40}/></div>
                          <h1 className="text-4xl font-black text-green-700">Corso Superato!</h1>
                          <p className="text-gray-500 mt-2 text-lg">Hai sbloccato il tuo attestato ufficiale.</p>
                      </div>

                      {/* DESIGN ATTESTATO (Stesso di Academy Admin) */}
                      <div className="w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl bg-gray-300 p-2 mb-8">
                          <div ref={certificateRef} className="bg-white border-8 border-double border-gray-300 p-16 text-center relative flex flex-col justify-center items-center w-full aspect-[1.414/1]">
                             
                             {/* Background Watermark finto */}
                             <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                 <Award size={400}/>
                             </div>

                             {course.certificate_template.logo_show && (
                                 companyLogo ? <img src={companyLogo} alt="Logo" className="h-20 object-contain mb-8 mx-auto" /> : <div className="w-16 h-16 bg-gray-100 rounded-full mb-8 mx-auto border flex items-center justify-center text-xs text-gray-400">Logo</div>
                             )}

                             <h3 className="font-serif text-4xl font-black text-gray-800 tracking-widest leading-tight uppercase mb-8">{course.certificate_template.title}</h3>
                             
                             <p className="text-gray-600 italic text-lg mb-2">Si certifica che l'agente</p>
                             <p className="font-bold text-3xl border-b-2 border-gray-300 pb-2 px-12 mb-6 text-[#00665E] uppercase">{agentName}</p>
                             
                             <p className="text-gray-600 text-lg mb-2">ha completato con profitto il percorso formativo aziendale in:</p>
                             <p className="font-black text-gray-900 text-2xl uppercase mb-16">{course.title}</p>
                             
                             <div className="mt-auto w-64 mx-auto text-center relative z-10">
                                 <p className="font-cursive text-4xl text-gray-800 leading-none mb-2" style={{fontFamily: "'Brush Script MT', cursive, sans-serif"}}>{course.certificate_template.signer}</p>
                                 <div className="border-t border-gray-400 w-full mb-1"></div>
                                 <p className="text-xs text-gray-500 uppercase tracking-widest">Firma Autorizzata</p>
                             </div>
                             
                             {/* Data superamento nell'angolo */}
                             <div className="absolute bottom-8 left-12 text-left">
                                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Data Conseguimento</p>
                                 <p className="font-bold text-gray-700">{new Date().toLocaleDateString('it-IT')}</p>
                             </div>
                         </div>
                      </div>

                      <button onClick={downloadCertificate} className="bg-[#00665E] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-[#004d46] transition flex items-center gap-3">
                          <Download size={24}/> Scarica Attestato (PDF/PNG)
                      </button>
                  </div>
              )}

          </div>
      </div>
    </div>
  )
}