import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('company_name, social_links')
  
  const profile = profiles?.find(p => {
    const qrs = p.social_links?.custom_qrs || []
    return qrs.some((q: any) => q.id === params.id)
  })

  const qr = profile?.social_links?.custom_qrs?.find((q: any) => q.id === params.id)

  return {
    title: qr ? `${qr.label} — ${profile?.company_name}` : 'QR Code',
    description: qr?.description || 'Scansiona questo codice QR per accedere al contenuto.',
  }
}

export default async function QRLandingPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Cerca in tutti i profili quale ha il QR con questo ID
  const { data: profiles } = await supabase
    .from('profiles')
    .select('company_name, logo_url, city, whatsapp_number, social_links, website')

  let targetQR: any = null
  let targetProfile: any = null

  for (const profile of (profiles || [])) {
    const qrs = profile.social_links?.custom_qrs || []
    const found = qrs.find((q: any) => q.id === params.id)
    if (found) {
      targetQR = found
      targetProfile = profile
      break
    }
  }

  if (!targetQR) notFound()

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetQR.url)}`

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-[#00443d] to-slate-900 flex items-center justify-center p-4 font-sans">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00665E]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Card principale */}
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Header azienda */}
          <div className="bg-white/5 border-b border-white/10 p-8 flex flex-col items-center text-center">
            {targetProfile?.logo_url ? (
              <img 
                src={targetProfile.logo_url} 
                alt={targetProfile.company_name}
                className="h-16 object-contain mb-4 drop-shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg">
                🏢
              </div>
            )}
            <h2 className="text-white font-black text-xl tracking-tight">
              {targetProfile?.company_name || 'La Nostra Azienda'}
            </h2>
            {targetProfile?.city && (
              <p className="text-white/60 text-sm font-medium mt-1">📍 {targetProfile.city}</p>
            )}
          </div>

          {/* Corpo con QR e descrizione */}
          <div className="p-8 flex flex-col items-center text-center gap-6">
            
            <div>
              <h1 className="text-white font-black text-2xl mb-2">{targetQR.label}</h1>
              {targetQR.description && (
                <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                  {targetQR.description}
                </p>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-3xl shadow-2xl">
              <img 
                src={qrImageUrl} 
                alt={targetQR.label}
                className="w-56 h-56 object-contain"
              />
            </div>

            {/* CTA Button */}
            <a
              href={targetQR.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#00665E] hover:bg-[#004d46] text-white font-black py-4 rounded-2xl transition shadow-xl shadow-black/30 flex items-center justify-center gap-2 text-sm"
            >
              🔗 Vai al Contenuto
            </a>

            {/* Download QR */}
            <a
              href={`${qrImageUrl}&format=png`}
              download={`qr-${targetQR.label}.png`}
              className="text-white/50 hover:text-white/80 text-xs font-medium transition"
            >
              Scarica il QR in alta risoluzione
            </a>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-4 text-center">
            <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase">
              Powered by IntegraOS
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
