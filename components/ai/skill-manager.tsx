'use client'

import React, { useState } from 'react'
import { 
  Zap, Shield, Search, Database, MessageCircle, 
  Settings2, Activity, Sparkles, Check, Info, Box
} from 'lucide-react'

const SKILLS_LIBRARY = [
  {
    id: 'sentiment',
    name: 'Analisi Sentiment',
    description: 'Rileva le emozioni nelle risposte dei clienti per adattare il tono.',
    category: 'Comunicazione',
    icon: <Smile size={20} className="text-amber-500" />
  },
  {
    id: 'lead-scoring',
    name: 'Predictive Lead Scoring',
    description: 'Assegna un punteggio di priorità ai lead basato sulla probabilità di chiusura.',
    category: 'Vendite',
    icon: <Activity size={20} className="text-blue-500" />
  },
  {
    id: 'data-cruncher',
    name: 'Data Cruncher Pro',
    description: 'Analizza grandi moli di dati per trovare pattern di acquisto nascosti.',
    category: 'Dati',
    icon: <Database size={20} className="text-purple-500" />
  },
  {
    id: 'negotiator',
    name: 'Gestore Obiezioni',
    description: 'Strategie avanzate di negoziazione psicologica integrate nel coach.',
    category: 'Vendite',
    icon: <Shield size={20} className="text-emerald-500" />
  },
  {
    id: 'scheduler',
    name: 'Auto-Meeting Scheduler',
    description: 'Trova e propone slot liberi per appuntamenti in automatico.',
    category: 'Automazione',
    icon: <Box size={20} className="text-sky-500" />
  }
]

import { Smile } from 'lucide-react'

export function SkillManager() {
  const [activeSkills, setActiveSkills] = useState<string[]>(['sentiment', 'negotiator'])
  const [search, setSearch] = useState('')

  const toggleSkill = (id: string) => {
    setActiveSkills(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const filteredSkills = SKILLS_LIBRARY.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" /> Libreria delle Skills
          </h2>
          <p className="text-xs text-gray-500 font-medium tracking-tight">Potenzia le capacità operative dei tuoi agenti AI.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cerca skill..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#00665E] transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {filteredSkills.map(skill => {
          const isActive = activeSkills.includes(skill.id)
          return (
            <div 
              key={skill.id} 
              onClick={() => toggleSkill(skill.id)}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-4 group ${
                isActive 
                ? 'bg-[#00665E]/5 border-[#00665E] shadow-sm' 
                : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition ${
                isActive ? 'bg-white shadow-inner' : 'bg-gray-50'
              }`}>
                {skill.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-gray-900 leading-none mb-1">{skill.name}</h4>
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{skill.category}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{skill.description}</p>
              </div>

              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition ${
                isActive ? 'bg-[#00665E] border-[#00665E] text-white' : 'border-gray-100 bg-gray-50'
              }`}>
                {isActive && <Check size={14} />}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-emerald-50/50 border-t border-emerald-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Info size={16} />
        </div>
        <p className="text-[10px] text-emerald-800 font-medium leading-normal">
          Le skills attivate sono condivise da tutti gli agenti della tua azienda e influenzano direttamente i loro consigli e automazioni.
        </p>
      </div>
    </div>
  )
}
