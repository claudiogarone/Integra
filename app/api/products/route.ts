import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'dev-user-id';

        // FIX 1: Usa .neq('is_deleted', true) così prende sia i "false" che i vecchi prodotti "null"
        const { data: activeProducts, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .neq('is_deleted', true) 
            .order('created_at', { ascending: false });

        if (error) throw error;

        // CALCOLO QUOTA MENSILE: Conta TUTTI i prodotti creati questo mese (anche quelli eliminati)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', firstDayOfMonth);

        return NextResponse.json({ 
            products: activeProducts || [], 
            monthUsage: count || 0 
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, user_id, name, description, price, image_url, category, legal_consent } = body;

        const productData = {
            user_id: user_id || 'dev-user-id',
            name: name || 'Nuovo Prodotto',
            description: description || '',
            price: price ? parseFloat(price) : 0,
            image_url: image_url || 'https://via.placeholder.com/300x200?text=Senza+Foto',
            category: category || 'Prodotti',
            legal_consent: legal_consent === true, // Salva la spunta legale!
            is_deleted: false
        };

        if (id) {
            const { data, error } = await supabase.from('products').update(productData).eq('id', id).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, product: data }, { status: 200 });
        } else {
            const { data, error } = await supabase.from('products').insert([productData]).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, product: data }, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        
        // SOFT DELETE: Mette nel cestino (is_deleted = true) ma mantiene nel DB
        const { error } = await supabase.from('products').update({ is_deleted: true }).eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}