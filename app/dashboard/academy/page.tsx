'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
// IMPORT COMPLETI DI TUTTE LE ICONE NECESSARIE
import { 
  Play, Plus, Video, FileText, Monitor, BookOpen, PenTool, 
  Users, Award, Edit, BarChart3, CheckSquare, Eye, X, 
  Trash2, Download, Save, Palette, StickyNote, Filter, UploadCloud, Youtube, Clock, Calendar
} from 'lucide-react'
// IMPORT RECHARTS PER I GRAFICI
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

export default function AcademyPage() {
  // --- STATI PRINCIPALI ---
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('Base') 
  const [user, setUser] = useState<any>(null)
  
  // --- GESTIONE MODALI ---
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false)

  // --- DATI SELEZIONATI ---
  const [activeCourse, setActiveCourse] = useState<any>(null)
  const [activeLive, setActiveLive] = useState<any>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  
  // --- FILTRI E NOTE ---
  const [statsFilter, setStatsFilter] = useState('all') 
  const [notesContent, setNotesContent] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // --- FORMS ---
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', platform_link: '', description: '' })
  const [certForm, setCertForm] = useState({ title: 'Attestato di Eccellenza', signer: 'La Direzione', logo_show: true })
  
  // --- QUIZ & UPLOAD ---
  const [quizForm, setQuizForm] = useState({ title: 'Test Finale', passing_score: 70 })
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', option1: '', option2: '', option3: '', correct: 0 })
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const supabase = createClient()
  const LIMITS = { courses: userPlan === 'Base' ? 3 : 999, lessons: 10, live: userPlan === 'Base' ? 2 : 999 }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;
    setUser(user)
    
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if(profile) setUserPlan(profile.plan || 'Base')

    // Carica Corsi con tutto (lezioni, quiz, progressi)
    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*), quizzes(*), course_progress(*)').order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    const { data: liveData } = await supabase.from('live_events').select('*').order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)

    const { data: teamData } = await supabase.from('team_members').select('*')
    if(teamData) setAgents(teamData)
    
    setLoading(false)
  }

  // --- UPLOAD FUNZIONE ---
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

  // --- EXPORT CSV ---
  const handleExportCSV = () => {
      if(!activeCourse) return;
      const dataToExport = activeCourse.course_progress?.map((p: any) => {
          const agent = agents.find(a => a.email === p.agent_email)
          return {
              Agente: agent?.name || p.agent_email,
              Email: p.agent_email,
              Stato: p.progress === 100 ? 'Completato' : 'In Corso',
              Progresso: `${p.progress}%`,
              Voto_Quiz: p.quiz_score || 0
          }
      }) || []

      if(dataToExport.length === 0) return alert("Nessun dato da esportare.");

      const headers = Object.keys(dataToExport[0]).join(",")
      const rows = dataToExport.map((row:any) => Object.values(row).join(",")).join("\n")
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `report_${activeCourse.title}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  // --- GESTIONE CORSI ---
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

      if (activeCourse) await supabase.from('courses').update(payload).eq('id', activeCourse.id)
      else await supabase.from('courses').insert(payload)
      
      fetchData(); setIsCourseModalOpen(false); setUploading(false)
  }

  const handleDeleteItem = async (table: string, id: number) => {
      if(!confirm("Eliminare definitivamente?")) return;
      await supabase.from(table).delete().eq('id', id)
      fetchData()
      if(table === 'lessons' && activeCourse) {
          // Aggiorna vista locale per reattività
          const updatedLessons = activeCourse.lessons.filter((l:any) => l.id !== id)
          setActiveCourse({...activeCourse, lessons: updatedLessons})
      }
  }

  // --- GESTIONE LEZIONI ---
  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("Devi accettare la privacy sui contenuti.");
      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          const url = await handleUpload(videoFile, 'video', 100); if(!url) return; finalUrl = url;
      }
      await supabase.from('lessons').insert({ course_id: activeCourse.id, title: lessonForm.title, video_type: lessonForm.video_type, video_url: finalUrl, notes: lessonForm.notes })
      fetchData(); setIsLessonModalOpen(false)
  }

  // --- GESTIONE LIVE (Con Sync Agenda) ---
  const handleSaveLive = async () => {
      if(!activeLive && userPlan === 'Base' && liveEvents.length >= LIMITS.live) return alert("Limite Live Raggiunto.");
      
      let eventId = activeLive?.id
      if(activeLive) {
           await supabase.from('live_events').update(liveForm).eq('id', activeLive.id)
      } else {
          const { data } = await supabase.from('live_events').insert({ user_id: user.id, ...liveForm }).select().single()
          if(data) eventId = data.id
      }

      // Sync Agenda (Tabella appointments con colonne corrette)
      if(eventId) {
          const endTime = new Date(new Date(liveForm.start_time).getTime() + 60*60000).toISOString()
          await supabase.from('appointments').insert({
              user_id: user.id,
              title: `🎥 LIVE: ${liveForm.title}`, 
              start_time: liveForm.start_time, 
              end_time: endTime, 
              type: 'live', 
              notes: liveForm.platform_link
          })
      }
      fetchData(); setIsLiveModalOpen(false); alert("Evento salvato e aggiunto in Agenda!")
  }

  // --- GESTIONE QUIZ ---
  const handleSaveQuiz = async () => {
      const { data: quizData } = await supabase.from('quizzes').insert({ 
          course_id: activeCourse.id, title: quizForm.title, passing_score: quizForm.passing_score 
      }).select().single()
      
      if(quizData) {
          await supabase.from('quiz_questions').insert(questions.map(q => ({ 
              quiz_id: quizData.id, question_text: q.question_text, options: q.options, correct_option_index: q.correct_option_index 
          })))
          alert("Quiz Salvato!"); setIsQuizModalOpen(false); fetchData();
      }
  }

  const handleAddQuestion = () => {
      if(!newQuestion.text || !newQuestion.option1) return alert("Inserisci domanda e opzioni");
      setQuestions([...questions, { question_text: newQuestion.text, options: [newQuestion.option1, newQuestion.option2, newQuestion.option3].filter(o=>o), correct_option_index: Number(newQuestion.correct) }])
      setNewQuestion({ text: '', option1: '', option2: '', option3: '', correct: 0 })
  }

  // --- ASSEGNAZIONE AGENTI ---
  const handleAssign = async () => {
      if(selectedAgents.length === 0) return alert("Seleziona agenti.");
      const assignments = selectedAgents.map(email => ({
          course_id: activeCourse.id, agent_email: email, progress: 0, status: 'assigned'
      }))
      const { error } = await supabase.from('course_progress').insert(assignments)
      if(!error) { alert("Corso Assegnato!"); setIsAssignModalOpen(false); fetchData(); setSelectedAgents([]); }
      else alert("Errore: Probabilmente già assegnato.")
  }

  // --- REGISTRO PRESENZE LIVE ---
  const handleSaveAttendance = async () => {
      const attendance = selectedAgents.map(email => ({
          live_event_id: activeLive.id, agent_email: email, present: true, notes: 'Confermato da Admin'
      }))
      await supabase.from('live_attendance').insert(attendance)
      alert("Presenze registrate!"); setIsAttendanceModalOpen(false); setSelectedAgents([]);
  }

  // --- DATI PER GRAFICI ---
  const getChartData = () => {
      if(!activeCourse?.course_progress) return [];
      let data = activeCourse.course_progress;
      if(statsFilter !== 'all') data = data.filter((p:any) => p.agent_email === statsFilter);
      
      return data.map((p:any) => {
          const name = agents.find(a => a.email === p.agent_email)?.name || p.agent_email.split('@')[0]
          return { name, progress: p.progress || 0, quiz: p.quiz_score || 0 }
      })
  }

  // --- STRUMENTI AULA ---
  const openTools = async (course: any) => {
      setActiveCourse(course)
      const { data } = await supabase.from('course_materials').select('content').eq('course_id', course.id).eq('type', 'notes').single()
      setNotesContent(data?.content || '')
      setIsToolsModalOpen(true)
  }
  const saveNotes = async () => {
      await supabase.from('course_materials').upsert({ course_id: activeCourse.id, type: 'notes', content: notesContent }, { onConflict: 'course_id, type' })
      alert("Note salvate!")
  }
  // Canvas Logic
  const startDrawing = (e: any) => { const ctx = canvasRef.current?.getContext('2d'); if(ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); setIsDrawing(true); }}
  const draw = (e: any) => { if(!isDrawing) return; const ctx = canvasRef.current?.getContext('2d'); if(ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); }}
  const stopDrawing = () => setIsDrawing(false)
  const clearCanvas = () => { const ctx = canvasRef.current?.getContext('2d'); if(ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento LMS...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-3xl font-black text-[#00665E]">Academy & Training</h1><p className="text-gray-500 text-sm">Gestisci corsi, dirette e progressi.</p></div>
        <div className="flex gap-2">
            <button onClick={() => { setActiveLive(null); setLiveForm({title:'', start_time:'', platform_link:'', description:''}); setIsLiveModalOpen(true) }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"><Video size={18}/> Crea Live</button>
            <button onClick={() => openCourseModal(null)} className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg"><Plus size={18}/> Nuovo Corso</button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Corsi ({courses.length})</button>
        <button onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Dirette ({liveEvents.length})</button>
      </div>

      {activeTab === 'courses' ? (
          <div className="space-y-6">
              {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-md transition">
                      <div className="md:w-64 h-48 md:h-auto bg-gray-200 relative shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                          <button onClick={() => openCourseModal(course)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:text-[#00665E] shadow-sm"><Edit size={16}/></button>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-xl text-gray-900">{course.title}</h3>
                                {course.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">Obbligatorio</span>}
                             </div>
                             <div className="text-right"><span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{course.lessons?.length} Lez.</span></div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-2">{course.description}</p>
                          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                              <button onClick={() => { setActiveCourse(course); setIsLessonModalOpen(true); }} className="btn-sec"><Plus size={14}/> Lezioni</button>
                              <button onClick={() => { setActiveCourse(course); setIsAssignModalOpen(true); }} className="btn-sec"><Users size={14}/> Assegna</button>
                              <button onClick={() => { setActiveCourse(course); setIsQuizModalOpen(true); }} className="btn-sec"><BookOpen size={14}/> Quiz</button>
                              <button onClick={() => openTools(course)} className="btn-sec text-purple-600 bg-purple-50 border-purple-200"><PenTool size={14}/> Strumenti</button>
                              <button onClick={() => { setActiveCourse(course); setIsStatsModalOpen(true); }} className="btn-sec bg-teal-50 text-teal-700 border-teal-100"><BarChart3 size={14}/> Monitoraggio</button>
                              <button onClick={() => { setActiveCourse(course); setIsCertModalOpen(true); }} className="btn-sec bg-yellow-50 text-yellow-700 border-yellow-100"><Award size={14}/> Attestato</button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="space-y-4">
              {liveEvents.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center hover:border-[#00665E] transition">
                      <div className="flex items-center gap-5">
                          <div className="bg-red-50 p-4 rounded-2xl text-red-600 border border-red-100"><Monitor size={24}/></div>
                          <div>
                              <h3 className="font-bold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{new Date(event.start_time).toLocaleString()} • {event.duration_minutes} min</p>
                              {event.platform_link && <a href={event.platform_link} target="_blank" className="text-xs text-blue-500 underline mt-1 block">Link Partecipazione</a>}
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button onClick={() => { setActiveLive(event); setLiveForm(event); setIsLiveModalOpen(true); }} className="btn-sec"><Edit size={14}/> Modifica</button>
                          <button onClick={() => { setActiveLive(event); setIsAttendanceModalOpen(true); }} className="btn-pri bg-green-600 hover:bg-green-700 border-none text-white"><CheckSquare size={14}/> Registro</button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- MODALI (TUTTE LE FUNZIONI) --- */}
      
      {/* 1. MONITORAGGIO & EXPORT */}
      {isStatsModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-4xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black">📊 Monitoraggio: {activeCourse?.title}</h2>
                      <div className="flex gap-2">
                          <select className="input py-2 text-xs w-40" value={statsFilter} onChange={e => setStatsFilter(e.target.value)}>
                              <option value="all">Tutti</option>
                              {activeCourse?.course_progress?.map((p:any) => <option key={p.id} value={p.agent_email}>{p.agent_email}</option>)}
                          </select>
                          <button onClick={handleExportCSV} className="btn-sec flex items-center gap-2 bg-green-50 text-green-700 border-green-200"><Download size={14}/> Export CSV</button>
                          <button onClick={() => setIsStatsModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                      </div>
                  </div>
                  
                  {getChartData().length === 0 ? (
                      <div className="p-10 text-center text-gray-400 bg-gray-50 rounded-xl">Nessun dato. Assegna il corso agli agenti.</div>
                  ) : (
                      <>
                          <div className="h-64 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={getChartData()}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="name" fontSize={10} />
                                      <YAxis fontSize={10} />
                                      <Tooltip />
                                      <Bar dataKey="progress" name="Progresso %" fill="#00665E" radius={[4, 4, 0, 0]} />
                                      <Bar dataKey="quiz" name="Voto Quiz" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                          <table className="w-full text-sm text-left">
                              <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="p-3">Agente</th><th className="p-3">Stato</th><th className="p-3">Progresso</th><th className="p-3">Quiz</th></tr></thead>
                              <tbody>
                                  {getChartData().map((d:any, i:number) => (
                                      <tr key={i} className="border-b">
                                          <td className="p-3 font-bold">{d.name}</td>
                                          <td className="p-3">{d.progress === 100 ? '✅ Completato' : '🟡 In Corso'}</td>
                                          <td className="p-3"><div className="w-20 bg-gray-200 h-1.5 rounded-full"><div className="bg-[#00665E] h-1.5 rounded-full" style={{width:`${d.progress}%`}}></div></div></td>
                                          <td className="p-3 font-mono">{d.quiz || '-'}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* 2. CREA/EDIT CORSO (CON ANTEPRIMA) */}
      {isCourseModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black">{activeCourse ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
                    <button onClick={() => setIsCourseModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                 </div>

                 {/* ANTEPRIMA CONTENUTI */}
                 {activeCourse && (
                     <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
                         <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Eye size={12}/> Contenuti Caricati</h4>
                         <div className="space-y-1">
                             <div className="text-xs flex justify-between"><span>📺 Lezioni:</span> <b>{activeCourse.lessons?.length || 0}</b></div>
                             {activeCourse.lessons?.map((l:any) => (
                                 <div key={l.id} className="flex justify-between items-center text-[10px] pl-4 text-gray-500 border-l-2 border-gray-200 ml-1">
                                     <span>{l.title}</span>
                                     <button onClick={() => handleDeleteItem('lessons', l.id)} className="text-red-400 hover:text-red-600"><Trash2 size={10}/></button>
                                 </div>
                             ))}
                             <div className="text-xs flex justify-between mt-2"><span>📝 Quiz:</span> <b>{activeCourse.quizzes?.length || 0}</b></div>
                             <div className="text-xs flex justify-between mt-2"><span>📂 Dispensa:</span> <b>{activeCourse.attachment_url ? 'Presente ✅' : 'Assente ❌'}</b></div>
                         </div>
                     </div>
                 )}

                 <div className="space-y-4">
                     <input className="input" placeholder="Titolo Corso" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                     <textarea className="input h-24" placeholder="Descrizione..." value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="label">Obbligatorio?</label><select className="input" onChange={e => setCourseForm({...courseForm, is_mandatory: e.target.value === 'true'})}><option value="false">No</option><option value="true">Si</option></select></div>
                         <div><label className="label">Scadenza</label><input type="date" className="input" value={courseForm.deadline} onChange={e => setCourseForm({...courseForm, deadline: e.target.value})} /></div>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl border border-dashed"><p className="text-xs font-bold mb-2">Copertina</p><input type="file" accept="image/*" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'images', 2); if(url) setCourseForm({...courseForm, thumbnail_url: url}) }}} /></div>
                     <div className="bg-blue-50 p-4 rounded-xl border border-dashed border-blue-200"><p className="text-xs font-bold mb-2 text-blue-700">Dispensa PDF (Max 50MB)</p><input type="file" accept=".pdf,.ppt" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'docs', 50); if(url) setCourseForm({...courseForm, attachment_url: url}) }}} /></div>
                     <button onClick={handleSaveCourse} disabled={uploading} className="btn-pri w-full">{uploading ? 'Caricamento...' : 'Salva Corso'}</button>
                 </div>
             </div>
          </div>
      )}

      {/* 3. ASSEGNAZIONE */}
      {isAssignModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-md">
                  <h2 className="text-xl font-black mb-4">Assegna Corso</h2>
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                     {agents.length === 0 && <p className="text-sm text-gray-500">Nessun agente trovato nella sezione Team.</p>}
                     {agents.map(agent => (
                         <label key={agent.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                             <input type="checkbox" className="w-5 h-5 accent-[#00665E]" onChange={e => { if(e.target.checked) setSelectedAgents([...selectedAgents, agent.email]); else setSelectedAgents(selectedAgents.filter(em => em !== agent.email)) }} />
                             <div><p className="font-bold text-sm">{agent.name}</p><p className="text-xs text-gray-400">{agent.email}</p></div>
                         </label>
                     ))}
                  </div>
                  <button onClick={handleAssign} className="btn-pri w-full">Conferma Assegnazione</button>
                  <button onClick={() => setIsAssignModalOpen(false)} className="btn-sec w-full mt-2">Chiudi</button>
              </div>
          </div>
      )}

      {/* 4. STRUMENTI AULA */}
      {isToolsModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-4xl h-[80vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-black flex items-center gap-2"><Palette className="text-purple-600"/> Aula Virtuale</h2>
                      <button onClick={() => setIsToolsModalOpen(false)}><X size={24}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
                      <div className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 p-2">
                          <div className="flex justify-between items-center mb-2 px-2"><span className="text-xs font-bold uppercase text-gray-500">Lavagna</span><button onClick={clearCanvas} className="text-xs text-red-500 hover:underline">Pulisci</button></div>
                          <canvas ref={canvasRef} width={400} height={300} className="bg-white rounded-lg shadow-sm border border-gray-200 w-full flex-1 cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}/>
                      </div>
                      <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1"><StickyNote size={14}/> Note Condivise</span><button onClick={saveNotes} className="text-xs bg-purple-600 text-white px-3 py-1 rounded">Salva</button></div>
                          <textarea className="w-full flex-1 p-4 border rounded-xl resize-none outline-none focus:border-purple-500 text-sm" placeholder="Appunti del corso..." value={notesContent} onChange={e => setNotesContent(e.target.value)}/>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 5. REGISTRO PRESENZE */}
      {isAttendanceModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-md">
                  <h2 className="text-xl font-black mb-2">Registro Presenze</h2>
                  <p className="text-xs text-gray-500 mb-4">{activeLive?.title}</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                      {agents.length === 0 && <p className="text-sm text-gray-400">Nessun agente.</p>}
                      {agents.map(agent => (
                          <label key={agent.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-green-50 transition">
                              <input type="checkbox" className="w-5 h-5 accent-green-600" onChange={e => { if(e.target.checked) setSelectedAgents([...selectedAgents, agent.email]); else setSelectedAgents(selectedAgents.filter(em => em !== agent.email)) }} />
                              <span className="font-bold text-sm">{agent.name}</span>
                          </label>
                      ))}
                  </div>
                  <button onClick={handleSaveAttendance} className="btn-pri w-full bg-green-600">Salva Presenze</button>
                  <button onClick={() => setIsAttendanceModalOpen(false)} className="btn-sec w-full mt-2">Chiudi</button>
              </div>
          </div>
      )}

      {/* ALTRE MODALI (LESSON, QUIZ, LIVE, CERT) SONO RIMASTE INVARIATE PER BREVITÀ MA SONO PRESENTI NELLA LOGICA */}
      {isLessonModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">Aggiungi Lezione</h2>
                 <input className="input mb-4" placeholder="Titolo" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                 <div className="flex gap-4 mb-4"><button onClick={() => setLessonForm({...lessonForm, video_type: 'youtube'})} className="flex-1 p-2 border rounded-lg text-sm font-bold bg-red-50 text-red-600">YouTube</button><button onClick={() => setLessonForm({...lessonForm, video_type: 'upload'})} className="flex-1 p-2 border rounded-lg text-sm font-bold bg-blue-50 text-blue-600">Upload</button></div>
                 {lessonForm.video_type === 'youtube' ? <input className="input mb-4" placeholder="Link YouTube" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} /> : <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-dashed"><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>}
                 <div className="flex items-center gap-2 mb-6"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} /><p className="text-xs">Confermo diritti.</p></div>
                 <button onClick={handleSaveLesson} disabled={uploading} className="btn-pri w-full">{uploading ? '...' : 'Salva'}</button>
                 <button onClick={() => setIsLessonModalOpen(false)} className="btn-sec w-full mt-2">Chiudi</button>
             </div>
          </div>
      )}

      {isLiveModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">Configura Diretta</h2>
                 <input className="input mb-2" placeholder="Titolo" value={liveForm.title} onChange={e => setLiveForm({...liveForm, title: e.target.value})} />
                 <input type="datetime-local" className="input mb-2" value={liveForm.start_time} onChange={e => setLiveForm({...liveForm, start_time: e.target.value})} />
                 <input className="input mb-4" placeholder="Link Piattaforma" value={liveForm.platform_link} onChange={e => setLiveForm({...liveForm, platform_link: e.target.value})} />
                 <button onClick={handleSaveLive} className="btn-pri w-full">Salva e Sincronizza</button>
                 <button onClick={() => setIsLiveModalOpen(false)} className="btn-sec w-full mt-2">Annulla</button>
             </div>
          </div>
      )}

      {isCertModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-md">
                 <h2 className="text-xl font-black mb-4">Configura Attestato</h2>
                 <input className="input mb-2" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} />
                 <input className="input mb-4" value={certForm.signer} onChange={e => setCertForm({...certForm, signer: e.target.value})} />
                 <button onClick={() => {alert("Configurazione salvata!"); setIsCertModalOpen(false)}} className="btn-pri w-full">Salva</button>
                 <button onClick={() => setIsCertModalOpen(false)} className="btn-sec w-full mt-2">Chiudi</button>
             </div>
          </div>
      )}

      {isQuizModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-2xl">
                  <h2 className="text-xl font-black mb-4">Quiz Builder</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <input className="input" placeholder="Titolo" value={quizForm.title} onChange={e=>setQuizForm({...quizForm, title: e.target.value})}/>
                      <input type="number" className="input" placeholder="Soglia %" value={quizForm.passing_score} onChange={e=>setQuizForm({...quizForm, passing_score: Number(e.target.value)})}/>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 max-h-40 overflow-y-auto">{questions.map((q,i) => <div key={i} className="text-sm border-b p-2"><b>{i+1}.</b> {q.question_text}</div>)}</div>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                      <input className="input mb-2" placeholder="Domanda..." value={newQuestion.text} onChange={e=>setNewQuestion({...newQuestion, text: e.target.value})} />
                      <div className="grid grid-cols-3 gap-2 mb-2"><input className="input" placeholder="Opz A" value={newQuestion.option1} onChange={e=>setNewQuestion({...newQuestion, option1: e.target.value})}/><input className="input" placeholder="Opz B" value={newQuestion.option2} onChange={e=>setNewQuestion({...newQuestion, option2: e.target.value})}/><input className="input" placeholder="Opz C" value={newQuestion.option3} onChange={e=>setNewQuestion({...newQuestion, option3: e.target.value})}/></div>
                      <select className="input" value={newQuestion.correct} onChange={e=>setNewQuestion({...newQuestion, correct: Number(e.target.value)})}> <option value={0}>A</option><option value={1}>B</option><option value={2}>C</option></select>
                      <button onClick={handleAddQuestion} className="btn-sec w-full mt-2">Aggiungi</button>
                  </div>
                  <div className="flex gap-2"><button onClick={()=>setIsQuizModalOpen(false)} className="btn-sec flex-1">Chiudi</button><button onClick={handleSaveQuiz} className="btn-pri flex-1">Salva</button></div>
              </div>
          </div>
      )}

      {/* STILI CSS */}
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); padding: 1rem; }
        .modal-content { background: white; padding: 2rem; border-radius: 1.5rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: zoomIn 0.2s ease-out; position: relative; max-height: 90vh; overflow-y: auto; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 0.875rem; }
        .input:focus { border-color: #00665E; box-shadow: 0 0 0 3px rgba(0, 102, 94, 0.1); }
        .label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }
        .btn-pri { background: #00665E; color: white; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; cursor: pointer; }
        .btn-pri:hover { background: #004d46; }
        .btn-sec { background: white; color: #475569; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.75rem; cursor: pointer; }
        .btn-sec:hover { background: #f1f5f9; border-color: #cbd5e1; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </main>
  )
}