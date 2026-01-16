'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'

// Tipi simulati per i messaggi
type Message = {
  id: number,
  sender: string,
  platform: 'whatsapp' | 'facebook' | 'instagram' | 'email' | 'telegram' | 'sms',
  text: string,
  time: string,
  read: boolean,
  avatar?: string
}

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'voip'>('inbox')
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isCalling, setIsCalling] = useState(false)
  
  // Simulazione Dati (In produzione questi arriverebbero via API da Chatwoot/Evolution)
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'Mario Rossi', platform: 'whatsapp', text: 'Salve, vorrei info sul preventivo.', time: '10:30', read: false },
    { id: 2, sender: 'Giulia Bianchi', platform: 'instagram', text: 'Avete taglie disponibili?', time: '09:15', read: true },
    { id: 3, sender: 'luca.verdi@gmail.com', platform: 'email', text: 'Richiesta supporto tecnico urgente.', time: 'Ieri', read: true },
    { id: 4, sender: 'Marco Neri', platform: 'telegram', text: 'Posso prenotare per domani?', time: 'Ieri', read: true },
  ])

  // Chat History simulata per la chat selezionata
  const [chatHistory, setChatHistory] = useState([
      { sender: 'user', text: 'Salve, vorrei info sul preventivo.' },
  ])

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'whatsapp': return '🟢';
          case 'facebook': return '🔵';
          case 'instagram': return '🟣';
          case 'telegram': return '✈️';
          case 'email': return '✉️';
          case 'sms': return '📱';
          default: return '💬';
      }
  }

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault()
      if(!replyText.trim()) return
      setChatHistory([...chatHistory, { sender: 'me', text: replyText }])
      setReplyText('')
      // Qui faresti la chiamata API al tuo server Chatwoot/Evolution
  }

  // --- VOIP LOGIC (Simulazione Jitsi) ---
  const startCall = () => {
      setIsCalling(true)
      // In produzione: window.open(`https://meet.jit.si/IntegraCall-${Math.random()}`, '_blank')
  }

  return (
    <main className="flex-1 overflow-hidden bg-[#F8FAFC] text-gray-900 font-sans h-screen flex flex-col">
      
      {/* HEADER */}
      <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#00665E] tracking-tight">Unified Inbox & VoIP</h1>
          <p className="text-gray-500 text-xs mt-1">Tutti i messaggi dei clienti in un unico posto.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('inbox')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'inbox' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>💬 Messaggi</button>
            <button onClick={() => setActiveTab('voip')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'voip' ? 'bg-white shadow text-[#00665E]' : 'text-gray-500'}`}>📞 Telefono / VoIP</button>
        </div>
      </div>

      {/* --- TAB MESSAGGI --- */}
      {activeTab === 'inbox' && (
          <div className="flex flex-1 overflow-hidden">
              
              {/* SIDEBAR LISTA CHAT */}
              <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                  {messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        onClick={() => { setSelectedChat(msg.id); setChatHistory([{sender: 'user', text: msg.text}]) }}
                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${selectedChat === msg.id ? 'bg-[#00665E]/5 border-l-4 border-l-[#00665E]' : ''}`}
                      >
                          <div className="flex justify-between mb-1">
                              <span className="font-bold text-sm text-gray-800">{msg.sender}</span>
                              <span className="text-[10px] text-gray-400">{msg.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-lg">{getPlatformIcon(msg.platform)}</span>
                              <p className={`text-xs truncate ${!msg.read ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{msg.text}</p>
                          </div>
                      </div>
                  ))}
              </div>

              {/* AREA CHAT */}
              <div className="flex-1 flex flex-col bg-[#F0F2F5]">
                  {selectedChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                {getPlatformIcon(messages.find(m => m.id === selectedChat)?.platform || '')} 
                                {messages.find(m => m.id === selectedChat)?.sender}
                            </h3>
                            <button className="text-xs bg-gray-100 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-200">Chiudi Ticket</button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {chatHistory.map((chat, idx) => (
                                <div key={idx} className={`flex ${chat.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${
                                        chat.sender === 'me' 
                                        ? 'bg-[#00665E] text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none'
                                    }`}>
                                        {chat.text}
                                    </div>
                                </div>
                            ))}
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
                          <p>Seleziona una conversazione per iniziare.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- TAB VOIP --- */}
      {activeTab === 'voip' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 max-w-md w-full text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">
                      📞
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">Web Phone</h2>
                  <p className="text-gray-500 text-sm mb-8">Effettua chiamate HD gratuite verso altri utenti Integra.</p>

                  {isCalling ? (
                      <div className="space-y-4">
                          <p className="text-green-600 font-bold animate-pulse">Chiamata in corso...</p>
                          <div className="h-64 bg-black rounded-xl flex items-center justify-center text-white relative overflow-hidden">
                              {/* Placeholder video Jitsi */}
                              <span className="z-10">Connessione Video Sicura</span>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          </div>
                          <button onClick={() => setIsCalling(false)} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30">
                              Termina Chiamata
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <input type="text" placeholder="Inserisci ID o Email utente..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:border-[#00665E] text-center" />
                          <button onClick={startCall} className="w-full bg-[#00665E] text-white font-bold py-3 rounded-xl hover:bg-[#004d46] shadow-lg shadow-[#00665E]/20 transition flex items-center justify-center gap-2">
                              Avvia Chiamata VoIP
                          </button>
                          <p className="text-[10px] text-gray-400 mt-4">
                              Powered by Jitsi / WebRTC (Gratuito & Sicuro)
                          </p>
                      </div>
                  )}
              </div>
          </div>
      )}

    </main>
  )
}