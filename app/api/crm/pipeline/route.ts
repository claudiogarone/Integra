import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Aggregazione dati pipeline per stadio funnel
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        // Recupera tutti i contatti con ordini
        const { data: contacts, error } = await supabase
            .from('contacts')
            .select('id, name, email, status, source, value, created_at, orders(*)')
            .order('created_at', { ascending: false })

        if (error) throw error

        const stages = ['Visualizzato', 'Richiesta', 'Promo Inviata', 'Offerta', 'Trattativa', 'Vinto']
        
        // Mappa pipeline: ogni contatto ha uno stadio e un colore
        const pipeline = (contacts || []).map((c: any) => {
            const stageIndex = stages.indexOf(c.status)
            const ltv = c.orders?.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0) || Number(c.value) || 0
            
            // Determina il colore basato su attività recente
            const lastOrder = c.orders?.[0]
            const daysSinceLastActivity = lastOrder 
                ? Math.floor((Date.now() - new Date(lastOrder.date).getTime()) / (1000 * 60 * 60 * 24))
                : Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
            
            let health: 'green' | 'yellow' | 'red' = 'green'
            if (daysSinceLastActivity > 90) health = 'red'
            else if (daysSinceLastActivity > 30) health = 'yellow'

            return {
                id: c.id,
                name: c.name,
                email: c.email,
                status: c.status,
                stageIndex: stageIndex >= 0 ? stageIndex : 0,
                source: c.source,
                ltv,
                ordersCount: c.orders?.length || 0,
                health,
                daysSinceLastActivity,
                created_at: c.created_at
            }
        })

        // Statistiche per stadio
        const stageStats = stages.map((stage, idx) => ({
            stage,
            count: pipeline.filter(p => p.stageIndex === idx).length,
            totalValue: pipeline.filter(p => p.stageIndex === idx).reduce((acc, p) => acc + p.ltv, 0),
            greenCount: pipeline.filter(p => p.stageIndex === idx && p.health === 'green').length,
            yellowCount: pipeline.filter(p => p.stageIndex === idx && p.health === 'yellow').length,
            redCount: pipeline.filter(p => p.stageIndex === idx && p.health === 'red').length,
        }))

        // Canali di acquisizione
        const sourceMap: Record<string, number> = {}
        pipeline.forEach(p => {
            const src = p.source || 'Sconosciuto'
            sourceMap[src] = (sourceMap[src] || 0) + 1
        })

        return NextResponse.json({ 
            pipeline,
            stageStats,
            sources: Object.entries(sourceMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
            totalContacts: pipeline.length
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
