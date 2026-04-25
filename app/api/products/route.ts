import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usiamo il service role key per bypassare RLS e avere accesso completo
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { data: products, error } = await supabaseAdmin
            .from('ecommerce_products') // FIX: tabella corretta (era 'products')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, products })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        if (!body.user_id) {
            return NextResponse.json({ error: 'user_id mancante nel payload' }, { status: 400 })
        }

        const { data: product, error } = await supabaseAdmin
            .from('ecommerce_products') // FIX: tabella corretta (era 'products')
            .insert({ 
                ...body, 
                is_deleted: false 
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, product })
    } catch (error: any) {
        console.error('Errore API Products POST:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// FIX: aggiunto handler DELETE mancante (soft delete)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        
        if (!id) {
            return NextResponse.json({ error: 'ID prodotto mancante' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('ecommerce_products')
            .update({ is_deleted: true })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Errore API Products DELETE:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}