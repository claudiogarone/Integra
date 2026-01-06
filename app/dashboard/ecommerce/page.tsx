'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function EcommercePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Prodotti'
  })
  const [imageFile, setImageFile] = useState<File | null>(null) // Nuovo stato per il file

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        if (data) setProducts(data)
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let publicUrl = 'https://via.placeholder.com/150' // Immagine default

    // 1. UPLOAD IMMAGINE (Se selezionata)
    if (imageFile && user) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, imageFile)

      if (uploadError) {
        alert('Errore caricamento foto: ' + uploadError.message)
        setSaving(false)
        return
      }

      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName)
      publicUrl = urlData.publicUrl
    }

    // 2. SALVA DATI PRODOTTO
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: publicUrl, // Salviamo l'URL generato
        category: formData.category
      })
      .select()

    if (!error && data) {
      setProducts([data[0], ...products])
      setIsModalOpen(false)
      setFormData({ name: '', description: '', price: '', category: 'Prodotti' })
      setImageFile(null)
    } else {
      alert('Errore salvataggio: ' + error?.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Eliminare?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(products.filter(p => p.id !== id))
  }

  if (loading) return <div className="p-10">Caricamento...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-black text-white">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold">Vetrina Prodotti</h1><p className="text-gray-400 text-sm">Carica qui i prodotti per la vendita.</p></div>
        <button onClick={() => setIsModalOpen(true)} className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 shadow-lg shadow-yellow-600/20">+ Aggiungi Prodotto</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group">
            <div className="h-48 bg-gray-800 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex justify-between"><h3 className="font-bold">{product.name}</h3><span className="text-yellow-500 font-bold">€ {product.price}</span></div>
              <button onClick={() => handleDelete(product.id)} className="text-xs text-red-500 mt-2 hover:underline">Elimina</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Nuovo Prodotto</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white" placeholder="Nome Prodotto" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white" placeholder="Prezzo €" />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white"><option>Prodotti</option><option>Servizi</option></select>
              </div>
              
              {/* INPUT FILE / FOTOCAMERA */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Foto Prodotto</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" // Attiva fotocamera su mobile
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-gray-800 text-sm text-gray-300 rounded cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-600 file:text-black hover:file:bg-yellow-500"
                />
              </div>

              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-800 p-3 rounded text-white h-20" placeholder="Descrizione..." />
              <button type="submit" disabled={saving} className="w-full bg-yellow-600 text-black font-bold py-3 rounded mt-2">{saving ? 'Caricamento...' : 'Salva'}</button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}