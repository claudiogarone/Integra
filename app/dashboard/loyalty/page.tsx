'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { 
  CreditCard, Store, Plus, ShoppingCart, Save, Trash2, Image as ImageIcon, 
  MapPin, Phone, Mail, FileText, User, UploadCloud, Loader2, Edit3, Download, 
  CheckCircle, Building, Settings, X, Palette
} from 'lucide-react'
import QRCode from "react-qr-code"
import Link from 'next/link'

export default function LoyaltyConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloadingCard, setDownloadingCard] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [companyName, setCompanyName] = useState('La Tua Azienda')
  
  const [config, setConfig] = useState<any>({
      card_name: 'VIP Club', card_color_primary: '#00665E', card_color_secondary: '#004d46', card_logo_url: '',
      max_cards_limit: 500, max_stores_limit: 5, points_per_euro: 1, points_for_feedback: 50
  })
  const [stores, setStores] = useState<any[]>([])
  const [cardsIssued, setCardsIssued] = useState(0)
  
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null)
  
  const [newStore, setNewStore] = useState({ 
      name: '', address: '', discount_percent: 10, 
      vat_number: '', email: '', phone: '', manager_name: '', store_code: '', pin_code: '0000'
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardPreviewRef = useRef<HTMLDivElement>(null)
  const cleanTemplateRef = useRef<HTMLDivElement>(null) // IL TEMPLATE PER LA TIPOGRAFIA
  const stickerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const currentUser = sessionData?.session?.user

    if (!currentUser) {
        setLoading(false);
        return;
    }
    setUser(currentUser)

    const { data: profile } = await supabase.from('profiles').select('company_name').eq('id', currentUser.id).single()
    if (profile && profile.company_name) setCompanyName(profile.company_name)

    let { data: settings } = await supabase.from('loyalty_settings').select('*').eq('user_id', currentUser.id).single()
    if (!settings) {
        const { data } = await supabase.from('loyalty_settings').insert({ user_id: currentUser.id }).select().single()
        settings = data
    }
    if (settings) setConfig(settings)

    const { data: storeList } = await supabase.from('loyalty_stores').select('*').eq('user_id', currentUser.id).order('created_at', {ascending: true})
    setStores(storeList || [])

    const { count } = await supabase.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id)
    setCardsIssued(count || 0)
    
    setLoading(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
        const fileName = `fidelity_logo_${Date.now()}_${safeName}`;
        
        const { error } = await supabase.storage.from('products').upload(fileName, file, { upsert: true });
        if (error) throw new Error(error.message);

        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        setConfig((prev: any) => ({ ...prev, card_logo_url: data.publicUrl }));
        alert("✅ Logo caricato! Ricorda di cliccare 'Salva Stile' per confermare.");
    } catch (err: any) {
        alert("Errore caricamento immagine: " + err.message);
    } finally {
        setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
      if (!user) return alert("Errore: Utente non autenticato. Ricarica la pagina.");
      setSaving(true)
      const { error } = await supabase.from('loyalty_settings').upsert({ user_id: user.id, ...config })
      if (error) alert("Errore Database: " + error.message)
      else alert("✅ Stile e Impostazioni della Carta salvati con successo!")
      setSaving(false)
  }

  const openStoreModal = (store?: any) => {
      if (store) {
          setEditingStoreId(store.id)
          setNewStore({
              name: store.name, address: store.address || '', discount_percent: store.discount_percent || 10,
              vat_number: store.vat_number || '', email: store.email || '', phone: store.phone || '',
              manager_name: store.manager_name || '', store_code: store.store_code, pin_code: store.pin_code
          })
      } else {
          if (stores.length >= config.max_stores_limit) return alert("⚠️ Limite negozi consentiti dal tuo piano raggiunto.")
          setEditingStoreId(null)
          setNewStore({ name: '', address: '', discount_percent: 10, vat_number: '', email: '', phone: '', manager_name: '', store_code: '', pin_code: '0000' })
      }
      setIsStoreModalOpen(true)
  }

  const handleSaveStore = async () => {
      if (!user) return alert("Errore: Utente non autenticato. Ricarica la pagina.");
      if (!newStore.name || !newStore.address) return alert("Inserisci almeno Nome Insegna e Indirizzo.")
      
      setSaving(true)
      const finalCode = newStore.store_code || `SHOP-${Math.floor(1000 + Math.random() * 9000)}`

      if (editingStoreId) {
          const { data, error } = await supabase.from('loyalty_stores').update({ ...newStore, store_code: finalCode }).eq('id', editingStoreId).select().single()
          if (error) alert("Errore aggiornamento: " + error.message)
          else {
              setStores(stores.map(s => s.id === editingStoreId ? data : s))
              setIsStoreModalOpen(false)
          }
      } else {
          const { data, error } = await supabase.from('loyalty_stores').insert({ user_id: user.id, ...newStore, store_code: finalCode }).select().single()
          if (error) alert("Errore creazione Negozio: " + error.message)
          else {
              setStores([...stores, data])
              setIsStoreModalOpen(false)
          }
      }
      setSaving(false)
  }

  const handleDeleteStore = async (id: number) => {
      if(!confirm("Sicuro di voler eliminare questo punto vendita? Le statistiche rimarranno, ma la cassa verrà disattivata.")) return;
      const { error } = await supabase.from('loyalty_stores').delete().eq('id', id)
      if(!error) setStores(stores.filter(s => s.id !== id))
  }

  // --- DOWNLOAD GRAFICA PULITA (Per Tipografia) ---
  const downloadCleanTemplate = async () => {
      if (cleanTemplateRef.current === null) return;
      setDownloadingCard(true)
      try {
          await new Promise(resolve => setTimeout(resolve, 300)); 
          const dataUrl = await toPng(cleanTemplateRef.current, { cacheBust: true, pixelRatio: 3 })
          const link = document.createElement('a')
          link.download = `Template_Tipografia_${companyName.replace(/\s/g, '_')}.png`
          link.href = dataUrl; 
          link.click()
          alert("✅ Template Pulito scaricato! Manda questo file e il CSV dei clienti alla tipografia.")
      } catch (err: any) {
          alert("Errore generazione immagine. " + err.message)
      } finally {
          setDownloadingCard(false)
      }
  }

  const downloadSticker = async (storeName: string) => {
      if (stickerRef.current === null) return;
      try {
          const dataUrl = await toPng(stickerRef.current, { cacheBust: true, pixelRatio: 3 })
          const link = document.createElement('a')
          link.download = `Vetrofania_${storeName.replace(/\s/g, '_')}.png`
          link.href = dataUrl; 
          link.click()
      } catch (err: any) {
          alert("Errore generazione vetrofania.")
      }
  }

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse flex items-center gap-2"><Loader2 className="animate-spin"/> Sincronizzazione Fidelity...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      
      {/* HEADER INTEGRAOS STYLE */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3"><Palette size={28}/> Branding & Locali</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Imposta la veste grafica del tuo Club e gestisci le casse abilitate (POS).</p>
        </div>
        <div className="flex gap-3">
             <Link href="/dashboard/loyalty/terminal" className="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 hover:text-slate-900 transition flex items-center gap-2 shadow-sm">
                 <Store size={18}/> Apri POS
             </Link>
             <button onClick={handleSaveConfig} disabled={saving} className="bg-[#00665E] text-white px-8 py-2.5 rounded-xl font-black shadow-[0_4px_14px_rgba(0,102,94,0.3)] hover:bg-[#004d46] hover:-translate-y-0.5 transition flex items-center gap-2 disabled:opacity-50">
                 {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Salva Stile
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA 1: DESIGN CARTA E REGOLE */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-8 items-start">
                
                {/* PREVIEW MANICHINO (Visiva per l'admin) */}
                <div className="w-full xl:w-1/2 shrink-0">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-[#00665E]"/> Preview Grafica</h3>
                    
                    <div 
                        ref={cardPreviewRef}
                        className="relative w-full aspect-[1.586/1] rounded-[1.5rem] shadow-xl p-6 text-white flex flex-col justify-between transition-all duration-500 overflow-hidden border border-black/10"
                        style={{ background: `linear-gradient(135deg, ${config.card_color_primary}, ${config.card_color_secondary})` }}
                    >
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        
                        <div className="flex justify-between items-start z-10">
                            <div>
                                <span className="font-black text-sm tracking-widest uppercase drop-shadow-md block leading-tight">{config.card_name}</span>
                                <span className="text-[10px] uppercase font-bold opacity-80 tracking-widest">{companyName}</span>
                            </div>
                            {config.card_logo_url ? (
                                <img src={config.card_logo_url} alt="Logo" className="w-12 h-12 object-contain bg-white/20 p-2 rounded-xl backdrop-blur-md shadow-sm" crossOrigin="anonymous"/>
                            ) : (
                                <div className="w-12 h-12 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center font-bold shadow-sm"><Building size={20}/></div>
                            )}
                        </div>
                        <div className="z-10 mt-auto my-4">
                            <p className="text-[9px] uppercase font-bold tracking-widest opacity-80 mb-0.5">Saldo Attuale</p>
                            <p className="text-4xl font-black tracking-tighter">1.250</p>
                        </div>
                        <div className="flex justify-between items-end z-10">
                            <div className="text-xs font-bold opacity-90 uppercase tracking-widest">Mario Rossi</div>
                            <div className="bg-white p-1.5 rounded-lg shadow-md"><QRCode value="DEMO-CODE" size={32} /></div>
                        </div>
                    </div>

                    <button onClick={downloadCleanTemplate} disabled={downloadingCard} className="w-full mt-6 bg-[#00665E]/10 text-[#00665E] border border-[#00665E]/20 py-3 rounded-xl font-bold hover:bg-[#00665E]/20 transition flex items-center justify-center gap-2 shadow-sm text-sm">
                        {downloadingCard ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} Scarica Template Tipografia
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2 text-center leading-relaxed">Scarica la versione <b>PULITA</b> (senza QR e nomi finti) in alta definizione da inviare in stampa per generare le tessere fisiche (es. RFID).</p>
                </div>

                {/* CONTROLLI EDITOR */}
                <div className="flex-1 w-full space-y-5">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><Settings size={18} className="text-[#00665E]"/> Opzioni Branding</h3>
                    
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome Programma Fedeltà</label>
                        <input type="text" value={config.card_name} onChange={e => setConfig({...config, card_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] focus:bg-white font-bold transition" placeholder="Es: VIP Club" />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Carica Nuovo Logo</label>
                        <label className="cursor-pointer bg-white border border-gray-200 text-[#00665E] px-4 py-3 rounded-xl text-sm font-bold hover:border-[#00665E] hover:bg-[#00665E]/5 transition flex items-center justify-center gap-2 w-full shadow-sm">
                            <UploadCloud size={18}/> {config.card_logo_url ? 'Sostituisci Logo...' : 'Sfoglia Immagini...'}
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Colore Sfondo 1</label>
                            <input type="color" value={config.card_color_primary} onChange={e => setConfig({...config, card_color_primary: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Colore Sfondo 2</label>
                            <input type="color" value={config.card_color_secondary} onChange={e => setConfig({...config, card_color_secondary: e.target.value})} className="w-full h-12 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <label className="text-[10px] font-black text-[#00665E] uppercase tracking-widest mb-2 block">Regola Cashback (Punti)</label>
                        <div className="flex items-center gap-3 bg-[#00665E]/5 p-4 rounded-xl border border-[#00665E]/20">
                            <span className="font-bold text-[#00665E]">Spesa di 1 € =</span>
                            <input type="number" min="1" value={config.points_per_euro} onChange={e => setConfig({...config, points_per_euro: parseInt(e.target.value)})} className="w-20 p-2 rounded-lg border border-[#00665E]/30 outline-none text-center font-black text-[#00665E] bg-white shadow-inner" />
                            <span className="font-bold text-[#00665E]">Punti</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* COLONNA 2: NEGOZI */}
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#00665E] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-10"><ShoppingCart size={150}/></div>
                <h3 className="font-black text-lg mb-6 relative z-10">Stato Abbonamento IntegraOS</h3>
                <div className="space-y-5 relative z-10">
                    <div>
                        <div className="flex justify-between mb-2 text-sm font-bold"><span>💳 Carte Generabili</span><span className="opacity-80">{cardsIssued} / {config.max_cards_limit}</span></div>
                        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-1"><div className="bg-white h-full" style={{width: `${Math.min((cardsIssued/config.max_cards_limit)*100, 100)}%`}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-2 text-sm font-bold"><span>🏪 Casse POS Autorizzate</span><span className="opacity-80">{stores.length} / {config.max_stores_limit}</span></div>
                        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden mb-1"><div className="bg-teal-300 h-full" style={{width: `${(stores.length/config.max_stores_limit)*100}%`}}></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col h-[420px]">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h3 className="font-black text-gray-800 flex items-center gap-2"><Store size={20} className="text-[#00665E]"/> I Tuoi Punti Vendita</h3>
                    <button onClick={() => openStoreModal()} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#00665E] hover:text-white transition flex items-center gap-1 shadow-sm"><Plus size={14}/> Aggiungi</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {stores.length === 0 && <p className="text-center text-gray-400 text-sm py-10 italic">Nessun terminale di cassa configurato.</p>}
                    {stores.map((store) => (
                        <div key={store.id} className="p-4 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-white hover:border-[#00665E]/30 hover:shadow-md transition relative group">
                            <div className="mb-2 pr-12">
                                <h4 className="font-bold text-sm text-gray-900">{store.name}</h4>
                                <p className="text-xs text-gray-500 line-clamp-1">{store.address}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">P.IVA {store.vat_number || '-'}</span>
                                <span className="bg-[#00665E]/10 border border-[#00665E]/20 text-[#00665E] px-2 py-0.5 rounded text-[10px] font-bold">POS ID: {store.store_code}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 pt-3 border-t border-gray-200 flex justify-between items-center font-medium">
                                <button onClick={() => downloadSticker(store.name)} className="text-[#00665E] font-bold flex items-center gap-1 hover:underline bg-[#00665E]/5 px-2 py-1 rounded"><Download size={12}/> Vetrofania</button>
                                <span className="font-black text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">PIN: {store.pin_code}</span>
                            </div>
                            
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => openStoreModal(store)} className="bg-white text-[#00665E] p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-[#00665E]/10"><Edit3 size={14}/></button>
                                <button onClick={() => handleDeleteStore(store.id)} className="bg-white text-rose-500 p-2 rounded-lg shadow-sm border border-gray-200 hover:bg-rose-50"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* SEZIONE CONDIVISIONE DIGITALE */}
      <div className="mt-8 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <h3 className="font-black text-gray-800 text-lg mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00665E]"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Condivisione Digitale
          </h3>
          <p className="text-sm text-gray-500 mb-6">Condividi il link di iscrizione digitale con i tuoi clienti via WhatsApp, Email o QR. I clienti potranno iscriversi online e ricevere la loro card virtuale.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* LINK DIGITALE */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Link Iscrizione</p>
                  <div className="flex gap-2">
                      <input
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/loyalty/join` : '/loyalty/join'}
                          className="flex-1 bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-mono text-gray-600 outline-none"
                      />
                      <button
                          onClick={() => { if(typeof window !== 'undefined') { navigator.clipboard.writeText(`${window.location.origin}/loyalty/join`); alert('✅ Link copiato negli appunti!'); } }}
                          className="bg-[#00665E] text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-[#004d46] transition shrink-0"
                      >
                          Copia
                      </button>
                  </div>
              </div>

              {/* WHATSAPP */}
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Condividi via WhatsApp</p>
                  <button
                      onClick={() => {
                          if(typeof window !== 'undefined') {
                              const msg = encodeURIComponent(`Ciao! Iscriviti al nostro programma fedeltà ${config.card_name} e ottieni punti ad ogni acquisto 🎁 → ${window.location.origin}/loyalty/join`);
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                          }
                      }}
                      className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-sm hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Invia su WhatsApp
                  </button>
              </div>

              {/* INFO POS */}
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">💡 Come Caricare Punti</p>
                  <p className="text-xs text-blue-800 font-medium leading-relaxed mb-3">Per caricare punti su una tessera devi prima:
                      <br/>1. Creare un <b>Punto Vendita (POS)</b> nella colonna destra
                      <br/>2. Aprire il terminale <b>Apri POS</b>
                      <br/>3. Inserire il numero tessera del cliente
                  </p>
                  <p className="text-[10px] text-blue-600 italic">Le carte generate in "Generale" richiedono comunque un POS attivo per la lettura dei punti.</p>
              </div>
          </div>
      </div>

      {/* MODALE NUOVO / MODIFICA NEGOZIO */}
      {isStoreModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
             <div className="bg-white p-8 rounded-3xl max-w-2xl w-full relative shadow-2xl my-10 animate-in zoom-in-95">
                <button onClick={() => setIsStoreModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition"><X size={16}/></button>
                <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                    <div className="bg-[#00665E]/10 text-[#00665E] p-3.5 rounded-2xl"><Store size={28}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900">{editingStoreId ? 'Modifica Cassa' : 'Nuova Cassa POS'}</h3>
                        <p className="text-xs text-gray-500 font-medium">Configura le credenziali di accesso al terminale per questo negozio.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome Insegna *</label>
                        <input type="text" placeholder="Es. Negozio Centro" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E] focus:bg-white transition mt-1 font-bold text-gray-900" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Indirizzo Fisico *</label>
                        <div className="relative mt-1">
                            <MapPin className="absolute left-4 top-4 text-gray-400" size={18}/>
                            <input type="text" placeholder="Via Roma 1, Milano" className="w-full pl-12 p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E] focus:bg-white transition text-gray-900" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Partita IVA (Opz.)</label>
                        <div className="relative mt-1">
                            <FileText className="absolute left-4 top-4 text-gray-400" size={16}/>
                            <input type="text" placeholder="IT12345678901" className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E] font-mono text-sm" value={newStore.vat_number} onChange={e => setNewStore({...newStore, vat_number: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Responsabile (Manager)</label>
                        <div className="relative mt-1">
                            <User className="absolute left-4 top-4 text-gray-400" size={16}/>
                            <input type="text" placeholder="Nome e Cognome" className="w-full pl-12 p-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#00665E] text-sm" value={newStore.manager_name} onChange={e => setNewStore({...newStore, manager_name: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-2 gap-5 p-6 bg-[#00665E]/5 rounded-3xl border border-[#00665E]/20 mt-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#00665E] tracking-widest block mb-2">ID Cassa (Auto o Manuale)</label>
                            <input type="text" placeholder="SHOP-001" className="w-full p-3.5 bg-white rounded-xl border border-[#00665E]/30 outline-none focus:border-[#00665E] font-mono uppercase font-bold text-sm shadow-inner" value={newStore.store_code} onChange={e => setNewStore({...newStore, store_code: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-[#00665E] tracking-widest block mb-2">PIN Accesso POS</label>
                            <input type="text" placeholder="0000" maxLength={4} className="w-full p-3.5 bg-white rounded-xl border border-[#00665E]/30 outline-none focus:border-[#00665E] font-mono tracking-[0.5em] text-center font-black text-xl text-[#00665E] shadow-inner" value={newStore.pin_code} onChange={e => setNewStore({...newStore, pin_code: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                    <button onClick={() => setIsStoreModalOpen(false)} className="w-1/3 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-xl border border-transparent hover:border-gray-200 transition">Annulla</button>
                    <button onClick={handleSaveStore} disabled={saving} className="w-2/3 bg-[#00665E] text-white py-4 rounded-xl font-black shadow-[0_4px_14px_rgba(0,102,94,0.3)] hover:bg-[#004d46] transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="animate-spin"/> : (editingStoreId ? <Save/> : <Plus/>)}
                        {saving ? 'Registrazione...' : (editingStoreId ? 'Aggiorna Dati Cassa' : 'Abilita Nuova Cassa')}
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* ============================================================== */}
      {/* 🛑 COMPONENTI NASCOSTI PER EXPORT ALTA DEFINIZIONE             */}
      {/* ============================================================== */}

      {/* 1. TEMPLATE PULITO PER TIPOGRAFIA (NO NOMI, NO QR) */}
      <div className="fixed -left-[9000px]">
        <div 
            ref={cleanTemplateRef} 
            className="w-[1056px] h-[666px] flex flex-col justify-between p-16 text-white overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${config.card_color_primary}, ${config.card_color_secondary})` }}
        >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, white 2px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="flex justify-between items-start z-10">
                <div>
                    <span className="font-black text-4xl tracking-widest uppercase drop-shadow-lg block mb-2">{config.card_name}</span>
                    <span className="text-xl uppercase font-bold opacity-80 tracking-widest">{companyName}</span>
                </div>
                {config.card_logo_url && (
                    <img src={config.card_logo_url} alt="Logo" className="h-32 object-contain bg-white/20 p-4 rounded-3xl backdrop-blur-md shadow-lg" crossOrigin="anonymous"/>
                )}
            </div>
            {/* Solo l'etichetta del livello, spazio vuoto per nome/QR che verranno stampati a laser */}
            <div className="z-10 mt-auto text-right">
                <p className="text-xl font-bold opacity-70 uppercase tracking-widest">Card Holder</p>
            </div>
        </div>
      </div>

      {/* 2. VETROFANIA NEGOZIO */}
      <div className="fixed -left-[9000px]">
          <div ref={stickerRef} className="w-[800px] h-[800px] bg-white rounded-full flex flex-col items-center justify-center border-[24px] border-[#00665E] p-20 text-center shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
             <CheckCircle size={140} className="text-[#00665E] mb-8 relative z-10"/>
             <h1 className="text-7xl font-black text-gray-900 uppercase tracking-tighter leading-none relative z-10">QUI ACCETTIAMO<br/>LA VIP CARD</h1>
             <p className="text-3xl font-bold text-gray-600 mt-6 relative z-10">{companyName}</p>
             <div className="mt-12 bg-gray-50 p-6 rounded-[2rem] border-4 border-gray-200 relative z-10 shadow-inner">
                 <QRCode value="https://integraos.it/fidelity" size={220} fgColor="#00665E" />
             </div>
             <p className="text-2xl font-black text-[#00665E] mt-8 uppercase tracking-widest relative z-10">Inquadra per iscriverti</p>
          </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}}/>
    </main>
  )
}