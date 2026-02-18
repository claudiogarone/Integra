'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, UploadCloud, Youtube, Clock, Trash2, Video, FileText, 
  Calendar, CheckCircle, AlertTriangle, Monitor, BookOpen, PenTool, 
  Users, Award, Edit, Save, BarChart3, CheckSquare, Eye, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('Base') 
  const [user, setUser] = useState<any>(null)
  
  // MODALI VISIBILITÀ
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)

  // DATI ATTIVI
  const [activeCourse, setActiveCourse] = useState<any>(null)
  const [activeLive, setActiveLive] = useState<any>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  // FORMS
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', platform_link: '', description: '' })
  const [certForm, setCertForm] = useState({ title: 'Attestato di Eccellenza', signer: 'La Direzione', logo_show: true })
  
  // QUIZ DATA
  const [quizForm, setQuizForm] = useState({ title: 'Test Finale', passing_score: 70 })
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', option1: '', option2: '', option3: '', correct: 0 })

  // UPLOAD
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const supabase = createClient()

  // LIMITI PIANO
  const LIMITS = { courses: userPlan === 'Base' ? 3 : 999, lessons: 10, live: userPlan === 'Base' ? 2 : 999 }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;
    setUser(user)
    
    // Profilo & Piano
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if(profile) setUserPlan(profile.plan || 'Base')

    // Carica Dati
    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*), quizzes(*)').order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    const { data: liveData } = await supabase.from('live_events').select('*').order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)

    const { data: teamData } = await supabase.from('team_members').select('*')
    if(teamData) setAgents(teamData)
    
    setLoading(false)
  }

  // --- FUNZIONE UPLOAD ---
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
      if(!activeCourse && userPlan === 'Base' && courses.length >= LIMITS.courses) return alert(`Limite raggiunto (${LIMITS.courses} corsi). Passa a Enterprise.`);
      
      setUploading(true)
      const payload = { user_id: user?.id, ...courseForm, thumbnail_url: courseForm.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=60' }

      if (activeCourse) await supabase.from('courses').update(payload).eq('id', activeCourse.id)
      else await supabase.from('courses').insert(payload)
      
      fetchData(); setIsCourseModalOpen(false); setUploading(false)
  }

  // --- GESTIONE LEZIONI ---
  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("Devi confermare i diritti privacy.");
      
      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          const url = await handleUpload(videoFile, 'video', 100); if(!url) return; finalUrl = url;
      }
      
      await supabase.from('lessons').insert({ 
          course_id: activeCourse.id, title: lessonForm.title, video_type: lessonForm.video_type, video_url: finalUrl, notes: lessonForm.notes 
      })
      fetchData(); setIsLessonModalOpen(false)
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
      if(!newQuestion.text || !newQuestion.option1 || !newQuestion.option2) return alert("Compila domanda e almeno 2 risposte");
      setQuestions([...questions, { question_text: newQuestion.text, options: [newQuestion.option1, newQuestion.option2, newQuestion.option3].filter(o=>o), correct_option_index: Number(newQuestion.correct) }])
      setNewQuestion({ text: '', option1: '', option2: '', option3: '', correct: 0 })
  }

  // --- GESTIONE LIVE (Con Sync Agenda) ---
  const handleSaveLive = async () => {
      if(!activeLive && userPlan === 'Base' && liveEvents.length >= LIMITS.live) return alert("Limite Eventi Live Raggiunto.");

      if(activeLive) {
           await supabase.from('live_events').update(liveForm).eq('id', activeLive.id)
      } else {
          const { data: liveData } = await supabase.from('live_events').insert({ 
              // @ts-ignore
              user_id: user?.id, ...liveForm 
          }).select().single()
          
          // SINCRONIZZAZIONE AGENDA
          if(liveData) {
              const endTime = new Date(new Date(liveForm.start_time).getTime() + 60*60000).toISOString()
              await supabase.from('appointments').insert({
                  // @ts-ignore
                  user_id: user?.id,
                  title: `🎥 LIVE: ${liveForm.title}`, start_time: liveForm.start_time, end_time: endTime, type: 'live', notes: liveForm.platform_link
              })
          }
      }
      fetchData(); setIsLiveModalOpen(false)
  }

  // --- DATI FINTI PER GRAFICI (Mockup finché non ci sono dati reali) ---
  const statsData = agents.length > 0 ? agents.map(a => ({
      name: a.name, progress: Math.floor(Math.random() * 100), quiz: Math.floor(Math.random() * 10) * 10
  })) : [{name: 'Esempio A', progress: 80, quiz: 90}, {name: 'Esempio B', progress: 40, quiz: 60}]

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento LMS Enterprise...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* HEADER & LIMITI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Academy & Training</h1>
          <p className="text-gray-500 text-sm">Piattaforma di Formazione per la tua Rete Vendita.</p>
        </div>
        
        {/* BARRA LIMITI */}
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-6 text-xs font-bold">
            <div className="text-center">
                <span className="text-gray-400 block mb-1">Corsi Attivi</span>
                <span className={`px-2 py-1 rounded ${courses.length >= LIMITS.courses ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {courses.length} / {LIMITS.courses}
                </span>
            </div>
            <div className="w-[1px] h-8 bg-gray-200"></div>
            <div className="text-center">
                <span className="text-gray-400 block mb-1">Piano</span>
                <span className="text-[#00665E] uppercase">{userPlan}</span>
            </div>
        </div>

        <div className="flex gap-2">
            <button onClick={() => { setActiveLive(null); setLiveForm({title:'', start_time:'', platform_link:'', description:''}); setIsLiveModalOpen(true) }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 text-sm"><Video size={18}/> Crea Live</button>
            <button onClick={() => openCourseModal(null)} className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm"><Plus size={18}/> Nuovo Corso</button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Corsi ({courses.length})</button>
        <button onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Dirette ({liveEvents.length})</button>
      </div>

      {activeTab === 'courses' ? (
          <div className="grid grid-cols-1 gap-6">
              {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-md transition">
                      <div className="md:w-64 h-48 md:h-auto bg-gray-200 relative shrink-0 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover" />
                          <button onClick={() => openCourseModal(course)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:text-[#00665E] shadow-sm group-hover:scale-110 transition"><Edit size={16}/></button>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                          <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bold text-xl text-gray-900">{course.title}</h3>
                                {course.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">Obbligatorio</span>}
                             </div>
                             <div className="text-right">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600">{course.lessons?.length} Lez.</span>
                             </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-2">{course.description}</p>
                          
                          {/* Pulsanti Azione */}
                          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                              <button onClick={() => { setActiveCourse(course); setIsLessonModalOpen(true); }} className="btn-sec"><Plus size={14}/> Lezioni</button>
                              <button onClick={() => { setActiveCourse(course); setIsAssignModalOpen(true); }} className="btn-sec"><Users size={14}/> Assegna</button>
                              <button onClick={() => { setActiveCourse(course); setIsQuizModalOpen(true); }} className="btn-sec"><BookOpen size={14}/> Quiz</button>
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

      {/* --- MODALE MONITORAGGIO (GRAFICI) --- */}
      {isStatsModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-4xl">
                  <h2 className="text-xl font-black mb-6">Monitoraggio: {activeCourse?.title}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div className="h-64 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Progresso Completamento</h4>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={statsData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                                  <Bar dataKey="progress" fill="#00665E" radius={[4, 4, 0, 0]} barSize={30} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <div className="h-64 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Performance Quiz</h4>
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={statsData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                  <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                                  <Bar dataKey="quiz" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={30} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                  <button onClick={() => setIsStatsModalOpen(false)} className="btn-sec w-full">Chiudi Monitoraggio</button>
              </div>
          </div>
      )}

      {/* --- MODALE CORSO (CREA/MODIFICA + ANTEPRIMA) --- */}
      {isCourseModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black">{activeCourse ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
                    <button onClick={() => setIsCourseModalOpen(false)}><X size={20} className="text-gray-400"/></button>
                 </div>

                 {/* ANTEPRIMA CONTENUTI ESISTENTI */}
                 {activeCourse && (
                     <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                         <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2"><Eye size={14}/> Contenuti Caricati</h4>
                         <ul className="space-y-1 text-xs text-blue-900">
                             <li>📺 <strong>{activeCourse.lessons?.length || 0}</strong> Lezioni Video</li>
                             <li>📝 <strong>{activeCourse.quizzes?.length || 0}</strong> Quiz Creati</li>
                             <li>📂 <strong>{activeCourse.attachment_url ? 'Dispensa PDF Presente ✅' : 'Nessuna Dispensa ❌'}</strong></li>
                         </ul>
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

      {/* --- MODALE LEZIONE --- */}
      {isLessonModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">Aggiungi Lezione</h2>
                 <input className="input mb-4" placeholder="Titolo Lezione" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                 <div className="flex gap-4 mb-4">
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'youtube'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'youtube' ? 'bg-red-50 border-red-500 text-red-600' : ''}`}>YouTube</button>
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'upload'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'upload' ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}`}>Upload (100MB)</button>
                 </div>
                 {lessonForm.video_type === 'youtube' ? <input className="input mb-4" placeholder="Link YouTube" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} /> : <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-dashed"><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>}
                 
                 <div className="flex items-center gap-2 mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                     <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} />
                     <p className="text-xs text-yellow-800 font-bold">Dichiaro di possedere i diritti e la titolarità del contenuto video caricato.</p>
                 </div>
                 
                 <button onClick={handleSaveLesson} disabled={uploading} className="btn-pri w-full">Salva Lezione</button>
                 <button onClick={() => setIsLessonModalOpen(false)} className="btn-sec w-full mt-2">Chiudi</button>
             </div>
          </div>
      )}

      {/* --- MODALE QUIZ --- */}
      {isQuizModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content max-w-2xl">
                  <h2 className="text-xl font-black mb-4">Crea Test Finale</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <input className="input" placeholder="Titolo Quiz" value={quizForm.title} onChange={e=>setQuizForm({...quizForm, title: e.target.value})}/>
                      <input type="number" className="input" placeholder="Punteggio Minimo" value={quizForm.passing_score} onChange={e=>setQuizForm({...quizForm, passing_score: Number(e.target.value)})}/>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl mb-4 max-h-40 overflow-y-auto">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Domande ({questions.length})</p>
                      {questions.map((q,i) => (
                          <div key={i} className="text-sm border-b p-2"><b>{i+1}.</b> {q.question_text} <span className="text-green-600 text-xs ml-2">(Risp: {q.options[q.correct_option_index]})</span></div>
                      ))}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                      <input className="input mb-2" placeholder="Domanda..." value={newQuestion.text} onChange={e=>setNewQuestion({...newQuestion, text: e.target.value})} />
                      <div className="grid grid-cols-3 gap-2 mb-2">
                          <input className="input" placeholder="Risp A" value={newQuestion.option1} onChange={e=>setNewQuestion({...newQuestion, option1: e.target.value})}/>
                          <input className="input" placeholder="Risp B" value={newQuestion.option2} onChange={e=>setNewQuestion({...newQuestion, option2: e.target.value})}/>
                          <input className="input" placeholder="Risp C" value={newQuestion.option3} onChange={e=>setNewQuestion({...newQuestion, option3: e.target.value})}/>
                      </div>
                      <select className="input" value={newQuestion.correct} onChange={e=>setNewQuestion({...newQuestion, correct: Number(e.target.value)})}> <option value={0}>A è Corretta</option><option value={1}>B è Corretta</option><option value={2}>C è Corretta</option></select>
                      <button onClick={handleAddQuestion} className="btn-sec w-full mt-2 bg-white text-blue-600 border-blue-200">Aggiungi Domanda</button>
                  </div>
                  
                  <div className="flex gap-2"><button onClick={()=>setIsQuizModalOpen(false)} className="btn-sec flex-1">Chiudi</button><button onClick={handleSaveQuiz} className="btn-pri flex-1">Salva Quiz</button></div>
              </div>
          </div>
      )}

      {/* --- MODALE LIVE --- */}
      {isLiveModalOpen && (
          <div className="modal-overlay">
             <div className="modal-content max-w-lg">
                 <h2 className="text-xl font-black mb-4">Configura Diretta</h2>
                 <input className="input mb-2" placeholder="Titolo" value={liveForm.title} onChange={e => setLiveForm({...liveForm, title: e.target.value})} />
                 <input type="datetime-local" className="input mb-2" value={liveForm.start_time} onChange={e => setLiveForm({...liveForm, start_time: e.target.value})} />
                 <input className="input mb-4" placeholder="Link Piattaforma (Zoom/Meet)" value={liveForm.platform_link} onChange={e => setLiveForm({...liveForm, platform_link: e.target.value})} />
                 <button onClick={handleSaveLive} className="btn-primary w-full bg-[#00665E] text-white p-3 rounded-lg font-bold">Salva e Sincronizza Agenda</button>
                 <button onClick={() => setIsLiveModalOpen(false)} className="btn-secondary w-full mt-2 p-3 border rounded-lg">Annulla</button>
             </div>
          </div>
      )}

      {/* --- STILI CSS --- */}
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); padding: 1rem; }
        .modal-content { background: white; padding: 2rem; border-radius: 1.5rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: zoomIn 0.2s ease-out; position: relative; max-height: 90vh; overflow-y: auto; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 0.875rem; }
        .input:focus { border-color: #00665E; box-shadow: 0 0 0 3px rgba(0, 102, 94, 0.1); }
        .label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; }
        .btn-pri { background: #00665E; color: white; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-pri:hover { background: #004d46; }
        .btn-sec { background: white; color: #475569; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.75rem; cursor: pointer; }
        .btn-sec:hover { background: #f1f5f9; border-color: #cbd5e1; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </main>
  )
}