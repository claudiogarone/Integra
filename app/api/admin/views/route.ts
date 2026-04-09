import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Statistiche visualizzazioni per pagina e sezione
export async function GET(req: Request) {
    try {
        const supabase = getAdminClient()
        const { searchParams } = new URL(req.url)
        const days = parseInt(searchParams.get('days') || '30')

        const since = new Date()
        since.setDate(since.getDate() - days)

        const { data: views, error } = await supabase
            .from('page_views')
            .select('*')
            .gte('viewed_at', since.toISOString())
            .order('viewed_at', { ascending: false })

        if (error) throw error

        // Aggregazione per pagina
        const byPage: Record<string, number> = {}
        const bySection: Record<string, number> = {}
        const byDay: Record<string, number> = {}
        let uniqueUsers = new Set<string>()

        views?.forEach(v => {
            byPage[v.page] = (byPage[v.page] || 0) + 1
            if (v.section) bySection[v.section] = (bySection[v.section] || 0) + 1
            const day = new Date(v.viewed_at).toLocaleDateString('it-IT')
            byDay[day] = (byDay[day] || 0) + 1
            if (v.user_id) uniqueUsers.add(v.user_id)
            if (v.session_id) uniqueUsers.add(v.session_id)
        })

        // Trend ultimi 7 giorni
        const last7 = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toLocaleDateString('it-IT')
            last7.push({ day: key, views: byDay[key] || 0 })
        }

        return NextResponse.json({
            total_views: views?.length || 0,
            unique_visitors: uniqueUsers.size,
            by_page: Object.entries(byPage).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count),
            by_section: Object.entries(bySection).map(([section, count]) => ({ section, count })).sort((a, b) => b.count - a.count),
            last7_trend: last7,
            recent: views?.slice(0, 50) || []
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Traccia una visualizzazione (chiamato dai clienti che visitano le pagine)
export async function POST(req: Request) {
    try {
        const supabase = getAdminClient()
        const body = await req.json()
        const { page, section, user_id, user_email, session_id, referrer } = body

        if (!page) return NextResponse.json({ error: 'page field required' }, { status: 400 })

        const { error } = await supabase
            .from('page_views')
            .insert({ page, section, user_id, user_email, session_id, referrer })

        if (error) throw error
        return NextResponse.json({ tracked: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
