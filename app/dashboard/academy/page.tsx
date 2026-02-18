'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, UploadCloud, Youtube, Clock, Trash2, Video, FileText, 
  Calendar, CheckCircle, AlertTriangle, Monitor, BookOpen, PenTool, 
  Users, Award, Edit, Save, MoreHorizontal, FileCheck
} from 'lucide-react'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([]) // Caricati dalla tabella agenti
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // MODALI
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  
  // STATI DI SELEZIONE
  const [activeCourse, setActiveCourse] = useState<any>(null) // Corso in modifica
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])

  // FORMS
  const [courseForm, setCourseForm] = useState({ 
      title: '', description: '', category: 'Generale', 
      thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' 
  })
  
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', platform_link: '', description: '' })
  const [certForm, setCertForm] = useState({ title: 'Attestato di Eccellenza', signer: 'La Direzione', logo_show: true })

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
    
    // 1. Carica Corsi
    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*), course_assignments(*)').order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    // 2. Carica Live
    const { data: liveData } = await supabase.from('live_events').select('*').order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)

    // 3. Carica Agenti (Simulazione se tabella vuota, o fetch reale)
    // Qui dovresti fare fetch dalla tua tabella 'team_members' o 'agents'
    // Per ora usiamo dati dummy se non ci sono
    setAgents([
        { id: 1, name: 'Mario Rossi', email: 'mario@test.com' },
        { id: 2, name: 'Luca Bianchi', email: 'luca@test.com' }
    ])
    
    setLoading(false)
  }

  // --- GESTIONE UPLOAD ---
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

  // --- CRUD CORSI (Crea e Modifica) ---
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

      const payload = {
          user_id: user?.id,
          ...courseForm,
          thumbnail_url: courseForm.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=60'
      }

      if (activeCourse) {
          // UPDATE
          const { error } = await supabase.from('courses').update(payload).eq('id', activeCourse.id)
          if(!error) fetchData()
      } else {
          // INSERT
          const { error } = await supabase.from('courses').insert(payload)
          if(!error) fetchData()
      }
      setIsCourseModalOpen(false)
      setUploading(false)
  }

  // --- CRUD LEZIONI ---
  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("Conferma i diritti privacy.");
      
      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          const url = await handleUpload(videoFile, 'video', 100)
          if(!url) return;
          finalUrl = url;
      }

      const { error } = await supabase.from('lessons').insert({
          course_id: activeCourse.id,
          title: lessonForm.title,
          video_type: lessonForm.video_type,
          video_url: finalUrl,
          notes: lessonForm.notes
      })

      if(!error) {
          fetchData() // Ricarica tutto
          setIsLessonModalOpen(false)
      }
  }

  // --- ASSEGNAZIONE AGENTI ---
  const handleAssign = async () => {
      if(selectedAgents.length === 0) return alert("Seleziona almeno un agente.");
      const assignments = selectedAgents.map(email => ({
          course_id: activeCourse.id,
          agent_email: email,
          status: 'assigned',
          progress: 0
      }))
      
      const { error } = await supabase.from('course_assignments').insert(assignments)
      if(!error) {
          alert(`Corso assegnato a ${selectedAgents.length} agenti!`);
          setIsAssignModalOpen(false);
          setSelectedAgents([]);
      }
  }

  // --- LIVE + AGENDA SYNC ---
  const handleSaveLive = async () => {
      // 1. Salva Live
      const { data: liveData, error } = await supabase.from('live_events').insert({
          user_id: user?.id, ...liveForm
      }).select().single()

      if(!error && liveData) {
          // 2. Sincronizza con Agenda (Appointments)
          const endTime = new Date(new Date(liveForm.start_time).getTime() + 60*60000).toISOString() // +1 ora default
          await supabase.from('appointments').insert({
              user_id: user.id,
              title: `🎥 LIVE: ${liveForm.title}`,
              start_time: liveForm.start_time,
              end_time: endTime,
              type: 'live_stream',
              notes: `Link: ${liveForm.platform_link}`
          })
          
          fetchData()
          setIsLiveModalOpen(false)
          alert("Evento creato e aggiunto in Agenda!")
      }
  }

  // --- CONFIGURA ATTESTATO ---
  const handleSaveCert = async () => {
      const { error } = await supabase.from('courses').update({
          certificate_template: certForm
      }).eq('id', activeCourse.id)
      if(!error) { alert("Template Attestato Salvato!"); setIsCertModalOpen(false); }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento LMS...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-black text-[#00665E]">Academy Manager</h1><p className="text-gray-500 text-sm">Crea corsi, assegna agli agenti e monitora.</p></div>
        <div className="flex gap-2">
            <button onClick={() => setIsLiveModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 text-sm"><Video size={18}/> Crea Live</button>
            <button onClick={() => openCourseModal()} className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm"><Plus size={18}/> Nuovo Corso</button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Corsi Attivi ({courses.length})</button>
        <button onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Dirette ({liveEvents.length})</button>
      </div>

      {activeTab === 'courses' ? (
          <div className="space-y-6">
              {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col md:flex-row">
                      {/* THUMBNAIL */}
                      <div className="md:w-64 h-48 md:h-auto bg-gray-200 relative group shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                          <button onClick={() => openCourseModal(course)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-gray-700 hover:text-[#00665E] shadow-sm"><Edit size={16}/></button>
                      </div>
                      
                      {/* CONTENT */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-xl text-gray-900">{course.title}</h3>
                                  <div className="flex gap-2">
                                      {course.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">OBBLIGATORIO</span>}
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">{course.lessons?.length || 0} Lezioni</span>
                                  </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                              
                              {/* STATUS BARRA MONITORAGGIO */}
                              <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                      <span>Assegnato a {course.course_assignments?.length || 0} Agenti</span>
                                      <span>Completamento Medio: 0%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full w-0"></div></div>
                              </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                              <button onClick={() => { setActiveCourse(course); setIsLessonModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100">
                                  <Plus size={14}/> Aggiungi Lezione
                              </button>
                              <button onClick={() => { setActiveCourse(course); setIsAssignModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100">
                                  <Users size={14}/> Assegna ad Agenti
                              </button>
                              <button onClick={() => { setActiveCourse(course); setIsCertModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-100">
                                  <Award size={14}/> Configura Attestato
                              </button>
                              <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100">
                                  <BookOpen size={14}/> Quiz & Lavagna
                              </button>
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
                          <div className="bg-red-50 p-4 rounded-2xl text-red-600"><Monitor size={24}/></div>
                          <div>
                              <h3 className="font-bold text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-500">{new Date(event.start_time).toLocaleString()} • {event.duration_minutes} min</p>
                          </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">In Agenda ✅</span>
                  </div>
              ))}
          </div>
      )}

      {/* --- MODALE CORSO (CREA / MODIFICA) --- */}
      {isCourseModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setIsCourseModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-4">{activeCourse ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
                 
                 <div className="space-y-4">
                     <input className="w-full p-3 border rounded-xl" placeholder="Titolo Corso" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                     <textarea className="w-full p-3 border rounded-xl h-24" placeholder="Descrizione..." value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                     
                     <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                         <p className="text-xs font-bold mb-2">📸 Copertina Personalizzata (Carica o Cambia)</p>
                         <input type="file" accept="image/*" onChange={async (e) => {
                             if(e.target.files?.[0]) {
                                 const url = await handleUpload(e.target.files[0], 'images', 2);
                                 if(url) setCourseForm({...courseForm, thumbnail_url: url})
                             }
                         }} />
                         {courseForm.thumbnail_url && <p className="text-[10px] text-green-600 mt-1">✅ Immagine caricata</p>}
                     </div>

                     <div className="bg-blue-50 p-4 rounded-xl border border-dashed border-blue-200">
                         <p className="text-xs font-bold mb-2 text-blue-700">📂 Dispensa PDF (Max 50MB)</p>
                         <input type="file" accept=".pdf,.ppt,.pptx" onChange={async (e) => {
                             if(e.target.files?.[0]) {
                                 const url = await handleUpload(e.target.files[0], 'docs', 50);
                                 if(url) setCourseForm({...courseForm, attachment_url: url})
                             }
                         }} />
                         {courseForm.attachment_url && <p className="text-[10px] text-blue-600 mt-1">✅ Dispensa pronta</p>}
                     </div>

                     <button onClick={handleSaveCourse} disabled={uploading} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">{uploading ? 'Caricamento...' : 'Salva Corso'}</button>
                 </div>
             </div>
          </div>
      )}

      {/* --- MODALE ASSEGNAZIONE AGENTI --- */}
      {isAssignModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                 <h2 className="text-xl font-black mb-4">Assegna "{activeCourse?.title}"</h2>
                 <p className="text-xs text-gray-500 mb-4">Seleziona chi deve seguire questo corso obbligatoriamente.</p>
                 
                 <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                     {agents.map(agent => (
                         <label key={agent.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                             <input type="checkbox" className="w-5 h-5 accent-[#00665E]" 
                                 onChange={e => {
                                     if(e.target.checked) setSelectedAgents([...selectedAgents, agent.email])
                                     else setSelectedAgents(selectedAgents.filter(em => em !== agent.email))
                                 }}
                             />
                             <div>
                                 <p className="font-bold text-sm">{agent.name}</p>
                                 <p className="text-xs text-gray-400">{agent.email}</p>
                             </div>
                         </label>
                     ))}
                 </div>
                 <div className="flex gap-2">
                     <button onClick={() => setIsAssignModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs">Annulla</button>
                     <button onClick={handleAssign} className="flex-1 bg-[#00665E] text-white py-3 rounded-xl font-bold text-xs">Conferma Assegnazione</button>
                 </div>
             </div>
          </div>
      )}

      {/* --- MODALE ATTESTATO --- */}
      {isCertModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                 <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Award className="text-yellow-500"/> Configura Attestato</h2>
                 <div className="space-y-4">
                     <div><label className="text-xs font-bold text-gray-500">Titolo Attestato</label><input className="w-full p-2 border rounded-lg" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} /></div>
                     <div><label className="text-xs font-bold text-gray-500">Firma (Nome Azienda/CEO)</label><input className="w-full p-2 border rounded-lg" value={certForm.signer} onChange={e => setCertForm({...certForm, signer: e.target.value})} /></div>
                     <div className="flex items-center gap-2"><input type="checkbox" checked={certForm.logo_show} onChange={e => setCertForm({...certForm, logo_show: e.target.checked})}/> <span className="text-sm">Mostra Logo Aziendale</span></div>
                     
                     <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                         <p className="font-serif text-xl font-bold text-gray-800">{certForm.title}</p>
                         <p className="text-xs text-gray-500 my-2">Si certifica che [Nome Agente] ha completato...</p>
                         <p className="font-cursive text-lg text-[#00665E]">{certForm.signer}</p>
                     </div>

                     <button onClick={handleSaveCert} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Salva Template</button>
                 </div>
                 <button onClick={() => setIsCertModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
             </div>
          </div>
      )}

      {/* --- MODALE LIVE --- */}
      {isLiveModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
                 <button onClick={() => setIsLiveModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-4">Programma Diretta</h2>
                 <div className="space-y-4">
                     <input className="w-full p-3 border rounded-xl" placeholder="Titolo Evento" value={liveForm.title} onChange={e => setLiveForm({...liveForm, title: e.target.value})} />
                     <input type="datetime-local" className="w-full p-3 border rounded-xl" value={liveForm.start_time} onChange={e => setLiveForm({...liveForm, start_time: e.target.value})} />
                     <input className="w-full p-3 border rounded-xl" placeholder="Link Piattaforma (Zoom/Meet/YouTube)" value={liveForm.platform_link} onChange={e => setLiveForm({...liveForm, platform_link: e.target.value})} />
                     <button onClick={handleSaveLive} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Salva e Aggiungi in Agenda</button>
                 </div>
             </div>
          </div>
      )}

    </main>
  )
}