'use client'

import { createClient } from '../../utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const supabase = createClient()

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Registrazione riuscita! Controlla la dashboard di Supabase.')
    }
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Login effettuato! Reindirizzamento...')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-xl">
        <h1 className="text-3xl font-bold text-yellow-500 mb-6 text-center">INTEGRA Login</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-500"
              placeholder="nome@azienda.it"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-500"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className="p-3 bg-gray-800 border border-yellow-500/50 text-yellow-200 text-sm rounded">
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded transition-colors"
            >
              {loading ? '...' : 'Accedi'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-transparent border border-gray-600 hover:border-gray-400 text-white font-bold py-3 rounded transition-colors"
            >
              Registrati
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}