'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // --- STATI DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null) // ID del contatto che stiamo modificando (null se nuovo)

  // --- CAMPI DEL FORM ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    value: '',
    status: 'Nuovo' // Default
  })
  
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // 1. Caricamento Dati
  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) setContacts(data)
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  // 2. Apri Modal per NUOVO contatto
  const openNewModal = () => {
    setEditingId(null) // Non stiamo modificando nessuno
    setFormData({ name: '', email: '', value: '', status: 'Nuovo' }) // Pulisci form
    setIsModalOpen(true)
  }

  // 3. Apri Modal per MODIFICA contatto
  const openEditModal = (contact: any) => {
    setEditingId(contact.id) // Salviamo l'ID
    setFormData({
      name: contact.name,
      email: contact.email,
      value: contact.value,
      status: contact.status
    })
    setIsModalOpen(true)
  }

  // 4. Salva (Gestisce sia CREAZIONE che MODIFICA)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (editingId) {
      // --- LOGICA MODIFICA (UPDATE) ---
      const { error } = await supabase
        .from('contacts')
        .update({
          name: formData.name,
          email: formData.email,
          value: Number(formData.value),
          status: formData.status
        })
        .eq('id', editingId) // Trova quello giusto

      if (!error) {
        // Aggiorna la lista locale senza ricaricare
        setContacts(contacts.map(c => c.id === editingId ? { ...c, ...formData, value: Number(formData.value) } : c))
        alert('Contatto aggiornato! ✅')
        setIsModalOpen(false)
      } else {
        alert('Errore: ' + error.message)
      }

    } else {
      // --- LOGICA CREAZIONE (INSERT) ---
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: formData.name,
          email: formData.email,
          value: Number(formData.value),
          status: formData.status,
          user_id: user.id
        })
        .select()

      if (!error && data) {
        setContacts([data[0], ...contacts])
        alert('Contatto creato! 🚀')
        setIsModalOpen(false)
      } else {
        alert('Errore: ' + (error?.message || 'Sconosciuto'))
      }
    }
    setSaving(false)
  }

  // 5. Elimina
  const handleDelete = async (id: number) => {
    if(!confirm('Sicuro di voler eliminare?')) return;
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (!error) setContacts(contacts.filter(c => c.id !== id))
  }

  if (loading) return <div className="p-10 text-white bg-black h-screen">Caricamento...</div>

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
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
          <Link href="/dashboard/agenda" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
            <span>📅</span> Agenda
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
           <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="w-full py-2 text-xs text-center border border-gray-700 rounded hover:bg-red-900/20 hover:text-red-400 transition">Disconnetti</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestione Contatti</h1>
          <button onClick={openNewModal} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">
            + Aggiungi Contatto
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
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
                <tr key={contact.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4 text-white">€ {contact.value}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs border ${
                      contact.status === 'Cliente' ? 'bg-green-900/30 text-green-300 border-green-900' :
                      contact.status === 'Perso' ? 'bg-red-900/30 text-red-300 border-red-900' :
                      'bg-blue-900/30 text-blue-300 border-blue-900'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEditModal(contact)} className="text-yellow-500 hover:text-yellow-400 font-bold">
                      Modifica
                    </button>
                    <button onClick={() => handleDelete(contact.id)} className="text-red-500 hover:text-red-400">
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL UNIFICATO (CREAZIONE + MODIFICA) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Modifica Contatto' : 'Nuovo Contatto'}
            </h2>
            
            <form className="space-y-4" onSubmit={handleSave}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Valore (€)</label>
                  <input type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Stato</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none appearance-none"
                  >
                    <option value="Nuovo">Nuovo Lead</option>
                    <option value="In Trattativa">In Trattativa</option>
                    <option value="Cliente">Cliente ✅</option>
                    <option value="Perso">Perso ❌</option>
                  </select>
                </div>
              </div>
              
              <button type="submit" disabled={saving} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4 transition">
                {saving ? 'Salvataggio...' : (editingId ? 'Aggiorna Contatto' : 'Salva Nuovo')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}