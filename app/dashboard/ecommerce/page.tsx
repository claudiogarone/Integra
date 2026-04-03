'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ShoppingBag, UploadCloud, Search, Plus, Trash2, Camera, Edit3, Image as ImageIcon, ShieldAlert, Check, X } from 'lucide-react'

const PLAN_LIMITS = {
  Base: { maxProducts: 10, maxFileSize: 5 * 1024 * 1024, canImport: false }, 
  Enterprise: { maxProducts: 150, maxFileSize: 10 * 1024 * 1024, canImport: true }, 
  Ambassador: { maxProducts: 99999, maxFileSize: 20 * 1024 * 1024, canImport: true } 
}

export default function EcommercePage() {
  const [products, setProducts] = useState<any[]>([])
  const [monthUsage, setMonthUsage] = useState(0) // Quota prodotti caricati nel mese (inclusi gli eliminati)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const [userPlan, setUserPlan] = useState<'Base' | 'Enterprise' | 'Ambassador'>('Base')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_lens'>('manual')
  const [analyzing, setAnalyzing] = useState(false)

  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: 'Prodotti', ar_model_url: '', ar_enabled: false })
  const [legalConsent, setLegalConsent] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [arFile, setArFile] = useState<File | null>(null)
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const currentUser = user || { id: '00000000-0000-0000-0000-000000000000', email: 'admin@integraos.it' }
      setUser(currentUser)

      if (user) {
          const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
          if (profile && profile.plan) { setUserPlan(profile.plan as any) }
      } else {
          setUserPlan('Base'); 
      }

      await fetchProducts(currentUser.id);
    }
    getData()
  }, [router, supabase])

  const fetchProducts = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('ecommerce_products').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
          if (error) throw error;
          
          setProducts(data || []);
          
          const startOfMonth = new Date();
          startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
          
          const { count, error: countError } = await supabase.from('ecommerce_products').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth.toISOString());
          if (!countError) {
              setMonthUsage(count || 0);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  }

  const checkLimits = () => {
    const limits = PLAN_LIMITS[userPlan];
    // Il limite si basa sul consumo del mese, non su quanti ne vedi in vetrina!
    if (monthUsage >= limits.maxProducts) {
      alert(`ATTENZIONE: Hai raggiunto il limite di ${limits.maxProducts} caricamenti mensili per il piano ${userPlan}. I caricamenti eliminati nel mese corrente vengono conteggiati. Attendi il mese prossimo o fai l'upgrade.`);
      return false;
    }
    return true;
  }

  // --- AI LENS ---
  const handleAIAnalysis = async (file: File) => {
    if (file.size > PLAN_LIMITS[userPlan].maxFileSize) {
        alert("Il file supera le dimensioni consentite dal tuo piano!"); return;
    }

    setImageFile(file)
    setImageUrlPreview(URL.createObjectURL(file))
    setAnalyzing(true)

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: reader.result })
        });

        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || "Errore AI Server");

        setFormData({
          name: data.name || '', description: data.description || '', price: data.price || '', category: data.category || 'Prodotti',
          ar_model_url: '', ar_enabled: false
        });
        setActiveTab('manual'); 
      } catch (error: any) {
        alert("Errore Analisi AI: " + error.message);
      } finally {
        setAnalyzing(false);
      }
    };
    
    reader.onerror = () => {
        alert("Errore nella lettura del file immagine.");
        setAnalyzing(false);
    };
  }

  // --- SALVATAGGIO SINGOLO ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!legalConsent) {
        alert("Devi accettare i termini di responsabilità legale per procedere.");
        return;
    }

    if (!checkLimits()) return;

    setSaving(true)
    let publicUrl = imageUrlPreview || 'https://via.placeholder.com/300x200?text=Senza+Immagine'
    let arUrl = formData.ar_model_url

    // Upload Immagine
    if (imageFile && user) {
        const fileName = `prod_${Date.now()}.${imageFile.name.split('.').pop()}`
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile)
        if (!uploadError) {
            const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
            publicUrl = urlData.publicUrl
        }
    }

    // Upload Modello 3D (AR)
    if (arFile && user) {
        const arFileName = `ar_${Date.now()}_${arFile.name.replace(/[^a-zA-Z0-9.]/g, '')}`
        const { error: arUploadError } = await supabase.storage.from('products').upload(arFileName, arFile)
        if (!arUploadError) {
            const { data: arUrlData } = supabase.storage.from('products').getPublicUrl(arFileName)
            arUrl = arUrlData.publicUrl
        }
    }

    const payload = {
        user_id: user?.id || '00000000-0000-0000-0000-000000000000',
        name: formData.name, 
        description: formData.description, 
        price: Number(formData.price) || 0, 
        category: formData.category,
        image_url: publicUrl,
        ar_model_url: arUrl,
        ar_enabled: formData.ar_enabled,
        legal_consent: legalConsent
    }

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Errore durante il salvataggio via API");
        
        await fetchProducts(user.id);
        setIsModalOpen(false)
        setFormData({ name: '', description: '', price: '', category: 'Prodotti', ar_model_url: '', ar_enabled: false })
        setImageFile(null); setImageUrlPreview(null); setLegalConsent(false);
    } catch (err: any) {
        alert('Errore: ' + err.message)
    } finally {
        setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Spostare questo prodotto nel cestino? (ATTENZIONE: Il sistema conteggerà comunque questo caricamento nel calcolo dei tuoi limiti mensili).')) return
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) setProducts(products.filter(p => p.id !== id))
  }

  // --- IMPORT EXCEL ---
  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!PLAN_LIMITS[userPlan].canImport) {
        alert("L'importazione massiva è disponibile solo per i piani Enterprise e Ambassador.");
        return;
    }
    
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
            const rows: any[] = results.data;
            const limits = PLAN_LIMITS[userPlan];

            // Controllo massivo della quota mensile
            if (monthUsage + rows.length > limits.maxProducts) {
                alert(`Impossibile importare. Supereresti la quota di ${limits.maxProducts} caricamenti mensili (hai già usato ${monthUsage} slot).`);
                return;
            }

            const newProducts = rows.map((row: any) => ({
                user_id: user?.id || '00000000-0000-0000-0000-000000000000',
                name: row.Nome || row.Name || 'Prodotto Importato',
                description: row.Descrizione || row.Description || '',
                price: Number(row.Prezzo || row.Price || 0),
                category: row.Categoria || 'Prodotti',
                image_url: 'https://via.placeholder.com/300x200?text=Senza+Foto',
                legal_consent: true, 
                is_deleted: false
            }))
            
            for (const prod of newProducts) {
                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(prod)
                });
            }
            
            await fetchProducts(user.id);
            alert(`Importati ${newProducts.length} prodotti con successo!`)
        }
    })
    if (importInputRef.current) importInputRef.current.value = ''
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Sincronizzazione Catalogo...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans relative pb-20 min-h-screen">
      
      {/* HEADER E CONTATORI */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3">
              <ShoppingBag size={28}/> Catalogo E-commerce
          </h1>
          <div className="flex items-center gap-2 mt-2">
             <span className="text-[10px] font-bold bg-[#00665E] text-white px-2 py-0.5 rounded uppercase tracking-widest">Piano {userPlan}</span>
             <p className={`text-xs font-bold ${monthUsage >= PLAN_LIMITS[userPlan].maxProducts ? 'text-red-500' : 'text-gray-500'}`}>
                Quota Mese Utilizzata: {monthUsage} / {PLAN_LIMITS[userPlan].maxProducts === 99999 ? '∞' : PLAN_LIMITS[userPlan].maxProducts}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
             <input type="file" accept=".csv,.xlsx" ref={importInputRef} onChange={handleExcelUpload} className="hidden" />
             <button onClick={() => importInputRef.current?.click()} className={`bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition shadow-sm flex items-center gap-2 ${!PLAN_LIMITS[userPlan].canImport ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                <UploadCloud size={16}/> Importa CSV {(!PLAN_LIMITS[userPlan].canImport) && '🔒'}
             </button>
             <button onClick={() => checkLimits() && setIsModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">
                <Plus size={18}/> Nuovo Prodotto
             </button>
        </div>
      </div>

      {/* GRIGLIA PRODOTTI IN VETRINA */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20"/>
                <h3 className="font-bold text-gray-700">Il catalogo è vuoto</h3>
                <p className="text-sm mt-1 mb-4">Aggiungi il tuo primo prodotto per iniziare a vendere.</p>
                <button onClick={() => checkLimits() && setIsModalOpen(true)} className="text-[#00665E] font-bold text-sm hover:underline">Crea Prodotto</button>
            </div>
        )}
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition duration-300 flex flex-col relative">
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition">
                 <button onClick={() => handleDelete(product.id)} className="bg-white text-red-500 p-2 rounded-lg shadow-md hover:bg-red-50"><Trash2 size={16}/></button>
            </div>
            <div className="h-48 bg-gray-50 overflow-hidden relative border-b border-gray-50 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{product.category}</span>
                  {product.ar_enabled && <span className="text-[9px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-black uppercase tracking-tighter">AR Ready</span>}
              </div>
              <h3 className="font-bold text-gray-900 leading-tight mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">{product.description}</p>
              
              {product.ar_enabled && (
                  <div className="mb-4 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center gap-2">
                       <div className="w-10 h-10 bg-white p-1 rounded-lg shadow-sm border">
                           {/* Placeholder QR per demo, in produzione usa QRCode wrapper */}
                           <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold">QR</div>
                       </div>
                       <div className="flex-1">
                           <p className="text-[10px] font-black text-gray-400 uppercase">Marker Negozio</p>
                           <p className="text-[9px] text-gray-500 font-medium">Stampa per scansione AR in loco</p>
                       </div>
                  </div>
              )}

              <div className="pt-3 border-t border-gray-50 flex justify-between items-end">
                  <span className="text-[#00665E] font-black text-xl">€ {Number(product.price).toLocaleString('it-IT', {minimumFractionDigits: 2})}</span>
                  {product.ar_enabled && <button className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition"><X size={14} className="rotate-45"/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE DI CREAZIONE PRODOTTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 p-0 rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-xl font-black text-[#00665E] flex items-center gap-2">Scheda Prodotto</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-200 p-2 rounded-full"><X size={16}/></button>
            </div>

            <div className="flex p-2 gap-2 bg-gray-50 border-b border-gray-100 shrink-0">
                <button type="button" onClick={() => setActiveTab('manual')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex justify-center items-center gap-2 ${activeTab === 'manual' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500 hover:bg-gray-200'}`}><Edit3 size={14}/> Compilazione</button>
                <button type="button" onClick={() => setActiveTab('ai_lens')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex justify-center items-center gap-2 ${activeTab === 'ai_lens' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow text-white' : 'text-gray-500 hover:bg-gray-200'}`}><Camera size={14}/> Scansione AI Lens</button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                
                {analyzing && activeTab === 'ai_lens' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-16 h-16 border-4 border-[#00665E]/20 border-t-[#00665E] rounded-full animate-spin mb-4"></div>
                        <h3 className="font-black text-[#00665E] text-lg">Elaborazione Vision in corso...</h3>
                        <p className="text-sm text-gray-500 text-center max-w-sm mt-2">L'Intelligenza Artificiale sta estraendo i dati commerciali dall'immagine.</p>
                    </div>
                )}

                {!analyzing && activeTab === 'ai_lens' && (
                    <div className="text-center py-6">
                        <div className="border-2 border-dashed border-purple-300 rounded-3xl p-8 bg-purple-50 cursor-pointer hover:bg-purple-100 transition group flex flex-col items-center" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-purple-600 mb-4 shadow-sm group-hover:scale-110 transition"><Camera size={28}/></div>
                            <h3 className="font-black text-purple-900 text-lg">Carica Foto Prodotto</h3>
                            <p className="text-xs text-purple-700/70 mt-2 font-medium max-w-xs">L'AI analizzerà l'oggetto e scriverà nome, testo persuasivo e ne stimerà il prezzo.</p>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleAIAnalysis(e.target.files[0])} className="hidden" />
                    </div>
                )}

                {activeTab === 'manual' && (
                    <form id="productForm" onSubmit={handleSave} className="space-y-5">
                        <div className="flex justify-center mb-2">
                            {imageUrlPreview ? (
                                <div className="relative group">
                                    <img src={imageUrlPreview} alt="Preview" className="w-28 h-28 rounded-2xl object-cover border border-gray-200 shadow-inner" />
                                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <Edit3 className="text-white" size={24}/>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-[#00665E] hover:text-[#00665E] transition" onClick={() => fileInputRef.current?.click()}>
                                    <ImageIcon size={24} className="mb-2"/>
                                    <span className="text-[10px] font-bold uppercase">Foto Prodotto</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) { setImageFile(e.target.files[0]); setImageUrlPreview(URL.createObjectURL(e.target.files[0])); } }} className="hidden" />
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Nome Prodotto / Servizio</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#00665E] focus:bg-white font-bold transition" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Prezzo (€)</label>
                                <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#00665E] focus:bg-white font-black text-[#00665E] transition" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#00665E] focus:bg-white font-bold cursor-pointer transition">
                                    <option>Elettronica</option><option>Abbigliamento</option><option>Accessori</option><option>Casa</option><option>Servizi</option><option>Alimentari</option><option>Altro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Descrizione</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#00665E] focus:bg-white h-24 text-sm resize-none transition leading-relaxed" />
                        </div>

                        {/* --- CONFIGURAZIONE AR --- */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-3xl border border-purple-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest flex items-center gap-2">
                                    <X size={16} className="rotate-45"/> Realtà Aumentata (AR)
                                </h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={formData.ar_enabled} onChange={e => setFormData({...formData, ar_enabled: e.target.checked})} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                            
                            {formData.ar_enabled ? (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <div className="border-2 border-dashed border-purple-200 rounded-2xl p-4 bg-white/50 text-center">
                                        <p className="text-[10px] font-bold text-purple-700 mb-2 uppercase">Modello 3D (.glb)</p>
                                        <input type="file" accept=".glb" onChange={e => setArFile(e.target.files?.[0] || null)} className="text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer" />
                                        <p className="text-[9px] text-gray-400 mt-2 italic">Supporto AR ottimizzato per il negozio fisico e cataloghi digitali.</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl text-[10px] font-medium text-purple-800 border border-purple-200">
                                        💡 <strong>Ricorda:</strong> Il costo del servizio AR include un sovrapprezzo del 40% già calcolato nel tuo canone mensile IntegraOS.
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] text-gray-500 italic">Attiva l'interruttore per sbloccare la visualizzazione AR del prodotto per i tuoi clienti.</p>
                            )}
                        </div>

                        {/* --- DISCLAIMER LEGALE ESTESO (RICHIESTO) --- */}
                        <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
                            <h4 className="text-xs font-black text-red-700 flex items-center gap-1.5 mb-3">
                                <ShieldAlert size={16}/> Dichiarazione di Responsabilità
                            </h4>
                            <p className="text-[10px] text-red-600/90 leading-relaxed mb-4 font-medium text-justify">
                                Caricando questo prodotto, dichiari di possedere i diritti legali sulle immagini e sul marchio o di assumerti la totale responsabilità del loro utilizzo. È severamente vietata la pubblicazione di contenuti a sfondo sessista, materiale esplicito, incitazione all'odio o alla guerra, armi e qualsiasi prodotto o servizio non consentito dalla legge. <br/><br/>
                                <strong>IntegraOS non è in alcun modo responsabile per i contenuti caricati.</strong>
                            </p>
                            <label className="flex items-start gap-3 cursor-pointer bg-white p-3 rounded-xl border border-red-100 shadow-sm hover:bg-red-50/30 transition">
                                <input type="checkbox" required checked={legalConsent} onChange={e => setLegalConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer shrink-0" />
                                <span className="text-[10px] font-bold text-red-800 leading-snug">
                                    Accetto i termini e mi assumo la piena e totale responsabilità civile e penale dei contenuti pubblicati, confermando che non violano le policy descritte.
                                </span>
                            </label>
                        </div>
                    </form>
                )}
            </div>

            {activeTab === 'manual' && (
                <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                    <button type="submit" form="productForm" disabled={saving || !legalConsent} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl hover:bg-[#004d46] transition shadow-[0_10px_20px_rgba(0,102,94,0.2)] disabled:opacity-50 disabled:cursor-not-allowed">
                        {saving ? 'Salvataggio in corso...' : 'Pubblica Online nel Catalogo'}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}