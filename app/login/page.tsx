'use client'

import { createClient } from '../../utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Sfondo Decorativo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#00665E]/10 to-transparent skew-y-3 origin-top-left"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-50"></div>

      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#00665E] tracking-tighter mb-2">
            INTEGRA<span className="font-light text-gray-400">OS</span>
          </h1>
          <p className="text-gray-400 text-sm">Accedi al tuo ecosistema aziendale.</p>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-600 text-sm rounded-r-xl flex items-center gap-2 animate-in shake">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          <div className="group">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Aziendale</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00665E] transition">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@azienda.com"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#00665E] focus:bg-white focus:ring-4 focus:ring-[#00665E]/10 transition duration-300"
                required
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00665E] transition">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-[#00665E] focus:bg-white focus:ring-4 focus:ring-[#00665E]/10 transition duration-300"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <a href="mailto:claudiogarone@gmail.com?subject=Reset Password Integra OS" className="text-xs font-bold text-gray-400 hover:text-[#00665E] transition">Password dimenticata?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#00665E] hover:bg-[#00554e] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#00665E]/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>ACCEDI <ArrowRight size={18} className="group-hover:translate-x-1 transition"/></>}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400">Non hai un account? <a href="mailto:claudiogarone@gmail.com?subject=Richiesta Account Integra OS" className="text-[#00665E] font-bold hover:underline">Contatta l'amministrazione</a></p>
        </div>

      </div>

      <div className="absolute bottom-4 text-center w-full text-[10px] text-gray-400 font-medium">
        Powered by Concept ADV & Enestar
      </div>
    </div>
  )
}