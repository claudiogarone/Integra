'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import Papa from 'papaparse'

export default function CRMPage() {
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Stati Modali
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSocialInfoOpen, setIsSocialInfoOpen] = useState(false) // Guida Social
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false) // Guida CSV
  
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', value: '', status: 'Nuovo' })
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
        if (data) setContacts(data)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  // --- LOGICA IMPORTAZIONE (CSV/VCF) ---
  const parseVCF = (content: string) => {
    const cards = content.split('BEGIN:VCARD')
    const parsedContacts: any[] = []
    cards.forEach(card => {
      if (!card.trim()) return
      const nameMatch = card.match(/FN:(.*)/)
      const emailMatch = card.match(/EMAIL.*:(.*)/)
      if (nameMatch) {
        parsedContacts.push({
          name: nameMatch[1].trim(),
          email: emailMatch ? emailMatch[1].trim() : '',
          value: 0, status: 'Nuovo', user_id: user.id
        })
      }
    })
    return parsedContacts
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: async (results) => {
          const rows: any[] = results.data
          const newContacts = rows.map((row: any) => ({
            name: row.Nome || row.Name || (row['First Name'] ? `${row['First Name']} ${row['Last Name']}` : 'Senza Nome'),
            email: row.Email || row.email || row['E-mail Address'] || '',
            value: 0, status: 'Nuovo', user_id: user.id
          })).filter((c: any) => c.name !== 'Senza Nome')
          saveToDb(newContacts)
        }
      })
    } else if (fileExt === 'vcf' || fileExt === 'vcard') {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const newContacts = parseVCF(text)
        saveToDb(newContacts)
      }
      reader.readAsText(file)
    } else {
      alert("Formato non supportato. Usa .CSV o .VCF")
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const saveToDb = async (newContacts: any[]) => {
    if (newContacts.length === 0) { alert("Nessun contatto valido trovato."); return }
    const { data, error } = await supabase.from('contacts').insert(newContacts).select()
    if (!error && data) {
      setContacts([...data, ...contacts])
      alert(`Importati ${data.length} contatti! 🚀`)
      setIsImportInfoOpen(false)
      setIsSocialInfoOpen(false)
    } else {
      alert('Errore: ' + error?.message)
    }
  }

  // --- CRUD Standard ---
  const openNewModal = () => { setEditingId(null); setFormData({ name: '', email: '', value: '', status: 'Nuovo' }); setIsModalOpen(true) }
  const openEditModal = (contact: any) => { setEditingId(contact.id); setFormData({ name: contact.name, email: contact.email, value: contact.value, status: contact.status }); setIsModalOpen(true) }
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    if (editingId) {
      const { error } = await supabase.from('contacts').update({ ...formData, value: Number(formData.value) }).eq('id', editingId)
      if (!error) { setContacts(contacts.map(c => c.id === editingId ? { ...c, ...formData, value: Number(formData.value) } : c)); setIsModalOpen(false) }
    } else {
      const { data, error } = await supabase.from('contacts').insert({ ...formData, value: Number(formData.value), user_id: user.id }).select()
      if (!error && data) { setContacts([data[0], ...contacts]); setIsModalOpen(false) }
    }
    setSaving(false)
  }
  
  const handleDelete = async (id: number) => { 
    if(!confirm('Eliminare definitivamente?')) return; 
    const { error } = await supabase.from('contacts').delete().eq('id', id); 
    if (!error) setContacts(contacts.filter(c => c.id !== id)) 
  }

  if (loading) return <div className="p-10 text-white">Caricamento CRM...</div>

  return (
    <main className="flex-1 p-10 overflow-auto bg-black text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestione Contatti</h1>
          <p className="text-sm text-gray-400">Database centralizzato clienti e lead.</p>
        </div>
        <div className="flex gap-2">
          {/* INPUT FILE NASCOSTO */}
          <input type="file" accept=".csv,.vcf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          
          <button onClick={() => setIsImportInfoOpen(true)} className="bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded font-bold hover:bg-gray-700 transition">📂 Importa File</button>
          <button onClick={() => setIsSocialInfoOpen(true)} className="bg-blue-900/50 border border-blue-800 text-blue-200 px-4 py-2 rounded font-bold hover:bg-blue-900 transition">🌐 Da Social</button>
          <button onClick={openNewModal} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20 transition">+ Nuovo</button>
        </div>
      </div>

      {/* TABELLA CONTATTI */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-gray-950 uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Valore Potenziale</th>
              <th className="px-6 py-4">Stato</th>
              <th className="px-6 py-4 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {contacts.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">Nessun contatto trovato. Inizia importando o creando un lead!</td></tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 font-medium text-white">{contact.name}</td>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4 text-white">€ {contact.value}</td>
                  <td className="px-6 py-4"><span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-900">{contact.status}</span></td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEditModal(contact)} className="text-yellow-500 hover:text-yellow-400 font-bold">Modifica</button>
                    <button onClick={() => handleDelete(contact.id)} className="text-red-500 hover:text-red-400">Elimina</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL GUIDA IMPORT FILE (CSV/EXCEL) --- */}
      {isImportInfoOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsImportInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-4">Guida Importazione File</h2>
            <div className="bg-gray-800 p-4 rounded border border-gray-700 mb-6">
              <h3 className="text-white font-bold mb-2">Formato Excel/CSV richiesto:</h3>
              <p className="text-xs text-gray-400 mb-2">Il file deve avere queste colonne nella prima riga:</p>
              <div className="bg-black p-3 rounded font-mono text-xs text-green-400">
                Nome, Email, Valore<br/>
                Mario Rossi, mario@email.com, 1000
              </div>
              <p className="text-xs text-yellow-500 mt-2">* Salva il file Excel come formato <strong>CSV (delimitato da virgola)</strong>.</p>
            </div>
            <button onClick={() => { setIsImportInfoOpen(false); fileInputRef.current?.click() }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded transition">📂 Ho capito, Seleziona File</button>
          </div>
        </div>
      )}
      
      {/* --- MODAL GUIDA SOCIAL (Tutti i canali) --- */}
      {isSocialInfoOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsSocialInfoOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-2">Importa da Social Network</h2>
            <p className="text-gray-400 text-sm mb-6">Scarica il file dei tuoi dati dal social e caricalo qui per popolare il CRM.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <span className="text-blue-500 font-bold block mb-1">📘 Facebook</span>
                <p className="text-xs text-gray-400">Impostazioni &gt; Le tue informazioni &gt; Scarica le tue informazioni (Scegli formato JSON)</p>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <span className="text-blue-300 font-bold block mb-1">👔 LinkedIn</span>
                <p className="text-xs text-gray-400">Impostazioni &gt; Privacy dati &gt; Ottieni una copia dei tuoi dati</p>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <span className="text-pink-500 font-bold block mb-1">📸 Instagram</span>
                <p className="text-xs text-gray-400">La tua attività &gt; Scarica le tue informazioni</p>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <span className="text-white font-bold block mb-1">⚫ TikTok / X (Twitter)</span>
                <p className="text-xs text-gray-400">Impostazioni &gt; Account &gt; Scarica un archivio dei tuoi dati</p>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded mb-6">
              <h3 className="text-yellow-500 font-bold text-sm mb-2">💡 Consiglio Importante</h3>
              <p className="text-xs text-gray-300">
                I file scaricati dai social sono spesso confusi. Per un risultato migliore, copia i dati (Nome ed Email) in un file Excel pulito e salvalo come CSV.
              </p>
            </div>

            <button onClick={() => { setIsSocialInfoOpen(false); fileInputRef.current?.click() }} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded transition">
              📂 Carica File Scaricato
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL NUOVO CONTATTO (Manuale) --- */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
              <h2 className="text-2xl font-bold text-white mb-6">{editingId ? 'Modifica Contatto' : 'Nuovo Contatto'}</h2>
              <form className="space-y-4" onSubmit={handleSave}>
                  <div><label className="text-xs text-gray-400">Nome</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white" required /></div>
                  <div><label className="text-xs text-gray-400">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white" /></div>
                  <div><label className="text-xs text-gray-400">Valore Stimato (€)</label><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white" /></div>
                  <button type="submit" className="w-full bg-yellow-600 p-3 rounded font-bold hover:bg-yellow-500 text-black mt-2">{saving ? 'Salvataggio...' : 'Salva Contatto'}</button>
              </form>
            </div>
         </div>
      )}
    </main>
  )
}