'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Shield, Zap, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#00665E] selection:text-white">
      
      {/* NAVBAR */}
      <nav className="p-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-black text-[#00665E] tracking-tighter cursor-pointer">
            INTEGRA<span className="font-light text-gray-400">OS</span>
        </div>
        <div className="flex gap-4">
            <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-[#00665E] py-2 transition">
                Login Agenti
            </Link>
            <Link href="/login" className="bg-[#00665E] text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-[#00665E]/20 hover:bg-[#004d46] transition flex items-center gap-2 text-sm">
                Entra in Piattaforma <ArrowRight size={16}/>
            </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="flex flex-col items-center justify-center text-center px-4 pt-10 pb-20 max-w-4xl mx-auto mt-10">
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="bg-teal-50 text-[#00665E] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-teal-100 mb-6 inline-block">
                Nuova Versione 2.0
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                Il tuo ecosistema <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00665E] to-teal-400">di Business Intelligente.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Gestisci clienti, vendite, marketing e fidelizzazione in un'unica piattaforma potenziata dall'Intelligenza Artificiale.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href="/login" className="bg-[#00665E] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-[#00665E]/30 hover:scale-105 transition transform flex items-center justify-center gap-2">
                    Inizia Ora <ArrowRight size={20}/>
                </Link>
                <a href="mailto:claudiogarone@gmail.com" className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2">
                    Richiedi Demo
                </a>
            </div>
        </div>

        {/* FEATURE CARDS (Visual Preview) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full animate-in slide-in-from-bottom-8 duration-1000 delay-200">
            <FeatureCard 
                icon={<BarChart3 className="text-blue-500"/>}
                title="CRM & Analytics"
                desc="Monitora il funnel di vendita e il valore dei clienti in tempo reale."
            />
             <FeatureCard 
                icon={<Zap className="text-yellow-500"/>}
                title="AI Advisor"
                desc="Ricevi suggerimenti automatici su chi chiamare e cosa vendere."
            />
             <FeatureCard 
                icon={<Shield className="text-green-500"/>}
                title="Fidelity System"
                desc="Gestisci carte fedeltà, punti e premi con un click."
            />
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 py-8 text-center text-gray-400 text-sm bg-white">
        <p>&copy; 2024 Integra OS. Powered by Concept ADV & Enestar.</p>
      </footer>
    </main>
  );
}

function FeatureCard({icon, title, desc}: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group">
            <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                {icon}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
        </div>
    )
}