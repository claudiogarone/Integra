import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Token non fornito dal client.' }, { status: 401 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
            }
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorizzato o token scaduto. Ricarica la pagina.' }, { status: 401 });
        }

        // Recuperiamo gli eventi solo dell'utente che ha fatto la richiesta (employee_id)
        const supabaseWithAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
                global: { headers: { Authorization: `Bearer ${token}` } }
            }
        );

        const { data, error } = await supabaseWithAuth
            .from('calendar_events')
            .select('*')
            .eq('employee_id', user.id)
            .order('event_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error("Errore GET Calendar Events:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) return NextResponse.json({ error: 'Token mancante' }, { status: 401 });

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Utente non valido' }, { status: 401 });

        const body = await request.json();
        const { id, title, description, event_date, start_time, end_time, type, status } = body;

        if (!title || !event_date || !start_time || !end_time) {
            return NextResponse.json({ error: 'Titolo, data, ora di inizio e fine sono obbligatori' }, { status: 400 });
        }

        const supabaseWithAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
                global: { headers: { Authorization: `Bearer ${token}` } }
            }
        );

        let eventData;
        if (id) {
            const { data, error } = await supabaseWithAuth
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
                .eq('employee_id', user.id) // Sicurezza aggiuntiva per impedire la modifica di eventi altrui
                .select()
                .single();

            if (error) throw error;
            eventData = data;
        } else {
            const { data, error } = await supabaseWithAuth
                .from('calendar_events')
                .insert([{ 
                    employee_id: user.id, // Viene associato l'evento all'utente reale!
                    company_id: user.id,
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

export async function DELETE(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) return NextResponse.json({ error: 'Token mancante' }, { status: 401 });

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Utente non valido' }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

        const supabaseWithAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
                global: { headers: { Authorization: `Bearer ${token}` } }
            }
        );

        const { error } = await supabaseWithAuth
            .from('calendar_events')
            .delete()
            .eq('id', id)
            .eq('employee_id', user.id); // L'utente può eliminare solo i propri eventi
            
        if (error) throw error;
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Errore DELETE:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}