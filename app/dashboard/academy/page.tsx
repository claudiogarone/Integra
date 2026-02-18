'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, UploadCloud, Youtube, Clock, Trash2, Layout, Video, FileVideo, CheckCircle 
} from 'lucide-react'

export default function AcademyPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('Base') // Default Base
  
  // STATI MODALI
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null)
  
  // FORM CORSO
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseDesc, setNewCourseDesc] = useState('')

  // FORM LEZIONE
  const [lessonTitle, setLessonTitle] = useState('')
  const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube')
  const [videoUrl, setVideoUrl] = useState('') // Per YouTube
  const [videoFile, setVideoFile] = useState<File | null>(null) // Per Upload
  const [uploading, setUploading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) return;
    
    // Carica Profilo (per il piano)
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    if(profile) setUserPlan(profile.plan || 'Base')

    // Carica Corsi e Lezioni
    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*)')
    if(coursesData) setCourses(coursesData)
    
    setLoading(false)
  }

  // --- CREA CORSO ---
  const handleCreateCourse = async () => {
      if(!newCourseTitle) return alert("Inserisci un titolo");
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase.from('courses').insert({
          user_id: user?.id,
          title: newCourseTitle,
          description: newCourseDesc,
          category: 'Generale',
          thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60' // Placeholder
      }).select().single()

      if(data) {
          setCourses([...courses, { ...data, lessons: [] }])
          setIsCourseModalOpen(false); setNewCourseTitle(''); setNewCourseDesc('');
      }
  }

  // --- CREA LEZIONE (Cuore della logica) ---
  const handleAddLesson = async () => {
      // 1. Controlli Limiti Piano Base
      const currentCourse = courses.find(c => c.id === activeCourseId)
      if (userPlan === 'Base' && (currentCourse?.lessons?.length || 0) >= 10) {
          return alert("⚠️ Limite Piano Base Raggiunto (Max 10 lezioni). Passa a Enterprise!")
      }

      setUploading(true)
      let finalUrl = videoUrl

      // 2. Gestione Upload File (Max 300MB)
      if (videoType === 'upload') {
          if (!videoFile) { setUploading(false); return alert("Seleziona un file video."); }
          
          // Controllo 300MB (300 * 1024 * 1024 bytes)
          if (videoFile.size > 300 * 1024 * 1024) {
              setUploading(false); return alert("⚠️ File troppo grande! Max 300MB per il piano Base.");
          }

          const fileName = `${Date.now()}_${videoFile.name}`
          const { error: uploadError } = await supabase.storage.from('course_videos').upload(fileName, videoFile)
          
          if (uploadError) { setUploading(false); return alert("Errore upload: " + uploadError.message); }
          
          const { data: { publicUrl } } = supabase.storage.from('course_videos').getPublicUrl(fileName)
          finalUrl = publicUrl
      }

      // 3. Salvataggio Database
      const { data, error } = await supabase.from('lessons').insert({
          course_id: activeCourseId,
          title: lessonTitle,
          video_type: videoType,
          video_url: finalUrl
      }).select().single()

      if (data) {
          // Aggiorna stato locale
          const updatedCourses = courses.map(c => {
              if (c.id === activeCourseId) {
                  return { ...c, lessons: [...(c.lessons || []), data] }
              }
              return c
          })
          setCourses(updatedCourses)
          setIsLessonModalOpen(false)
          setLessonTitle(''); setVideoUrl(''); setVideoFile(null);
      }
      setUploading(false)
  }

  const handleDeleteCourse = async (id: number) => {
      if(!confirm("Eliminare corso e lezioni?")) return;
      await supabase.from('courses').delete().eq('id', id)
      setCourses(courses.filter(c => c.id !== id))
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Academy...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#00665E]">Academy & Formazione</h1>
          <p className="text-gray-500 text-sm">Carica corsi per la tua rete vendita.</p>
        </div>
        <button onClick={() => setIsCourseModalOpen(true)} className="bg-[#00665E] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#004d46] shadow-lg flex items-center gap-2">
           <Plus size={20}/> Nuovo Corso
        </button>
      </div>

      {/* LISTA CORSI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 && (
              <div className="col-span-3 text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                  <Video size={48} className="mx-auto text-gray-300 mb-4"/>
                  <h3 className="text-xl font-bold text-gray-900">Nessun corso attivo</h3>
                  <p className="text-gray-500 text-sm">Inizia creando il primo modulo formativo.</p>
              </div>
          )}

          {courses.map(course => (
              <div key={course.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
                  {/* COPERTINA */}
                  <div className="h-40 bg-gray-200 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      <button onClick={() => handleDeleteCourse(course.id)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded hover:bg-red-500"><Trash2 size={14}/></button>
                  </div>
                  
                  {/* INFO */}
                  <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2">{course.description || "Nessuna descrizione."}</p>
                      
                      {/* LISTA LEZIONI */}
                      <div className="flex-1 space-y-2 mb-4">
                          {course.lessons && course.lessons.length > 0 ? (
                              course.lessons.map((lesson: any) => (
                                  <div key={lesson.id} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-gray-50 rounded-lg group cursor-pointer hover:bg-gray-100">
                                      {lesson.video_type === 'youtube' ? <Youtube size={16} className="text-red-600"/> : <FileVideo size={16} className="text-blue-600"/>}
                                      <span className="truncate flex-1">{lesson.title}</span>
                                      <a href={lesson.video_url} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 text-[#00665E]"><Play size={14}/></a>
                                  </div>
                              ))
                          ) : (
                              <p className="text-xs text-gray-400 italic">Nessuna lezione caricata.</p>
                          )}
                      </div>

                      <button 
                          onClick={() => { setActiveCourseId(course.id); setIsLessonModalOpen(true); }} 
                          className="w-full border border-[#00665E] text-[#00665E] py-2 rounded-xl text-sm font-bold hover:bg-[#00665E] hover:text-white transition flex items-center justify-center gap-2"
                      >
                          <Plus size={16}/> Aggiungi Lezione
                      </button>
                  </div>
              </div>
          ))}
      </div>

      {/* --- MODALE NUOVO CORSO --- */}
      {isCourseModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-md relative shadow-2xl animate-in zoom-in-95">
                 <button onClick={() => setIsCourseModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-4">Crea Corso</h2>
                 <input className="w-full p-3 border rounded-xl mb-3" placeholder="Titolo Corso (es. Tecniche di Vendita)" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} />
                 <textarea className="w-full p-3 border rounded-xl mb-4 h-24" placeholder="Descrizione..." value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} />
                 <button onClick={handleCreateCourse} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold">Salva Corso</button>
             </div>
          </div>
      )}

      {/* --- MODALE NUOVA LEZIONE --- */}
      {isLessonModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl w-full max-w-lg relative shadow-2xl animate-in zoom-in-95">
                 <button onClick={() => setIsLessonModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
                 <h2 className="text-xl font-black mb-1">Aggiungi Lezione</h2>
                 <p className="text-xs text-gray-500 mb-6">Piano {userPlan}: Max 10 link o 300MB upload.</p>
                 
                 <div className="mb-4">
                     <label className="text-xs font-bold uppercase text-gray-500">Titolo Lezione</label>
                     <input className="w-full p-3 border rounded-xl mt-1" placeholder="Es. Introduzione al prodotto" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} />
                 </div>

                 <div className="flex gap-4 mb-4">
                     <button onClick={() => setVideoType('youtube')} className={`flex-1 p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${videoType === 'youtube' ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white text-gray-500'}`}>
                         <Youtube size={18}/> Link YouTube
                     </button>
                     <button onClick={() => setVideoType('upload')} className={`flex-1 p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${videoType === 'upload' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white text-gray-500'}`}>
                         <UploadCloud size={18}/> Carica Video
                     </button>
                 </div>

                 {videoType === 'youtube' ? (
                     <div className="mb-6">
                         <label className="text-xs font-bold uppercase text-gray-500">Link YouTube</label>
                         <input className="w-full p-3 border rounded-xl mt-1" placeholder="https://youtube.com/..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                     </div>
                 ) : (
                     <div className="mb-6">
                         <label className="text-xs font-bold uppercase text-gray-500">File Video (Max 300MB)</label>
                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mt-1 hover:bg-gray-50 transition cursor-pointer relative">
                             <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                             {videoFile ? (
                                 <div className="text-green-600 font-bold flex items-center justify-center gap-2"><CheckCircle size={20}/> {videoFile.name}</div>
                             ) : (
                                 <div className="text-gray-400 text-sm">Clicca per caricare MP4, MOV...</div>
                             )}
                         </div>
                     </div>
                 )}

                 <button onClick={handleAddLesson} disabled={uploading} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                     {uploading ? 'Caricamento in corso...' : 'Salva Lezione'}
                 </button>
             </div>
          </div>
      )}

    </main>
  )
}