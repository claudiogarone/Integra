'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([]) // Qui salviamo i contatti scaricati
  const [loading, setLoading] = useState(true)
  
  // Stati per il Modal (Popup)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactValue, setNewContactValue] = useState('')
  const [saving, setSaving] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // 1. Caricamento Iniziale (Utente + Lista Contatti)
  useEffect(() => {
    const getData = async () => {
      // Check Utente
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Scarica i Contatti dal Database
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false }) // I più recenti in alto
      
      if (data) {
        setContacts(data)
      }
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  // 2. Funzione per Salvare un nuovo contatto
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name: newContactName,
        email: newContactEmail,
        value: Number(newContactValue),
        user_id: user.id,
        status: 'Nuovo'
      })
      .select() // Ci restituisce il dato appena creato

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      // Aggiorniamo la tabella senza ricaricare la pagina
      if (data) setContacts([data[0], ...contacts])
      
      setIsModalOpen(false)
      setNewContactName('')
      setNewContactEmail('')
      setNewContactValue('')
      alert('Contatto salvato! 🚀')
    }
    setSaving(false)
  }

  // 3. Funzione per Cancellare (Bonus)
  const handleDelete = async (id: number) => {
    if(!confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (!error) {
      setContacts(contacts.filter(c => c.id !== id)) // Rimuove dalla vista
    }
  }

  if (loading) {
    return <div className="p-10 text-white bg-black h-screen">Caricamento CRM...</div>
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* SIDEBAR (Identica alla Dashboard) */}
      <aside className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-yellow-500 tracking-wider">INTEGRA</h2>
        </div>
        
        <nav className="space-y-2 px-4 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/crm" className="flex items-center gap-3 py-3 px-4 bg-gray-900 rounded-lg text-yellow-500 font-medium shadow-lg shadow-yellow-900/10">
            <span>👥</span> CRM Contatti
          </Link>
          <a href="#" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
            <span>📅</span> Agenda
          </a>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-xs font-bold text-black">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate w-32">Admin</p>
              <p className="text-xs text-gray-500 truncate w-32">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="w-full py-2 text-xs text-center border border-gray-700 rounded hover:bg-red-900/20 hover:text-red-400 hover:border-red-900 transition"
          >
            Disconnetti
          </button>
        </div>
      </aside>

      {/* CONTENUTO PRINCIPALE */}
      <main className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestione Contatti</h1>
            <p className="text-gray-400 text-sm mt-1">
              Hai {contacts.length} contatti registrati nel database.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20"
          >
            + Aggiungi Contatto
          </button>
        </div>

        {/* TABELLA DATI VERI */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
          {contacts.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Non hai ancora salvato nessun contatto. Clicca su "+ Aggiungi Contatto" per iniziare!
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-950 uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Valore</th>
                  <th className="px-6 py-4">Stato</th>
                  <th className="px-6 py-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-800/50 transition duration-150">
                    <td className="px-6 py-4 font-medium text-white text-base">{contact.name}</td>
                    <td className="px-6 py-4">{contact.email || '-'}</td>
                    <td className="px-6 py-4 text-white">€ {contact.value}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-900">
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-500 hover:text-red-400 text-xs uppercase font-bold tracking-wider"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL POPUP (Identico alla Dashboard) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6">Nuovo Contatto</h2>
            
            <form className="space-y-4" onSubmit={handleSaveContact}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" 
                  placeholder="Es. Mario Rossi" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" 
                  placeholder="mario@email.com" 
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valore Stimato (€)</label>
                <input 
                  type="number" 
                  value={newContactValue}
                  onChange={(e) => setNewContactValue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" 
                  placeholder="0" 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4 disabled:opacity-50 transition"
              >
                {saving ? 'Salvataggio...' : 'Salva Contatto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}