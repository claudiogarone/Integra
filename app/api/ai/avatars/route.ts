import { createClient } from '../../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    try {
        const { data: avatars, error } = await supabase
            .from('ai_avatars')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, avatars })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { data: avatar, error } = await supabase
            .from('ai_avatars')
            .insert({ ...body, user_id: user.id })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, avatar })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const supabase = await createClient()
    
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

    try {
        const { error } = await supabase
            .from('ai_avatars')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
