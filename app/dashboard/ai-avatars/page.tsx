'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { 
    UserCog, Sparkles, Mic, BrainCircuit, Save, 
    Plus, Trash2, Camera, Volume2, User, 
    ShieldCheck, Zap, Loader2, X, Play, Palette, 
    Smartphone, MessageSquare, Globe
} from 'lucide-react'

interface Avatar {
    id: string;
    name: string;
    avatar_img_url: string;
    gender: 'male' | 'female' | 'neutral';
    voice_id: string;
    personality_prompt: string;
    style_config: any;
    is_active: boolean;
    avatar_video_url?: string;
}

export default function AvatarStudioPage() {
    const [avatars, setAvatars] = useState<Avatar[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [privacyAccepted, setPrivacyAccepted] = useState(false)
    const [showCamera, setShowCamera] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // STATO CONFIGURATORE
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
    const [formData, setFormData] = useState<Partial<Avatar>>({
        name: '', 
        gender: 'neutral', 
        personality_prompt: '', 
        voice_id: 'default',
        style_config: { clothes: 'Professional', vibe: 'Friendly', background: 'Modern Office' }
    })

    const supabase = createClient()

    useEffect(() => {
        const getData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                fetchAvatars()
            } else {
                setLoading(false)
            }
        }
        getData()
    }, [])

    const fetchAvatars = async () => {
        try {
            const res = await fetch('/api/ai/avatars')
            const data = await res.json()
            if (data.success) {
                setAvatars(data.avatars || [])
                if (data.avatars?.length > 0 && !selectedAvatar) {
                    handleSelectAvatar(data.avatars[0])
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAvatar = (avatar: Avatar) => {
        setSelectedAvatar(avatar)
        setFormData(avatar)
    }

    const handleNewAvatar = () => {
        const newTemplate: Partial<Avatar> = {
            name: 'Nuovo Avatar',
            gender: 'neutral',
            personality_prompt: 'Sei un assistente cordiale...',
            voice_id: 'eleven_multi_v2_f1',
            style_config: { clothes: 'Business Casual', vibe: 'Professional', background: 'Studio' }
        }
        setSelectedAvatar(null)
        setFormData(newTemplate)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const method = selectedAvatar?.id ? 'POST' : 'POST' // L'API gestisce l'upsert o l'insert semplice
            const res = await fetch('/api/ai/avatars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                await fetchAvatars()
                alert("✅ Digital Persona salvata con successo!")
            }
        } catch (err) {
            alert("Errore salvataggio")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Vuoi eliminare definitivamente questo Avatar?")) return
        try {
            const res = await fetch(`/api/ai/avatars?id=${id}`, { method: 'DELETE' })
            if (res.ok) {
                setAvatars(avatars.filter(a => a.id !== id))
                if (selectedAvatar?.id === id) setSelectedAvatar(null)
            }
        } catch (e) {}
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) return alert("File troppo grande! Max 2MB.")
        
        setIsSaving(true)
        const fileName = `avatar_${Date.now()}_${file.name}`
        const { data, error } = await supabase.storage.from('products').upload(fileName, file)
        if (error) { alert("Errore upload: " + error.message); setIsSaving(false); return; }
        
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
        setFormData(prev => ({ ...prev, avatar_img_url: urlData.publicUrl }))
        setIsSaving(false)
    }

    const startCamera = async () => {
        setShowCamera(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } })
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch (err) {
            alert("Impossibile accedere alla fotocamera.")
            setShowCamera(false)
        }
    }

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream
        stream?.getTracks().forEach(track => track.stop())
        setShowCamera(false)
    }

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d')
            context?.drawImage(videoRef.current, 0, 0, 400, 400)
            const dataUrl = canvasRef.current.toDataURL('image/png')
            setFormData(prev => ({ ...prev, avatar_img_url: dataUrl }))
            stopCamera()
        }
    }

    const handleGenerateImage = () => {
        // ... mantiene la simulazione per chi non vuole caricare foto
    }

    const handleAnimate = async () => {
        if (!selectedAvatar?.id) return alert("Salva prima l'Avatar per animarlo!")
        setIsAnimating(true)
        try {
            const res = await fetch('/api/ai/avatars/animate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarId: selectedAvatar.id, text: "Ciao, sono il tuo assistente digitale IntegraOS!" })
            })
            const data = await res.json()
            if (data.success) {
                // In un caso reale, qui gestiremo il polling. In DEMO carichiamo subito.
                setFormData(prev => ({ ...prev, avatar_video_url: data.videoUrl || prev.avatar_video_url }))
                alert("✨ Digital Human animato con successo! (Demo Mode)")
            }
        } catch (err) {
            alert("Errore animazione")
        } finally {
            setIsAnimating(false)
        }
    }

    if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Avvio Avatar Studio...</div>

    return (
        <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-200 p-8 bg-white shadow-sm z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
                        <UserCog size={34}/> AI Avatar Studio
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Definisci il volto, la voce e l'anima digitale del tuo brand.</p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button onClick={handleNewAvatar} className="bg-white border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                        <Plus size={18}/> Nuovo Progetto
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || !privacyAccepted} 
                        className={`bg-[#00665E] text-white px-8 py-2.5 rounded-xl font-black shadow-xl transition flex items-center gap-2 ${(!privacyAccepted || isSaving) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-[#004d46] shadow-[#00665E]/20'}`}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                        Salva Persona
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* LISTA AVATAR (SIDE SMALL) */}
                <aside className="w-80 border-r border-gray-200 bg-white/50 overflow-y-auto p-6 hidden lg:block custom-scrollbar">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Le Tue Persone Digitali</h3>
                    <div className="space-y-4">
                        {avatars.length === 0 && <div className="text-center py-10 text-gray-400 text-sm italic">Nessun avatar creato.</div>}
                        {avatars.map((a) => (
                            <div 
                                key={a.id} 
                                onClick={() => handleSelectAvatar(a)}
                                className={`p-4 rounded-2xl border-2 transition cursor-pointer group relative ${selectedAvatar?.id === a.id ? 'bg-[#00665E] border-[#00665E] text-white shadow-lg' : 'bg-white border-transparent hover:border-gray-200 text-gray-700'}`}
                            >
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                                >
                                    <X size={12}/>
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 bg-gray-100">
                                        <img src={a.avatar_img_url || 'https://via.placeholder.com/100'} alt={a.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold truncate">{a.name}</p>
                                        <p className={`text-[10px] uppercase font-black tracking-widest ${selectedAvatar?.id === a.id ? 'text-teal-200' : 'text-gray-400'}`}>{a.gender}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* CONFIGURATORE (MAIN AREA) */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar pb-32">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-10">
                        
                        {/* COLONNA SINISTRA: ESTETICA E PREVIEW */}
                        <div className="xl:col-span-1 space-y-8">
                            
                            {/* PREVIEW CARD */}
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-teal-50 to-transparent"></div>
                                
                                <div className="w-48 h-48 rounded-[38px] overflow-hidden border-[6px] border-white shadow-2xl relative z-10 bg-gray-50 flex items-center justify-center group/video">
                                    {isGenerating || isAnimating ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={32} className="text-[#00665E] animate-spin"/>
                                            <span className="text-[10px] font-black uppercase text-[#00665E] animate-pulse">{isAnimating ? 'Animating...' : 'Generation...'}</span>
                                        </div>
                                    ) : formData.avatar_video_url ? (
                                        <video src={formData.avatar_video_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={formData.avatar_img_url || 'https://via.placeholder.com/300x300?text=Avatar'} alt="Preview" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                <div className="mt-8 text-center relative z-10 w-full">
                                    <h2 className="text-2xl font-black text-gray-900 mb-1">{formData.name || 'Senza Nome'}</h2>
                                    <p className="text-xs font-bold text-[#00665E] uppercase tracking-widest">{formData.gender || 'neutral'}</p>
                                    
                                    <div className="flex justify-center gap-2 mt-6">
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-gray-50 transition flex items-center gap-2">
                                            <Camera size={14}/> Carica Foto
                                        </button>
                                        <button onClick={startCamera} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black shadow-sm hover:bg-gray-50 transition flex items-center gap-2">
                                            <Camera size={14}/> Scatta Foto
                                        </button>
                                        <button 
                                            onClick={handleAnimate} 
                                            disabled={isAnimating || !formData.avatar_img_url || !privacyAccepted}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black shadow-lg hover:scale-105 transition flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
                                        >
                                            {isAnimating ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>}
                                            Anima Persona
                                        </button>
                                    </div>
                                </div>
                                
                                {/* BADGES */}
                                <div className="flex gap-2 mt-8 w-full justify-center">
                                    <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-blue-100 flex items-center gap-1"><Smartphone size={12}/> GSM</div>
                                    <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-green-100 flex items-center gap-1"><MessageSquare size={12}/> WA</div>
                                    <div className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] font-black border border-purple-100 flex items-center gap-1"><Globe size={12}/> WEB</div>
                                </div>
                            </div>

                            {/* ESTETICA SETTINGS */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><Palette size={16} className="text-[#00665E]"/> Configura Estetica</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Stile Abbigliamento</label>
                                        <select 
                                            value={formData.style_config?.clothes} 
                                            onChange={e => setFormData({...formData, style_config: {...formData.style_config, clothes: e.target.value}})}
                                            className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-bold outline-none focus:border-[#00665E]"
                                        >
                                            <option>Professional</option><option>Business Casual</option><option>Futuristic</option><option>Uniform</option><option>Sporty</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Sfondo Ambientale</label>
                                        <select 
                                            value={formData.style_config?.background} 
                                            onChange={e => setFormData({...formData, style_config: {...formData.style_config, background: e.target.value}})}
                                            className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-bold outline-none focus:border-[#00665E]"
                                        >
                                            <option>Modern Office</option><option>Cosy Lounge</option><option>Digital Grid</option><option>Abstract Colors</option><option>Minimal White</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* COLONNA DESTRA: IDENTITÀ, VOCE E CERVELLO */}
                        <div className="xl:col-span-2 space-y-8">
                            
                             {/* IDENTITÀ */}
                             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                 <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><User size={16} className="text-[#00665E]"/> Identità Digitale</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                     <div>
                                         <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Nome Avatar</label>
                                         <input 
                                             type="text" 
                                             placeholder="Es. Martina"
                                             value={formData.name} 
                                             onChange={e => setFormData({...formData, name: e.target.value})}
                                             className="w-full bg-gray-50 border p-3.5 rounded-xl text-base font-black outline-none focus:border-[#00665E] transition"
                                         />
                                     </div>
                                     <div>
                                         <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Genere Voce/Aspetto</label>
                                         <div className="flex p-1 bg-gray-100 rounded-xl">
                                             {['male', 'female', 'neutral'].map(g => (
                                                 <button 
                                                     key={g}
                                                     onClick={() => setFormData({...formData, gender: g as any})}
                                                     className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition ${formData.gender === g ? 'bg-white text-[#00665E] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                 >
                                                     {g === 'male' ? 'Uomo' : g === 'female' ? 'Donna' : 'Neutral'}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </div>

                                 {/* PRIVACY & RESPONSABILITÀ */}
                                 <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl">
                                     <h3 className="font-black text-amber-900 mb-3 flex items-center gap-2 uppercase text-[10px] tracking-widest"><ShieldCheck size={16}/> Privacy & Responsabilità legale</h3>
                                     <div className="flex items-start gap-3">
                                         <input 
                                             type="checkbox" 
                                             id="privacy-check"
                                             checked={privacyAccepted}
                                             onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                             className="mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                         />
                                         <label htmlFor="privacy-check" className="text-[11px] text-amber-800 leading-relaxed font-medium cursor-pointer">
                                             Dichiaro di avere i pieni diritti legali sull'immagine e sulla voce caricate. Mi assumo la totale responsabilità dell'uso dell'Avatar generato e manlevo **IntegraOS** da ogni controversia legale legata a violazioni di copyright o uso improprio di contenuti biometrici.
                                         </label>
                                     </div>
                                 </div>
                             </div>

                            {/* VOCE TIMBRO */}
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2 uppercase text-xs tracking-widest"><Volume2 size={16} className="text-[#00665E]"/> Timbro Vocale (Neural Voice)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Modello di Sintesi</label>
                                        <select 
                                            value={formData.voice_id} 
                                            onChange={e => setFormData({...formData, voice_id: e.target.value})}
                                            className="w-full bg-gray-50 border p-3 rounded-xl text-sm font-bold outline-none focus:border-[#00665E]"
                                        >
                                            <option value="default">Seleziona Timbro...</option>
                                            <option value="eleven_multi_v2_f1">Chiara (Italian Female - Professional)</option>
                                            <option value="eleven_multi_v2_m1">Marco (Italian Male - Authoritative)</option>
                                            <option value="eleven_multi_v2_f2">Sofia (Italian Female - Sweet/Young)</option>
                                            <option value="eleven_multi_v2_m2">Luca (Italian Male - Calm/Trusted)</option>
                                        </select>
                                    </div>
                                    <div className="bg-slate-900 rounded-2xl p-4 flex flex-col justify-center">
                                         <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1 italic">Real-Time Audio Sample</p>
                                         <div className="flex items-center gap-4">
                                            <button className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition shrink-0">
                                                <Play size={16} fill="currentColor"/>
                                            </button>
                                            <div className="flex-1 flex gap-0.5 items-center h-4">
                                                {[...Array(20)].map((_, i) => <div key={i} className="flex-1 bg-teal-500/30 h-full rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%`}}></div>)}
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </div>

                            {/* BRAIN / PERSONALITÀ */}
                            <div className="bg-gradient-to-br from-slate-900 to-[#121b1b] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute -right-20 -bottom-20 opacity-5">
                                    <BrainCircuit size={300}/>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-black text-2xl flex items-center gap-2"><Sparkles size={24} className="text-teal-400"/> Cervello & Reattività AI</h3>
                                        <div className="bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-widest">Powered by Gemini 2.0</div>
                                    </div>
                                    
                                    <label className="text-[10px] font-black text-teal-400 uppercase tracking-tighter block mb-3">Prompt di Sistema (L'Anima del tuo Avatar)</label>
                                    <textarea 
                                        rows={8}
                                        value={formData.personality_prompt} 
                                        onChange={e => setFormData({...formData, personality_prompt: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none focus:border-teal-500 text-teal-50 font-mono text-sm leading-relaxed resize-none shadow-inner mb-6"
                                        placeholder="Descrivi come l'Avatar deve agire. Es: Sei Martina, una Digital Strategist esperta di marketing locale. Parla in modo brillante, usa metafore sportive e sii sempre proattiva nel proporre soluzioni..."
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
                                            <h4 className="text-xs font-black text-teal-400 mb-2 flex items-center gap-2"><ShieldCheck size={14}/> Guardrail di Sicurezza</h4>
                                            <p className="text-[10px] text-teal-50/60 leading-relaxed">L'avatar è protetto da filtri antispam e non risponderà mai a provocazioni o linguaggi inappropriati, mantenendo il decoro del brand.</p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
                                            <h4 className="text-xs font-black text-teal-400 mb-2 flex items-center gap-2"><Zap size={14}/> Memoria Contestuale</h4>
                                            <p className="text-[10px] text-teal-50/60 leading-relaxed">Attivando questa opzione, l'avatar ricorderà le conversazioni precedenti con lo stesso contatto per una personalizzazione estrema.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>

            {/* BARRA AZIONI FISSA IN BASSO */}
            <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center px-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 flex items-center gap-2">
                        <Smartphone size={14}/> Voice Ready
                    </div>
                    <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-500 flex items-center gap-2">
                        <MessageSquare size={14}/> WhatsApp Integrated
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedAvatar(null)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Annulla</button>
                    <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black hover:bg-black transition shadow-lg flex items-center gap-2">
                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18}/>}
                        Attiva & Pubblica Digital Persona
                    </button>
                </div>
            </div>

            {/* MODALE CAMERA */}
            {showCamera && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center">
                        <button onClick={stopCamera} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
                        <h3 className="text-xl font-black text-[#00665E] mb-6">Inquadra il Volto</h3>
                        <div className="bg-gray-100 rounded-[40px] overflow-hidden aspect-square border-4 border-[#00665E]/20 mb-8 max-w-[300px] mx-auto">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            <canvas ref={canvasRef} width="400" height="400" className="hidden" />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={stopCamera} className="flex-1 px-6 py-3 rounded-xl font-bold bg-gray-100 text-gray-500">Annulla</button>
                            <button onClick={capturePhoto} className="flex-1 px-6 py-3 rounded-xl font-bold bg-[#00665E] text-white shadow-lg shadow-teal-500/20">Cattura Immagine</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
