'use client'

import React, { useState } from 'react'
import { 
  Users, UserPlus, MessageSquare, ListTodo, 
  ArrowRight, Sparkles, BrainCircuit, ShieldCheck,
  TrendingUp, Zap, Clock, Search, Filter, Mail, Bell
} from 'lucide-react'

const TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Marco Rossi',
    role: 'Sales Representative',
    status: 'Online',
    skills: ['Trattativa', 'Chiusura'],
    performance: 88,
    avatar: 'MR'
  },
  {
    id: '2',
    name: 'Alessia Verdi',
    role: 'Customer Support',
    status: 'In Chiamata',
    skills: ['Problem Solving', 'Sentiment Analysis'],
    performance: 92,
    avatar: 'AV'
  },
  {
    id: '3',
    name: 'Data Analyst AI',
    role: 'System Agent',
    status: 'Elaborazione Dati',
    skills: ['Analisi Trend', 'Lead Scoring'],
    performance: 99,
    avatar: 'AI'
  }
]

const SHARED_TASKS = [
  { id: '1', title: 'Follow-up Lead Tech Solutions', assignee: 'Marco Rossi', priority: 'HIGHT', status: 'In Corso' },
  { id: '2', title: 'Analisi abbandono carrello (Marzo)', assignee: 'Data Analyst AI', priority: 'MEDIUM', status: 'In Attesa' },
  { id: '3', title: 'Risoluzione reclamo ordine #892', assignee: 'Alessia Verdi', priority: 'HIGHT', status: 'Urgent' }
]

