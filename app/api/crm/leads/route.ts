import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        // ORA LEGGIAMO E SCRIVIAMO NELLA TABELLA MASTER: 'contacts'
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, user_id, name, email, phone, status, value, notes, source, churn_date } = body;

        // Prepariamo i dati ESATTI per le colonne della tabella 'contacts'
        const leadData: any = {
            name: name || 'Senza Nome',
            email: email || null,
            phone: phone || null,
            status: status || 'Nuovo',
            value: value ? parseFloat(value) : 0,
            ltv: value ? parseFloat(value) : 0, 
            notes: notes || null,
            // Normalizziamo la fonte per evitare duplicati con case diversi
            source: (source || 'Sito Web').trim(),
            churn_date: churn_date || null
        };

        if (id) {
            // AGGIORNAMENTO: aggiorna il record esistente tramite id
            const { data, error } = await supabase.from('contacts').update(leadData).eq('id', id).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, lead: data }, { status: 200 });
        } else {
            // CREAZIONE: aggiunge user_id solo alla creazione
            if (user_id) leadData.user_id = user_id;
            const { data, error } = await supabase.from('contacts').insert([leadData]).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, lead: data }, { status: 200 });
        }
    } catch (error: any) {
        console.error("Errore API CRM:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}