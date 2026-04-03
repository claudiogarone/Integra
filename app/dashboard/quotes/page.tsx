'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { 
    FileText, Plus, Trash2, Send, Building, User, ShoppingBag, 
    Download, Edit3, Loader2, BarChart3, Eye, CheckCircle, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

export default function QuotesPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'archive'>('new')
  
  // Dati Globali dal DB
  const [user, setUser] = useState<any>(null)
  const [companyProfile, setCompanyProfile] = useState<any>({ name: 'La Tua Azienda', logo: '', address: '', city: '', cap: '', province: '', p_iva: '', email: '', phone: '' })
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([]) 

  // Stato Form Nuovo Preventivo
  const [quoteNumber, setQuoteNumber] = useState('001/2026') // NUMERAZIONE AUTOMATICA
  const [clientMode, setClientMode] = useState<'crm' | 'manual'>('crm')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [customClient, setCustomClient] = useState({ name: '', email: '', phone: '', address: '', p_iva: '' })
  
  // Voci con IVA (taxRate)
  const [quoteItems, setQuoteItems] = useState<any[]>([])
  const [customItem, setCustomItem] = useState({ name: '', description: '', price: 0, qty: 1, taxRate: 22 })
  
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0])
  const [quoteNotes, setQuoteNotes] = useState('Grazie per averci scelto. Restiamo a disposizione per eventuali chiarimenti. Pagamento tramite bonifico bancario a 30gg.')

  const [viewQuoteModal, setViewQuoteModal] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (!currentUser) {
          setLoading(false);
          return;
      }
      setUser(currentUser);

      try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
          if (profile) {
              setCompanyProfile({
                  name: profile.company_name || 'La Tua Azienda',
                  logo: profile.logo_url || '',
                  address: profile.address || '',
                  city: profile.city || '',
                  cap: profile.cap || '',
                  province: profile.province || '',
                  p_iva: profile.p_iva || '',
                  email: profile.company_email || '',
                  phone: profile.whatsapp_number || profile.phone_secondary || ''
              })
          }

          const { data: leads } = await supabase.from('contacts').select('*').order('name')
          if (leads) setContacts(leads)

          const { data: prods } = await supabase.from('products').select('*').neq('is_deleted', true)
          if (prods) setProducts(prods)

          const { data: dbQuotes } = await supabase.from('quotes').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
          if (dbQuotes) {
              setQuotes(dbQuotes)
              // CALCOLO NUMERAZIONE AUTOMATICA (Anno corrente)
              const currentYear = new Date().getFullYear();
              const yearQuotes = dbQuotes.filter(q => q.quote_number && q.quote_number.includes(`/${currentYear}`));
              const nextNum = yearQuotes.length + 1;
              setQuoteNumber(`${String(nextNum).padStart(3, '0')}/${currentYear}`);
          }

      } catch (e) {
          console.error(e)
      } finally {
          setLoading(false)
      }
    }

    fetchAllData()
  }, [supabase])

  const activeClientInfo = clientMode === 'crm' ? selectedClient : customClient;

  // Calcoli Matematici con IVA per ogni singola voce
  const calculateSubTotal = () => quoteItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
  const calculateTax = () => quoteItems.reduce((acc, item) => acc + (item.price * item.qty * (item.taxRate / 100)), 0)
  const calculateTotal = () => calculateSubTotal() + calculateTax()

  // -------------------------------------------------------------
  // GENERAZIONE PDF NATIVA (Istantanea e infallibile)
  // -------------------------------------------------------------
  const handleDownloadPDF = () => {
      // Usiamo il motore nativo del browser: zero caricamenti, zero blocchi.
      // Il CSS @media print che abbiamo scritto si occuperà di formattare l'A4 perfettamente.
      alert("💡 Suggerimento: Nella finestra che si aprirà, scegli 'Salva come PDF' come destinazione stampante.");
      window.print();
  }

  // AZIONE: INVIO REALE MAIL E SALVATAGGIO
  const handleSendQuote = async () => {
      if(!activeClientInfo || !activeClientInfo.name) return alert("Seleziona o compila i dati del cliente prima di inviare.");
      if(!activeClientInfo.email) return alert("Il cliente non ha un'email impostata.");
      if(quoteItems.length === 0) return alert("Il preventivo è vuoto.");

      setSending(true);
      
      try {
          const { data: savedQuote, error } = await supabase.from('quotes').insert({
              user_id: user.id,
              quote_number: quoteNumber, // Salviamo il numero generato!
              client_name: activeClientInfo.name,
              client_email: activeClientInfo.email,
              total_amount: calculateTotal(),
              status: 'Inviato',
              items: quoteItems,
              notes: quoteNotes
          }).select().single();

          if (error) throw error;

          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token || '';

          const res = await fetch('/api/send-quote', {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({
                  quote_id: savedQuote.id,
                  quote_number: quoteNumber, // Passiamo il numero all'email!
                  client_email: activeClientInfo.email,
                  client_name: activeClientInfo.name,
                  company_name: companyProfile.name,
                  company_logo: companyProfile.logo,
                  base_url: window.location.origin, 
                  quote_details: {
                      items: quoteItems,
                      subtotal: calculateSubTotal(),
                      tax: calculateTax(),
                      total: calculateTotal(),
                      notes: quoteNotes
                  }
              })
          });

          if (!res.ok) throw new Error("Errore durante l'invio dell'email.");

          alert(`✅ Preventivo N° ${quoteNumber} inviato con successo a ${activeClientInfo.email}!`);
          
          // Aggiorna lista e ricalcola numero successivo
          const { data: dbQuotes } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
          if (dbQuotes) {
              setQuotes(dbQuotes)
              const currentYear = new Date().getFullYear();
              const yearQuotes = dbQuotes.filter(q => q.quote_number?.includes(`/${currentYear}`));
              setQuoteNumber(`${String(yearQuotes.length + 1).padStart(3, '0')}/${currentYear}`);
          }
          
          setQuoteItems([]); setCustomItem({ name: '', description: '', price: 0, qty: 1, taxRate: 22 });
          setActiveTab('archive');

      } catch (err: any) {
          alert("❌ Errore: " + err.message);
      } finally {
          setSending(false);
      }
  }

  // Helper per il carrello
  const addItemFromCatalog = (product: any) => setQuoteItems([...quoteItems, { id: Date.now(), name: product.name, description: product.description, price: product.price, qty: 1, taxRate: 22 }])
  const addCustomItem = () => {
      if(!customItem.name) return alert("Inserisci il nome.");
      setQuoteItems([...quoteItems, { id: Date.now(), name: customItem.name, description: customItem.description, price: Number(customItem.price), qty: Number(customItem.qty), taxRate: Number(customItem.taxRate) }])
      setCustomItem({ name: '', description: '', price: 0, qty: 1, taxRate: 22 })
  }
  const updateItemQty = (id: number, qty: number) => setQuoteItems(quoteItems.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item))
  const updateItemPrice = (id: number, price: number) => setQuoteItems(quoteItems.map(item => item.id === id ? { ...item, price: price } : item))
  const updateItemTax = (id: number, taxRate: number) => setQuoteItems(quoteItems.map(item => item.id === id ? { ...item, taxRate: taxRate } : item))
  const removeItem = (id: number) => setQuoteItems(quoteItems.filter(item => item.id !== id))

  const chartData = [
      { name: 'Inviati', value: quotes.filter(q => q.status === 'Inviato').length, color: '#3B82F6' },
      { name: 'Visionati', value: quotes.filter(q => q.status === 'Visionato').length, color: '#F59E0B' },
      { name: 'Accettati', value: quotes.filter(q => q.status === 'Accettato').length, color: '#10B981' }
  ];

  if (loading) return <div className="p-10 text-[#00665E] font-bold animate-pulse">Inizializzazione Motore Preventivi...</div>

  return (
    <main className="flex-1 p-8 bg-[#F8FAFC] text-gray-900 font-sans min-h-screen pb-20">
      
      {/* HEADER GLOBALE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] flex items-center gap-3">
              <FileText size={28}/> Studio Preventivi
          </h1>
          <p className="text-gray-500 text-sm mt-1">Genera PDF in HD e invia documenti interattivi via email.</p>
        </div>
      </div>

      {/* TAB NAVIGAZIONE */}
      <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 w-fit mb-8 shadow-sm print:hidden">
          <button onClick={() => setActiveTab('new')} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'new' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><Plus size={16}/> Nuovo Documento</button>
          <button onClick={() => { setActiveTab('archive'); setLoading(true); supabase.from('quotes').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).then(({data}) => {if(data) setQuotes(data); setLoading(false)}) }} className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'archive' ? 'bg-[#00665E] text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 size={16}/> Analitica & Archivio</button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COSTRUTTORE PREVENTIVO */}
      {/* ========================================================================= */}
      {activeTab === 'new' && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in">
          
          {/* PANNELLO DI SINISTRA: CONFIGURAZIONE */}
          <div className="xl:col-span-5 space-y-6 print:hidden">
              
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-[#00665E]"/> Dati Cliente</h3>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button onClick={() => setClientMode('crm')} className={`px-3 py-1 text-xs font-bold rounded-md ${clientMode === 'crm' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>CRM</button>
                          <button onClick={() => setClientMode('manual')} className={`px-3 py-1 text-xs font-bold rounded-md ${clientMode === 'manual' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>Manuale</button>
                      </div>
                  </div>

                  {clientMode === 'crm' ? (
                      <>
                          <select className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#00665E] bg-gray-50 text-sm font-medium cursor-pointer"
                                  onChange={(e) => setSelectedClient(contacts.find(c => c.id.toString() === e.target.value) || null)}>
                              <option value="">-- Seleziona dal database --</option>
                              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          {selectedClient && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
                                  <p className="font-bold">{selectedClient.name}</p><p>{selectedClient.email}</p>
                              </div>
                          )}
                      </>
                  ) : (
                      <div className="space-y-3 text-xs">
                          <input type="text" placeholder="Nome o Ragione Sociale" value={customClient.name} onChange={e=>setCustomClient({...customClient, name: e.target.value})} className="w-full p-2.5 rounded-lg border outline-none focus:border-[#00665E] font-bold" />
                          <div className="grid grid-cols-2 gap-3">
                              <input type="email" placeholder="Email (per invio reale)" value={customClient.email} onChange={e=>setCustomClient({...customClient, email: e.target.value})} className="w-full p-2.5 rounded-lg border outline-none focus:border-[#00665E]" />
                              <input type="text" placeholder="Telefono" value={customClient.phone} onChange={e=>setCustomClient({...customClient, phone: e.target.value})} className="w-full p-2.5 rounded-lg border outline-none focus:border-[#00665E]" />
                          </div>
                          <input type="text" placeholder="Indirizzo (Es. Via Roma 10, Milano)" value={customClient.address} onChange={e=>setCustomClient({...customClient, address: e.target.value})} className="w-full p-2.5 rounded-lg border outline-none focus:border-[#00665E]" />
                          <input type="text" placeholder="P.IVA / C.F." value={customClient.p_iva} onChange={e=>setCustomClient({...customClient, p_iva: e.target.value})} className="w-full p-2.5 rounded-lg border outline-none focus:border-[#00665E] font-mono" />
                      </div>
                  )}
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2"><ShoppingBag size={18} className="text-[#00665E]"/> Voci Preventivo</h3>
                  
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Aggiungi Rapida da Catalogo</p>
                  <div className="grid grid-cols-2 gap-2 mb-6 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-gray-50 rounded-xl border border-gray-100">
                      {products.map(p => (
                          <div key={p.id} onClick={() => addItemFromCatalog(p)} className="bg-white p-2 rounded-lg border border-gray-200 cursor-pointer hover:border-[#00665E] transition">
                              <p className="font-bold text-xs text-gray-800 line-clamp-1">{p.name}</p><p className="text-[10px] font-black text-gray-500 mt-1">€ {p.price}</p>
                          </div>
                      ))}
                  </div>

                  <div className="mb-6 p-3 bg-purple-50 border border-purple-100 rounded-xl">
                      <p className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1 mb-2"><Edit3 size={12}/> Voce Libera Extra</p>
                      <div className="space-y-2 text-xs">
                          <input type="text" placeholder="Nome Servizio Extra" value={customItem.name} onChange={e=>setCustomItem({...customItem, name: e.target.value})} className="w-full p-2 border border-purple-200 rounded outline-none focus:border-purple-500 font-bold"/>
                          <div className="flex gap-2">
                              <input type="number" placeholder="Q.tà" min="1" value={customItem.qty} onChange={e=>setCustomItem({...customItem, qty: Number(e.target.value)})} className="w-12 p-2 border border-purple-200 rounded text-center" title="Quantità"/>
                              <input type="number" placeholder="Prezzo €" step="0.01" value={customItem.price || ''} onChange={e=>setCustomItem({...customItem, price: Number(e.target.value)})} className="flex-1 p-2 border border-purple-200 rounded font-bold text-purple-700"/>
                              <select value={customItem.taxRate} onChange={e=>setCustomItem({...customItem, taxRate: Number(e.target.value)})} className="w-16 p-2 border border-purple-200 rounded outline-none text-center cursor-pointer bg-white" title="Seleziona IVA">
                                  <option value={22}>22%</option><option value={10}>10%</option><option value={4}>4%</option><option value={0}>0%</option>
                              </select>
                              <button onClick={addCustomItem} className="bg-purple-600 text-white px-3 rounded font-bold"><Plus size={16}/></button>
                          </div>
                      </div>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Riepilogo e Modifica Voci</p>
                  <div className="space-y-2">
                      {quoteItems.length === 0 ? <p className="text-xs text-gray-400 italic py-2">Vuoto.</p> : null}
                      {quoteItems.map(item => (
                          <div key={item.id} className="flex flex-col gap-2 bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm">
                              <div className="flex justify-between items-start">
                                  <p className="font-bold text-xs text-gray-900 line-clamp-1 flex-1 pr-2">{item.name}</p>
                                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14}/></button>
                              </div>
                              <div className="flex items-center gap-1 mt-1 justify-between">
                                  <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400 font-bold">Qt:</span>
                                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItemQty(item.id, parseInt(e.target.value))} className="w-12 p-1 border rounded text-xs text-center outline-none" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400 font-bold">IVA:</span>
                                      <select value={item.taxRate} onChange={(e) => updateItemTax(item.id, parseInt(e.target.value))} className="w-14 p-1 border rounded text-xs text-center outline-none cursor-pointer">
                                          <option value={22}>22%</option><option value={10}>10%</option><option value={4}>4%</option><option value={0}>0%</option>
                                      </select>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400 font-bold">€/un:</span>
                                      <input type="number" step="0.01" value={item.price} onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value))} className="w-16 p-1 border rounded text-xs text-center font-bold text-[#00665E]" />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* BOTTONI AZIONE EXPORT */}
              <div className="flex gap-3">
                  <button onClick={handleDownloadPDF} className="flex-[1.5] bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-black transition shadow-lg flex items-center justify-center gap-2">
                      <Download size={18}/> Scarica PDF
                  </button>
                  <button onClick={handleSendQuote} disabled={sending} className="flex-[2] bg-[#00665E] text-white py-3 rounded-xl font-black hover:bg-[#004d46] shadow-[0_10px_20px_rgba(0,102,94,0.3)] transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} Salva & Invia Email
                  </button>
              </div>

          </div>

          {/* PANNELLO DI DESTRA: ANTEPRIMA A4 DA ESPORTARE */}
          <div className="xl:col-span-7 flex justify-center overflow-x-auto pb-10">
              
              {/* Contenitore ID 'quote-print-area' per html2pdf */}
              <div id="quote-print-area" className="bg-white shadow-2xl relative flex flex-col font-sans" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm', boxSizing: 'border-box' }}>
                  
                  {/* HEADER FOGLIO A4 */}
                  <div className="flex justify-between items-start mb-12 border-b-2 border-gray-100 pb-6">
                      <div className="max-w-[50%]">
                          {companyProfile.logo && <img src={companyProfile.logo} alt="Logo" className="h-16 object-contain mb-2" crossOrigin="anonymous"/>}
                          <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                              {!companyProfile.logo && <Building size={20}/>} 
                              {companyProfile.name}
                          </h2>
                          <p className="text-gray-500 text-[11px] leading-relaxed">
                              {companyProfile.address} <br/>
                              {(companyProfile.cap || companyProfile.city) && `${companyProfile.cap} ${companyProfile.city} ${companyProfile.province ? `(${companyProfile.province})` : ''}`}<br/>
                              {companyProfile.p_iva && `P.IVA: ${companyProfile.p_iva}`}<br/>
                              {companyProfile.email && `Email: ${companyProfile.email}`}
                          </p>
                      </div>
                      <div className="text-right">
                          <h1 className="text-4xl font-black text-[#00665E] tracking-tighter uppercase mb-2" style={{letterSpacing: '-1px'}}>Preventivo</h1>
                          <p className="text-gray-900 font-black text-lg">N° {quoteNumber}</p>
                          <p className="text-gray-500 font-bold text-xs mt-2">Data: <span className="font-normal text-gray-800">{new Date(quoteDate).toLocaleDateString('it-IT')}</span></p>
                      </div>
                  </div>

                  {/* DATI CLIENTE A4 */}
                  <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-black text-[#00665E] uppercase tracking-widest mb-2">Spett.le:</p>
                      {activeClientInfo && activeClientInfo.name ? (
                          <>
                              <h3 className="text-base font-black text-gray-900 uppercase">{activeClientInfo.name}</h3>
                              {activeClientInfo.address && <p className="text-gray-600 text-xs mt-1">{activeClientInfo.address}</p>}
                              {activeClientInfo.p_iva && <p className="text-gray-600 text-xs font-mono mt-0.5">P.IVA / C.F.: {activeClientInfo.p_iva}</p>}
                              <div className="flex gap-4 mt-2 text-xs text-gray-500 font-medium">
                                  {activeClientInfo.email && <span>Email: {activeClientInfo.email}</span>}
                                  {activeClientInfo.phone && <span>Tel: {activeClientInfo.phone}</span>}
                              </div>
                          </>
                      ) : <p className="text-gray-400 italic text-sm">Nessun cliente selezionato.</p>}
                  </div>

                  {/* TABELLA PRODOTTI A4 */}
                  <div className="flex-1">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b-2 border-[#00665E] text-gray-900">
                                  <th className="py-2 font-black uppercase text-[10px]">Descrizione</th>
                                  <th className="py-2 font-black uppercase text-[10px] text-center w-12">Q.tà</th>
                                  <th className="py-2 font-black uppercase text-[10px] text-center w-12">IVA</th>
                                  <th className="py-2 font-black uppercase text-[10px] text-right w-24">Prezzo</th>
                                  <th className="py-2 font-black uppercase text-[10px] text-right w-28">Totale</th>
                              </tr>
                          </thead>
                          <tbody>
                              {quoteItems.length === 0 && (<tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Il preventivo è vuoto.</td></tr>)}
                              {quoteItems.map((item, index) => (
                                  <tr key={index} className="border-b border-gray-100">
                                      <td className="py-4 pr-4">
                                          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                          {item.description && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{item.description}</p>}
                                      </td>
                                      <td className="py-4 text-center text-gray-700 text-sm">{item.qty}</td>
                                      <td className="py-4 text-center text-gray-500 text-xs font-bold">{item.taxRate}%</td>
                                      <td className="py-4 text-right text-gray-700 text-sm">€ {item.price.toFixed(2)}</td>
                                      <td className="py-4 text-right font-black text-gray-900 text-sm">€ {(item.price * item.qty).toFixed(2)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  {/* TOTALI A4 */}
                  <div className="flex justify-end mt-8">
                      <div className="w-64 space-y-2 p-4 rounded-xl border border-gray-200">
                          <div className="flex justify-between text-gray-600 text-xs font-medium"><span>Imponibile:</span><span>€ {calculateSubTotal().toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-600 text-xs font-medium"><span>Totale Imposte:</span><span>€ {calculateTax().toFixed(2)}</span></div>
                          <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
                              <span className="font-black text-sm text-gray-900 uppercase">Totale</span>
                              <span className="font-black text-xl text-[#00665E]">€ {calculateTotal().toFixed(2)}</span>
                          </div>
                      </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-gray-200 text-[10px] text-gray-500">
                      <p className="font-bold text-gray-800 mb-1 uppercase tracking-widest">Note e Condizioni</p>
                      <textarea className="w-full resize-none border-none outline-none bg-transparent text-gray-600 font-medium p-0 leading-relaxed" rows={3} value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} />
                  </div>

              </div>
          </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANALITICA E ARCHIVIO PREVENTIVI REALI                              */}
      {/* ========================================================================= */}
      {activeTab === 'archive' && (
          <div className="animate-in slide-in-from-right space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Send size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase">Totale Inviati</p>
                          <h3 className="text-3xl font-black text-gray-900">{quotes.length}</h3>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase">Accettati (Vinti)</p>
                          <h3 className="text-3xl font-black text-emerald-600">{quotes.filter(q => q.status === 'Accettato').length}</h3>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
                      <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Eye size={24}/></div>
                      <div>
                          <p className="text-xs font-black text-gray-400 uppercase">Letti ma In Attesa</p>
                          <h3 className="text-3xl font-black text-amber-600">{quotes.filter(q => q.status === 'Visionato').length}</h3>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm lg:col-span-1 flex flex-col items-center">
                      <h3 className="font-bold text-gray-800 mb-6 self-start w-full border-b pb-2">Tasso di Successo</h3>
                      <div className="w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                      {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                          <h3 className="font-bold text-gray-800">Storico Preventivi ({quotes.length})</h3>
                      </div>
                      <div className="overflow-y-auto max-h-[400px]">
                          {quotes.length === 0 ? <p className="text-center py-10 text-gray-400">Nessun preventivo archiviato.</p> : null}
                          <table className="w-full text-left text-sm">
                              <thead className="bg-white sticky top-0 border-b border-gray-100">
                                  <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                      <th className="px-6 py-4">Data & Cliente</th>
                                      <th className="px-6 py-4">N° Doc.</th>
                                      <th className="px-6 py-4 text-center">Stato Tracking</th>
                                      <th className="px-6 py-4 text-right">Importo Tot.</th>
                                      <th className="px-6 py-4 text-right">Azioni</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {quotes.map(q => (
                                      <tr key={q.id} className="hover:bg-blue-50/30 transition cursor-pointer group">
                                          <td className="px-6 py-4">
                                              <p className="font-bold text-gray-900 group-hover:text-[#00665E]">{q.client_name}</p>
                                              <p className="text-xs text-gray-500">{new Date(q.created_at).toLocaleDateString('it-IT')}</p>
                                          </td>
                                          <td className="px-6 py-4 font-mono font-bold text-gray-600">{q.quote_number || '-'}</td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-1 w-max mx-auto ${
                                                  q.status === 'Accettato' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                  q.status === 'Visionato' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                  'bg-blue-50 text-blue-600 border-blue-200'
                                              }`}>
                                                  {q.status === 'Accettato' && <CheckCircle size={12}/>}
                                                  {q.status === 'Visionato' && <Eye size={12}/>}
                                                  {q.status === 'Inviato' && <Send size={12}/>}
                                                  {q.status}
                                              </span>
                                          </td>
                                          <td className="px-6 py-4 text-right font-black text-gray-900">
                                              € {Number(q.total_amount).toLocaleString('it-IT', {minimumFractionDigits: 2})}
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <button onClick={() => setViewQuoteModal(q)} className="text-xs font-bold text-[#00665E] bg-[#00665E]/10 px-3 py-1.5 rounded-lg hover:bg-[#00665E] hover:text-white transition">Dettagli</button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODALE VISUALIZZA DETTAGLIO PREVENTIVO (DALL'ARCHIVIO) */}
      {viewQuoteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
                 <button onClick={() => setViewQuoteModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"><X size={20}/></button>
                 <div className="p-8">
                     <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                         <div>
                             <p className="text-[10px] font-black text-[#00665E] uppercase tracking-widest mb-1">Preventivo N° {viewQuoteModal.quote_number || '-'}</p>
                             <h2 className="text-xl font-black text-gray-900">{viewQuoteModal.client_name}</h2>
                             <p className="text-sm text-gray-500">{viewQuoteModal.client_email}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-gray-400">Data Invio</p>
                             <p className="font-bold text-gray-900">{new Date(viewQuoteModal.created_at).toLocaleDateString('it-IT')}</p>
                         </div>
                     </div>

                     <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Voci Offerte</h4>
                     <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                         {viewQuoteModal.items && viewQuoteModal.items.map((it:any, i:number) => (
                             <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                 <div>
                                     <p className="font-bold text-sm text-gray-900">{it.name}</p>
                                     <p className="text-[10px] text-gray-500 font-bold">Q.tà: {it.qty} | IVA: {it.taxRate}%</p>
                                 </div>
                                 <p className="font-black text-[#00665E]">€ {(it.price * it.qty).toFixed(2)}</p>
                             </div>
                         ))}
                     </div>

                     <div className="bg-[#00665E] p-4 rounded-xl text-white flex justify-between items-center mb-6 shadow-lg">
                         <span className="font-black uppercase tracking-widest text-sm">Totale Compreso IVA</span>
                         <span className="text-2xl font-black">€ {Number(viewQuoteModal.total_amount).toLocaleString('it-IT', {minimumFractionDigits:2})}</span>
                     </div>

                     <div className="flex justify-center">
                         <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                              viewQuoteModal.status === 'Accettato' ? 'bg-emerald-100 text-emerald-700' :
                              viewQuoteModal.status === 'Visionato' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                              Stato Attuale: {viewQuoteModal.status}
                          </span>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </main>
  )
}