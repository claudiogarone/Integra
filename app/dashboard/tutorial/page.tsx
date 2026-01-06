'use client'
import Link from 'next/link'

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🎓 Centro Formazione Integra</h1>
        <p className="text-gray-400 mb-8">Impara a usare la tua piattaforma al 100%.</p>

        <div className="grid md:grid-cols-2 gap-6">
          
          {/* VIDEO 1 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-500 transition cursor-pointer group">
            <div className="h-40 bg-gray-800 flex items-center justify-center group-hover:bg-gray-700">
              <span className="text-4xl">▶️</span>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">1. Primi Passi su Integra</h3>
              <p className="text-sm text-gray-400">Come configurare il tuo profilo e importare i primi contatti.</p>
            </div>
          </div>

          {/* VIDEO 2 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-500 transition cursor-pointer group">
            <div className="h-40 bg-gray-800 flex items-center justify-center group-hover:bg-gray-700">
              <span className="text-4xl">▶️</span>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">2. Configurare l'Agente AI</h3>
              <p className="text-sm text-gray-400">Insegna al tuo bot a vendere i tuoi prodotti in autonomia.</p>
            </div>
          </div>

          {/* VIDEO 3 */}
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-yellow-500 transition cursor-pointer group">
            <div className="h-40 bg-gray-800 flex items-center justify-center group-hover:bg-gray-700">
              <span className="text-4xl">▶️</span>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">3. Creare una Vetrina Prodotti</h3>
              <p className="text-sm text-gray-400">Carica le foto e inizia a ricevere ordini su WhatsApp.</p>
            </div>
          </div>

        </div>

        <div className="mt-12 bg-yellow-900/20 border border-yellow-600/30 p-6 rounded-xl text-center">
          <h3 className="text-xl font-bold text-yellow-500 mb-2">Hai bisogno di aiuto specifico?</h3>
          <p className="text-gray-300 mb-4">Il nostro team di supporto è disponibile.</p>
          <button className="bg-yellow-600 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-500">Contatta Assistenza</button>
        </div>
      </div>
    </div>
  )
}