export default function AgentTeamsPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'mailbox'>('members')

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* HEADER TEAMS */}
      <div className="bg-slate-900 text-white p-8 border-b border-slate-800 shadow-xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-2 border-slate-700">
                      <Users size={32} />
                  </div>
                  <div>
                      <h1 className="text-3xl font-black flex items-center gap-3">Orchestra Teams</h1>
                      <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                          <BrainCircuit size={16} className="text-blue-400"/> Monitoraggio e Coordinamento Multi-Agente
                      </p>
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3">
                      <div className="flex -space-x-3">
                          {TEAM_MEMBERS.map(m => (
                              <div key={m.id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                  {m.avatar}
                              </div>
                          ))}
                      </div>
                      <span className="text-xs font-bold text-slate-300">3 Agenti Attivi</span>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm transition flex items-center gap-2 shadow-lg">
                      <UserPlus size={18}/> Aggiungi Teammate
                  </button>
              </div>
          </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-8">
          
          {/* TABS NAV */}
          <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-2xl w-max shadow-sm">
              <TabBtn active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users size={18}/>} label="Team Members" />
              <TabBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ListTodo size={18}/>} label="Task Board" />
              <TabBtn active={activeTab === 'mailbox'} onClick={() => setActiveTab('mailbox')} icon={<MessageSquare size={18}/>} label="Inter-Agent Mailbox" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* CONTENT AREA */}
              <div className="lg:col-span-8">
                  {activeTab === 'members' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
                          {TEAM_MEMBERS.map(member => (
                              <div key={member.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition group">
                                  <div className="flex justify-between items-start mb-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-14 h-14 bg-gray-50 text-gray-900 rounded-2xl border border-gray-100 flex items-center justify-center text-lg font-black shadow-inner">
                                              {member.avatar}
                                          </div>
                                          <div>
                                              <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition">{member.name}</h3>
                                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{member.role}</p>
                                          </div>
                                      </div>
                                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${member.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {member.status}
                                      </div>
                                  </div>
                                  
                                  <div className="space-y-4 mb-6">
                                      <div className="flex justify-between items-end">
                                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance</span>
                                          <span className="text-sm font-black text-blue-600">{member.performance}%</span>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-50">
                                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${member.performance}%` }}></div>
                                      </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 mb-6">
                                      {member.skills.map(skill => (
                                          <span key={skill} className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg text-[10px] font-bold text-gray-600">
                                              {skill}
                                          </span>
                                      ))}
                                  </div>

                                  <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition flex items-center justify-center gap-2 text-xs">
                                      Monitora Azioni <ArrowRight size={14}/>
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  {activeTab === 'tasks' && (
                      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in zoom-in-95">
                          <table className="w-full text-left">
                              <thead className="bg-gray-50/80 border-b border-gray-100">
                                  <tr>
                                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attività / Lead</th>
                                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assegnato A</th>
                                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                      <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priorità</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {SHARED_TASKS.map(task => (
                                      <tr key={task.id} className="hover:bg-gray-50/50 transition">
                                          <td className="p-5"><span className="text-sm font-black text-gray-900">{task.title}</span></td>
                                          <td className="p-5">
                                              <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[8px] font-black flex items-center justify-center shadow-sm">AI</div>
                                                  <span className="text-xs font-bold text-gray-600">{task.assignee}</span>
                                              </div>
                                          </td>
                                          <td className="p-5">
                                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100 uppercase tracking-tight">{task.status}</span>
                                          </td>
                                          <td className="p-5">
                                              <div className="flex items-center gap-1.5 font-black text-[10px] text-rose-500 uppercase">
                                                  <Zap size={12} fill="currentColor"/> {task.priority}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <div className="p-5 border-t border-gray-50 bg-gray-50/30 text-center">
                              <button className="text-blue-600 text-xs font-black hover:underline flex items-center justify-center gap-1 mx-auto">Vedi Board Completo Kanban <ArrowRight size={14}/></button>
                          </div>
                      </div>
                  )}

                  {activeTab === 'mailbox' && (
                      <div className="space-y-4 animate-in slide-in-from-right-4">
                          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex gap-4">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Bell size={20}/></div>
                              <div>
                                  <h4 className="text-sm font-black text-gray-900 mb-1">Data Analyst AI ha inviato un report a Marco Rossi</h4>
                                  <p className="text-xs text-gray-500 leading-relaxed mb-3 italic">"Ho individuato un pattern di calo nel carrello per Tech Solutions. Ti consiglio di attivare lo Skill 'Sentiment Analysis' prima del meeting."</p>
                                  <span className="text-[10px] font-bold text-gray-400">2 minuti fa • Protocollo Inter-Agent sync-v2</span>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* SIDEBAR ANALITICA */}
              <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                      <Zap className="absolute -right-8 -bottom-8 text-emerald-500/20" size={160} />
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Sparkles size={16}/> Team Pulse
                      </h4>
                      <div className="relative z-10">
                          <h2 className="text-4xl font-black mb-1">94.2%</h2>
                          <p className="text-slate-400 text-xs font-bold leading-normal">Efficienza collettiva rilevata nell'ultima ora di operazione continuativa.</p>
                      </div>
                      <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
                          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sync Latency</p>
                              <p className="text-lg font-black text-white">42ms</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Task Velocity</p>
                              <p className="text-lg font-black text-white">12/h</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 pb-2 border-b">Recenti Azioni Coordinate</h4>
                      <div className="space-y-6">
                          <CoordAction icon={<TrendingUp className="text-blue-500"/>} agent="Data Analyst" action="Generato report lead scoring" time="10m fa" />
                          <CoordAction icon={<Mail className="text-amber-500"/>} agent="Alessia" action="Invio newsletter assistita" time="24m fa" />
                          <CoordAction icon={<Zap className="text-purple-500"/>} agent="System" action="Sync Database globale" time="1h fa" />
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </main>
  )
}

function TabBtn({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black transition ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-gray-500 hover:bg-gray-50'}`}>
            {icon} {label}
        </button>
    )
}

function CoordAction({ icon, agent, action, time }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-xs font-black text-gray-900 leading-none mb-1">{agent}</p>
                <p className="text-[10px] text-gray-500 mb-1 leading-normal">{action}</p>
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold">
                    <Clock size={10}/> {time}
                </div>
            </div>
        </div>
    )
}
