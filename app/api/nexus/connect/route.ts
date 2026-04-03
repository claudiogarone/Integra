import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const { app_id, target_id, settings } = await req.json()
        
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Salva o aggiorna l'integrazione
        // In un sistema reale, qui verificheremmo l'API Key fornita in settings.
        const { data, error } = await supabase.from('integrations').upsert({
            user_id: user.id,
            app_id,
            target_id,
            settings: settings || {},
            status: 'active',
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,app_id,target_id' }).select().single()

        if (error) throw error

        return NextResponse.json({ success: true, data })

    } catch (error: any) {
        console.error("❌ NEXUS CONNECT ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
