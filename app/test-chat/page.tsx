'use client'

import { useEffect } from 'react'

export default function TestChatPage() {
  useEffect(() => {
    // Inseriamo il widget di Chatwoot in modo nativo su React con il tuo Token
    (function(d,t) {
      var BASE_URL="https://chat-web.server.integraos.tech";
      var g=d.createElement(t) as any,s=d.getElementsByTagName(t)[0];
      g.src=BASE_URL+"/packs/js/sdk.js";
      g.defer = true;
      g.async = true;
      s.parentNode?.insertBefore(g,s);
      g.onload=function(){
        (window as any).chatwootSDK.run({
          websiteToken: 'QfCWPNQx6JJDMfW9pDi5xakX',
          baseUrl: BASE_URL
        })
      }
    })(document,"script");
  }, [])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] text-gray-800 font-sans">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-200">
          <div className="w-20 h-20 bg-[#00665E] text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg animate-bounce">💬</div>
          <h1 className="text-3xl font-black text-[#00665E] mb-2">Simulatore Sito Web</h1>
          <p className="text-gray-500 font-medium mb-8">Usa la nuvoletta in basso a destra per simulare un cliente.</p>
          <p className="text-sm bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-bold">
             ✅ Essendo su localhost, Chrome permetterà alla chat di inviare i messaggi!
          </p>
      </div>
    </div>
  )
}