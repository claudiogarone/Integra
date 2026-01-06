'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NegozioPage() {
  const [products, setProducts] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState<any>(null) // Dati azienda (nome, whatsapp)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const initShop = async () => {
      // 1. Scarica i prodotti attivi
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
      
      if (productsData && productsData.length > 0) {
        setProducts(productsData)

        // 2. Trova il proprietario del negozio (usiamo l'user_id del primo prodotto)
        const ownerId = productsData[0].user_id

        // 3. Scarica le Info Azienda (Numero WhatsApp, Nome) dal profilo del proprietario
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_name, whatsapp_number')
          .eq('id', ownerId)
          .single()
        
        if (profileData) {
          setCompanyInfo(profileData)
        }
      }
      setLoading(false)
    }
    initShop()
  }, [supabase])

  // Funzione Ordine
  const handleOrder = (product: any) => {
    // Se non c'è il numero configurato, avvisa
    if (!companyInfo?.whatsapp_number) {
      alert("⚠️ Il negoziante non ha ancora configurato il numero WhatsApp nelle impostazioni.")
      return
    }

    const text = `Ciao! 👋 Vorrei ordinare dal negozio *${companyInfo.company_name || 'Integra Shop'}*: \n\n📦 *${product.name}*\n💰 Prezzo: € ${product.price}\n\nAttendo info. Grazie!`
    
    const encodedText = encodeURIComponent(text)
    const waLink = `https://wa.me/${companyInfo.whatsapp_number}?text=${encodedText}`
    
    window.open(waLink, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50 font-sans pb-20">
      
      {/* HEADER NEGOZIO */}
      <header className="bg-black text-white p-6 sticky top-0 z-50 shadow-xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            {/* Usa il nome azienda dinamico o un default */}
            <h1 className="text-2xl font-bold text-yellow-500 tracking-tighter uppercase">
              {companyInfo?.company_name || 'NEGOZIO ONLINE'}
            </h1>
            <p className="text-xs text-gray-400">Ordina facile, ricevi subito.</p>
          </div>
          <div className="bg-gray-800 p-2 rounded-full relative">
            <span className="text-xl">🛍️</span>
          </div>
        </div>
      </header>

      {/* LISTA PRODOTTI */}
      <div className="max-w-4xl mx-auto p-6">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nessun prodotto disponibile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition duration-300">
                
                {/* Immagine */}
                <div className="h-64 bg-gray-200 relative overflow-hidden group">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  {product.category && <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-md">{product.category}</span>}
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h2>
                    <span className="text-lg font-bold text-yellow-600">€{product.price}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{product.description || '...'}</p>

                  <button 
                    onClick={() => handleOrder(product)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-green-500/20"
                  >
                    <span>💬</span> Ordina su WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-gray-400 text-xs py-10">
        <p>Powered by Integra Platform</p>
      </footer>
    </main>
  )
}