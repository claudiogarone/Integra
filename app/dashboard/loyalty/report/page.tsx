'use client'

import { createClient } from '../../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { 
  Download, ArrowLeft, TrendingUp, Users, Plus, Edit3, X, Save, CreditCard, ShieldAlert, UserPlus, Search, RefreshCw, Store, Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function LoyaltyReportPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false) 
  const [user, setUser] = useState<any>(null)
  
  // Dati
  const [cards, setCards] = useState<any[]>([])
  const [storeStats, setStoreStats] = useState<any[]>([])
  const [crmContacts, setCrmContacts] = useState<any[]>([])
  const [storesList, setStoresList] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState({ name: 'La Tua Azienda', logo: '' })
  
  // Modali
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<any>(null)
  const [manualPoints, setManualPoints] = useState<number>(0)
  const [manualTier, setManualTier] = useState('Bronze')
  
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false)
  const [creationMode, setCreationMode] = useState<'crm' | 'new'>('crm')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [issueStoreId, setIssueStoreId] = useState('') 
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' })

  const supabase = createClient()

  useEffect(() => { loadAnalytics() }, [])

  const loadAnalytics = async () => {
    setRefreshing(true)
    const devUser = { id: '00000000-0000-0000-0000-000000000000' }
    setUser(devUser)

    try {
        const { data: profile } = await supabase.from('profiles').select('company_name, logo_url').eq('id', devUser.id).single()
        if (profile) setCompanyInfo({ name: profile.company_name || 'VIP Club', logo: profile.logo_url || '' })

        const { data: cardsData } = await supabase.from('loyalty_cards').select('*').eq('user_id', devUser.id).order('total_spent', { ascending: false })
        const { data: contactsData } = await supabase.from('contacts').select('id, name, email').order('created_at', { ascending: false })
        const { data: allStores } = await supabase.from('loyalty_stores').select('id, name').eq('user_id', devUser.id)

        if(contactsData) setCrmContacts(contactsData)
        if(allStores) setStoresList(allStores)

        const enrichedCards = (cardsData || []).map(card => {
            const matchedStore = allStores?.find(s => s.id.toString() === card.store_id?.toString());
            return {
                ...card,
                store_name: matchedStore ? matchedStore.name : 'Sede Centrale',
                contacts: {
                    name: card.customer_name || 'Utente Sconosciuto',
                    email: card.customer_email || ''
                }
            }
        })
        setCards(enrichedCards)

        const { data: txData } = await supabase.from('loyalty_transactions').select('store_id, amount_spent').eq('user_id', devUser.id)

        const statsMap: any = {}
        if (allStores) { allStores.forEach(s => { statsMap[s.id] = { name: s.name, incasso: 0, transazioni: 0 } }) }
        if (txData) {
            txData.forEach((tx: any) => {
                if(tx.store_id && statsMap[tx.store_id]) {
                    statsMap[tx.store_id].incasso += Number(tx.amount_spent)
                    statsMap[tx.store_id].transazioni += 1
                }
            })
        }
        setStoreStats(Object.values(statsMap))
    } catch (e) {
        console.error("Errore:", e)
    }

    setLoading(false)
    setRefreshing(false)
  }

  const handleOpenEditCard = (card: any) => {
      setEditingCard(card)
      setManualPoints(Number(card.points) || 0)
      setManualTier(card.tier || 'Bronze')
      setIsCardModalOpen(true)
  }

  const handleUpdateCard = async (e: React.FormEvent) => {
      e.preventDefault()
      
      const sicurePoints = Number(manualPoints) || 0;

      const { error } = await supabase.from('loyalty_cards')
          .update({ points: sicurePoints, tier: manualTier })
          .eq('id', editingCard.id)
      
      if(error) return alert("Errore di Salvataggio DB: " + error.message)
      
      alert("✅ Aggiornamento Completato!")
      setIsCardModalOpen(false)
      await loadAnalytics() // Attesa per forzare il refresh immediato in UI!
  }

  const handleCreateNewCard = async (e: React.FormEvent) => {
      e.preventDefault()
      setCreating(true)
      let targetContactId = selectedContactId;
      let targetName = '';
      let targetEmail = '';

      if (creationMode === 'new') {
          if (!newCustomer.name) { setCreating(false); return alert("Inserisci il nome."); }
          
          const { data: newContact, error: crmError } = await supabase.from('contacts').insert({
              user_id: user.id, name: newCustomer.name, email: newCustomer.email || null, phone: newCustomer.phone || null,
              status: 'Vinto', source: 'Fidelity Registrazione', value: 0
          }).select().single();

          if (crmError) { setCreating(false); return alert("Errore CRM: " + crmError.message); }
          targetContactId = newContact.id;
          targetName = newContact.name;
          targetEmail = newContact.email || '';
      } else {
          if (!targetContactId) { setCreating(false); return alert("Seleziona un contatto."); }
          const existingCrmContact = crmContacts.find(c => c.id.toString() === targetContactId.toString());
          if(existingCrmContact) { targetName = existingCrmContact.name; targetEmail = existingCrmContact.email; }
      }

      const existing = cards.find(c => c.contact_id?.toString() === targetContactId.toString());
      if (existing) { setCreating(false); return alert("Questo cliente ha già una carta!"); }

      const newCode = 'VIP-' + Math.floor(10000 + Math.random() * 90000);

      const payload: any = {
          user_id: user.id, contact_id: targetContactId.toString(),
          customer_name: targetName, customer_email: targetEmail, 
          code: newCode, tier: 'Bronze', points: 0, total_spent: 0,
          store_id: issueStoreId ? issueStoreId.toString() : null 
      };

      const { error } = await supabase.from('loyalty_cards').insert(payload)

      if(error) { setCreating(false); return alert("Errore creazione: " + error.message); }
      
      if (targetEmail) {
          try {
              await fetch('/api/loyalty/emails', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      type: 'welcome',
                      customerEmail: targetEmail,
                      customerName: targetName,
                      cardCode: newCode,
                      companyName: companyInfo.name,
                      companyLogo: companyInfo.logo,
                      baseUrl: window.location.origin
                  })
              });
          } catch(err) { console.error("Email fallita", err) }
      }

      setCreating(false)
      alert(`✅ Nuova Carta Creata con successo!\nCodice: ${newCode}`)
      setIsNewCardModalOpen(false)
      setSelectedContactId(''); setIssueStoreId(''); setNewCustomer({ name: '', email: '', phone: '' })
      await loadAnalytics()
  }

  const handleExport = () => {
      if(cards.length === 0) return alert("Nessun dato da esportare")
      const flatCards = cards.map(c => ({
          "Nome Sulla Carta": c.contacts?.name || c.customer_name || 'Cliente VIP',
          "Codice (Per QR / Banda / RFID)": c.code,
          "Livello Grafica": c.tier
      }))
      const csv = Papa.unparse(flatCards);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Fidelity_Tipografia_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse font-bold flex items-center gap-2"><Loader2 className="animate-spin"/> Caricamento Dati Reali...</div>

  return (
    <main className="p-8 bg-[#F8FAFC] min-h-screen pb-20 font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/loyalty" className="bg-white p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm text-gray-600"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className="text-3xl font-black text-[#00665E] tracking-tight">Report Fedeltà Reale</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Analisi avanzata e gestione manuale delle carte VIP.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={loadAnalytics} disabled={refreshing} className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 shadow-sm flex items-center gap-2 transition disabled:opacity-50 text-sm">
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> Aggiorna Dati
                </button>
                <button onClick={handleExport} className="bg-[#00665E] text-white px-5 py-2.5 rounded-xl font-black hover:bg-[#004d46] shadow-[0_4px_14px_rgba(0,102,94,0.3)] hover:-translate-y-0.5 flex items-center gap-2 transition text-sm">
                    <Download size={18}/> Export Tipografia
                </button>
            </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={14}/> Carte Attive</p>
                <h3 className="text-4xl font-black text-gray-900">{cards.length}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><CreditCard size={14}/> Punti Erogati</p>
                <h3 className="text-4xl font-black text-[#00665E]">{cards.reduce((acc, c) => acc + (Number(c.points) || 0), 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={14}/> Spesa Generata</p>
                <h3 className="text-4xl font-black text-blue-600">€ {cards.reduce((acc, c) => acc + Number(c.total_spent || 0), 0).toLocaleString('it-IT')}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={14}/> LTV Medio VIP</p>
                <h3 className="text-4xl font-black text-purple-600">
                    € {cards.length > 0 ? Math.floor(cards.reduce((acc, c) => acc + Number(c.total_spent || 0), 0) / cards.length).toLocaleString() : 0}
                </h3>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* STORE PERFORMANCE REALE */}
            <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={20} className="text-[#00665E]"/> Incassi per Negozio (dal POS)</h3>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{storeStats.length} Casse Totali</span>
                </div>
                
                {storeStats.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <Store size={32} className="mb-2 opacity-50"/>
                        <p>Nessun punto vendita configurato.</p>
                        <Link href="/dashboard/loyalty" className="text-[#00665E] font-bold mt-2 hover:underline">Configura un Negozio</Link>
                    </div>
                ) : (
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storeStats} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                <XAxis dataKey="name" tick={{fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}} 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                                    formatter={(value: any) => [`€ ${value}`, 'Incasso Generato']}
                                />
                                <Bar dataKey="incasso" fill="#00665E" radius={[8, 8, 0, 0]} barSize={60}>
                                    {storeStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00665E' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* TABELLA CLIENTI COMPLETA E GESTIONE MANUALE */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800">Classifica Clienti Fedeli</h3>
                    <button onClick={() => setIsNewCardModalOpen(true)} className="bg-[#00665E] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#004d46] transition flex items-center gap-2 shadow-lg shadow-[#00665E]/20">
                        <Plus size={16}/> Emetti Nuova Carta
                    </button>
                </div>
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-white uppercase font-bold text-gray-400 text-[10px] tracking-wider sticky top-0 border-b border-gray-100 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">Codice Carta</th>
                                <th className="px-6 py-4">Cliente / CRM</th>
                                <th className="px-6 py-4">Emessa in</th>
                                <th className="px-6 py-4">Livello</th>
                                <th className="px-6 py-4 text-right">Punti</th>
                                <th className="px-6 py-4 text-right">Spesa</th>
                                <th className="px-6 py-4 text-center">Gestione</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cards.length === 0 && <tr><td colSpan={7} className="text-center py-10">Nessuna carta emessa. Creala qui o usa il POS.</td></tr>}
                            {cards.map((card) => (
                                <tr key={card.id} className="hover:bg-blue-50/30 transition group">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-800">{card.code}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-900 block">{card.contacts?.name}</span>
                                        <span className="text-xs text-gray-500">{card.contacts?.email}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                        {card.store_name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                                            card.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                            card.tier === 'Platinum' ? 'bg-slate-800 text-slate-200 border-slate-700' :
                                            'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>{card.tier}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-[#00665E] text-lg">{card.points}</td>
                                    <td className="px-6 py-4 text-right font-black text-gray-900">€ {Number(card.total_spent || 0).toLocaleString('it-IT')}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handleOpenEditCard(card)} className="bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white border border-purple-200 hover:border-transparent px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto shadow-sm">
                                            <Edit3 size={14}/> Modifica
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>

        {/* MODALE: CREA NUOVA CARTA */}
        {isNewCardModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2"><CreditCard className="text-[#00665E]"/> Emetti Fidelity Card</h2>
                        <button onClick={() => setIsNewCardModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-1.5 transition"><X size={16}/></button>
                    </div>
                    
                    <div className="flex bg-gray-100 p-1 m-6 rounded-xl border border-gray-200 shadow-inner">
                        <button type="button" onClick={() => setCreationMode('crm')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition flex justify-center items-center gap-2 ${creationMode === 'crm' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}><Search size={14}/> Da CRM Esistente</button>
                        <button type="button" onClick={() => setCreationMode('new')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition flex justify-center items-center gap-2 ${creationMode === 'new' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}><UserPlus size={14}/> Crea Nuovo Cliente</button>
                    </div>

                    <form onSubmit={handleCreateNewCard} className="px-8 pb-8">
                        {creationMode === 'crm' ? (
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2 ml-1">Seleziona Contatto dal Database</label>
                                <select required value={selectedContactId} onChange={e => setSelectedContactId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-[#00665E] font-bold text-gray-800 mb-2 cursor-pointer transition">
                                    <option value="">-- Seleziona o Cerca --</option>
                                    {crmContacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email || 'Senza Email'})</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-[11px] text-gray-500 font-medium mb-4 border-b pb-3">Il cliente verrà salvato automaticamente nel CRM.</p>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1 ml-1">Nome e Cognome *</label>
                                    <input type="text" required placeholder="Es. Mario Rossi" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#00665E] font-bold transition"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1 ml-1">Email</label>
                                        <input type="email" placeholder="mario@email.com" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#00665E] transition"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1 ml-1">Telefono</label>
                                        <input type="text" placeholder="+39..." value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} className="w-full p-3.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#00665E] transition"/>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="text-[10px] font-black uppercase text-[#00665E] tracking-widest block mb-2 ml-1">Cassa / Negozio di Emissione (Opzionale)</label>
                            <select value={issueStoreId} onChange={e => setIssueStoreId(e.target.value)} className="w-full bg-[#00665E]/5 border border-[#00665E]/20 p-3.5 rounded-xl outline-none focus:border-[#00665E] font-bold text-[#00665E] cursor-pointer transition">
                                <option value="">Sede Centrale (Generale)</option>
                                {storesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <button type="submit" disabled={creating} className="mt-8 w-full bg-[#00665E] text-white py-4 rounded-xl font-black shadow-[0_4px_14px_rgba(0,102,94,0.3)] hover:bg-[#004d46] transition flex items-center justify-center gap-2 disabled:opacity-50">
                            {creating ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
                            {creating ? 'Generazione in corso...' : 'Emetti Carta ed Esporta'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* MODALE: GESTIONE MANUALE CARTA ESISTENTE */}
        {isCardModalOpen && editingCard && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-xl font-black text-purple-900 flex items-center gap-2"><Edit3 size={20}/> Gestione Carta</h2>
                            <p className="text-xs text-gray-500 font-mono mt-1">{editingCard.code} - {editingCard.contacts?.name}</p>
                        </div>
                        <button onClick={() => setIsCardModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-200 rounded-full p-1.5 transition"><X size={16}/></button>
                    </div>
                    <form onSubmit={handleUpdateCard} className="p-6 space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2 ml-1">Aggiorna Punteggio Totale</label>
                            <input type="number" required value={manualPoints} onChange={e => setManualPoints(Number(e.target.value))} className="w-full bg-purple-50 border border-purple-200 p-4 rounded-xl outline-none focus:border-purple-500 font-black text-3xl text-purple-700 text-center shadow-inner transition" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-2 ml-1">Forza Livello VIP</label>
                            <select value={manualTier} onChange={e => setManualTier(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:border-purple-500 font-bold text-gray-800 cursor-pointer transition">
                                <option value="Bronze">Bronze (Base)</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum (Massimo)</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                            <Save size={18}/> Salva Modifiche
                        </button>
                    </form>
                </div>
            </div>
        )}

    </main>
  )
}