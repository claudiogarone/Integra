import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { trackUsage } from '@/utils/billing'

// Questo end-point riceve comunicazioni da piattaforme esterne come Vapi.ai o Twilio
// ed è in grado di avviare una chiamata, o gestirne la conclusione (trascrizioni e costi)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { message, call } = body // Struttura tipica dei webhook Vapi.ai

        // IMPORTANTE: Bypassiamo RLS perché riceve il webhook da server a server
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // CASO 1: Vapi ci chiede le istruzioni custom in diretta all'avvio della chiamata (Assistant Request)
        if (message?.type === 'assistant-request') {
            const customerPhone = call?.customer?.number
            
            // Cerchiamo a quale Tenant (Azienda) appartiene questa chiamata tramite qualche tag o caller_id
            // Per ora mandiamo il prompt generico salvato. Potremmo anche leggere la riga CRM per personalizzazioni!
            return NextResponse.json({
                assistant: {
                    model: { provider: "google", model: "gemini-1.5-flash" },
                    voice: { provider: "11labs", voiceId: "it_alessandro" }, // Esempio Voce Italiana
                    // Possiamo iniettare contesto real-time dal nostro DB
                    firstMessage: "Pronto?",
                }
            })
        }

        // CASO 2: La Chiamata AI si è conclusa (End of Call Report)
        if (message?.type === 'end-of-call-report') {
            const transcript = message.artifact?.transcript || ''
            const callSummary = message.artifact?.summary || ''
            const VapiCallId = message.call?.id
            const phoneNumber = message.call?.customer?.number
            const durationMinutes = (message.call?.endedAt && message.call?.startedAt) 
                ? (new Date(message.call.endedAt).getTime() - new Date(message.call.startedAt).getTime()) / 60000 
                : 0
            
            // Identifichiamo il tenant IntegraOS proprietario (usualmente inserito da noi nei Vapi tags quando lanciamo la call)
            const tenantUserId = message.call?.customer?.metadata?.user_id
            const crmContactId = message.call?.customer?.metadata?.contact_id

            if (tenantUserId) {
                // 1. Scaliamo il costo usando utils/billing.ts! Se dura 2 minuti, track(2).
                if (durationMinutes > 0) {
                   await trackUsage(tenantUserId, 'voice_min_ai', durationMinutes, supabase)
                }

                // 2. Salviamo il LOG della conversazione per farla rileggere all'azienda
                await supabase.from('voice_logs').insert({
                    user_id: tenantUserId,
                    contact_id: crmContactId || null,
                    phone_number: phoneNumber || 'Sconosciuto',
                    direction: 'outbound',
                    status: 'completed',
                    duration_minutes: durationMinutes,
                    transcript: transcript,
                    summary: callSummary,
                    call_id: VapiCallId
                })
            }

            return NextResponse.json({ success: true, logged: true })
        }

        // Se arriva un evento sconosciuto, ignoriamo
        return NextResponse.json({ status: 'ignored' })

    } catch (err: any) {
        console.error("[VOICE WEBHOOK ERROR]", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
