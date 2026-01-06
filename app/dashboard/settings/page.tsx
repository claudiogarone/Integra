'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Dati del modulo
  const [formData, setFormData] = useState({
    company_name: '',
    whatsapp_number: '',
    p_iva: '',
    address: ''
  })

  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Scarica i dati attuali dal profilo
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setFormData({
            company_name: data.company_name || '',
            whatsapp_number: data.whatsapp_number || '',
            p_iva: data.p_iva || '',
            address: data.address || ''
          })
        }
      }
      setLoading(false)
    }
    getData()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Aggiorna la tabella profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: formData.company_name,
        whatsapp_number: formData.whatsapp_number,
        p_iva: formData.p_iva,
        address: formData.address
      })
      .eq('id', user.id)

    if (!error) {
      alert('✅ Impostazioni salvate con successo!')
    } else {
      alert('Errore: ' + error.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-white">Caricamento impostazioni...</div>

  return (
    <main className="flex-1 p-10 overflow-auto bg-black text-white">
      <h1 className="text-3xl font-bold mb-8">Impostazioni Azienda</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* FORM CONFIGURAZIONE */}
        <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">✏️ Dati Attività</h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome Azienda (Apparirà nel negozio)</label>
              <input 
                type="text" 
                value={formData.company_name}
                onChange={e => setFormData({...formData, company_name: e.target.value})}
                className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none"
                placeholder="Es. Pastaorosa SRL"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Numero WhatsApp (Per ricevere ordini)</label>
              <input 
                type="text" 
                value={formData.whatsapp_number}
                onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                className="w-full bg-gray-950 border border-yellow-600/50 rounded p-3 text-white focus:border-yellow-500 outline-none"
                placeholder="Es. 393331234567 (Con prefisso, senza +)"
                required
              />
              <p className="text-xs text-yellow-500 mt-1">⚠️ Importante: Inserisci il numero con prefisso internazionale (es. 39 per Italia) senza spazi o simboli +.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Partita IVA</label>
                <input 
                  type="text" 
                  value={formData.p_iva}
                  onChange={e => setFormData({...formData, p_iva: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none"
                  placeholder="IT12345678901"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Indirizzo</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none"
                  placeholder="Via Roma 1, Milano"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg mt-4 transition"
            >
              {saving ? 'Salvataggio in corso...' : '💾 Salva Modifiche'}
            </button>

          </form>
        </div>

        {/* INFO BOX */}
        <div className="space-y-6">
          <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-800">
            <h3 className="font-bold text-blue-400 mb-2">ℹ️ Come funziona il numero WhatsApp?</h3>
            <p className="text-sm text-gray-300">
              Il numero che inserisci qui verrà collegato automaticamente al pulsante "Ordina" nel tuo negozio pubblico.
              <br/><br/>
              Quando un cliente clicca, si aprirà una chat diretta con te con i dettagli del prodotto già scritti.
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <h3 className="font-bold text-white mb-2">Anteprima Dati</h3>
            <div className="text-sm space-y-2 text-gray-400">
              <p><strong>Negozio:</strong> {formData.company_name || '---'}</p>
              <p><strong>WhatsApp:</strong> {formData.whatsapp_number ? `✅ Configurato (${formData.whatsapp_number})` : '❌ Non configurato'}</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}