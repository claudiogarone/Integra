import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Recupera tutti gli appuntamenti
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            // Ordiniamo per data e ora per averli cronologici
            .order('event_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Errore GET Calendar Events:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crea o Modifica un appuntamento
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, description, event_date, start_time, end_time, type, status } = body;

        if (!title || !event_date || !start_time || !end_time) {
            return NextResponse.json({ error: 'Titolo, data, ora di inizio e fine sono obbligatori' }, { status: 400 });
        }

        let eventData;

        // MODIFICA
        if (id) {
            const { data, error } = await supabase
                .from('calendar_events')
                .update({ 
                    title, 
                    description: description || '', 
                    event_date, 
                    start_time, 
                    end_time, 
                    type: type || 'Call', 
                    status: status || 'Scheduled' 
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            eventData = data;
        } 
        // CREAZIONE NUOVO
        else {
            const { data, error } = await supabase
                .from('calendar_events')
                .insert([{ 
                    title, 
                    description: description || '', 
                    event_date, 
                    start_time, 
                    end_time, 
                    type: type || 'Call', 
                    status: status || 'Scheduled' 
                }])
                .select()
                .single();

            if (error) throw error;
            eventData = data;
        }

        return NextResponse.json({ success: true, event: eventData }, { status: 200 });
    } catch (error: any) {
        console.error("Errore POST Calendar Events:", error);
        return NextResponse.json({ error: error.message || "Errore sconosciuto" }, { status: 500 });
    }
}

// DELETE: Elimina un appuntamento
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        if (error) throw error;
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Errore DELETE Calendar Events:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}