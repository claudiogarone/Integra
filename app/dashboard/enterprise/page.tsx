'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function EnterprisePage() {
  const searchParams = useSearchParams()
  const feat = searchParams.get('feat') // Legge l'ID della funzione

  // --- DATABASE FUNZIONI ---
  const features = {
    // === SEZIONE AMBASSADOR (Futuro AI) ===
    ghost: {
      type: 'AMBASSADOR',
      emoji: '👻',
      title: 'Ghost-Writer di Brand',
      subtitle: 'L\'AI che rende virale il tuo brand.',
      desc: 'Un\'intelligenza artificiale che monitora i trend virali del settore ogni mattina. Invierà una notifica: "Oggi questo argomento è virale. Vuoi che generi un post e un video ora?". Con un clic, il sistema crea e pubblica.',
      color: 'from-purple-600 to-indigo-600',
      btn: 'Attiva Modulo AI'
    },
    simulator: {
      type: 'AMBASSADOR',
      emoji: '🥊',
      title: 'Simulatore Sales AI',
      subtitle: 'La palestra per i tuoi venditori.',
      desc: 'Uno strumento di training per la forza vendita. Il dipendente chatta con un’AI che simula un "cliente difficile". Alla fine, l\'AI dà un voto e suggerisce come migliorare la trattativa.',
      color: 'from-red-600 to-orange-600',
      btn: 'Inizia Training'
    },
    living: {
      type: 'AMBASSADOR',
      emoji: '🧬',
      title: 'Sito Vivente',
      subtitle: 'Il sito che muta in base al cliente.',
      desc: 'Landing page dinamiche. Se un utente atterra sul sito da Milano, vedrà foto e testi personalizzati per Milano; se è un cliente ricorrente, il sito lo saluterà per nome e mostrerà offerte basate sui suoi gusti passati.',
      color: 'from-blue-600 to-cyan-500',
      btn: 'Configura Sito'
    },

    // === SEZIONE ENTERPRISE (Scalabilità Business) ===
    shop100: {
      type: 'ENTERPRISE',
      emoji: '🏬',
      title: 'Negozio Online Pro',
      subtitle: 'E-commerce completo senza limiti.',
      desc: 'Potenzia la tua vetrina fino a 100 prodotti. Include gestione varianti (taglie/colori), codici sconto avanzati, integrazione corrieri per spedizioni automatiche e pagamenti diretti con carta di credito.',
      color: 'from-teal-600 to-emerald-600',
      btn: 'Upgrade a Negozio Pro'
    },
    dem: {
      type: 'ENTERPRISE',
      emoji: '📨',
      title: 'Campagna DEM Avanzata',
      subtitle: 'Direct Email Marketing Automation.',
      desc: 'Crea funnel di vendita automatici via email. Segmenta i clienti in base agli acquisti ("VIP", "Nuovi", "Dormienti") e invia offerte mirate che partono in automatico al momento giusto.',
      color: 'from-teal-600 to-emerald-600',
      btn: 'Crea Campagna'
    },
    agents: {
      type: 'ENTERPRISE',
      emoji: '💼',
      title: 'Crea Rete Agenti',
      subtitle: 'Gestisci la tua forza vendita.',
      desc: 'Un portale dedicato per i tuoi agenti. Possono inserire ordini per conto dei clienti, vedere le provvigioni maturate in tempo reale e accedere ai listini riservati.',
      color: 'from-teal-600 to-emerald-600',
      btn: 'Configura Agenti'
    },
    affiliate: {
      type: 'ENTERPRISE',
      emoji: '🤝',
      title: 'Sistema di Affiliazione',
      subtitle: 'Trasforma i clienti in venditori.',
      desc: 'Genera link personalizzati per influencer e partner. Loro portano traffico, il sistema traccia le vendite e calcola automaticamente le commissioni da pagare a fine mese.',
      color: 'from-teal-600 to-emerald-600',
      btn: 'Attiva Affiliazioni'
    },
    network: {
      type: 'ENTERPRISE',
      emoji: '🌐',
      title: 'Crea Network',
      subtitle: 'La tua rete in franchising digitale.',
      desc: 'Collega più sedi o negozi sotto un unico pannello di controllo centrale. Monitora le performance di ogni punto vendita, condividi magazzino e strategie marketing unificate.',
      color: 'from-teal-600 to-emerald-600',
      btn: 'Espandi Network'
    }
  }

  // Seleziona la feature attiva (o default)
  const active = features[feat as keyof typeof features] || features.ghost

  return (
    <main className="min-h-full p-6 md:p-12 font-sans flex flex-col items-center justify-center animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${active.type === 'AMBASSADOR' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
          FUNZIONE {active.type}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mt-4 mb-2">
          {active.title}
        </h1>
        <p className="text-xl text-gray-500 font-light">
          {active.subtitle}
        </p>
      </div>

      {/* CARD CENTRALE ACCATTIVANTE */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row transform transition hover:scale-[1.01] duration-500">
        
        {/* LATO SX: VISUAL */}
        <div className={`md:w-5/12 bg-gradient-to-br ${active.color} p-10 flex flex-col items-center justify-center text-white relative overflow-hidden`}>
          {/* Cerchi decorativi sfocati */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          <div className="text-9xl relative z-10 animate-bounce-slow filter drop-shadow-lg">
            {active.emoji}
          </div>
        </div>

        {/* LATO DX: DESCRIZIONE */}
        <div className="md:w-7/12 p-10 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Come funziona:
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            {active.desc}
          </p>

          <div className="mt-auto">
            <button className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 bg-gradient-to-r ${active.color}`}>
              {active.btn} →
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              *Richiede l'attivazione del pacchetto {active.type === 'AMBASSADOR' ? 'Ambassador' : 'Enterprise'}.
            </p>
          </div>
        </div>
      </div>

    </main>
  )
}