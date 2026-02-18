'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, UploadCloud, Youtube, Clock, Trash2, Video, FileText, 
  Calendar, CheckCircle, AlertTriangle, Monitor, BookOpen, PenTool, Layout
} from 'lucide-react'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('Base') 
  
  // MODALI
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null)
  
  // FORM CORSO
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
  
  // FORM LEZIONE
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false) // Checkbox Privacy & Copyright
  
  // FORM LIVE
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', platform_link: '', description: '' })

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;
    
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if(profile) setUserPlan(profile.plan || 'Base')

    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*)').order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    const { data: liveData } = await supabase.from('live_events').select('*').order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)
    
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

  // --- SAVE CORSO ---
  const handleSaveCourse = async () => {
      if(!courseForm.title) return alert("Titolo obbligatorio");
      if(userPlan === 'Base' && courses.length >= 3) return alert("⛔ Limite Piano Base raggiunto: Max 3 Corsi. Passa a Enterprise.");

      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('courses').insert({
          user_id: user?.id,
          ...courseForm,
          thumbnail_url: courseForm.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=60'
      }).select().single()

      if(data) {
          setCourses([ { ...data, lessons: [] }, ...courses ])
          setIsCourseModalOpen(false); 
          setCourseForm({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
      }
  }

  // --- SAVE LEZIONE ---
  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("⚠️ DEVI confermare di essere titolare dei diritti del video (Copyright/Privacy).");
      
      const currentCourse = courses.find(c => c.id === activeCourseId)
      // Controllo Limite Lezioni (10 per Base)
      if (userPlan === 'Base' && (currentCourse?.lessons?.length || 0) >= 10) return alert("⛔ Limite Lezioni raggiunto (Max 10 per corso nel Piano Base).");

      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          // Limite 100MB per video upload
          const url = await handleUpload(videoFile, 'video', 100) 
          if(!url) return;
          finalUrl = url;
      }

      const { data } = await supabase.from('lessons').insert({
          course_id: activeCourseId,
          title: lessonForm.title,
          video_type: lessonForm.video_type,
          video_url: finalUrl,
          notes: lessonForm.notes
      }).select().single()

      if (data) {
          setCourses(courses.map(c => c.id === activeCourseId ? { ...c, lessons: [...c.lessons, data] } : c))
          setIsLessonModalOpen(false); setLessonForm({title:'', video_type:'youtube', video_url:'', notes:''}); setPrivacyAccepted(false); setVideoFile(null);
      }
  }

  // --- SAVE LIVE EVENT ---
  const handleSaveLive = async () => {
      // Limite 2 Live per Base
      if(userPlan === 'Base' && liveEvents.length >= 2) return alert("⛔ Limite Eventi Live raggiunto (Max 2).");
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data } = await supabase.from('live_events').insert({
          user_id: user?.id, ...liveForm
      }).select().single()

      if(data) {
          setLiveEvents([...liveEvents, data]); setIsLiveModalOpen(false); setLiveForm({title:'', start_time:'', platform_link:'', description:''})
      }
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Piattaforma Formazione...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Academy & Formazione</h1>
          <p className="text-gray-500 text-sm">Gestisci l'apprendimento della tua rete vendita.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsLiveModalOpen(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 text-sm">
               <Video size={18}/> Crea Live
            </button>
            <button onClick={() => setIsCourseModalOpen(true)} className="bg-[#00665E] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2 text-sm">
               <Plus size={18}/> Nuovo Corso
            </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-8">
        <button onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Video Corsi ({courses.length})</button>
        <button onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Eventi Live ({liveEvents.length})</button>
      </div>

      {activeTab === 'courses' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                      {/* Thumb Personalizzabile */}
                      <div className="h-40 bg-gray-200 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-gray-900 leading-tight">{course.title}</h3>
                              <div className="flex flex-col items-end gap-1">
                                  {course.is_mandatory && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">OBBLIGATORIO</span>}
                                  {course.deadline && <span className="text-[10px] text-gray-400">Scad: {new Date(course.deadline).toLocaleDateString()}</span>}
                              </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2">{course.description || "Nessuna descrizione."}</p>
                          
                          {/* Dispense PDF */}
                          {course.attachment_url && (
                              <a href={course.attachment_url} target="_blank" className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg mb-4 hover:bg-blue-100 border border-blue-100">
                                  <FileText size={14}/> <strong>Dispensa PDF/PPT</strong> (Materiale Didattico)
                              </a>
                          )}

                          <div className="flex-1 space-y-2 mb-4 max-h-40 overflow-y-auto pr-1 bg-gray-50 p-2 rounded-xl">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                                  <span>Lezioni ({course.lessons?.length || 0})</span>
                                  {/* Placeholder Lavagna/Quiz */}
                                  <span className="flex gap-1"><PenTool size={12}/> <BookOpen size={12}/></span>
                              </p>
                              {course.lessons?.map((lesson: any) => (
                                  <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-white border border-gray-100 rounded-lg group cursor-pointer hover:border-[#00665E]">
                                      {lesson.video_type === 'youtube' ? <Youtube size={16} className="text-red-600 shrink-0"/> : <Video size={16} className="text-blue-600 shrink-0"/>}
                                      <span className="truncate flex-1 text-xs font-medium">{lesson.title}</span>
                                      <a href={lesson.video_url} target="_blank" className="text-[#00665E]"><Play size={14}/></a>
                                  </div>
                              ))}
                          </div>

                          <button onClick={() => { setActiveCourseId(course.id); setIsLessonModalOpen(true); }} className="w-full border border-[#00665E] text-[#00665E] py-2 rounded-xl text-sm font-bold hover:bg-[#00665E] hover:text-white transition flex items-center justify-center gap-2">
                              <Plus size={16}/> Aggiungi Lezione
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      ) : (
          <div className="space-y-4">
              {liveEvents.length === 0 && <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-gray-400">Nessuna diretta programmata. Crea la prima!</div>}
              {liveEvents.map(event => (
                  <div key={event.id} className="bg-white p-6 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-5">
                          <div className="bg-red-50 p-4 rounded-2xl text-red-600 border border-red-100"><Monitor size={32}/></div>
                          <div>
                              <h3 className="font-bold text-xl text-gray-900">{event.title}</h3>
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                  <Clock size={14}/> {new Date(event.start_time).toLocaleString('it-IT')} • Durata Max: 60 min
                              </p>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold mt-2 inline-block">PROGRAMMATA</span>
                          </div>
                      </div>
                      <a href={event.platform_link} target="_blank" className="bg-[#00665E] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#004d46] shadow-lg">Partecipa alla Live</a>
                  </div>
              ))}
          </div>
      )}

      {/* --- MODALE CORSO (Impostazioni Avanzate) --- */}
      {isCourseModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setIsCourseModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-4">Configurazione Corso</h2>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs font-bold text-gray-500">Titolo Corso</label>
                         <input className="w-full p-3 border rounded-xl mt-1" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500">Descrizione & Obiettivi</label>
                         <textarea className="w-full p-3 border rounded-xl h-24 mt-1" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="text-xs font-bold text-gray-500">Obbligatorio?</label><select className="w-full p-3 border rounded-xl mt-1" onChange={e => setCourseForm({...courseForm, is_mandatory: e.target.value === 'true'})}><option value="false">Facoltativo</option><option value="true">Obbligatorio</option></select></div>
                         <div><label className="text-xs font-bold text-gray-500">Scadenza</label><input type="date" className="w-full p-3 border rounded-xl mt-1" onChange={e => setCourseForm({...courseForm, deadline: e.target.value})} /></div>
                     </div>

                     <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                         <p className="text-xs font-bold mb-2">Immagine Copertina Personalizzata</p>
                         <input type="file" accept="image/*" onChange={async (e) => {
                             if(e.target.files?.[0]) {
                                 const url = await handleUpload(e.target.files[0], 'images', 2);
                                 if(url) setCourseForm({...courseForm, thumbnail_url: url})
                             }
                         }} />
                     </div>

                     <div className="bg-blue-50 p-4 rounded-xl border border-dashed border-blue-200">
                         <p className="text-xs font-bold mb-2 text-blue-700">Dispensa (PDF/PPT - Max 50MB)</p>
                         <input type="file" accept=".pdf,.ppt,.pptx" onChange={async (e) => {
                             if(e.target.files?.[0]) {
                                 const url = await handleUpload(e.target.files[0], 'docs', 50);
                                 if(url) setCourseForm({...courseForm, attachment_url: url})
                             }
                         }} />
                     </div>

                     <button onClick={handleSaveCourse} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Salva Corso</button>
                 </div>
             </div>
          </div>
      )}

      {/* --- MODALE LEZIONE (Con Check Privacy) --- */}
      {isLessonModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl relative">
                 <button onClick={() => setIsLessonModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-4">Nuova Lezione</h2>
                 <input className="w-full p-3 border rounded-xl mb-4" placeholder="Titolo Lezione" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                 
                 <div className="flex gap-4 mb-4">
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'youtube'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'youtube' ? 'bg-red-50 border-red-500 text-red-600' : ''}`}>YouTube</button>
                     <button onClick={() => setLessonForm({...lessonForm, video_type: 'upload'})} className={`flex-1 p-2 border rounded-lg text-sm font-bold ${lessonForm.video_type === 'upload' ? 'bg-blue-50 border-blue-500 text-blue-600' : ''}`}>Upload (100MB)</button>
                 </div>

                 {lessonForm.video_type === 'youtube' ? (
                     <input className="w-full p-3 border rounded-xl mb-4" placeholder="https://youtube.com/..." value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} />
                 ) : (
                     <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-dashed text-center">
                         <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                         <p className="text-xs text-gray-400 mt-1">Max 100MB</p>
                     </div>
                 )}

                 {/* PRIVACY ALERT OBBLIGATORIO */}
                 <div className="flex items-start gap-2 mb-6 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                     <input type="checkbox" className="mt-1 w-4 h-4" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} />
                     <div className="text-xs text-yellow-800">
                         <strong>Dichiarazione Privacy & Copyright:</strong>
                         <br/>Confermo di essere titolare dei diritti su questo contenuto o di avere l'autorizzazione per utilizzarlo. Il video non contiene materiale offensivo o illegale.
                     </div>
                 </div>

                 <button onClick={handleSaveLesson} disabled={uploading} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">{uploading ? 'Caricamento...' : 'Aggiungi Lezione'}</button>
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
                     <p className="text-xs text-gray-400">Max durata: 60 minuti (Piano Base)</p>
                     <button onClick={handleSaveLive} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Salva Evento</button>
                 </div>
             </div>
          </div>
      )}

    </main>
  )
}