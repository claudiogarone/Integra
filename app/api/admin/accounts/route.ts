import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
    try {
        const supabase = getAdminClient()

        // Source primaria: auth.admin.listUsers (ha sempre email + created_at)
        let authUsers: any[] = []
        try {
            const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
            if (authData?.users) authUsers = authData.users
        } catch { /* continua senza dati auth */ }

        // Arricchimento: profili dal DB (plan, company_name, role, etc.)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, plan, company_name, full_name, role, subscription_status, updated_at')

        const profilesMap: Record<string, any> = {}
        profiles?.forEach((p: any) => { profilesMap[p.id] = p })

        // Merge: auth come base, profilo come enrichment
        const enriched = authUsers.map((au: any) => {
            const p = profilesMap[au.id] || {}
            return {
                id: au.id,
                email: au.email,
                email_confirmed: !!au.email_confirmed_at,
                last_sign_in: au.last_sign_in_at,
                created_at_auth: au.created_at,
                plan: p.plan || 'Base',
                company_name: p.company_name || '',
                full_name: p.full_name || '',
                role: p.role || 'user',
                subscription_status: p.subscription_status || 'active',
                updated_at: p.updated_at || au.created_at,
            }
        }).sort((a: any, b: any) => new Date(b.created_at_auth).getTime() - new Date(a.created_at_auth).getTime())

        const now = new Date()
        const stats = {
            total: enriched.length,
            active_this_month: enriched.filter((u: any) => {
                const d = new Date(u.created_at_auth)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length,
            by_plan: enriched.reduce((acc: any, u: any) => {
                const plan = u.plan || 'Base'; acc[plan] = (acc[plan] || 0) + 1; return acc
            }, {}),
            new_today: enriched.filter((u: any) => new Date(u.created_at_auth).toDateString() === now.toDateString()).length,
        }

        return NextResponse.json({ accounts: enriched, stats })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
