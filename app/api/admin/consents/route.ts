import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Lista di tutti i consensi privacy
export async function GET() {
    try {
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('privacy_consents')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        const stats = {
            total: data?.length || 0,
            marketing_yes: data?.filter(c => c.accepted_marketing).length || 0,
            this_month: data?.filter(c => {
                const d = new Date(c.created_at)
                const now = new Date()
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length || 0,
        }

        return NextResponse.json({ consents: data || [], stats })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Registra un nuovo consenso (chiamato dalla landing page / signup)
export async function POST(req: Request) {
    try {
        const supabase = getAdminClient()
        const body = await req.json()
        const { email, full_name, user_id, accepted_marketing, consent_version, ip_address } = body

        if (!email) return NextResponse.json({ error: 'Email obbligatoria' }, { status: 400 })

        // Evita duplicati per email
        const { data: existing } = await supabase
            .from('privacy_consents')
            .select('id')
            .eq('email', email)
            .single()

        if (existing) {
            // Aggiorna il consenso esistente
            const { data, error } = await supabase
                .from('privacy_consents')
                .update({ accepted_marketing: !!accepted_marketing, consent_version: consent_version || '1.0' })
                .eq('email', email)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ consent: data, updated: true })
        }

        const { data, error } = await supabase
            .from('privacy_consents')
            .insert({ email, full_name, user_id, accepted_marketing: !!accepted_marketing, consent_version: consent_version || '1.0', ip_address })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ consent: data, updated: false })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
