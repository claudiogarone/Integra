import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        )

        // 1. Recupera Transazioni Recenti
        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false })
            .limit(50)

        if (txError) throw txError

        // 2. Recupera KPI Caricati
        const { data: kpis, error: kpiError } = await supabase
            .from('kpi_financials')
            .select('*')
            .order('month_year', { ascending: false })
            .limit(12)

        if (kpiError) throw kpiError

        // 3. Recupera Metriche Esterne (Ads, Meteo, ISTAT)
        const { data: metrics, error: metricsError } = await supabase
            .from('marketing_metrics')
            .select('*')
            .order('date', { ascending: false })
            .limit(100)

        if (metricsError) {
            console.error("Errore recupero metriche:", metricsError)
        }

        return NextResponse.json({ 
            success: true, 
            transactions,
            kpis,
            metrics: metrics || [],
            summary: {
                total_revenue: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0),
                total_expenses: transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

        const { data: transaction, error } = await supabase
            .from('transactions')
            .insert({ ...body, user_id: user.id })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, transaction })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
