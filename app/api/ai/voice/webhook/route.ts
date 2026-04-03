import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { trackUsage } from '@/utils/billing'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        
        // Esempio evento da Vapi o Twilio: call.ended
        if (body.type !== 'call_ended' && body.event !== 'call.completed') {
            return NextResponse.json({ ok: true })
        }

        // Estrazione dati: durata in secondi
        const durationSeconds = body.duration_seconds || body.call_duration || 0
        const durationMinutes = Math.ceil(durationSeconds / 60)
        
        // Identifica l'azienda associata (tenant_id)
        const tenantId = body.assistant_id || body.to // In produzione mappare id assistente a user_id
        
        const supabase = await createClient()
        // Recupera user_id dal database in base all'assistente
        const { data: assistant } = await supabase.from('voice_assistants').select('user_id').eq('external_id', tenantId).single()

        if (assistant && durationMinutes > 0) {
            // Fatturazione minuti (Markup 40% gi\u00e0 incluso in trackUsage)
            await trackUsage(assistant.user_id, 'voice_min', durationMinutes)
        }

        return NextResponse.json({ success: true, min_billed: durationMinutes })

    } catch (error: any) {
        console.error("\u274c VOICE BILLING ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
