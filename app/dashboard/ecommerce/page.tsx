'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation' // <--- AGGIUNTO QUESTO
import Papa from 'papaparse'

// Definiamo i limiti per piano
const PLAN_LIMITS = {
  Base: { maxProducts: 10, maxFileSize: 5 * 1024 * 1024, canImport: false }, // 5MB
  Enterprise: { maxProducts: 150, maxFileSize: 10 * 1024 * 1024, canImport: true }, // 10MB
  Ambassador: { maxProducts: 99999, maxFileSize: 20 * 1024 * 1024, canImport: true } // 20MB
}

export default function EcommercePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Stato del Piano Utente
  const [userPlan, setUserPlan] = useState<'Base' | 'Enterprise' | 'Ambassador'>('Base')

  // Stati UI
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_lens' | 'url'>('manual')
  const [analyzing, setAnalyzing] = useState(false)

  // Form Dati
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Prodotti'
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(null)
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter() // <--- INIZIALIZZATO ROUTER
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // 1. LEGGI IL PIANO REALE DAL DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      
      if (profile && profile.plan) {
         setUserPlan(profile.plan)
      }

      // 2. SCARICA I PRODOTTI (Corretto: prima c'era campaigns)
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setProducts(data)

      setLoading(false)
    }
    getData()
  }, [router, supabase])

  // --- CONTROLLO LIMITI ---
  const checkLimits = () => {
    const limits = PLAN_LIMITS[userPlan];
    if (products.length >= limits.maxProducts) {
      alert(`Hai raggiunto il limite di ${limits.maxProducts} prodotti per il piano ${userPlan}. Passa al livello successivo per aggiungerne altri!`);
      return false;
    }
    return true;
  }

  const checkFileLimit = (file: File) => {
    const limits = PLAN_LIMITS[userPlan];
    if (file.size > limits.maxFileSize) {
      alert(`Il file è troppo grande! Limite per ${userPlan}: ${limits.maxFileSize / 1024 / 1024}MB.`);
      return false;
    }
    return true;
  }

  // --- AI LENS REALE ---
  const handleAIAnalysis = async (file: File) => {
    if (!checkFileLimit(file)) return;

    setImageFile(file)
    setImageUrlPreview(URL.createObjectURL(file))
    setAnalyzing(true)

    try {
      // 1. Converti immagine in Base64 per inviarla all'API
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result;

        // 2. Chiama la nostra API (Claude Vision)
        const response = await fetch('/api/analyze-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image })
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // 3. Popola il form con i dati AI
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price || '',
          category: data.category || 'Prodotti'
        });
        
        setActiveTab('manual'); // Mostra all'utente il risultato per conferma
      };
    } catch (error: any) {
      alert("Errore Analisi AI: " + error.message);
    } finally {
      setAnalyzing(false);
    }
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

            // Controllo se l'importazione supera il limite totale
            if (products.length + rows.length > limits.maxProducts) {
                alert(`Impossibile importare. Supereresti il limite di ${limits.maxProducts} prodotti.`);
                return;
            }

            const newProducts = rows.map((row: any) => ({
                user_id: user.id,
                name: row.Nome || row.Name || 'Prodotto Importato',
                description: row.Descrizione || row.Description || '',
                price: parseFloat(row.Prezzo || row.Price || '0').toFixed(2),
                category: row.Categoria || 'Prodotti',
                image_url: 'https://via.placeholder.com/150'
            }))
            
            const { data, error } = await supabase.from('products').insert(newProducts).select()
            if(!error && data) {
                setProducts([...data, ...products])
                alert(`Importati ${data.length} prodotti!`)
                setIsImportModalOpen(false)
            } else {
                alert("Errore importazione: " + error?.message)
            }
        }
    })
    if (importInputRef.current) importInputRef.current.value = ''
  }

  // --- SALVATAGGIO ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Controllo finale limite (sicurezza)
    if (products.length >= PLAN_LIMITS[userPlan].maxProducts) {
        alert("Limite raggiunto.");
        setSaving(false);
        return;
    }

    let publicUrl = 'https://via.placeholder.com/300x200?text=No+Image'

    if (imageFile && user) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `prod_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, imageFile)

      if (uploadError) {
        alert('Errore caricamento foto: ' + uploadError.message)
      } else {
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
        publicUrl = urlData.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: publicUrl,
        category: formData.category
      })
      .select()

    if (!error && data) {
      setProducts([data[0], ...products])
      setIsModalOpen(false)
      setFormData({ name: '', description: '', price: '', category: 'Prodotti' })
      setImageFile(null)
      setImageUrlPreview(null)
      setActiveTab('manual')
    } else {
      alert('Errore: ' + error?.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Eliminare?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(products.filter(p => p.id !== id))
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Vetrina...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Vetrina Prodotti</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-xs font-bold bg-[#00665E] text-white px-2 py-0.5 rounded">Piano {userPlan}</span>
             <p className="text-gray-500 text-sm">
                Prodotti: {products.length} / {PLAN_LIMITS[userPlan].maxProducts === 99999 ? '∞' : PLAN_LIMITS[userPlan].maxProducts}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
             <input type="file" accept=".csv,.xlsx" ref={importInputRef} onChange={handleExcelUpload} className="hidden" />
             <button onClick={() => importInputRef.current?.click()} className={`bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl font-bold transition shadow-sm flex items-center gap-2 ${!PLAN_LIMITS[userPlan].canImport ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                📊 Importa Excel {(!PLAN_LIMITS[userPlan].canImport) && '🔒'}
             </button>
             <button onClick={() => checkLimits() && setIsModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center gap-2">
                + Nuovo Prodotto
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
            <div className="h-48 bg-gray-50 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                  <span className="text-[#00665E] font-black text-lg">€ {product.price}</span>
              </div>
              <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-1">{product.description}</p>
              <div className="pt-4 border-t border-gray-50 flex justify-end">
                  <button onClick={() => handleDelete(product.id)} className="text-xs font-bold text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded">Elimina</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white border border-gray-100 p-0 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="text-xl font-black text-[#00665E]">Nuovo Prodotto</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>

            {analyzing && (
                <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-[#00665E] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-[#00665E] animate-pulse">L'Intelligenza Artificiale sta analizzando...</p>
                    <p className="text-xs text-gray-400 mt-2">Identificazione oggetto e prezzo in corso</p>
                </div>
            )}

            <div className="flex p-2 gap-2 bg-gray-50">
                <button onClick={() => setActiveTab('manual')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'manual' ? 'bg-white shadow text-[#00665E]' : 'text-gray-400'}`}>✍️ Manuale</button>
                <button onClick={() => setActiveTab('ai_lens')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'ai_lens' ? 'bg-[#00665E] shadow text-white' : 'text-gray-400 hover:bg-gray-200'}`}>📷 AI Lens</button>
            </div>

            <div className="p-6 overflow-y-auto">
                {activeTab === 'ai_lens' && (
                    <div className="text-center py-6">
                        <div className="border-2 border-dashed border-[#00665E]/30 rounded-2xl p-8 bg-[#00665E]/5 cursor-pointer hover:bg-[#00665E]/10 transition group" onClick={() => fileInputRef.current?.click()}>
                            <div className="text-4xl mb-3 group-hover:scale-110 transition">📸</div>
                            <h3 className="font-bold text-[#00665E]">Carica Foto Reale</h3>
                            <p className="text-xs text-gray-500 mt-2">Analisi tramite Claude 3 Haiku per compilare i dati.</p>
                        </div>
                        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleAIAnalysis(e.target.files[0])} className="hidden" />
                    </div>
                )}

                {activeTab === 'manual' && (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="flex justify-center mb-4">
                            {imageUrlPreview ? (
                                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imageUrlPreview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="text-xs text-center text-gray-400">Nessuna foto selezionata</div>
                            )}
                        </div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nome</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Prezzo (€)</label><input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none" /></div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none">
                                    <option>Prodotti</option>
                                    <option>Servizi</option>
                                </select>
                            </div>
                        </div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Descrizione</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none h-20" /></div>
                        <button type="submit" disabled={saving} className="w-full bg-[#00665E] text-white font-bold py-3 rounded-xl hover:bg-[#004d46] transition">{saving ? 'Salvataggio...' : 'Conferma'}</button>
                    </form>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}