'use client'

import { createClient } from '../../utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // --- STATI PER I DATI REALI ---
  const [loading, setLoading] = useState(true)
  const [kpiTotal, setKpiTotal] = useState(0)
  const [kpiValue, setKpiValue] = useState(0)
  const [recentContacts, setRecentContacts] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  // Stati per il form
  const [newContactName, setNewContactName] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactValue, setNewContactValue] = useState('')

  const router = useRouter()
  const supabase = createClient()

  // --- CARICAMENTO DATI ---
  useEffect(() => {
    const getData = async () => {
      // 1. Check Utente
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 2. Scarica TUTTI i contatti per fare i calcoli
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false }) // Dal più recente

      if (contacts) {
        // A. KPI Totale Contatti
        setKpiTotal(contacts.length)

        // B. KPI Valore Totale (Somma dei valori)
        const totaleEuro = contacts.reduce((sum, c) => sum + (c.value || 0), 0)
        setKpiValue(totaleEuro)

        // C. Tabella Recenti (Prendi solo i primi 5)
        setRecentContacts(contacts.slice(0, 5))

        // D. Calcolo Grafico (Ultimi 7 giorni)
        // Questo codice raggruppa i contatti per data di creazione
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - i)
          return d.toISOString().split('T')[0] // Es. "2023-10-25"
        }).reverse()

        const grafico = last7Days.map(dateStr => {
          // Conta quanti contatti hanno questa data (ignorando l'ora)
          const count = contacts.filter(c => c.created_at.startsWith(dateStr)).length
          // Formatta la data per il grafico (es. "25/10")
          const shortDate = dateStr.split('-').slice(1).reverse().join('/')
          return { nome: shortDate, contatti: count }
        })
        setChartData(grafico)
      }
      
      setLoading(false)
    }
    getData()
  }, [router, supabase])

  // --- FUNZIONE SALVATAGGIO ---
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name: newContactName,
        email: newContactEmail,
        value: Number(newContactValue),
        user_id: user.id,
        status: 'Nuovo'
      })
      .select()

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      alert('Contatto salvato! 🚀')
      setIsModalOpen(false)
      // Ricarica la pagina per aggiornare i grafici (metodo veloce)
      window.location.reload()
    }
  }

  if (loading) {
    return <div className="p-10 text-white bg-black h-screen">Caricamento Dashboard...</div>
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col hidden md:flex">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-yellow-500 tracking-wider">INTEGRA</h2>
        </div>
        
        <nav className="space-y-2 px-4 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 py-3 px-4 bg-gray-900 rounded-lg text-yellow-500 font-medium shadow-lg shadow-yellow-900/10">
            <span>📊</span> Dashboard
          </Link>
          <Link href="/dashboard/crm" className="flex items-center gap-3 py-3 px-4 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-all">
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

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Panoramica</h1>
            <p className="text-gray-400 text-sm">Ecco i dati aggiornati del tuo business.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-yellow-600 text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 transition shadow-lg shadow-yellow-600/20"
          >
            + Nuovo Lead
          </button>
        </header>

        {/* KPI CARDS (COLLEGATE AI DATI REALI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* CARD 1: TOTALE CONTATTI */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Totale Contatti</p>
                <h3 className="text-3xl font-bold text-white mt-1">{kpiTotal}</h3>
              </div>
              <span className="text-green-400 text-xs bg-green-400/10 px-2 py-1 rounded">Reali</span>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 w-full"></div>
            </div>
          </div>

          {/* CARD 2: FATTURATO (SOMMA DEL 'VALUE' DEI CONTATTI) */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Valore Pipeline</p>
                <h3 className="text-3xl font-bold text-white mt-1">€ {kpiValue.toLocaleString()}</h3>
              </div>
              <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-1 rounded">Stima</span>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-2/3"></div>
            </div>
          </div>

          {/* CARD 3: STATICA (PER ORA) */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Tasso Conversione</p>
                <h3 className="text-3xl font-bold text-white mt-1">--%</h3>
              </div>
              <span className="text-gray-500 text-xs px-2 py-1 rounded">Coming Soon</span>
            </div>
          </div>
        </div>

        {/* GRAFICI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* GRAFICO CRESCITA REALE */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-80">
            <h3 className="text-lg font-bold mb-6">Nuovi Lead (Ultimi 7gg)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="nome" stroke="#9CA3AF" />
                <YAxis allowDecimals={false} stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#EAB308' }}
                />
                <Line type="monotone" dataKey="contatti" stroke="#EAB308" strokeWidth={3} dot={{ r: 4, fill: '#EAB308' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* GRAFICO SORGENTI (RIMANE STATICO PERCHÉ NON ABBIAMO ANCORA IL CAMPO 'SORGENTE' NEL DB) */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 h-80">
            <h3 className="text-lg font-bold mb-6">Sorgenti (Demo)</h3>
            <div className="flex items-center justify-center h-full text-gray-500">
              Dati non ancora disponibili
            </div>
          </div>
        </div>

        {/* TABELLA RECENTI (REALE) */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden mb-10">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold">Ultimi Contatti Registrati</h3>
            <Link href="/dashboard/crm" className="text-sm text-yellow-500 hover:text-yellow-400">
              Vedi tutti &rarr;
            </Link>
          </div>
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-950 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Valore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentContacts.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                  <td className="px-6 py-4">{c.email}</td>
                  <td className="px-6 py-4">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-white">€ {c.value}</td>
                </tr>
              ))}
              {recentContacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">Nessun dato recente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL POPUP (Identico) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Nuovo Contatto</h2>
            <form className="space-y-4" onSubmit={handleSaveContact}>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
                <input type="text" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none focus:border-yellow-500" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valore Stimato (€)</label>
                <input type="number" value={newContactValue} onChange={(e) => setNewContactValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white outline-none focus:border-yellow-500" />
              </div>
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded mt-4">Salva Contatto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}