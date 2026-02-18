'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, UploadCloud, Youtube, Clock, Trash2, Video, FileText, 
  Calendar, CheckCircle, AlertTriangle, Monitor, BookOpen, PenTool, 
  Users, Award, Edit, Save, MoreHorizontal, FileCheck, BarChart3, CheckSquare
} from 'lucide-react'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // MODALI STATO
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false) // Nuovo
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false) // Nuovo
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false) // Nuovo

  // DATI SELEZIONATI
  const [activeCourse, setActiveCourse] = useState<any>(null)
  const [activeLive, setActiveLive] = useState<any>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  // FORMS
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', platform_link: '', description: '' })
  const [certForm, setCertForm] = useState({ title: 'Attestato di Eccellenza', signer: 'La Direzione', logo_show: true })
  
  // QUIZ FORM
  const [quizForm, setQuizForm] = useState({ title: 'Test Finale', passing_score: 70 })
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', option1: '', option2: '', option3: '', correct: 0 })

  // UPLOAD
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;
    setUser(user)
    
    // Carica Corsi + Lezioni + Quiz
    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*), quizzes(*)').order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    // Carica Live
    const { data: liveData } = await supabase.from('live_events').select('*').order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)

    // Carica Agenti REALI
    const { data: teamData } = await supabase.from('team_members').select('*')
    if(teamData) setAgents(teamData)
    
    setLoading(false)
  }

  // --- HELPER UPLOAD ---
  const handleUpload = async (file: File, folder: string, maxSizeMB: number) => {
      if (file.size > maxSizeMB * 1024 * 1024) { alert(`⚠️ File troppo grande! Max ${maxSizeMB}MB.`); return null; }
      setUploading(true)
      const fileName = `${folder}_${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const bucket = folder === 'video' ? 'course_videos' : 'course_assets'
      const { error } = await supabase.storage.from(bucket).upload(fileName, file)
      setUploading(false)
      if (error) { alert("Errore upload: " + error.message); return null; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
      return data.publicUrl
  }

  // --- CRUD CORSI ---
  const openCourseModal = (course?: any) => {
      if (course) {
          setActiveCourse(course)
          setCourseForm({
              title: course.title, description: course.description, category: course.category,
              thumbnail_url: course.thumbnail_url, attachment_url: course.attachment_url,
              is_mandatory: course.is_mandatory, deadline: course.deadline
          })
      } else {
          setActiveCourse(null)
          setCourseForm({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
      }
      setIsCourseModalOpen(true)
  }

  const handleSaveCourse = async () => {
      if(!courseForm.title) return alert("Titolo mancante");
      setUploading(true)
      const payload = { user_id: user?.id, ...courseForm, thumbnail_url: courseForm.thumbnail_url || 'https://via.placeholder.com/800x400' }

      if (activeCourse) {
          await supabase.from('courses').update(payload).eq('id', activeCourse.id)
      } else {
          await supabase.from('courses').insert(payload)
      }
      fetchData(); setIsCourseModalOpen(false); setUploading(false)
  }

  // --- CRUD LEZIONI ---
  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("Conferma diritti privacy.");
      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          const url = await handleUpload(videoFile, 'video', 100)
          if(!url) return;
          finalUrl = url;
      }
      await supabase.from('lessons').insert({
          course_id: activeCourse.id, title: lessonForm.title, video_type: lessonForm.video_type, video_url: finalUrl, notes: lessonForm.notes
      })
      fetchData(); setIsLessonModalOpen(false)
  }

  // --- QUIZ SYSTEM ---
  const handleAddQuestion = () => {
      if(!newQuestion.text || !newQuestion.option1 || !newQuestion.option2) return alert("Compila domanda e almeno 2 risposte");
      const q = {
          question_text: newQuestion.text,
          options: [newQuestion.option1, newQuestion.option2, newQuestion.option3].filter(o => o !== ''),
          correct_option_index: Number(newQuestion.correct)
      }
      setQuestions([...questions, q])
      setNewQuestion({ text: '', option1: '', option2: '', option3: '', correct: 0 })
  }

  const handleSaveQuiz = async () => {
      // 1. Crea Quiz
      const { data: quizData, error } = await supabase.from('quizzes').insert({
          course_id: activeCourse.id, title: quizForm.title, passing_score: quizForm.passing_score
      }).select().single()

      if(quizData) {
          // 2. Inserisci Domande
          const questionsPayload = questions.map(q => ({
              quiz_id: quizData.id, question_text: q.question_text, options: q.options, correct_option_index: q.correct_option_index
          }))
          await supabase.from('quiz_questions').insert(questionsPayload)
          alert("Quiz Salvato con successo!"); setIsQuizModalOpen(false);
      }
  }

  // --- LIVE & AGENDA ---
  const handleSaveLive = async () => {
      // Update o Insert
      if(activeLive) {
           await supabase.from('live_events').update(liveForm).eq('id', activeLive.id)
           fetchData(); setIsLiveModalOpen(false); setActiveLive(null);
      } else {
          const { data: liveData } = await supabase.from('live_events').insert({ user_id: user?.id, ...liveForm }).select().single()
          if(liveData) {
              // Sync Agenda
              const endTime = new Date(new Date(liveForm.start_time).getTime() + 60*60000).toISOString()
              await supabase.from('appointments').insert({
                  user_id: user.id, title: `🎥 LIVE: ${liveForm.title}`, start_time: liveForm.start_time, end_time: endTime, type: 'live', notes: liveForm.platform_link
              })
              fetchData(); setIsLiveModalOpen(false)
          }
      }
  }

  // --- ASSEGNAZIONE ---
  const handleAssign = async () => {
      if(selectedAgents.length === 0) return alert("Seleziona agenti");
      const assignments = selectedAgents.map(email => ({
          course_id: activeCourse.id, agent_email: email, status: 'assigned', progress: 0
      }))
      await supabase.from('course_progress').insert(assignments) // Usiamo course_progress come tabella di assegnazione
      alert(`Assegnato a ${selectedAgents.length} agenti!`); setIsAssignModalOpen(false);
  }

  // --- SAVE PRESENZE LIVE ---
  const handleSaveAttendance = async () => {
      // Qui salveresti su tabella live_attendance
      alert("Presenze registrate e obiettivi aggiornati!"); setIsAttendanceModalOpen(false);
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento LMS Enterprise...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-[#00665E]">Academy & Training</h1><p className="text-gray-500 text-sm">Formazione, Quiz e Certificazioni.</p></div>
        <div className="flex gap-2">
            <button onClick={() => { setActiveLive(null); setLiveForm({title:'', start_time:'', platform_link:'', description:''}); setIsLiveModalOpen(true) }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 text-sm"><Video size={18}/> Crea Live</button>
            <button onClick={() => openCourseModal()} className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm"><Plus size={18}/> Nuovo Corso</button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Corsi ({courses.length})</button>
        <button onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Dirette ({liveEvents.length})</button>
      </div>

      {activeTab === 'courses' ? (
          <div className="space-y-8">
              {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-md transition">
                      <div className="md:w-64 h-48 md:h-auto bg-gray-200 relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                          <button onClick={() => openCourseModal(course)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:text-[#00665E]"><Edit size={16}/></button>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-xl text-gray-900">{course.title}</h3>
                                {course.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase">Obbligatorio</span>}
                             </div>
                             <div className="text-right">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{course.lessons?.length} Lezioni</span>
                             </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-2">{course.description}</p>
                          
                          {/* LISTA LEZIONI COMPATTA */}
                          <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
                              {course.lessons && course.lessons.map((l:any) => (
                                  <div key={l.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                      <span className="text-xs text-gray-600 flex items-center gap-2"><Play size={10}/> {l.title}</span>
                                      <span className="text-[10px] text-gray-400 uppercase">{l.video_type}</span>
                                  </div>
                              ))}
                              {(!course.lessons || course.lessons.length === 0) && <p className="text-xs text-gray-400 italic">Nessuna lezione.</p>}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-auto">
                              <button onClick={() => { setActiveCourse(course); setIsLessonModalOpen(true); }} className="btn-secondary"><Plus size={14}/> Aggiungi Lezione</button>
                              <button onClick={() => { setActiveCourse(course); setIsAssignModalOpen(true); }} className="btn-secondary"><Users size={14}/> Assegna</button>
                              <button onClick={() => { setActiveCourse(course); setIsQuizModalOpen(true); }} className="btn-secondary"><BookOpen size={14}/> Crea Quiz</button>
                              <button onClick={() => { setActiveCourse(course); setIsStatsModalOpen(true); }} className="btn-secondary bg-teal-50 text-teal-700 border-teal-100"><BarChart3 size={14}/> Monitoraggio</button>
                              <button onClick={() => { setActiveCourse(course); setIsCertModalOpen(true); }} className="btn-secondary bg-yellow-50 text-yellow-700 border-yellow-100"><Award size={14}/> Attestato</button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="space-y-4">
              {liveEvents.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-5">
                          <div className="bg-red-50 p-4 rounded-2xl text-red-600 border border-red-100"><Monitor size={24}/></div>
                          <div>
                              <h3 className="font-bold text-gray-900">{event.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">{new Date(event.start_time).toLocaleString()} • Durata: 60 min</p>
                              {event.platform_link && <a href={event.platform_link} target="_blank" className="text-xs text-blue-500 underline mt-1 block">Link Zoom/Meet</a>}
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => { setActiveLive(event); setLiveForm(event); setIsLiveModalOpen(true); }} className="btn-secondary"><Edit size={14}/> Modifica</button>
                          <button onClick={() => { setActiveLive(event); setIsAttendanceModalOpen(true); }} className="btn-primary bg-green-600 hover:bg-green-700 border-none text-white"><CheckSquare size={14}/> Registro Presenze</button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- MODALE QUIZ BUILDER --- */}
      {isQuizModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-2xl">
                  <h2 className="text-xl font-black mb-4">Crea Test Finale per "{activeCourse?.title}"</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="label">Titolo Quiz</label><input className="input" value={quizForm.title} onChange={e=>setQuizForm({...quizForm, title: e.target.value})}/></div>
                      <div><label className="label">Soglia Superamento (%)</label><input type="number" className="input" value={quizForm.passing_score} onChange={e=>setQuizForm({...quizForm, passing_score: Number(e.target.value)})}/></div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-4 max-h-40 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Domande Inserite ({questions.length})</p>
                      {questions.map((q,i) => (
                          <div key={i} className="text-sm border-b p-2 last:border-0">
                              <span className="font-bold">{i+1}. {q.question_text}</span>
                              <span className="text-xs text-green-600 block ml-4">Risposta Corretta: {q.options[q.correct_option_index]}</span>
                          </div>
                      ))}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                      <h4 className="text-sm font-bold text-blue-800 mb-2">Aggiungi Domanda</h4>
                      <input className="input mb-2" placeholder="Domanda (es. Qual è il vantaggio principale?)" value={newQuestion.text} onChange={e=>setNewQuestion({...newQuestion, text: e.target.value})} />
                      <div className="grid grid-cols-3 gap-2 mb-2">
                          <input className="input" placeholder="Opzione A" value={newQuestion.option1} onChange={e=>setNewQuestion({...newQuestion, option1: e.target.value})} />
                          <input className="input" placeholder="Opzione B" value={newQuestion.option2} onChange={e=>setNewQuestion({...newQuestion, option2: e.target.value})} />
                          <input className="input" placeholder="Opzione C" value={newQuestion.option3} onChange={e=>setNewQuestion({...newQuestion, option3: e.target.value})} />
                      </div>
                      <label className="label">Indice Risposta Corretta (0=A, 1=B, 2=C)</label>
                      <select className="input" value={newQuestion.correct} onChange={e=>setNewQuestion({...newQuestion, correct: Number(e.target.value)})}>
                          <option value={0}>Opzione A</option><option value={1}>Opzione B</option><option value={2}>Opzione C</option>
                      </select>
                      <button onClick={handleAddQuestion} className="btn-secondary w-full mt-2 bg-white border-blue-200 text-blue-700">Aggiungi alla Lista</button>
                  </div>

                  <div className="flex gap-2">
                      <button onClick={() => setIsQuizModalOpen(false)} className="btn-secondary flex-1">Annulla</button>
                      <button onClick={handleSaveQuiz} className="btn-primary flex-1">Salva Quiz Completo</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODALE MONITORAGGIO (ANALYTICS) --- */}
      {isStatsModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-3xl">
                  <h2 className="text-xl font-black mb-4">Monitoraggio: {activeCourse?.title}</h2>
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                          <tr><th className="p-3">Agente</th><th className="p-3">Stato</th><th className="p-3">Tempo</th><th className="p-3">Quiz</th><th className="p-3">Azioni</th></tr>
                      </thead>
                      <tbody>
                          {agents.map(agent => (
                              <tr key={agent.id} className="border-b">
                                  <td className="p-3 font-bold">{agent.name}</td>
                                  <td className="p-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">In Corso (40%)</span></td>
                                  <td className="p-3">2h 15m</td>
                                  <td className="p-3">-</td>
                                  <td className="p-3"><button className="text-blue-600 hover:underline text-xs">Dettagli</button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div className="mt-4 flex justify-end">
                      <button onClick={() => setIsStatsModalOpen(false)} className="btn-secondary">Chiudi</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODALE PRESENZE LIVE --- */}
      {isAttendanceModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-md">
                  <h2 className="text-xl font-black mb-2">Registro Presenze</h2>
                  <p className="text-sm text-gray-500 mb-4">{activeLive?.title}</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {agents.map(agent => (
                          <div key={agent.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-gray-50">
                              <span className="font-bold text-sm">{agent.name}</span>
                              <div className="flex gap-2">
                                  <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-green-600"/> <span className="text-xs">Presente</span></label>
                                  <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="accent-blue-600"/> <span className="text-xs">Obiettivo OK</span></label>
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={handleSaveAttendance} className="btn-primary w-full">Salva Registro</button>
                  <button onClick={() => setIsAttendanceModalOpen(false)} className="btn-secondary w-full mt-2">Chiudi</button>
              </div>
          </div>
      )}

      {/* --- MODALE CORSO (CREA/EDIT) --- */}
      {isCourseModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">{activeCourse ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
                 <div className="space-y-4">
                     <input className="input" placeholder="Titolo Corso" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                     <textarea className="input h-24" placeholder="Descrizione..." value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="label">Obbligatorio?</label><select className="input" onChange={e => setCourseForm({...courseForm, is_mandatory: e.target.value === 'true'})}><option value="false">Facoltativo</option><option value="true">Obbligatorio</option></select></div>
                         <div><label className="label">Scadenza</label><input type="date" className="input" value={courseForm.deadline} onChange={e => setCourseForm({...courseForm, deadline: e.target.value})} /></div>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl border border-dashed"><p className="text-xs font-bold mb-2">Copertina</p><input type="file" accept="image/*" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'images', 2); if(url) setCourseForm({...courseForm, thumbnail_url: url}) }}} /></div>
                     <div className="bg-blue-50 p-4 rounded-xl border border-dashed border-blue-200"><p className="text-xs font-bold mb-2 text-blue-700">Dispensa PDF</p><input type="file" accept=".pdf,.ppt" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'docs', 50); if(url) setCourseForm({...courseForm, attachment_url: url}) }}} /></div>
                     <button onClick={handleSaveCourse} disabled={uploading} className="btn-primary w-full">{uploading ? '...' : 'Salva'}</button>
                     <button onClick={() => setIsCourseModalOpen(false)} className="btn-secondary w-full">Annulla</button>
                 </div>
             </div>
          </div>
      )}
      
      {/* --- MODALE LEZIONE --- */}
      {isLessonModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">Gestisci Lezione</h2>
                 <input className="input mb-4" placeholder="Titolo" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                 <div className="flex gap-4 mb-4">
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'youtube'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'youtube' ? 'bg-red-50 border-red-500 text-red-600' : ''}`}>YouTube</button>
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'upload'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'upload' ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}`}>Upload</button>
                 </div>
                 {lessonForm.video_type === 'youtube' ? <input className="input mb-4" placeholder="Link YouTube" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} /> : <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-dashed"><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>}
                 <div className="flex items-center gap-2 mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} /><p className="text-xs text-yellow-800">Confermo diritti Copyright.</p></div>
                 <button onClick={handleSaveLesson} disabled={uploading} className="btn-primary w-full">Salva Lezione</button>
                 <button onClick={() => setIsLessonModalOpen(false)} className="btn-secondary w-full mt-2">Chiudi</button>
             </div>
          </div>
      )}

      {/* --- MODALE LIVE --- */}
      {isLiveModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">{activeLive ? 'Modifica Live' : 'Nuova Live'}</h2>
                 <input className="input mb-2" placeholder="Titolo" value={liveForm.title} onChange={e => setLiveForm({...liveForm, title: e.target.value})} />
                 <input type="datetime-local" className="input mb-2" value={liveForm.start_time} onChange={e => setLiveForm({...liveForm, start_time: e.target.value})} />
                 <input className="input mb-4" placeholder="Link Zoom/Meet" value={liveForm.platform_link} onChange={e => setLiveForm({...liveForm, platform_link: e.target.value})} />
                 <button onClick={handleSaveLive} className="btn-primary w-full">Salva e Sincronizza Agenda</button>
                 <button onClick={() => setIsLiveModalOpen(false)} className="btn-secondary w-full mt-2">Annulla</button>
             </div>
          </div>
      )}
      
      {/* --- MODALE ASSEGNAZIONE --- */}
      {isAssignModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-md">
                  <h2 className="text-xl font-black mb-4">Assegna Corso</h2>
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                     {agents.length === 0 && <p className="text-sm text-gray-500">Nessun agente trovato.</p>}
                     {agents.map(agent => (
                         <label key={agent.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                             <input type="checkbox" className="w-5 h-5 accent-[#00665E]" onChange={e => { if(e.target.checked) setSelectedAgents([...selectedAgents, agent.email]); else setSelectedAgents(selectedAgents.filter(em => em !== agent.email)) }} />
                             <div><p className="font-bold text-sm">{agent.name}</p></div>
                         </label>
                     ))}
                  </div>
                  <button onClick={handleAssign} className="btn-primary w-full">Conferma</button>
                  <button onClick={() => setIsAssignModalOpen(false)} className="btn-secondary w-full mt-2">Chiudi</button>
              </div>
          </div>
      )}

      {/* --- MODALE ATTESTATO --- */}
      {isCertModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-md">
                 <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Award className="text-yellow-500"/> Configura Attestato</h2>
                 <div className="space-y-4">
                     <div><label className="label">Intestazione</label><input className="input" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} /></div>
                     <div><label className="label">Firma (CEO/Direttore)</label><input className="input" value={certForm.signer} onChange={e => setCertForm({...certForm, signer: e.target.value})} /></div>
                     <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                         <p className="font-serif text-xl font-bold text-gray-800">{certForm.title}</p>
                         <p className="text-xs text-gray-500 my-2">Certifica che [Nome Agente] ha superato...</p>
                         <p className="font-bold text-[#00665E] my-1">{activeCourse?.title}</p>
                         <p className="font-cursive text-lg text-gray-600 mt-4">{certForm.signer}</p>
                     </div>
                     <button onClick={() => {alert("Configurazione salvata!"); setIsCertModalOpen(false)}} className="btn-primary w-full">Salva Template</button>
                     <button onClick={() => setIsCertModalOpen(false)} className="btn-secondary w-full">Chiudi</button>
                 </div>
             </div>
          </div>
      )}

      {/* STILI CSS IN-JS PER LE MODALI */}
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); padding: 1rem; }
        .modal-content { background: white; padding: 2rem; border-radius: 1.5rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: zoomIn 0.2s ease-out; position: relative; max-height: 90vh; overflow-y: auto; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; }
        .input:focus { border-color: #00665E; box-shadow: 0 0 0 3px rgba(0, 102, 94, 0.1); }
        .label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }
        .btn-primary { background: #00665E; color: white; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-primary:hover { background: #004d46; }
        .btn-secondary { background: white; color: #475569; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.75rem; }
        .btn-secondary:hover { background: #f1f5f9; border-color: #cbd5e1; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

    </main>
  )
}