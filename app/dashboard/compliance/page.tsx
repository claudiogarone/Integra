'use client'

import { createClient } from '../../../utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'
import { Shield, ShieldAlert, ShieldCheck, UserX, History, Search, Download, AlertTriangle, CheckCircle, FileText, PhoneOff } from 'lucide-react'
import Papa from 'papaparse'

interface Consent {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  consent_phone: boolean;
  consent_email: boolean;
  consent_sms: boolean;
  consent_profiling: boolean;
  consent_third_party: boolean;
  source: string;
  created_at: string;
  opted_out_at: string | null;
  opt_out_reason: string | null;
}

interface RPOVerification {
  id: string;
  phone_number: string;
  is_registered: boolean;
  verification_status: string;
  verified_at: string;
  expires_at: string;
}

interface Blacklist {
  id: string;
  contact_value: string;
  contact_type: string;
  reason: string;
  reason_type: string;
  blocked_at: string;
  active: boolean;
}

interface AuditLog {
  id: string;
  event_type: string;
  event_description: string;
  created_at: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

export default function CompliancePage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'consents' | 'rpo' | 'blacklist' | 'audit'>('consents')
  const [data, setData] = useState({
    consents: [] as Consent[],
    rpo: [] as RPOVerification[],
    blacklist: [] as Blacklist[],
    audit: [] as AuditLog[]
  })
  
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/compliance?type=all')
      if (res.ok) {
        const json = await res.json()
        setData({
          consents: json.consents || [],
          rpo: json.rpo || [],
          blacklist: json.blacklist || [],
          audit: json.audit || []
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredConsents = useMemo(() => {
    return data.consents.filter(c => 
      (c.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact_phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data.consents, searchTerm])

  const filteredRpo = useMemo(() => {
    return data.rpo.filter(r => 
      (r.phone_number || '').includes(searchTerm)
    )
  }, [data.rpo, searchTerm])

  const filteredBlacklist = useMemo(() => {
    return data.blacklist.filter(b => 
      (b.contact_value || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data.blacklist, searchTerm])

  const filteredAudit = useMemo(() => {
    return data.audit.filter(a => 
      (a.event_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [data.audit, searchTerm])

  const exportCSV = (dataType: string, exportData: any[]) => {
    if (exportData.length === 0) return alert('Nessun dato da esportare')
    const csv = Papa.unparse(exportData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `integraos_compliance_${dataType}_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="p-10 text-[#00665E] animate-pulse">Caricamento Modulo Compliance...</div>

  return (
    <main className="flex-1 p-8 overflow-auto bg-[#F8FAFC] text-gray-900 font-sans h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#00665E] tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8" />
            Compliance & Privacy
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestione GDPR, Registro delle Opposizioni e Blacklist.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText className="w-6 h-6" /></div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Consensi Attivi</p>
                <p className="text-2xl font-black text-gray-900">{data.consents.filter(c => !c.opted_out_at).length}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Verifiche RPO (Mese)</p>
                <p className="text-2xl font-black text-gray-900">{data.rpo.length}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl"><UserX className="w-6 h-6" /></div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Blacklist</p>
                <p className="text-2xl font-black text-gray-900">{data.blacklist.length}</p>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><History className="w-6 h-6" /></div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Log Audit</p>
                <p className="text-2xl font-black text-gray-900">{data.audit.length}</p>
            </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('consents')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'consents' ? 'bg-white shadow-sm text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}>Consensi</button>
          <button onClick={() => setActiveTab('rpo')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'rpo' ? 'bg-white shadow-sm text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}>Registro Opposizioni</button>
          <button onClick={() => setActiveTab('blacklist')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'blacklist' ? 'bg-white shadow-sm text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}>Blacklist</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'audit' ? 'bg-white shadow-sm text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}>Audit Log</button>
        </div>
        <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <Search size={16} className="text-gray-400"/>
                <input type="text" placeholder="Cerca..." className="bg-transparent border-none outline-none text-sm w-48" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => {
                const map = {
                    'consents': filteredConsents,
                    'rpo': filteredRpo,
                    'blacklist': filteredBlacklist,
                    'audit': filteredAudit
                }
                exportCSV(activeTab, map[activeTab])
            }} className="bg-white border border-gray-200 text-[#00665E] px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                <Download size={16}/> Esporta
            </button>
        </div>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* CONSENTS TABLE */}
        {activeTab === 'consents' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Contatto</th>
                            <th className="px-6 py-4 text-center">Data Registrazione</th>
                            <th className="px-6 py-4 text-center">Permessi</th>
                            <th className="px-6 py-4 text-center">Fonte</th>
                            <th className="px-6 py-4 text-right">Stato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredConsents.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nessun consenso trovato.</td></tr>}
                        {filteredConsents.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{c.contact_name || 'Sconosciuto'}</p>
                                    <p className="text-xs text-gray-500">{c.contact_email} {c.contact_phone ? `• ${c.contact_phone}` : ''}</p>
                                </td>
                                <td className="px-6 py-4 text-center text-xs">{new Date(c.created_at).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.consent_email ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Email</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.consent_sms ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>SMS</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.consent_phone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Call</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-xs font-medium">{c.source}</td>
                                <td className="px-6 py-4 text-right">
                                    {c.opted_out_at ? 
                                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100 inline-flex items-center gap-1"><PhoneOff size={12}/> Opt-Out</span>
                                        : <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600 border border-green-100 inline-flex items-center gap-1"><CheckCircle size={12}/> Attivo</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* RPO TABLE */}
        {activeTab === 'rpo' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Numero di Telefono</th>
                            <th className="px-6 py-4 text-center">Esito RPO</th>
                            <th className="px-6 py-4 text-center">Data Verifica</th>
                            <th className="px-6 py-4 text-right">Scadenza Validità (15gg)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredRpo.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nessuna verifica RPO trovata.</td></tr>}
                        {filteredRpo.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4 font-bold text-gray-900">{r.phone_number}</td>
                                <td className="px-6 py-4 text-center">
                                    {r.is_registered ? 
                                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100 inline-flex items-center gap-1"><AlertTriangle size={12}/> Iscritto (Bloccato)</span>
                                        : <span className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600 border border-green-100 inline-flex items-center gap-1"><CheckCircle size={12}/> Libero</span>
                                    }
                                </td>
                                <td className="px-6 py-4 text-center text-xs">{new Date(r.verified_at).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-xs">
                                    {new Date() > new Date(r.expires_at) ? 
                                        <span className="text-red-500 font-bold">Scaduta il {new Date(r.expires_at).toLocaleDateString()}</span> 
                                        : <span className="text-green-600 font-bold">Valida fino al {new Date(r.expires_at).toLocaleDateString()}</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* BLACKLIST TABLE */}
        {activeTab === 'blacklist' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Contatto Bloccato</th>
                            <th className="px-6 py-4 text-center">Tipo</th>
                            <th className="px-6 py-4 text-center">Motivazione</th>
                            <th className="px-6 py-4 text-center">Data Inserimento</th>
                            <th className="px-6 py-4 text-right">Stato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredBlacklist.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nessun contatto in blacklist.</td></tr>}
                        {filteredBlacklist.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4 font-bold text-gray-900">{b.contact_value}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">{b.contact_type}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-medium text-red-600">{b.reason}</span>
                                    <span className="block text-[10px] text-gray-400">({b.reason_type})</span>
                                </td>
                                <td className="px-6 py-4 text-center text-xs">{new Date(b.blocked_at).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {b.active ? 
                                        <span className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100 inline-flex items-center gap-1"><UserX size={12}/> Attivo</span>
                                        : <span className="px-2 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">Rimosso</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* AUDIT LOG TABLE */}
        {activeTab === 'audit' && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 uppercase font-bold text-gray-400 text-[10px] tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Data & Ora</th>
                            <th className="px-6 py-4">Evento</th>
                            <th className="px-6 py-4">Dettagli Evento</th>
                            <th className="px-6 py-4 text-right">Contatto Associato</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAudit.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Nessun log trovato.</td></tr>}
                        {filteredAudit.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4 text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        a.event_type.includes('rpo') ? 'bg-orange-100 text-orange-700' :
                                        a.event_type.includes('consent') ? 'bg-blue-100 text-blue-700' :
                                        a.event_type.includes('blacklist') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                    }`}>{a.event_type}</span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-800">{a.event_description}</td>
                                <td className="px-6 py-4 text-right">
                                    {a.contact_name || a.contact_email || a.contact_phone ? (
                                        <div className="text-xs">
                                            <span className="font-bold text-gray-900 block">{a.contact_name}</span>
                                            <span className="text-gray-500">{a.contact_phone || a.contact_email}</span>
                                        </div>
                                    ) : <span className="text-gray-400 text-xs">-</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

      </div>
    </main>
  )
}
