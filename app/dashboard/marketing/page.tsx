'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MarketingPage() {
  const [user, setUser] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati per Nuova Campagna
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  // Gestione Selezione
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Stato per espandere i dettagli nella lista (toggle)
  const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      if (campaignsData) setCampaigns(campaignsData)

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true })
      if (contactsData) setContacts(contactsData)

      setLoading(false)
    }
    getData()
  }, [router, supabase])

  const toggleContact = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id))
      setSelectAll(false)
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]) 
    } else {
      setSelectedIds(contacts.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedIds.length === 0) {
      alert("Seleziona almeno un destinatario!")
      return
    }

    setSending(true)

    // 1. Prepariamo la lista COMPLETA dei destinatari (Email + Nome)
    // Filtriamo quelli selezionati
    const recipientsList = contacts.filter(c => selectedIds.includes(c.id))
    
    // Estraiamo solo le email valide per Resend
    const recipientEmails = recipientsList
      .map(c => c.email)
      .filter(email => email && email.includes('@'))

    if (recipientEmails.length === 0) {
      alert("Nessuno dei contatti selezionati ha un'email valida!")
      setSending(false)
      return
    }

    try {
      // 2. Invio Reale
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject,
          content: content,
          emails: recipientEmails
        })
      })

      if (!response.ok) throw new Error('Errore invio server')

      // 3. Salvataggio Database (CON LISTA NOMI!)
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: subject,
          content: content,
          status: 'Inviata',
          sent_count: recipientEmails.length,
          recipients_details: recipientsList, // <--- SALVIAMO LA LISTA QUI (JSON)
          user_id: user.id
        })
        .select()

      if (!error && data) {
        setCampaigns([data[0], ...campaigns])
        setIsModalOpen(false)
        setSubject('')
        setContent('')
        setSelectedIds([])
        setSelectAll(false)
        alert(`Campagna inviata a ${recipientEmails.length} contatti! 🚀`)
      } else {
        throw error
      }

    } catch (err: any) {
      alert('Errore invio: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-10 text-white bg-black h-screen">Caricamento Marketing...</div>

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
     

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Campagne Email</h1>
            <p className="text-gray-400 text-sm mt-1">Gestisci le tue comunicazioni.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
            + Nuova Campagna
          </button>
        </div>

        {/* LISTA CAMPAGNE AGGIORNATA */}
        <div className="grid gap-4">
          {campaigns.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
              <p className="mb-4 text-4xl">📧</p>
              Non hai ancora inviato nessuna campagna.
            </div>
          ) : (
            campaigns.map((camp) => (
              <div key={camp.id} className="bg-gray-900 border border-gray-800 p-6 rounded-xl hover:border-yellow-500/30 transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-white">{camp.title}</h3>
                  <span className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded border border-green-900">
                    {camp.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{camp.content}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-4">
                  <div className="flex gap-4">
                    <span>📅 {new Date(camp.created_at).toLocaleDateString('it-IT')}</span>
                    <span>📬 Inviata a <strong>{camp.sent_count}</strong> contatti</span>
                  </div>
                  
                  {/* PULSANTE PER VEDERE CHI L'HA RICEVUTA */}
                  <button 
                    onClick={() => setExpandedCampaignId(expandedCampaignId === camp.id ? null : camp.id)}
                    className="text-yellow-500 hover:text-white transition underline"
                  >
                    {expandedCampaignId === camp.id ? 'Nascondi dettagli' : 'Vedi destinatari'}
                  </button>
                </div>

                {/* LISTA ESPANDIBILE DEI DESTINATARI */}
                {expandedCampaignId === camp.id && camp.recipients_details && (
                  <div className="mt-4 bg-gray-950 p-4 rounded border border-gray-800 text-sm">
                    <p className="text-gray-400 mb-2 font-bold">Destinatari:</p>
                    <ul className="space-y-1">
                      {camp.recipients_details.map((recipient: any, idx: number) => (
                        <li key={idx} className="flex justify-between text-gray-300 border-b border-gray-800 pb-1 last:border-0">
                          <span>{recipient.name}</span>
                          <span className="text-gray-500">{recipient.email}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL (Identico a prima) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-4xl shadow-2xl relative flex gap-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl font-bold text-white mb-6">Componi Messaggio</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Oggetto</label>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" placeholder="Es. Offerta Speciale..." required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Messaggio</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-64 bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none resize-none font-mono text-sm" placeholder="Scrivi qui..." required></textarea>
              </div>
            </div>
            <div className="w-64 border-l border-gray-800 pl-8 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-4">Destinatari</h3>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-500" />
                <label className="text-sm text-white font-medium">Seleziona Tutti</label>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[400px]">
                {contacts.length === 0 && <p className="text-xs text-gray-500">Nessun contatto nel CRM.</p>}
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => toggleContact(contact.id)} className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-600 accent-yellow-500" />
                    <div className="truncate">
                      <p className="text-sm text-gray-300 truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-auto border-t border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Selezionati: <strong className="text-yellow-500">{selectedIds.length}</strong></p>
                <button onClick={handleSendCampaign} disabled={sending || selectedIds.length === 0} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {sending ? 'Invio...' : '🚀 Invia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}