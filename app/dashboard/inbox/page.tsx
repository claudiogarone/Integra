'use client'

import { useEffect, useState } from 'react'
import { getConversations, getMessages, sendMessage } from '@/app/actions/chatwoot'

// Tipi reali di Chatwoot
type ChatwootConversation = {
  id: number;
  meta: {
    sender: {
      name: string;
      thumbnail?: string;
    };
  };
  messages: Array<{ content: string; created_at: number }>;
  channel: string; // "Channel::WebWidget", "Channel::Whatsapp", etc.
  unread_count: number;
};

type ChatwootMessage = {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing' | 'template'; // incoming = cliente, outgoing = noi
  created_at: number;
  sender?: { name: string };
};

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'voip'>('inbox')
  
  // STATO REALE
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatwootMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  // VOIP STATE
  const [isCalling, setIsCalling] = useState(false);

  // 1. CARICA LE CONVERSAZIONI ALL'AVVIO
  useEffect(() => {
    async function loadChats() {
      try {
        const data = await getConversations();
        // @ts-ignore
        if (Array.isArray(data)) {
             setConversations(data);
        } else {
             setConversations([]);
        }
      } catch (e) {
        console.error("Errore caricamento chat", e);
        setConversations([]);
      }
    }
    loadChats();
    
    // Refresh automatico ogni 10 secondi
    const interval = setInterval(loadChats, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. CARICA I MESSAGGI QUANDO CLICCHI UNA CHAT
  useEffect(() => {
    if (!selectedChatId) return;
    
    async function loadMsgs() {
      setLoading(true);
      try {
        const msgs = await getMessages(selectedChatId!);
        // @ts-ignore
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      } catch (e) {
        setChatMessages([]);
      }
      setLoading(false);
    }
    loadMsgs();
  }, [selectedChatId]);


  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!replyText.trim() || !selectedChatId) return;

      // Invia al server
      await sendMessage(selectedChatId, replyText);

      // Aggiorna la UI subito (Optimistic UI)
      const tempMsg: ChatwootMessage = {
          id: Date.now(),
          content: replyText,
          message_type: 'outgoing',
          created_at: Date.now() / 1000
      };
      setChatMessages([...chatMessages, tempMsg]);
      setReplyText('');
  }

  // Helper per l'icona
  const getPlatformIcon = (channelType: string) => {
      if (channelType?.includes('Whatsapp')) return '🟢';
      if (channelType?.includes('Facebook')) return '🔵';
      if (channelType?.includes('Email')) return '✉️';
      if (channelType?.includes('Telegram')) return '✈️';
      return '💬'; // Web Widget default
  }

  return (
    <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          {/* ERRORE CORRETTO QUI SOTTO: Ho chiuso il tag h1 e messo parentesi tonde */}
          <h1 className="text-2xl font-black text-[#00665E] tracking-tight">Unified Inbox (AGGIORNATO)</h1>
          <p className="text-gray-500 text-xs mt-1">Chatwoot Connected ✅</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'inbox' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>💬 Messaggi</button>
            <button onClick={() => setActiveTab('voip')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'voip' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>📞 Telefono</button>
        </div>
      </div>

      {/* --- TAB MESSAGGI --- */}
      {activeTab === 'inbox' && (
          <div className="flex flex-1 overflow-hidden">
              
              {/* SIDEBAR LISTA CHAT */}
              <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                  {conversations.length === 0 && (
                    <div className="p-10 text-center text-gray-400 text-sm">
                        <p>Caricamento chat...</p>
                        <p className="text-xs mt-2 text-gray-300">(Se rimane così, scrivi un messaggio dal sito pubblico)</p>
                    </div>
                  )}
                  
                  {conversations.map((chat) => (
                      <div 
                        key={chat.id} 
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${selectedChatId === chat.id ? 'bg-[#00665E]/5 border-l-4 border-l-[#00665E]' : ''}`}
                      >
                          <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm text-gray-800">{chat.meta?.sender?.name || "Utente"}</span>
                              <span className="text-[10px] text-gray-400">ID: {chat.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-lg">{getPlatformIcon(chat.channel)}</span>
                              <p className="text-xs truncate text-gray-500">
                                {chat.messages && chat.messages.length > 0 
                                    ? chat.messages[chat.messages.length -1].content 
                                    : "Nessun messaggio"}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* AREA CHAT */}
              <div className="flex-1 flex flex-col bg-[#F0F2F5]">
                  {selectedChatId ? (
                      <>
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse"> 
                           <div className="flex flex-col gap-4">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.message_type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${
                                        msg.message_type === 'outgoing'
                                        ? 'bg-[#00665E] text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none'
                                    }`}>
                                            {msg.content}
                                    </div>
                                </div>
                            ))}
                           </div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                            <input 
                                type="text" 
                                value={replyText} 
                                onChange={e => setReplyText(e.target.value)} 
                                placeholder="Scrivi una risposta..." 
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#00665E] text-sm"
                            />
                            <button type="submit" className="bg-[#00665E] text-white w-12 rounded-xl flex items-center justify-center hover:bg-[#004d46] transition">➤</button>
                        </form>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                          <span className="text-6xl mb-4">📬</span>
                          <p>Seleziona una conversazione vera.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- TAB VOIP --- */}
      {activeTab === 'voip' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
             <div className="text-center">
                <h2 className="text-xl font-bold">Modulo VoIP</h2>
                <p>Integrazione Twilio in arrivo...</p>
             </div>
          </div>
      )}

    </main>
  )
}