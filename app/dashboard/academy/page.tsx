'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
  Play, Plus, Video, FileText, Monitor, BookOpen, PenTool, 
  Users, Award, Edit, BarChart3, CheckSquare, Eye, X, 
  Trash2, Download, Palette, StickyNote, Printer, Link as LinkIcon, Clock, Building, Mail, ShieldAlert
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState<'courses' | 'live'>('courses')
  const [courses, setCourses] = useState<any[]>([])
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([]) 
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState('Base') 
  
  // Dati Globali Azienda (Dalle Impostazioni)
  const [companyProfile, setCompanyProfile] = useState<any>({ name: 'La Tua Azienda', logo: '' })
  const [user, setUser] = useState<any>(null)
  
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isCertModalOpen, setIsCertModalOpen] = useState(false)
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false)

  const [activeCourse, setActiveCourse] = useState<any>(null)
  const [activeLive, setActiveLive] = useState<any>(null)
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]) 
  const [statsFilter, setStatsFilter] = useState('all') 
  
  const [notesContent, setNotesContent] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const [courseForm, setCourseForm] = useState({ title: '', description: '', category: 'Generale', thumbnail_url: '', attachment_url: '', is_mandatory: false, deadline: '' })
  const [lessonForm, setLessonForm] = useState({ title: '', video_type: 'youtube', video_url: '', notes: '' })
  const [liveForm, setLiveForm] = useState({ title: '', start_time: '', duration_minutes: 60, platform_link: '', description: '' })
  const [certForm, setCertForm] = useState({ title: 'Attestato di Partecipazione', signer: 'La Direzione', logo_show: true })
  
  // STATI QUIZ (Aggiunto quizId per l'update)
  const [quizForm, setQuizForm] = useState({ id: null as number|null, title: 'Test Finale', passing_score: 70 })
  const [questions, setQuestions] = useState<any[]>([])
  const [newQuestion, setNewQuestion] = useState({ text: '', option1: '', option2: '', option3: '', correct: 0 })
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  
  const [sendingEmails, setSendingEmails] = useState(false)

  const supabase = createClient()
  
  // LIMITI PER PIANO
  const LIMITS = { 
      Base: { courses: 3, live: 2 },
      Enterprise: { courses: 20, live: 15 },
      Ambassador: { courses: 999, live: 999 }
  }

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    
    if (!currentUser) {
        setLoading(false);
        return;
    }
    setUser(currentUser);
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
    if(profile) {
        setUserPlan(profile.plan || 'Base')
        setCompanyProfile({
            name: profile.company_name || 'La Tua Azienda',
            logo: profile.logo_url || ''
        })
        setCertForm(prev => ({...prev, signer: profile.company_name ? `Direzione ${profile.company_name}` : 'La Direzione'}))
    }

    const { data: coursesData } = await supabase.from('courses').select('*, lessons(*), quizzes(*, quiz_questions(*)), course_progress(*)').eq('user_id', currentUser.id).order('created_at', {ascending: false})
    if(coursesData) setCourses(coursesData)

    const { data: liveData } = await supabase.from('live_events').select('*, live_attendance(*)').eq('user_id', currentUser.id).order('start_time', {ascending: true})
    if(liveData) setLiveEvents(liveData)

    const { data: teamData } = await supabase.from('team_members').select('*')
    if(teamData && teamData.length > 0) {
        setAgents(teamData)
    } else {
        setAgents([{ id: 1, name: 'Agente Demo 1', email: 'agente1@demo.it' }, { id: 2, name: 'Agente Demo 2', email: 'agente2@demo.it' }])
    }
    
    setLoading(false)
  }

  const canCreateCourse = () => {
      const limits = LIMITS[userPlan as keyof typeof LIMITS] || LIMITS.Base;
      if (courses.length >= limits.courses) {
          alert(`🛑 Limite Raggiunto: Il tuo piano ${userPlan} permette un massimo di ${limits.courses} corsi attivi. Fai un upgrade per sbloccare più spazio.`);
          return false;
      }
      return true;
  }

  const canCreateLive = () => {
      const limits = LIMITS[userPlan as keyof typeof LIMITS] || LIMITS.Base;
      if (liveEvents.length >= limits.live) {
          alert(`🛑 Limite Raggiunto: Il tuo piano ${userPlan} permette un massimo di ${limits.live} dirette attive. Fai un upgrade per sbloccare più spazio.`);
          return false;
      }
      return true;
  }

  const formatTime = (totalSeconds: number) => {
      if(!totalSeconds) return '0m';
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const handleUpload = async (file: File, folder: string, maxSizeMB: number) => {
      if (file.size > maxSizeMB * 1024 * 1024) { alert(`File troppo grande! Max ${maxSizeMB}MB.`); return null; }
      setUploading(true)
      const fileName = `${folder}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const { error } = await supabase.storage.from('products').upload(fileName, file) 
      setUploading(false)
      if (error) { alert("Errore upload: " + error.message); return null; }
      const { data } = supabase.storage.from('products').getPublicUrl(fileName)
      return data.publicUrl
  }

  const handleExportCSV = () => {
      const target = activeCourse || activeLive
      if(!target) return;
      const dataToExport = (activeTab === 'courses' ? target.course_progress : target.live_attendance)?.map((p: any) => {
          const agent = agents.find(a => a.email === p.agent_email)
          return {
              Agente: agent?.name || p.agent_email,
              Email: p.agent_email,
              Stato: (p.progress >= 100 || p.present) ? 'Completato' : 'In Corso',
              Progresso: activeTab === 'courses' ? `${p.progress}%` : (p.present ? 'Presente' : 'Assente'),
              Tempo_Studio: formatTime(p.time_spent_seconds)
          }
      }) || []
      if(dataToExport.length === 0) return alert("Nessun dato.");
      const headers = Object.keys(dataToExport[0]).join(",")
      const rows = dataToExport.map((row:any) => Object.values(row).join(",")).join("\n")
      const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `report_${target.title}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const openCourseModal = (course?: any) => {
      if (!course && !canCreateCourse()) return; 

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
          deadline: courseForm.deadline || null,
          thumbnail_url: courseForm.thumbnail_url || 'https://via.placeholder.com/800x400?text=Corso' 
      }
      let err = null;
      if (activeCourse) { const res = await supabase.from('courses').update(payload).eq('id', activeCourse.id); err = res.error; } 
      else { const res = await supabase.from('courses').insert(payload); err = res.error; }
      if(err) alert("Errore dal DB: " + err.message)
      else { fetchData(); setIsCourseModalOpen(false); }
      setUploading(false)
  }

  const handleDeleteItem = async (table: string, id: number) => {
      if(!confirm("Eliminare definitivamente?")) return;
      await supabase.from(table).delete().eq('id', id)
      fetchData()
      
      // FIX QUIZ: se eliminiamo una domanda dal database mentre siamo nel modale, aggiorniamo lo stato
      if(table === 'quiz_questions') {
          setQuestions(questions.filter(q => q.id !== id && q.tempId !== id))
      }
      if(table === 'lessons' && activeCourse) {
          const updatedLessons = activeCourse.lessons.filter((l:any) => l.id !== id);
          setActiveCourse({...activeCourse, lessons: updatedLessons});
      }
  }

  const handleSaveLesson = async () => {
      if(!privacyAccepted) return alert("Devi accettare la privacy.");
      let finalUrl = lessonForm.video_url
      if (lessonForm.video_type === 'upload' && videoFile) {
          const url = await handleUpload(videoFile, 'video', 100); if(!url) return; finalUrl = url;
      }
      await supabase.from('lessons').insert({ course_id: activeCourse.id, title: lessonForm.title, video_type: lessonForm.video_type, video_url: finalUrl, notes: lessonForm.notes })
      fetchData(); setIsLessonModalOpen(false)
  }

  const openLiveModal = (event?: any) => {
      if (!event && !canCreateLive()) return; 

      if (event) {
          setActiveLive(event)
          const formattedDate = new Date(event.start_time).toISOString().slice(0, 16);
          setLiveForm({ title: event.title, start_time: formattedDate, duration_minutes: event.duration_minutes || 60, platform_link: event.platform_link, description: event.description || '' })
      } else {
          setActiveLive(null)
          setLiveForm({ title: '', start_time: '', duration_minutes: 60, platform_link: '', description: '' })
      }
      setIsLiveModalOpen(true)
  }

  const handleSaveLive = async () => {
      if(!liveForm.title || !liveForm.start_time) return alert("Titolo e Data obbligatori");
      let err = null;

      if(activeLive) {
           const res = await supabase.from('live_events').update(liveForm).eq('id', activeLive.id)
           err = res.error
      } else {
          const res = await supabase.from('live_events').insert({ user_id: user.id, ...liveForm }).select().single()
          err = res.error
      }
      if(err) return alert("Errore salvataggio Live: " + err.message);

      const startDate = new Date(liveForm.start_time);
      const endDate = new Date(startDate.getTime() + (liveForm.duration_minutes * 60000));
      
      const dateString = startDate.toISOString().split('T')[0]; 
      const startTimeString = startDate.toTimeString().substring(0, 5); 
      const endTimeString = endDate.toTimeString().substring(0, 5); 

      const { data: existingCalEvent } = await supabase.from('calendar_events')
          .select('id').eq('title', `🎥 LIVE: ${activeLive?.title || liveForm.title}`).single();

      const calPayload = {
          title: `🎥 LIVE: ${liveForm.title}`,
          description: `Link Diretta: ${liveForm.platform_link}`,
          event_date: dateString,
          start_time: startTimeString,
          end_time: endTimeString,
          type: 'live',
          status: 'Scheduled'
      };

      if (existingCalEvent) {
          await supabase.from('calendar_events').update(calPayload).eq('id', existingCalEvent.id);
      } else {
          await supabase.from('calendar_events').insert([calPayload]);
      }

      fetchData(); setIsLiveModalOpen(false); alert("Evento salvato e sincronizzato in Agenda!")
  }

  const sendLiveReminders = async (event: any) => {
      const assignedAgents = event.live_attendance?.map((att:any) => agents.find(a => a.email === att.agent_email)).filter(Boolean) || agents;
      
      if (!confirm(`Vuoi inviare un'email di promemoria con il link al calendario a ${assignedAgents.length} agenti per l'evento "${event.title}"?`)) return;
      
      setSendingEmails(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      try {
          const res = await fetch('/api/academy/emails', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`
              },
              body: JSON.stringify({
                  type: 'reminder',
                  event: event,
                  agents: assignedAgents
              })
          });
          if(!res.ok) throw new Error("Errore API Invio");
          alert("✅ Promemoria inviati con successo!");
      } catch (err: any) {
          alert("Errore invio email.");
      } finally {
          setSendingEmails(false);
      }
  }

  const sendCertificatesEmail = async (event: any) => {
      const attendees = event.live_attendance?.filter((a:any) => a.present) || [];
      if(attendees.length === 0) return alert("Nessun utente segnato come 'Presente'. Aggiorna il Registro prima di inviare gli attestati.");
      
      if (!confirm(`Notificare i ${attendees.length} partecipanti via email che l'attestato è pronto?`)) return;
      setSendingEmails(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      try {
          const agentsToNotify = attendees.map((att:any) => agents.find(a => a.email === att.agent_email)).filter(Boolean);
          const res = await fetch('/api/academy/emails', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`
              },
              body: JSON.stringify({
                  type: 'certificate',
                  event: event,
                  agents: agentsToNotify
              })
          });
          if(!res.ok) throw new Error("Errore API Invio");
          alert("✅ Email con attestati inviate con successo ai presenti!");
      } catch (err: any) {
          alert("Errore invio email.");
      } finally {
          setSendingEmails(false);
      }
  }

  const openCertModal = (item: any) => {
      if(activeTab === 'courses') setActiveCourse(item); else setActiveLive(item);
      
      if(item.certificate_template) setCertForm(item.certificate_template)
      else setCertForm({ title: 'Attestato di Partecipazione', signer: `Direzione ${companyProfile.name}`, logo_show: true })
      setIsCertModalOpen(true)
  }
  
  const handleSaveCert = async () => {
      const table = activeTab === 'courses' ? 'courses' : 'live_events'
      const id = activeTab === 'courses' ? activeCourse.id : activeLive.id
      const { error } = await supabase.from(table).update({ certificate_template: certForm }).eq('id', id)
      if(!error) { alert("Template Attestato Salvato!"); setIsCertModalOpen(false); fetchData(); }
      else alert("Errore DB: " + error.message)
  }

  const handleAssign = async () => {
      if(selectedAgents.length === 0) return alert("Seleziona almeno un agente.");
      
      if (activeTab === 'courses') {
          const assignments = selectedAgents.map(email => ({ course_id: activeCourse.id, agent_email: email, progress: 0, status: 'assigned' }))
          const { error } = await supabase.from('course_progress').upsert(assignments, { onConflict: 'course_id, agent_email' })
          if(!error) { alert("Corso assegnato con successo!"); setIsAssignModalOpen(false); fetchData(); setSelectedAgents([]); }
          else alert("Errore dal Database: " + error.message)
      } else {
          const assignments = selectedAgents.map(email => ({ live_event_id: activeLive.id, agent_email: email, present: false, notes: 'Assegnato (Da partecipare)' }))
          const { error } = await supabase.from('live_attendance').upsert(assignments, { onConflict: 'live_event_id, agent_email' })
          if(!error) { alert("Agenti iscritti alla diretta con successo!"); setIsAssignModalOpen(false); fetchData(); setSelectedAgents([]); }
          else alert("Errore dal Database: " + error.message)
      }
  }

  const openAssignModal = (item: any) => {
      if(activeTab === 'courses') {
          setActiveCourse(item);
          const assigned = item.course_progress?.map((p:any) => p.agent_email) || [];
          setSelectedAgents(assigned);
      } else {
          setActiveLive(item);
          const assigned = item.live_attendance?.map((p:any) => p.agent_email) || [];
          setSelectedAgents(assigned);
      }
      setIsAssignModalOpen(true);
  }

  const apriRegistro = (event: any) => {
      setActiveLive(event)
      const existingAttendance = event.live_attendance || []
      const iscrittiEmails = existingAttendance.map((ea:any) => ea.agent_email);
      const targetAgents = agents.filter(a => iscrittiEmails.includes(a.email) || iscrittiEmails.length === 0);
      
      const state = targetAgents.map(a => {
          const found = existingAttendance.find((ea:any) => ea.agent_email === a.email)
          return { email: a.email, name: a.name, present: found ? found.present : false, notes: found ? found.notes : '' }
      })
      setSelectedAgents(state)
      setIsAttendanceModalOpen(true)
  }

  const handleSaveAttendance = async () => {
      const attendance = selectedAgents.map(a => ({ 
          live_event_id: activeLive.id, 
          agent_email: a.email, 
          present: a.present, 
          notes: a.notes || (a.present ? 'Presente confermato' : 'Assente') 
      }))
      if(attendance.length > 0) {
          const { error } = await supabase.from('live_attendance').upsert(attendance, { onConflict: 'live_event_id, agent_email' })
          if(!error) alert("Registro Presenze aggiornato!"); else alert("Errore DB: " + error.message)
      }
      setIsAttendanceModalOpen(false); setSelectedAgents([]); fetchData();
  }

  const getChartData = () => {
      const target = activeTab === 'courses' ? activeCourse : activeLive;
      const data = activeTab === 'courses' ? target?.course_progress : target?.live_attendance;
      if(!data) return [];
      let filtered = data;
      if(statsFilter !== 'all') filtered = data.filter((p:any) => p.agent_email === statsFilter);
      return filtered.map((p:any) => {
          const name = agents.find(a => a.email === p.agent_email)?.name || p.agent_email.split('@')[0]
          const isPresent = p.present === true;
          const prog = activeTab === 'courses' ? (p.progress || 0) : (isPresent ? 100 : 0);
          return { 
              name, 
              email: p.agent_email, 
              progress: prog, 
              present: isPresent, 
              quiz: p.quiz_score || 0,
              timeSpent: p.time_spent_seconds || 0,
              token: p.access_token
          }
      })
  }

  const openTools = async (item: any) => {
      if(activeTab === 'courses') setActiveCourse(item); else setActiveLive(item);
      const column = activeTab === 'courses' ? 'course_id' : 'live_event_id'
      const { data: noteData } = await supabase.from('course_materials').select('content').eq(column, item.id).eq('type', 'shared_note').single()
      setNotesContent(noteData?.content || '')
      const { data: boardData } = await supabase.from('course_materials').select('content').eq(column, item.id).eq('type', 'whiteboard').single()
      setIsToolsModalOpen(true)
      setTimeout(() => {
          if(boardData?.content && canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d')
              const img = new Image()
              img.onload = () => ctx?.drawImage(img, 0, 0)
              img.src = boardData.content
          }
      }, 200)
  }

  const saveTools = async () => {
      const column = activeTab === 'courses' ? 'course_id' : 'live_event_id'
      const id = activeTab === 'courses' ? activeCourse.id : activeLive.id
      const canvasData = canvasRef.current?.toDataURL() || ''

      await supabase.from('course_materials').delete().eq(column, id)
      
      const { error } = await supabase.from('course_materials').insert([
          { type: 'shared_note', content: notesContent, [column]: id },
          { type: 'whiteboard', content: canvasData, [column]: id }
      ])

      if(!error) alert("Lavagna e Note salvate! Lo studente potrà vederle.")
      else alert("Errore dal Database: " + error.message)
  }
  
  const startDrawing = (e: any) => { const ctx = canvasRef.current?.getContext('2d'); if(ctx) { ctx.beginPath(); ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); setIsDrawing(true); }}
  const draw = (e: any) => { if(!isDrawing) return; const ctx = canvasRef.current?.getContext('2d'); if(ctx) { ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY); ctx.stroke(); }}
  const stopDrawing = () => setIsDrawing(false)
  const clearCanvas = () => { const ctx = canvasRef.current?.getContext('2d'); if(ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }


  // ==========================================
  // LOGICA QUIZ COMPLETAMENTE FIXATA (Admin)
  // ==========================================
  const openQuizModal = (course: any) => {
      setActiveCourse(course);
      
      // Carica l'ultimo quiz creato per questo corso, se esiste
      const existingQuiz = course.quizzes && course.quizzes.length > 0 ? course.quizzes[course.quizzes.length - 1] : null;
      
      if (existingQuiz) {
          setQuizForm({ id: existingQuiz.id, title: existingQuiz.title, passing_score: existingQuiz.passing_score });
          // Carica le domande se ci sono
          if (existingQuiz.quiz_questions) {
              setQuestions(existingQuiz.quiz_questions);
          } else {
              setQuestions([]);
          }
      } else {
          // Resetta se non c'è quiz
          setQuizForm({ id: null, title: 'Test Finale', passing_score: 70 });
          setQuestions([]);
      }
      setNewQuestion({ text: '', option1: '', option2: '', option3: '', correct: 0 });
      setIsQuizModalOpen(true);
  }

  const handleSaveQuiz = async () => {
      if(!activeCourse) return;
      
      let quizIdToUse = quizForm.id;

      // 1. Salva o Aggiorna il Quiz principale
      if (quizIdToUse) {
          // Aggiorna esistente
          const { error } = await supabase.from('quizzes').update({ 
              title: quizForm.title, 
              passing_score: quizForm.passing_score 
          }).eq('id', quizIdToUse);
          if (error) return alert("Errore aggiornamento Quiz: " + error.message);
      } else {
          // Crea nuovo
          const { data: newQuiz, error } = await supabase.from('quizzes').insert({ 
              course_id: activeCourse.id, 
              title: quizForm.title, 
              passing_score: quizForm.passing_score 
          }).select().single();
          
          if (error) return alert("Errore creazione Quiz: " + error.message);
          quizIdToUse = newQuiz.id;
      }

      // 2. Salva le domande (cancelliamo le vecchie e inseriamo le nuove per evitare duplicati in questa versione semplificata)
      if (quizIdToUse) {
          // Elimina domande vecchie per questo quiz (clean slate)
          await supabase.from('quiz_questions').delete().eq('quiz_id', quizIdToUse);
          
          // Inserisci le nuove
          if (questions.length > 0) {
              const questionsToInsert = questions.map(q => ({ 
                  quiz_id: quizIdToUse, 
                  question_text: q.question_text, 
                  options: q.options, 
                  correct_option_index: q.correct_option_index 
              }));
              const { error: qError } = await supabase.from('quiz_questions').insert(questionsToInsert);
              if (qError) return alert("Errore salvataggio domande: " + qError.message);
          }
      }

      alert("✅ Quiz e Domande salvati correttamente nel Database!"); 
      setIsQuizModalOpen(false); 
      fetchData(); // Ricarica tutto per avere lo stato aggiornato
  }
  
  const handleAddQuestion = () => {
      if(!newQuestion.text || !newQuestion.option1 || !newQuestion.option2) return alert("Inserisci domanda e almeno DUE opzioni");
      
      const optionsArray = [newQuestion.option1, newQuestion.option2];
      if (newQuestion.option3) optionsArray.push(newQuestion.option3);

      // Usiamo un tempId per poterla rimuovere dall'interfaccia prima del salvataggio su DB
      const newQ = { 
          tempId: Date.now(),
          question_text: newQuestion.text, 
          options: optionsArray, 
          correct_option_index: Number(newQuestion.correct) 
      };
      
      setQuestions([...questions, newQ]);
      setNewQuestion({ text: '', option1: '', option2: '', option3: '', correct: 0 });
  }

  const handleRemoveQuestionFromUI = (indexToRemove: number) => {
      // Rimuove la domanda solo dalla UI (verrà cancellata dal DB quando si preme Salva Intero Quiz)
      setQuestions(questions.filter((_, idx) => idx !== indexToRemove));
  }


  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold">Sincronizzazione Academy...</div>

  const safeData = getChartData() || [];
  const validCertificates = safeData.filter((d:any) => d.progress >= 100 || d.present === true);
  if (validCertificates.length === 0) {
      validCertificates.push({ name: 'Mario Rossi (Demo)' });
  }

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* 🖨️ SEZIONE NASCOSTA: STAMPA MASSIVA ATTESTATI */}
      <div className="print-only">
          {validCertificates.map((certData:any, i:number) => {
              const target = activeTab === 'courses' ? activeCourse : activeLive;
              const template = target?.certificate_template || certForm; 
              if(!template) return null;
              return (
                 <div key={i} className="certificate-page flex items-center justify-center">
                     <div className="bg-white border-8 border-double border-gray-400 p-16 text-center relative flex flex-col justify-center items-center w-[1056px] h-[816px]">
                         <div className="absolute inset-0 flex items-center justify-center opacity-5"><Award size={400}/></div>
                         
                         {template.logo_show && (
                             companyProfile.logo ? (
                                <img src={companyProfile.logo} alt="Logo" className="h-24 object-contain mb-8 mx-auto relative z-10" crossOrigin="anonymous" />
                             ) : (
                                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-widest mb-8 relative z-10 flex items-center gap-2 justify-center"><Building size={28}/> {companyProfile.name}</h2>
                             )
                         )}

                         <h3 className="font-serif text-5xl font-black text-gray-800 tracking-widest leading-tight uppercase mb-8 relative z-10">{template.title}</h3>
                         <p className="text-gray-600 italic text-xl mb-4 relative z-10">Si certifica che</p>
                         <p className="font-bold text-4xl border-b-2 border-gray-400 pb-2 px-16 mb-8 text-[#00665E] uppercase relative z-10">{certData.name}</p>
                         <p className="text-gray-600 text-xl mb-4 relative z-10">ha completato con profitto {activeTab === 'live' ? 'la sessione live in:' : 'la formazione in:'}</p>
                         <p className="font-black text-gray-900 text-3xl uppercase mb-20 relative z-10">{target?.title || 'Formazione Continua'}</p>
                         
                         <div className="mt-auto w-72 mx-auto text-center relative z-10">
                             <p className="font-cursive text-4xl text-gray-800 leading-none mb-4" style={{fontFamily: "'Brush Script MT', cursive, sans-serif"}}>{template.signer}</p>
                             <div className="border-t-2 border-gray-500 w-full mb-2"></div>
                             <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">Firma Autorizzata</p>
                         </div>
                     </div>
                 </div>
              )
          })}
      </div>

      <div className="no-print animate-in fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3"><BookOpen size={28}/> Academy Aziendale</h1>
                <p className="text-gray-500 text-sm mt-1">Forma il tuo team o i tuoi clienti e rilascia attestati brandizzati <strong>{companyProfile.name}</strong>.</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
                <div className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-gray-500 border shadow-sm mr-2">
                    Piano: <span className="uppercase text-[#00665E]">{userPlan}</span> 
                    <span className="mx-2">|</span> 
                    Corsi: {courses.length}/{(LIMITS as any)[userPlan].courses} 
                    <span className="mx-2">|</span> 
                    Live: {liveEvents.length}/{(LIMITS as any)[userPlan].live}
                </div>
                <button type="button" onClick={() => openLiveModal()} className="bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-red-700 shadow-lg"><Video size={18}/> Crea Live</button>
                <button type="button" onClick={() => openCourseModal(null)} className="bg-[#00665E] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm hover:bg-[#004d46] shadow-lg"><Plus size={18}/> Nuovo Corso</button>
            </div>
          </div>

          <div className="flex gap-6 border-b border-gray-200 mb-8">
            <button type="button" onClick={() => setActiveTab('courses')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'courses' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Corsi in Piattaforma ({courses.length})</button>
            <button type="button" onClick={() => setActiveTab('live')} className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'live' ? 'border-[#00665E] text-[#00665E]' : 'border-transparent text-gray-400'}`}>Dirette Formative ({liveEvents.length})</button>
          </div>

          {activeTab === 'courses' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {courses.length === 0 && <p className="text-gray-400 italic py-10 col-span-full text-center">Nessun corso caricato. Creane uno per iniziare.</p>}
                  {courses.map(course => (
                      <div key={course.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row overflow-hidden hover:shadow-lg transition duration-300 group">
                          <div className="md:w-56 h-48 md:h-auto bg-gray-100 relative shrink-0">
                              <img src={course.thumbnail_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              <button type="button" onClick={() => openCourseModal(course)} className="absolute top-3 right-3 bg-white/90 p-2 rounded-full hover:text-[#00665E] shadow-sm"><Edit size={16}/></button>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h3 className="font-black text-xl text-gray-900 leading-tight">{course.title}</h3>
                                    {course.is_mandatory && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block tracking-widest">Obbligatorio</span>}
                                 </div>
                                 <span className="text-xs bg-gray-100 px-2 py-1 rounded-lg font-bold text-gray-600 shrink-0">{course.lessons?.length || 0} Lezioni</span>
                              </div>
                              <p className="text-sm text-gray-500 mb-6 line-clamp-2">{course.description}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
                                  <button type="button" onClick={() => { setActiveCourse(course); setIsLessonModalOpen(true); }} className="btn-sec"><Plus size={14}/> Add Lezione</button>
                                  <button type="button" onClick={() => openAssignModal(course)} className="btn-sec"><Users size={14}/> Assegna</button>
                                  <button type="button" onClick={() => openQuizModal(course)} className="btn-sec"><BookOpen size={14}/> Quiz</button>
                                  <button type="button" onClick={() => openTools(course)} className="btn-sec text-purple-600 bg-purple-50 border-purple-200"><PenTool size={14}/> Lavagna</button>
                                  <button type="button" onClick={() => { setActiveCourse(course); setIsStatsModalOpen(true); }} className="btn-sec bg-teal-50 text-teal-700 border-teal-100"><BarChart3 size={14}/> Analitica</button>
                                  <button type="button" onClick={() => { setActiveCourse(course); openCertModal(course); }} className="btn-sec bg-amber-50 text-amber-700 border-amber-200"><Award size={14}/> Modello Attestato</button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {liveEvents.length === 0 && <p className="text-gray-400 italic py-10 col-span-full text-center">Nessuna diretta programmata.</p>}
                  {liveEvents.map(event => (
                      <div key={event.id} className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-[#00665E] hover:shadow-lg transition duration-300 flex flex-col relative overflow-hidden">
                          
                          <div className="flex items-center gap-4 mb-4">
                              <div className="bg-red-50 p-4 rounded-2xl text-red-600 border border-red-100"><Monitor size={24}/></div>
                              <div>
                                  <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-1" title={event.title}>{event.title}</h3>
                                  <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(event.start_time).toLocaleString('it-IT', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})} ({event.duration_minutes} min)</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2 mb-6">
                              {event.platform_link && <a href={event.platform_link} target="_blank" className="flex-1 text-xs bg-blue-50 text-blue-600 py-2 rounded-xl font-bold text-center hover:bg-blue-100 transition truncate border border-blue-200 flex items-center justify-center">Entra in Stanza</a>}
                              <button onClick={() => sendLiveReminders(event)} disabled={sendingEmails} className="flex-[0.8] text-xs bg-gray-50 text-gray-600 py-2 rounded-xl font-bold text-center hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-1">
                                  <Mail size={12}/> Promemoria
                              </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-gray-100">
                              <button type="button" onClick={() => openAssignModal(event)} className="btn-sec text-xs"><Users size={14}/> Assegna / Invita</button>
                              <button type="button" onClick={() => apriRegistro(event)} className="btn-pri bg-green-600 hover:bg-green-700 border-none text-white text-xs"><CheckSquare size={14}/> Presenze</button>
                              <button type="button" onClick={() => openTools(event)} className="btn-sec text-purple-600 bg-purple-50 border-purple-200 text-xs"><PenTool size={14}/> Lavagna</button>
                              <button type="button" onClick={() => { setActiveLive(event); openCertModal(event); }} className="btn-sec bg-amber-50 text-amber-700 border-amber-200 text-xs"><Award size={14}/> Attestato</button>
                              <button type="button" onClick={() => { setActiveLive(event); setIsStatsModalOpen(true); }} className="col-span-2 btn-sec bg-teal-50 text-teal-700 border-teal-100 text-xs"><BarChart3 size={14}/> Cruscotto Analitico (Invia Attestati)</button>
                              <button type="button" onClick={() => openLiveModal(event)} className="col-span-2 btn-sec text-xs border-dashed"><Edit size={14}/> Modifica Impostazioni Diretta</button>
                          </div>
                      </div>
                  ))}
              </div>
          )}

          {/* --- MODALI --- */}
          {isStatsModalOpen && (
              <div className="modal-overlay">
                  <div className="modal-content max-w-5xl bg-[#F8FAFC]">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-black text-[#00665E] flex items-center gap-2"><BarChart3/> Metriche: {activeCourse?.title || activeLive?.title}</h2>
                          <div className="flex gap-2">
                              {activeTab === 'live' && validCertificates.length > 0 && (
                                  <button type="button" onClick={() => sendCertificatesEmail(activeLive)} disabled={sendingEmails} className="btn-pri bg-emerald-600 hover:bg-emerald-700 border-none text-white flex items-center gap-2">
                                      <Mail size={16}/> Invia {validCertificates.length} Attestati
                                  </button>
                              )}
                              
                              <button type="button" onClick={() => window.print()} className="btn-pri bg-amber-500 hover:bg-amber-600 text-amber-950 font-black border-none flex items-center gap-2"><Printer size={16}/> Stampa/Anteprima PDF</button>
                              <button type="button" onClick={() => setIsStatsModalOpen(false)} className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 ml-4"><X size={20} className="text-gray-600"/></button>
                          </div>
                      </div>
                      
                      {safeData.length === 0 ? (
                          <div className="p-10 text-center text-gray-400 bg-white border border-gray-200 rounded-3xl shadow-sm">Nessun utente ha ancora iniziato o partecipato. {activeTab === 'live' ? "Assicurati di aver Assegnato l'evento e spuntato le presenze nel Registro." : 'Assegna il corso.'}</div>
                      ) : (
                          <>
                              <div className="h-72 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mb-6">
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={safeData}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                          <XAxis dataKey="name" fontSize={12} fontWeight="bold" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} dy={10}/>
                                          <YAxis fontSize={12} fontWeight="bold" tick={{fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}/>
                                          <Bar dataKey="progress" name={activeTab === 'courses' ? "Progresso %" : "Presente (100=Sì, 0=No)"} fill="#00665E" radius={[6, 6, 0, 0]} barSize={40} />
                                          {activeTab === 'courses' && <Bar dataKey="quiz" name="Voto Quiz" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={40} />}
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                  <div className="bg-blue-50 p-3 text-xs font-bold text-blue-800 border-b border-blue-100 flex items-center gap-2">
                                      <span>💡 Info Logica Portale Studente:</span> 
                                      <span className="font-medium text-blue-700">L'attestato si sblocca in automatico nel loro portale (link magico) solo quando la barra Progresso Video raggiunge il 100% e superano il test (se previsto). Nelle dirette, l'attestato si sblocca se il titolare segna la Presenza o se lo studente entra dal portale e rimane fino alla fine (Automazione).</span>
                                  </div>
                                  <table className="w-full text-sm text-left">
                                      <thead className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                          <tr>
                                              <th className="p-4 font-bold">Utente / Agente</th>
                                              <th className="p-4 font-bold">Stato Rilascio</th>
                                              <th className="p-4 font-bold">Progresso</th>
                                              {activeTab === 'courses' && <th className="p-4 font-bold">Tempo Studio</th>}
                                              {activeTab === 'courses' && <th className="p-4 font-bold">Voto Quiz</th>}
                                              <th className="p-4 text-right font-bold">Accesso Link Magico</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                          {safeData.map((d:any, i:number) => (
                                              <tr key={i} className="hover:bg-gray-50 transition">
                                                  <td className="p-4 font-bold text-gray-900">{d.name}</td>
                                                  <td className="p-4">
                                                      {(d.progress >= 100 || d.present) ? 
                                                          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">✅ Idoneo (Attestato Visibile)</span> : 
                                                          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">⏳ In Corso / Assente</span>}
                                                  </td>
                                                  <td className="p-4">
                                                      {activeTab === 'courses' ? 
                                                          <div className="flex items-center gap-2">
                                                              <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden"><div className="bg-[#00665E] h-2 rounded-full" style={{width:`${d.progress}%`}}></div></div>
                                                              <span className="text-xs font-bold text-gray-500">{d.progress}%</span>
                                                          </div>
                                                          : <span className="font-bold text-[#00665E]">{d.present ? 'Presente Segnato' : 'Assente'}</span>
                                                      }
                                                  </td>
                                                  {activeTab === 'courses' && <td className="p-4 text-gray-600 font-medium flex items-center gap-1"><Clock size={14}/> {formatTime(d.timeSpent)}</td>}
                                                  {activeTab === 'courses' && <td className="p-4 font-mono font-bold text-gray-700">{d.quiz || '-'}</td>}
                                                  <td className="p-4 text-right">
                                                      <button type="button" onClick={() => {
                                                          if(d.token) {
                                                              navigator.clipboard.writeText(`${window.location.origin}/learning/${d.token}`);
                                                              alert("Link Magico Copiato! 🔗 \n\nInvia questo link allo studente. Da lì potrà vedere i video, fare i quiz e scaricare l'attestato.");
                                                          } else { alert("Nessun link generato."); }
                                                      }} className="text-xs bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 font-bold border border-gray-200 shadow-sm transition inline-flex items-center gap-2">
                                                          <LinkIcon size={12}/> Copia Link
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          )}

          {isCourseModalOpen && (
              <div className="modal-overlay">
                 <div className="modal-content max-w-2xl bg-white">
                     <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-black text-[#00665E]">{activeCourse ? 'Modifica Corso' : 'Nuovo Corso'}</h2>
                        <button type="button" onClick={() => setIsCourseModalOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={20} className="text-gray-600"/></button>
                     </div>
                     
                     <div className="space-y-5">
                         {/* PANNELLO LEZIONI ESISTENTI (VISIBILE SOLO IN MODIFICA) */}
                         {activeCourse && (
                             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contenuti Già Caricati</h4>
                                 <div className="space-y-2">
                                     {(!activeCourse.lessons || activeCourse.lessons.length === 0) && <p className="text-xs text-gray-400 italic">Nessuna lezione presente. Aggiungine una chiudendo questa finestra e cliccando su "Add Lezione".</p>}
                                     {activeCourse.lessons?.map((l:any, index:number) => (
                                         <div key={l.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-100 text-sm">
                                             <span className="font-bold">{index + 1}. {l.title}</span>
                                             <button type="button" onClick={() => handleDeleteItem('lessons', l.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"><Trash2 size={14}/></button>
                                         </div>
                                     ))}
                                     {activeCourse.quizzes?.length > 0 && (
                                         <div className="mt-4 pt-2 border-t border-gray-200">
                                            <span className="text-xs font-bold text-[#00665E] flex items-center gap-1"><CheckSquare size={12}/> Quiz Finale Configurato ({activeCourse.quizzes[activeCourse.quizzes.length-1].passing_score}% per superare)</span>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}

                         <div>
                             <label className="label">Titolo Corso</label>
                             <input className="input font-bold text-lg" placeholder="Es. Tecniche di Vendita Avanzate" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} />
                         </div>
                         <div>
                             <label className="label">Descrizione Breve</label>
                             <textarea className="input h-24 resize-none leading-relaxed" placeholder="Cosa impareranno gli utenti?" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="label">Formazione Obbligatoria?</label>
                                 <select className="input font-bold" value={courseForm.is_mandatory ? 'true' : 'false'} onChange={e => setCourseForm({...courseForm, is_mandatory: e.target.value === 'true'})}>
                                     <option value="false">No, facoltativo</option><option value="true">Sì, obbligatorio</option>
                                 </select>
                             </div>
                             <div><label className="label">Entro il (Scadenza)</label><input type="date" className="input" value={courseForm.deadline || ''} onChange={e => setCourseForm({...courseForm, deadline: e.target.value})} /></div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                                 <p className="text-[10px] font-black uppercase text-gray-500 mb-2">Immagine Copertina</p>
                                 <input type="file" accept="image/*" className="text-xs w-full cursor-pointer" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'images', 2); if(url) setCourseForm({...courseForm, thumbnail_url: url}) }}} />
                             </div>
                             <div className="bg-blue-50 p-4 rounded-2xl border border-dashed border-blue-200">
                                 <p className="text-[10px] font-black uppercase text-blue-700 mb-2">Dispensa / Slide PDF</p>
                                 <input type="file" accept=".pdf,.ppt,.pptx" className="text-xs w-full cursor-pointer" onChange={async (e) => {if(e.target.files?.[0]) { const url = await handleUpload(e.target.files[0], 'docs', 50); if(url) setCourseForm({...courseForm, attachment_url: url}) }}} />
                             </div>
                         </div>
                         <button type="button" onClick={handleSaveCourse} disabled={uploading} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#004d46] transition mt-4 disabled:opacity-50">
                             {uploading ? 'Caricamento File...' : 'Salva Corso nel Database'}
                         </button>
                     </div>
                 </div>
              </div>
          )}

          {isAssignModalOpen && (
              <div className="modal-overlay">
                  <div className="modal-content max-w-md">
                      <h2 className="text-xl font-black mb-2 text-[#00665E]">Assegna {activeTab === 'courses' ? 'Corso' : 'Diretta Live'}</h2>
                      <p className="text-xs text-gray-500 mb-6">Seleziona i membri del team che devono partecipare a "{activeCourse?.title || activeLive?.title}".</p>
                      
                      <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                          {agents.map(agent => (
                              <label key={agent.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-[#00665E] hover:bg-teal-50/30 transition">
                                  <div>
                                      <p className="font-bold text-sm text-gray-900">{agent.name}</p>
                                      <p className="text-[10px] text-gray-500">{agent.email}</p>
                                  </div>
                                  <input type="checkbox" className="w-5 h-5 accent-[#00665E]" checked={selectedAgents.includes(agent.email)} onChange={e => { 
                                      if(e.target.checked) setSelectedAgents([...selectedAgents, agent.email]); 
                                      else setSelectedAgents(selectedAgents.filter(em => em !== agent.email)) 
                                  }} />
                              </label>
                          ))}
                      </div>
                      <button type="button" onClick={handleAssign} className="w-full bg-[#00665E] text-white font-black py-3.5 rounded-xl hover:bg-[#004d46] transition shadow-md">Conferma Assegnazioni</button>
                      <button type="button" onClick={() => setIsAssignModalOpen(false)} className="w-full bg-white text-gray-600 font-bold py-3.5 rounded-xl mt-2 hover:bg-gray-50 transition border border-gray-200">Annulla</button>
                  </div>
              </div>
          )}

          {isToolsModalOpen && (
              <div className="modal-overlay">
                  <div className="modal-content max-w-5xl h-[85vh] flex flex-col bg-[#F8FAFC]">
                      <div className="flex justify-between items-center mb-6 shrink-0">
                          <div>
                              <h2 className="text-2xl font-black text-purple-900 flex items-center gap-2"><Palette className="text-purple-600"/> Aula Virtuale</h2>
                              <p className="text-sm text-purple-700 font-medium">Ciò che scrivi qui apparirà nel portale studente in tempo reale.</p>
                          </div>
                          <button type="button" onClick={() => setIsToolsModalOpen(false)} className="bg-white p-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"><X size={24} className="text-gray-500"/></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-0">
                          <div className="flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
                              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                  <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Lavagna Interattiva</span>
                                  <button type="button" onClick={clearCanvas} className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-lg hover:bg-rose-100">Svuota Lavagna</button>
                              </div>
                              <canvas ref={canvasRef} width={600} height={400} className="bg-gray-50 rounded-xl border border-gray-200 w-full flex-1 cursor-crosshair" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}/>
                          </div>
                          <div className="flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm p-4">
                              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                  <span className="text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-1"><StickyNote size={14}/> Note e Link Condivisi</span>
                              </div>
                              <textarea className="w-full flex-1 p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl resize-none outline-none focus:border-yellow-400 text-sm font-medium leading-relaxed text-gray-800" placeholder="Scrivi qui gli appunti della lezione, i link utili o le istruzioni. Gli studenti li vedranno sotto il video." value={notesContent} onChange={e => setNotesContent(e.target.value)}/>
                          </div>
                      </div>
                      <div className="mt-6 shrink-0 flex justify-end">
                          <button type="button" onClick={saveTools} className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-black shadow-lg hover:bg-purple-700 transition flex items-center gap-2"><Monitor size={18}/> Aggiorna Schermi Studenti</button>
                      </div>
                  </div>
              </div>
          )}

          {isAttendanceModalOpen && (
              <div className="modal-overlay">
                  <div className="modal-content max-w-md">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h2 className="text-xl font-black text-green-700">Appello Presenze</h2>
                              <p className="text-xs text-gray-500 font-bold">{activeLive?.title}</p>
                          </div>
                          <button type="button" onClick={() => setIsAttendanceModalOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={16}/></button>
                      </div>
                      
                      <div className="max-h-72 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                          {selectedAgents.map((agent, index) => (
                              <div key={index} className={`flex flex-col gap-2 p-4 border rounded-2xl transition ${agent.present ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <label className="flex items-center justify-between cursor-pointer">
                                      <span className="font-bold text-sm text-gray-900">{agent.name}</span>
                                      <input type="checkbox" className="w-6 h-6 accent-green-600" checked={agent.present} onChange={e => {
                                          const updated = [...selectedAgents]
                                          updated[index].present = e.target.checked
                                          setSelectedAgents(updated)
                                      }} />
                                  </label>
                                  {agent.present && (
                                      <input type="text" placeholder="Aggiungi una nota (opzionale)" className="text-xs p-2.5 border border-green-200 rounded-lg outline-none bg-white" value={agent.notes} onChange={e => {
                                          const updated = [...selectedAgents]
                                          updated[index].notes = e.target.value
                                          setSelectedAgents(updated)
                                      }} />
                                  )}
                              </div>
                          ))}
                      </div>
                      <button type="button" onClick={handleSaveAttendance} className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 shadow-lg transition">Salva Registro Definitivo</button>
                  </div>
              </div>
          )}

          {isCertModalOpen && (
              <div className="modal-overlay">
                 <div className="modal-content max-w-4xl bg-slate-50 p-8">
                     <div className="flex justify-between items-center mb-6">
                         <h2 className="text-2xl font-black text-amber-600 flex items-center gap-2"><Award size={28}/> Designer Modello Attestato</h2>
                         <button type="button" onClick={() => setIsCertModalOpen(false)} className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-50"><X size={20} className="text-gray-500"/></button>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                         <div className="lg:col-span-4 space-y-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-fit">
                             <p className="text-xs text-gray-500 font-medium mb-4">Personalizza il testo del certificato che verrà generato in PDF per chi completa questo modulo formativo.</p>
                             <div>
                                 <label className="label text-gray-400">Intestazione Principale</label>
                                 <input className="input font-bold" value={certForm.title} onChange={e => setCertForm({...certForm, title: e.target.value})} />
                             </div>
                             <div>
                                 <label className="label text-gray-400">Testo Firma In Basso</label>
                                 <input className="input font-medium" value={certForm.signer} onChange={e => setCertForm({...certForm, signer: e.target.value})} />
                             </div>
                             <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer" onClick={() => setCertForm({...certForm, logo_show: !certForm.logo_show})}>
                                 <input type="checkbox" className="accent-[#00665E] w-5 h-5 pointer-events-none" checked={certForm.logo_show} readOnly/> 
                                 <span className="text-sm font-bold text-gray-700">Includi Logo Azienda</span>
                             </div>
                             <div className="pt-4 mt-2 border-t border-gray-100">
                                 <button type="button" onClick={handleSaveCert} className="w-full bg-amber-500 text-amber-950 font-black py-3.5 rounded-xl shadow-lg hover:bg-amber-400 transition">Salva Configurazione</button>
                             </div>
                         </div>

                         <div className="lg:col-span-8 flex flex-col items-center justify-center bg-gray-200/50 rounded-3xl border-2 border-dashed border-gray-300 overflow-hidden p-4 relative">
                             {validCertificates.length === 1 && validCertificates[0].name.includes('Demo') && (
                                 <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-lg z-20 border border-yellow-200">
                                     Modalità Anteprima (Nessun promosso ancora)
                                 </div>
                             )}
                             <div className="bg-white border-4 border-double border-gray-300 p-10 text-center shadow-2xl relative flex flex-col justify-center items-center w-full aspect-[1.414/1] max-w-[600px]">
                                 <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]"><Award size={250}/></div>
                                 
                                 {certForm.logo_show && (
                                     companyProfile.logo ? (
                                        <img src={companyProfile.logo} alt="Logo" className="h-16 object-contain mb-6 mx-auto relative z-10" crossOrigin="anonymous"/>
                                     ) : (
                                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2 justify-center"><Building size={20}/> {companyProfile.name}</h2>
                                     )
                                 )}

                                 <h3 className="font-serif text-2xl font-black text-[#00665E] tracking-widest leading-tight uppercase relative z-10">{certForm.title}</h3>
                                 <p className="text-[10px] text-gray-500 mt-4 italic relative z-10">Si certifica che</p>
                                 <p className="font-bold text-lg border-b border-gray-300 pb-1 px-8 mt-2 text-gray-900 relative z-10">Nome Cognome Studente</p>
                                 <p className="text-[10px] text-gray-500 mt-4 relative z-10">ha completato con successo:</p>
                                 <p className="font-black text-gray-800 text-sm mt-1 uppercase relative z-10">{activeCourse?.title || activeLive?.title || "Titolo del Corso"}</p>
                                 
                                 <div className="mt-8 pt-2 w-48 mx-auto text-center relative z-10">
                                     <p className="font-cursive text-3xl text-gray-800 leading-none" style={{fontFamily: "'Brush Script MT', cursive, sans-serif"}}>{certForm.signer}</p>
                                     <div className="border-t border-gray-400 w-full mt-2"></div>
                                     <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Firma Autorizzata</p>
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
              </div>
          )}

          {/* NUOVO MODALE QUIZ INTELLIGENTE */}
          {isQuizModalOpen && (
              <div className="modal-overlay">
                  <div className="modal-content max-w-3xl bg-[#F8FAFC]">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BookOpen className="text-blue-600"/> Generatore Quiz: {activeCourse?.title}</h2>
                          <button type="button" onClick={() => setIsQuizModalOpen(false)} className="bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-50"><X size={20} className="text-gray-500"/></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className="md:col-span-5 space-y-4">
                              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                                  <label className="label">Nome del Test</label>
                                  <input className="input font-bold mb-4" value={quizForm.title} onChange={e=>setQuizForm({...quizForm, title: e.target.value})}/>
                                  <label className="label">Punteggio Minimo per Superare (%)</label>
                                  <div className="flex items-center gap-4">
                                      <input type="range" min="10" max="100" step="10" className="flex-1 accent-[#00665E]" value={quizForm.passing_score} onChange={e=>setQuizForm({...quizForm, passing_score: Number(e.target.value)})}/>
                                      <span className="font-black text-lg text-[#00665E]">{quizForm.passing_score}%</span>
                                  </div>
                              </div>
                              <button type="button" onClick={handleSaveQuiz} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#004d46] transition text-sm">
                                  {quizForm.id ? 'Aggiorna Quiz nel DB' : 'Salva Nuovo Quiz nel DB'}
                              </button>
                          </div>
                          
                          <div className="md:col-span-7 flex flex-col gap-4">
                              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-200 shadow-sm">
                                  <h3 className="text-sm font-black text-blue-900 mb-3">Aggiungi Domanda</h3>
                                  <input className="input mb-3 bg-white" placeholder="Testo della domanda..." value={newQuestion.text} onChange={e=>setNewQuestion({...newQuestion, text: e.target.value})} />
                                  <div className="space-y-2 mb-3">
                                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">A</div><input className="input bg-white py-2 text-sm" placeholder="Prima opzione" value={newQuestion.option1} onChange={e=>setNewQuestion({...newQuestion, option1: e.target.value})}/></div>
                                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">B</div><input className="input bg-white py-2 text-sm" placeholder="Seconda opzione" value={newQuestion.option2} onChange={e=>setNewQuestion({...newQuestion, option2: e.target.value})}/></div>
                                      <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">C</div><input className="input bg-white py-2 text-sm" placeholder="Terza opzione (opz.)" value={newQuestion.option3} onChange={e=>setNewQuestion({...newQuestion, option3: e.target.value})}/></div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                          <label className="text-[10px] uppercase font-bold text-blue-800 block mb-1">Risposta Corretta</label>
                                          <select className="input bg-white py-2 text-sm font-bold text-green-700" value={newQuestion.correct} onChange={e=>setNewQuestion({...newQuestion, correct: Number(e.target.value)})}>
                                              <option value={0}>Opzione A</option><option value={1}>Opzione B</option><option value={2}>Opzione C</option>
                                          </select>
                                      </div>
                                      <button type="button" onClick={handleAddQuestion} className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-blue-700 shadow-md mt-4 text-sm whitespace-nowrap">Aggiungi</button>
                                  </div>
                              </div>
                              
                              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Domande Inserite ({questions.length})</h3>
                                  <div className="space-y-3">
                                      {questions.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Nessuna domanda. Crea la prima qui sopra.</p>}
                                      {questions.map((q,i) => (
                                          <div key={i} className="text-sm p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-start group hover:border-[#00665E] transition">
                                              <div>
                                                  <p className="font-bold text-gray-900 mb-1">{i+1}. {q.question_text}</p>
                                                  <p className="text-xs text-gray-500">Risposta esatta: <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{q.options[q.correct_option_index]}</span></p>
                                              </div>
                                              <button type="button" onClick={() => {
                                                  // Se la domanda ha un id (esiste nel db), chiamiamo handleDeleteItem
                                                  if (q.id) handleDeleteItem('quiz_questions', q.id);
                                                  // Altrimenti la rimuoviamo solo dall'array temporaneo
                                                  else handleRemoveQuestionFromUI(i);
                                              }} className="text-gray-300 hover:text-red-500 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200"><Trash2 size={14}/></button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {isLessonModalOpen && (
              <div className="modal-overlay">
                 <div className="modal-content max-w-lg">
                     <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Video className="text-[#00665E]"/> Nuova Lezione Video</h2>
                     <div className="space-y-4">
                         <div><label className="label">Titolo Lezione</label><input className="input font-bold" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} /></div>
                         <div>
                             <label className="label">Sorgente Video</label>
                             <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                 <button type="button" onClick={() => setLessonForm({...lessonForm, video_type: 'youtube'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${lessonForm.video_type === 'youtube' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>YouTube / Vimeo</button>
                                 <button type="button" onClick={() => setLessonForm({...lessonForm, video_type: 'upload'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${lessonForm.video_type === 'upload' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Upload Diretto</button>
                             </div>
                         </div>
                         {lessonForm.video_type === 'youtube' ? 
                             <div><label className="label">Link URL</label><input className="input text-blue-600 font-mono text-xs" placeholder="https://youtube.com/..." value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} /></div> 
                             : 
                             <div className="bg-blue-50 p-6 rounded-2xl border border-dashed border-blue-200 text-center"><input type="file" accept="video/mp4,video/x-m4v,video/*" className="text-xs w-full text-blue-700 font-bold" onChange={e => setVideoFile(e.target.files?.[0] || null)} /></div>
                         }
                         <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 mt-6 cursor-pointer" onClick={() => setPrivacyAccepted(!privacyAccepted)}>
                             <input type="checkbox" className="accent-[#00665E] mt-0.5" checked={privacyAccepted} readOnly />
                             <p className="text-[10px] text-gray-500 leading-tight">Dichiaro di avere i diritti di diffusione del materiale caricato e sollevo la piattaforma da ogni responsabilità legale per violazione del copyright.</p>
                         </div>
                         <div className="flex gap-2 pt-4 border-t border-gray-100">
                             <button type="button" onClick={() => setIsLessonModalOpen(false)} className="btn-sec flex-1 py-3.5">Annulla</button>
                             <button type="button" onClick={handleSaveLesson} disabled={uploading || !privacyAccepted} className="btn-pri flex-1 py-3.5 disabled:opacity-50 shadow-lg">{uploading ? 'Caricamento...' : 'Aggiungi Lezione'}</button>
                         </div>
                     </div>
                 </div>
              </div>
          )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .print-only { display: none; }
        @media print {
            @page { size: landscape; margin: 0; }
            .no-print, .no-print * { display: none !important; }
            .print-only { display: block !important; position: absolute; left: 0; top: 0; width: 100vw; }
            .certificate-page { page-break-after: always; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: white !important; }
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            main { padding: 0 !important; margin: 0 !important; background: white !important; }
            .border-double { border-style: double !important; }
        }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(8px); padding: 1rem; }
        .modal-content { background: white; padding: 2rem; border-radius: 2rem; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); animation: zoomIn 0.2s ease-out; position: relative; max-height: 95vh; overflow-y: auto; }
        .input { width: 100%; padding: 0.875rem 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; outline: none; transition: all 0.2s; font-size: 0.875rem; background: #f8fafc; }
        .input:focus { border-color: #00665E; background: white; box-shadow: 0 0 0 3px rgba(0, 102, 94, 0.1); }
        .label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .btn-pri { background: #00665E; color: white; padding: 0.75rem 1rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; cursor: pointer; border: none; }
        .btn-pri:hover { background: #004d46; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 102, 94, 0.2); }
        .btn-sec { background: white; color: #475569; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.75rem; cursor: pointer; }
        .btn-sec:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}} />
    </main>
  )
}