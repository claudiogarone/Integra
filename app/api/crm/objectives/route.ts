import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Recupera obiettivi KPI dell'utente
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const { data, error } = await supabase
            .from('crm_objectives')
            .select('*')
            .eq('user_id', user.id)
            .order('sort_order', { ascending: true })

        if (error) throw error
        return NextResponse.json({ objectives: data || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// POST: Crea o aggiorna un obiettivo KPI
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const body = await req.json()
        const { id, name, ob_minimum, ob_ideal, current_value, timing, category, unit, sort_order } = body

        if (id) {
            // Update
            const { data, error } = await supabase
                .from('crm_objectives')
                .update({ name, ob_minimum, ob_ideal, current_value, timing, category, unit, sort_order, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ objective: data })
        } else {
            // Insert
            const { data, error } = await supabase
                .from('crm_objectives')
                .insert({ user_id: user.id, name, ob_minimum, ob_ideal, current_value, timing, category, unit, sort_order })
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ objective: data })
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// DELETE
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const { id } = await req.json()
        const { error } = await supabase
            .from('crm_objectives')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
