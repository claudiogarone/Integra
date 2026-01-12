'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function QuotesPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // SIMULAZIONE PIANO UTENTE
  // Cambia questo valore in 'Enterprise' per sbloccare l'AI
  const [userPlan, setUserPlan] = useState<'Base' | 'Enterprise'>('Base') 

  // Dati dal Database
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Stato del Preventivo
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [quoteItems, setQuoteItems] = useState<any[]>([])
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0])
  const [quoteNumber, setQuoteNumber] = useState(`PREV-${new Date().getFullYear()}-001`)

  // Stato AI & UI
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: c } = await supabase.from('contacts').select('*')
        const { data: p } = await supabase.from('products').select('*')
        if(c) setContacts(c)
        if(p) setProducts(p)
      }
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  // --- LOGICA PREVENTIVO ---
  const handleContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value
      setSelectedContactId(id)
      setSelectedContact(contacts.find(c => c.id.toString() === id) || null)
  }

  const addProductToQuote = (productId: string) => {
      const product = products.find(p => p.id.toString() === productId)
      if (!product) return

      // Controlla se esiste già, se sì aumenta quantità
      const existing = quoteItems.find(item => item.id === product.id)
      if (existing) {
          setQuoteItems(quoteItems.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item))
      } else {
          setQuoteItems([...quoteItems, { ...product, qty: 1 }])
      }
  }

  const updateQty = (id: number, delta: number) => {
      setQuoteItems(quoteItems.map(item => {
          if (item.id === id) {
              const newQty = Math.max(1, item.qty + delta)
              return { ...item, qty: newQty }
          }
          return item
      }))
  }

  const removeItem = (id: number) => {
      setQuoteItems(quoteItems.filter(item => item.id !== id))
  }

  // Calcoli Totali
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const vat = subtotal * 0.22 // IVA 22% fissa per demo
  const total = subtotal + vat

  // --- AI COPYWRITER ---
  const handleGenerateEmail = async () => {
      if(!selectedContact) { alert("Seleziona un cliente prima!"); return; }
      setIsGenerating(true)
      setIsEmailModalOpen(true)
      
      try {
        const res = await fetch('/api/generate-quote-email', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                clientName: selectedContact.name,
                products: quoteItems,
                total: total.toFixed(2)
            })
        })
        const data = await res.json()
        setGeneratedEmail(data.emailText)
      } catch (err) {
          alert("Errore AI")
      } finally {
          setIsGenerating(false)
      }
  }

  // --- SIMULAZIONE TRACKING & PDF ---
  const handlePrint = () => {
      window.print()
  }

  if (loading) return <div className="p-10 text-[#00665E]">Caricamento Builder...</div>

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* ----------------- COLONNA SINISTRA: BUILDER (Non visibile in stampa) ----------------- */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto print:hidden flex flex-col gap-6 shadow-xl z-10">
        <div>
            <div className="flex justify-between items-center">
                 <h1 className="text-2xl font-black text-[#00665E]">Crea Preventivo</h1>
                 <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${userPlan === 'Base' ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-600'}`}>Piano {userPlan}</span>
            </div>
            <p className="text-sm text-gray-500">Componi, analizza con AI e stampa.</p>
        </div>

        {/* 1. SELEZIONE CLIENTE */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Cliente (da CRM)</label>
            <select value={selectedContactId} onChange={handleContactChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-[#00665E]">
                <option value="">-- Seleziona Cliente --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {/* 2. AGGIUNGI PRODOTTI */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Aggiungi Prodotti (da Vetrina)</label>
            <select onChange={(e) => { addProductToQuote(e.target.value); e.target.value = ''; }} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:border-[#00665E] mb-2">
                <option value="">+ Aggiungi Voce...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (€ {p.price})</option>)}
            </select>
            
            {/* Lista rapida modifica */}
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {quoteItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                        <div className="truncate w-1/2 font-medium">{item.name}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200">-</button>
                            <span className="w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200">+</button>
                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. AZIONI AI & PRINT */}
        <div className="mt-auto space-y-3">
             {/* LOGICA BOTTONE AI BLOCCATO/SBLOCCATO */}
             {userPlan === 'Base' ? (
                 <button onClick={() => alert("Questa è una funzione Enterprise! 🚀\nL'AI scrive l'email persuasiva al posto tuo.")} className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl font-bold border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 group">
                    🔒 AI Copywriter <span className="text-[10px] border border-gray-300 px-1 rounded ml-1 group-hover:bg-gray-200">PRO</span>
                 </button>
             ) : (
                 <button onClick={handleGenerateEmail} disabled={quoteItems.length === 0} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    ✨ Genera Email Accompagnamento
                 </button>
             )}

             <button onClick={handlePrint} disabled={quoteItems.length === 0} className="w-full bg-[#00665E] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#00665E]/20 hover:bg-[#004d46] transition flex items-center justify-center gap-2">
                🖨️ Scarica / Stampa PDF
             </button>
        </div>
      </div>

      {/* ----------------- COLONNA DESTRA: ANTEPRIMA A4 (Stampabile) ----------------- */}
      <div className="w-full md:w-2/3 bg-gray-500 p-8 overflow-y-auto flex justify-center print:p-0 print:w-full print:bg-white print:block">
        
        {/* FOGLIO A4 */}
        <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-[15mm] flex flex-col relative print:shadow-none print:w-full">
            
            {/* HEADER FATTURA */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    {/* LOGO AZIENDA */}
                    <div className="bg-[#00665E] text-white font-black text-2xl px-4 py-2 inline-block rounded mb-2">INTEGRA</div>
                    <p className="text-gray-500 text-sm">Tua Azienda S.r.l.<br/>Via Roma 123, Milano<br/>P.IVA 12345678901</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-light text-gray-300 uppercase tracking-widest">Preventivo</h2>
                    <p className="font-bold text-gray-700 mt-2">#{quoteNumber}</p>
                    <p className="text-gray-500 text-sm">Data: {quoteDate}</p>
                </div>
            </div>

            {/* INFO CLIENTE */}
            <div className="mb-12 border-l-4 border-[#00665E] pl-6 py-1 bg-gray-50">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Preventivo per:</p>
                {selectedContact ? (
                    <>
                        <h3 className="text-xl font-bold text-gray-900">{selectedContact.name}</h3>
                        <p className="text-gray-600">{selectedContact.email}</p>
                    </>
                ) : (
                    <p className="text-gray-400 italic">Seleziona un cliente...</p>
                )}
            </div>

            {/* TABELLA PRODOTTI */}
            <div className="flex-1">
                <table className="w-full text-left mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="py-3">Descrizione</th>
                            <th className="py-3 text-center">Q.tà</th>
                            <th className="py-3 text-right">Prezzo</th>
                            <th className="py-3 text-right">Totale</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {quoteItems.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-300 italic">Aggiungi voci al preventivo...</td></tr>}
                        {quoteItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-50">
                                <td className="py-4">
                                    <span className="font-bold text-gray-800 block">{item.name}</span>
                                    <span className="text-gray-500 text-xs">{item.description}</span>
                                </td>
                                <td className="py-4 text-center text-gray-600">{item.qty}</td>
                                <td className="py-4 text-right text-gray-600">€ {item.price.toFixed(2)}</td>
                                <td className="py-4 text-right font-bold text-gray-800">€ {(item.price * item.qty).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALI */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 space-y-2">
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>Imponibile</span>
                        <span>€ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-sm">
                        <span>IVA (22%)</span>
                        <span>€ {vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-[#00665E] border-t border-gray-200 pt-2 mt-2">
                        <span>TOTALE</span>
                        <span>€ {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-xs text-gray-400 mt-auto pt-8 border-t border-gray-100">
                <p>Grazie per la fiducia. Termini di pagamento: 30gg data fattura.</p>
                <p>Documento generato da Integra OS</p>
            </div>
        </div>
      </div>

      {/* --- MODALE EMAIL AI --- */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm print:hidden">
            <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black text-indigo-600 flex items-center gap-2">✨ AI Copywriter</h2>
                    <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                </div>
                
                {isGenerating ? (
                    <div className="py-12 text-center">
                        <div className="animate-spin text-4xl mb-4">🔮</div>
                        <p className="text-indigo-600 font-bold animate-pulse">Claude sta scrivendo la mail perfetta...</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 h-64 overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                            {generatedEmail}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => {navigator.clipboard.writeText(generatedEmail); alert("Copiato!")}} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50">📋 Copia Testo</button>
                            <button onClick={() => window.open(`mailto:${selectedContact?.email}?subject=Preventivo&body=${encodeURIComponent(generatedEmail)}`)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">🚀 Apri Email Client</button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

      {/* CSS PER LA STAMPA PERFETTA */}
      <style jsx global>{`
        @media print {
            body { background: white; }
            nav, aside, button { display: none !important; } /* Nasconde tutto tranne il foglio */
            main { height: auto; display: block; overflow: visible; }
        }
      `}</style>

    </main>
  )
}