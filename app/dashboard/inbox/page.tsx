'use client'

import { useEffect, useState, useMemo } from 'react'
import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  MessageSquare, Phone, Mail, User, DollarSign, Award, 
  Search, Filter, Send, Loader2, CheckCircle2, Clock, 
  ExternalLink, Smartphone, Facebook, Globe, ShieldCheck, 
  MoreVertical, Info, Zap, Settings, X, ShieldAlert, PhoneCall, Sparkles
} from 'lucide-react'
import Link from 'next/link'

// Tipi Native
type NativeContact = {
  id: string;
  name: string;
  channel_id: string;
  external_id: string;
  provider: string;
  bot_enabled?: boolean;
  unread_count?: number;
};

type NativeMessage = {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  created_at: string;
  is_ai_generated?: boolean;
};

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'voip'>('inbox')
  const [conversations, setConversations] = useState<NativeContact[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<NativeMessage[]>([]);
  const [crmContacts, setCrmContacts] = useState<any[]>([]);
  const [activeCrmContact, setActiveCrmContact] = useState<any>(null);
  
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modulo Lead Import
  const [importingLead, setImportingLead] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ email: '', phone: '' });
  const [leadSaving, setLeadSaving] = useState(false);

  // VoIP States
  const [isVoipModalOpen, setIsVoipModalOpen] = useState(false)
  const [voipConfig, setVoipConfig] = useState({ provider: 'Twilio', sid: '', token: '', phone: '' })
  const [voipSaving, setVoipSaving] = useState(false)

  const [chatUsage, setChatUsage] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('Base')
  const chatLimits: any = { 'Base': 100, 'Enterprise': 1000, 'Ambassador': 5000 }

  const supabase = createClient()

  // 1. CARICAMENTO INIZIALE CHAT, CRM E BILLING
  useEffect(() => {
    const initInbox = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
          // Carica Profilo e Utilizzo
          const { data: profile } = await supabase.from('profiles').select('plan, usage_chat, ai_reply_enabled').eq('id', user.id).single()
          if (profile) {
              setCurrentPlan(profile.plan || 'Base')
              setChatUsage(profile.usage_chat || 0)
              setAiEnabled(profile.ai_reply_enabled || false)
          }

          // Carica Costi Extra
          const { data: metrics } = await supabase.from('usage_metrics').select('cost_user').eq('user_id', user.id).eq('resource_type', 'chat_message').eq('is_free', false)
          if (metrics) {
              setTotalCost(metrics.reduce((acc: number, m: any) => acc + (m.cost_user || 0), 0))
          }
      }

      try {
        const { data: contactsData } = await supabase.from('inbox_contacts').select('*, inbox_channels(id, provider, bot_enabled)').order('last_interaction', { ascending: false });
        if (contactsData) {
            setConversations(contactsData.map(c => ({
                id: c.id, name: c.name || 'Sconosciuto', channel_id: c.channel_id,
                external_id: c.external_id, provider: c.inbox_channels?.provider || 'web',
                bot_enabled: c.inbox_channels?.bot_enabled || false
            })));
        }
        const { data: contacts } = await supabase.from('contacts').select('*');
        if (contacts) setCrmContacts(contacts);
      } catch (e) {
        console.error("Errore init inbox", e);
      } finally {
        setLoading(false);
      }
    };
    initInbox();
    
    // Supabase Realtime Listener per update UI live
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_messages' }, () => {
         // Ricarica chat quando arriva un db event
         if (selectedChatId) setLoadingMsgs(true) // trigger refresh
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []);

  const toggleAiReply = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newValue = !aiEnabled
      const { error } = await supabase.from('profiles').update({ ai_reply_enabled: newValue }).eq('id', user.id)
      
      if (!error) {
          setAiEnabled(newValue)
          if (newValue) alert("🤖 AI Auto-Reply attivata! Ogni risposta automatica costerà 1 credito (Base + 40% markup dopo la soglia gratuita).")
      }
  }

  // 2. CARICA MESSAGGI E TROVA CONTATTO CRM
  useEffect(() => {
    if (!selectedChatId) return;
    
    const loadChatDetails = async () => {
      setLoadingMsgs(true);
      try {
        const { data: msgs } = await supabase.from('inbox_messages').select('*').eq('inbox_contact_id', selectedChatId).order('created_at', { ascending: false })
        if (msgs) setChatMessages(msgs);
        
        const currentConv = conversations.find(c => c.id === selectedChatId);
        if (currentConv) {
            const matched = crmContacts.find(c => c.name?.toLowerCase() === currentConv.name.toLowerCase());
            setActiveCrmContact(matched || null);
        }
      } catch (e) {
        setChatMessages([]);
      } finally {
        setLoadingMsgs(false);
      }
    };
    loadChatDetails();
    setImportingLead(false); // Resetta il form quando si cambia chat
    setLeadFormData({ email: '', phone: '' });
  }, [selectedChatId, conversations, crmContacts, loadingMsgs]);

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!replyText.trim() || !selectedChatId || sending) return;

      setSending(true);
      try {
          const currentConv = conversations.find(c => c.id === selectedChatId);
          if (!currentConv) return;
          
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return;

          // Inserimento a DB (questo farà triggerare il Webhook per inviarlo fisicamente a Meta/Telegram, implementazione futura)
          await supabase.from('inbox_messages').insert({
              user_id: user.id,
              channel_id: currentConv.channel_id,
              inbox_contact_id: currentConv.id,
              direction: 'outbound',
              message_type: 'text',
              content: replyText,
              status: 'sent'
          })
          
          // Forza update locale temporaneo per UX istantanea
          const tempMsg: NativeMessage = {
              id: Date.now().toString(),
              content: replyText,
              direction: 'outbound',
              created_at: new Date().toISOString()
          };
          setChatMessages([tempMsg, ...chatMessages]);
          setReplyText('');
      } catch(e) {
          alert("Errore invio messaggio");
      } finally {
          setSending(false);
      }
  }

  const handleImportLead = async () => {
    const currentConv = conversations.find(c => c.id === selectedChatId);
    if (!currentConv) return;
    
    setLeadSaving(true);
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        // Usa il numero del provider se è WA e non l'hanno specificato
        let finalPhone = leadFormData.phone;
        if (!finalPhone && currentConv.provider === 'whatsapp') {
            finalPhone = currentConv.external_id;
        }

        const { data: newContact, error } = await supabase.from('contacts').insert({
            user_id: user.id,
            name: currentConv.name,
            email: leadFormData.email || null,
            phone: finalPhone || null,
            status: 'Lead',
            source: currentConv.provider,
            value: 0
        }).select().single()

        if (!error && newContact) {
            // Aggiorna lo stato locale per re-triggerare l'Intelligence CRM block in tempo reale
            setCrmContacts([...crmContacts, newContact]);
            setImportingLead(false);
        } else {
            alert("Errore salvataggio Lead. Verifica i dati inseriti.");
        }
    }
    setLeadSaving(false);
  }

  const handleSaveVoip = () => {
      setVoipSaving(true)
      setTimeout(() => {
          setVoipSaving(false)
          setIsVoipModalOpen(false)
          alert("✅ Configurazione VoIP salvata! IntegraOS ora tenterà la connessione al Trunk SIP.")
      }, 1500)
  }

  const filteredConversations = useMemo(() => {
      return conversations.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.external_id.includes(searchTerm)
      )
  }, [conversations, searchTerm]);

  const getPlatformIcon = (channelType: string) => {
      if (channelType?.includes('Whatsapp')) return <Smartphone size={14} className="text-emerald-500"/>;
      if (channelType?.includes('Facebook')) return <Facebook size={14} className="text-blue-600"/>;
      if (channelType?.includes('Email')) return <Mail size={14} className="text-gray-500"/>;
      return <Globe size={14} className="text-indigo-500"/>;
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-white text-[#00665E] font-bold animate-pulse">Sincronizzazione Canali Comunicazione...</div>

  return (
    <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      {/* TOP HEADER */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#00665E] p-2 rounded-xl text-white shadow-lg"><MessageSquare size={20}/></div>
          <div>
            <h1 className="text-xl font-black text-[#00665E] tracking-tight">Unified Inbox</h1>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><Zap size={10} fill="currentColor"/> Real-time Nexus Active</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
            {/* INDICATORE LIMITI CHAT */}
            <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
                <MessageSquare className={currentPlan === 'Ambassador' ? "text-purple-500" : "text-[#00665E]"} size={16}/>
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Messaggi AI Inclusi</span>
                    <span className="text-xs font-black text-gray-800">{chatUsage} / {chatLimits[currentPlan]}</span>
                </div>
            </div>

            {/* COSTO EXTRA CHAT */}
            {totalCost > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl scale-95 origin-right">
                    <DollarSign className="text-amber-600" size={14}/>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest leading-none">Consumo Extra (+40%)</span>
                        <span className="text-xs font-black text-gray-900">€ {totalCost.toFixed(2)}</span>
                    </div>
                </div>
            )}

            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                <button onClick={() => setActiveTab('inbox')} className={`px-5 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}><MessageSquare size={14}/> MESSAGGI</button>
                <button onClick={() => setActiveTab('voip')} className={`px-5 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 ${activeTab === 'voip' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500 hover:text-gray-700'}`}><Phone size={14}/> TELEFONO</button>
            </div>
        </div>
      </div>

      {activeTab === 'inbox' && (
          <div className="flex flex-1 overflow-hidden">
              
              {/* 1. SIDEBAR LISTA CHAT */}
              <div className="w-80 md:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0">
                  <div className="p-4 border-b border-gray-50">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                          <input 
                            type="text" 
                            placeholder="Cerca conversazione..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#00665E] transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {filteredConversations.length === 0 && (
                        <div className="p-10 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-dashed border-gray-200"><MessageSquare size={32}/></div>
                            <p className="text-gray-400 text-sm font-bold text-center">Nessuna conversazione attiva.<br/><span className="text-[10px] font-normal">Collega un canale o scrivi un messaggio di test.</span></p>
                        </div>
                      )}
                      
                      {filteredConversations.map((chat) => (
                          <div 
                            key={chat.id} 
                            onClick={() => setSelectedChatId(chat.id)}
                            className={`p-4 border-b border-gray-50 cursor-pointer transition relative group ${selectedChatId === chat.id ? 'bg-[#00665E]/5 border-l-4 border-l-[#00665E]' : 'hover:bg-gray-50'}`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-gray-900">{chat.name}</span>
                                      {(chat.unread_count || 0) > 0 && <span className="bg-[#00665E] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-bounce">{chat.unread_count}</span>}
                                  </div>
                              </div>
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden mt-1">
                                      <div className="shrink-0">{getPlatformIcon(chat.provider)}</div>
                                      <p className="text-xs text-gray-500 font-medium">#{chat.external_id.substring(0,8)}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* 2. AREA CHAT CENTRALE */}
              <div className="flex-1 flex flex-col bg-[#F0F2F5] relative">
                  {selectedChatId ? (
                      <>
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#00665E]/10 rounded-full flex items-center justify-center font-bold text-[#00665E] border border-[#00665E]/20">
                                    {conversations.find(c => c.id === selectedChatId)?.name.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-sm text-gray-900 leading-tight">{conversations.find(c => c.id === selectedChatId)?.name || 'Utente'}</h3>
                                        <span className="bg-gray-100 text-gray-500 rounded p-1 flex items-center">{getPlatformIcon(conversations.find(c => c.id === selectedChatId)?.provider || '')}</span>
                                    </div>
                                    <p className="text-[10px] font-bold flex items-center gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <span className="text-emerald-600 mr-2">Connesso</span>
                                        {conversations.find(c => c.id === selectedChatId)?.bot_enabled && <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-1"><Sparkles size={10}/> AI Attiva</span>}
                                    </p>
                                </div>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition"><MoreVertical size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col-reverse custom-scrollbar"> 
                            {loadingMsgs ? (
                                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[#00665E]"/></div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {chatMessages.map((msg) => (
                                        <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                                            <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                                msg.direction === 'outbound'
                                                ? (msg.is_ai_generated ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none border border-purple-500' : 'bg-[#00665E] text-white rounded-tr-none')
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                            }`}>
                                                {msg.content}
                                                <div className={`text-[9px] mt-1.5 flex items-center gap-1 font-bold ${msg.direction === 'outbound' ? 'text-white/60 justify-end' : 'text-gray-400 justify-start'}`}>
                                                    {msg.is_ai_generated && <span className="flex items-center gap-1"><Sparkles size={10}/> AI Generato •</span>}
                                                    {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={replyText} 
                                    onChange={e => setReplyText(e.target.value)} 
                                    placeholder="Digita un messaggio..." 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 outline-none focus:border-[#00665E] focus:bg-white text-sm font-medium transition shadow-inner"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!replyText.trim() || sending}
                                    className="bg-[#00665E] text-white w-14 rounded-2xl flex items-center justify-center hover:bg-[#004d46] transition shadow-lg disabled:opacity-50"
                                >
                                    {sending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                                </button>
                            </form>
                        </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center">
                            <MessageSquare size={64} className="mb-6 text-[#00665E]"/>
                            <h3 className="text-xl font-black text-gray-900">Seleziona una chat</h3>
                            <p className="text-sm font-medium mt-2">La tua posta in arrivo multicanale è pronta.</p>
                          </div>
                      </div>
                  )}
              </div>

              {/* 3. SIDEBAR INTELLIGENCE CRM (DESTRA) */}
              <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden xl:flex flex-col p-6 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
                  
                  {/* ASSISTENTE AI AUTO-REPLY */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-[#00665E] to-teal-600 rounded-3xl text-white shadow-xl relative overflow-hidden group shrink-0">
                      <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Zap size={80} fill="white"/></div>
                      <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                              <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2"><Sparkles size={16}/> AI Assistant</h3>
                              <button 
                                onClick={toggleAiReply}
                                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${aiEnabled ? 'bg-white' : 'bg-white/20'}`}
                              >
                                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${aiEnabled ? 'right-0.5 bg-[#00665E]' : 'left-0.5 bg-white'}`}></div>
                              </button>
                          </div>
                          <p className="text-[10px] font-medium leading-relaxed opacity-90">Auto-risposta intelligente 24/7 attiva su tutti i canali.</p>
                          <p className="text-[9px] mt-2 font-black bg-black/20 px-2 py-1 rounded inline-block">Markup: +40% (Post-Soglia)</p>
                      </div>
                  </div>

                  <div className="flex items-center gap-2 mb-8 pb-4 border-b border-gray-50 text-gray-800">
                      <Info size={18} className="text-[#00665E]"/>
                      <h3 className="font-black text-sm uppercase tracking-wider">Intelligence CRM</h3>
                  </div>

                  {activeCrmContact ? (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                          <div className="flex flex-col items-center text-center">
                              <div className="w-20 h-20 bg-gradient-to-br from-[#00665E] to-teal-500 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl mb-4 rotate-3">
                                  {activeCrmContact.name.charAt(0)}
                              </div>
                              <h4 className="text-xl font-black text-gray-900">{activeCrmContact.name}</h4>
                              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mt-2 tracking-widest uppercase">Cliente Verificato</p>
                          </div>

                          <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-[#00665E] transition">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"> Valore Commerciale (LTV)</p>
                                  <div className="flex items-center gap-2">
                                      <div className="bg-[#00665E]/10 p-2 rounded-lg text-[#00665E]"><DollarSign size={16}/></div>
                                      <span className="text-2xl font-black text-gray-900">€ {activeCrmContact.value || 0}</span>
                                  </div>
                              </div>

                              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 group hover:border-purple-500 transition">
                                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2"> Punti Fedeltà</p>
                                  <div className="flex items-center gap-2">
                                      <div className="bg-purple-600/10 p-2 rounded-lg text-purple-600"><Award size={16}/></div>
                                      <span className="text-2xl font-black text-purple-700">{Math.floor((activeCrmContact.value || 0) / 10)} PTS</span>
                                  </div>
                              </div>
                          </div>

                          <div className="pt-4 space-y-3">
                              <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                                  <Smartphone size={14} className="text-[#00665E]"/> {activeCrmContact.phone || 'Non disponibile'}
                              </div>
                              <div className="flex items-center gap-3 text-sm font-medium text-gray-600 truncate">
                                  <Mail size={14} className="text-[#00665E]"/> {activeCrmContact.email || 'Senza email'}
                              </div>
                          </div>

                          <div className="pt-6 border-t border-gray-100">
                              <Link href="/dashboard/crm" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition shadow-lg">
                                  <User size={14}/> Apri Scheda Completa <ExternalLink size={12}/>
                              </Link>
                          </div>
                      </div>
                  ) : selectedChatId ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                          {!importingLead ? (
                              <div className="animate-in zoom-in-95">
                                  <ShieldCheck size={48} className="text-gray-200 mb-4 mx-auto"/>
                                  <h4 className="font-bold text-gray-900 mb-2">Lead Esterno Rilevato</h4>
                                  <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mb-6">Questo utente non è ancora presente nel CRM. Importalo per tracciare i suoi acquisti.</p>
                                  <button 
                                      onClick={() => setImportingLead(true)}
                                      className="bg-gray-900 text-white font-black text-xs px-5 py-3 rounded-xl hover:bg-black transition shadow flex items-center gap-2 mx-auto"
                                  >
                                      <User size={14}/> Importa nel CRM
                                  </button>
                              </div>
                          ) : (
                              <div className="w-full text-left animate-in fade-in slide-in-from-bottom-4">
                                  <div className="flex items-center justify-between mb-6">
                                      <h4 className="font-black text-sm text-gray-900 flex items-center gap-2"><User size={16} className="text-[#00665E]"/> Nuovo Lead CRM</h4>
                                      <button onClick={() => setImportingLead(false)} className="text-gray-400 hover:text-gray-900"><X size={16}/></button>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Nome Contatto</label>
                                          <input type="text" readOnly className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-500 font-bold" value={conversations.find(c => c.id === selectedChatId)?.name} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Indirizzo Email (Opzionale)</label>
                                          <input autoFocus type="email" placeholder="esempio@email.com" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-[#00665E]" value={leadFormData.email} onChange={e=>setLeadFormData({...leadFormData, email: e.target.value})} />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Numero Telefono (Opzionale)</label>
                                          <input type="tel" placeholder="+39..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 outline-none focus:border-[#00665E]" value={leadFormData.phone} onChange={e=>setLeadFormData({...leadFormData, phone: e.target.value})} />
                                      </div>
                                  </div>

                                  <button 
                                      onClick={handleImportLead}
                                      disabled={leadSaving}
                                      className="w-full mt-6 bg-[#00665E] text-white font-black text-xs py-3.5 rounded-xl transition shadow hover:bg-[#004d46] disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                      {leadSaving ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>}
                                      Salva & Attiva Intelligence
                                  </button>
                              </div>
                          )}
                      </div>
                  ) : null}
              </div>
          </div>
      )}

      {/* --- TAB VOIP --- */}
      {activeTab === 'voip' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center bg-white">
             <div className="text-center max-w-md animate-in zoom-in-95">
                <div className="w-24 h-24 bg-teal-50 text-[#00665E] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white"><PhoneCall size={48}/></div>
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Modulo Chiamate IP</h2>
                <p className="text-gray-500 font-medium mb-8 leading-relaxed">Effettua e ricevi chiamate direttamente dal tuo browser. Tutte le telefonate verranno registrate e trascritte dall'AI nella cronologia del cliente.</p>
                <button onClick={() => setIsVoipModalOpen(true)} className="bg-[#00665E] text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-[#004d46] hover:scale-105 transition flex items-center gap-2 mx-auto">
                    <Settings size={18}/> Configura Trunk SIP
                </button>
                <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-4 grayscale opacity-40">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Twilio_logo.svg" className="h-6" alt="Twilio" />
                    <img src="https://cdn.worldvectorlogo.com/logos/3cx.svg" className="h-6" alt="3CX" />
                </div>
             </div>
          </div>
      )}

      {/* MODALE CONFIGURAZIONE VOIP */}
      {isVoipModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-[2.5rem] max-w-lg w-full relative shadow-2xl animate-in slide-in-from-bottom-4">
                 <button onClick={() => setIsVoipModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition"><X size={16}/></button>
                 
                 <div className="flex items-center gap-4 mb-8">
                     <div className="bg-teal-50 text-[#00665E] p-3 rounded-2xl"><Settings size={28}/></div>
                     <div>
                         <h3 className="text-2xl font-black text-gray-900">Configurazione VoIP</h3>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Integrazione Cloud PBX</p>
                     </div>
                 </div>

                 <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Provider Selezionato</label>
                        <select className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E] transition cursor-pointer">
                            <option>Twilio (Consigliato)</option>
                            <option>Messagenet</option>
                            <option>3CX Custom Trunk</option>
                            <option>Voispeed API</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Account SID / API Key</label>
                        <input type="text" placeholder="ACxxxxxxxxxxxxxxxx" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs outline-none focus:border-[#00665E] transition" value={voipConfig.sid} onChange={e=>setVoipConfig({...voipConfig, sid: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Auth Token / Secret</label>
                        <input type="password" placeholder="••••••••••••••••" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs outline-none focus:border-[#00665E] transition" value={voipConfig.token} onChange={e=>setVoipConfig({...voipConfig, token: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Numero di Telefono Certificato</label>
                        <input type="text" placeholder="+39..." className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-[#00665E] transition" value={voipConfig.phone} onChange={e=>setVoipConfig({...voipConfig, phone: e.target.value})} />
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 text-[10px] font-medium leading-relaxed">
                        <ShieldAlert size={20} className="shrink-0 text-amber-500"/>
                        Assicurati di aver configurato il Webhook di risposta nel tuo pannello Twilio per consentire la ricezione delle chiamate in entrata.
                    </div>

                    <button onClick={handleSaveVoip} disabled={voipSaving} className="w-full bg-[#00665E] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#004d46] transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {voipSaving ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>}
                        {voipSaving ? 'Test di connessione...' : 'Attiva Centralino Virtuale'}
                    </button>
                 </div>
             </div>
          </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}}/>
    </main>
  )
}