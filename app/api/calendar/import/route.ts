import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];
        if (!token) return NextResponse.json({ error: 'Token non fornito' }, { status: 401 });

        const cookieStore = await cookies();
        const baseSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
        );
        
        const { data: { user }, error: authError } = await baseSupabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Autorizzazione fallita o token scaduto' }, { status: 401 });

        const body = await request.json();
        const { url } = body; 

        if (!url || (!url.startsWith('http') && !url.startsWith('webcal'))) {
            return NextResponse.json({ error: 'URL del calendario non valido' }, { status: 400 });
        }

        const fetchUrl = url.replace('webcal://', 'https://');

        const res = await fetch(fetchUrl, { 
            cache: 'no-store',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!res.ok) throw new Error(`Server esterno ha rifiutato la connessione (Status: ${res.status})`);
        
        const icsData = await res.text();

        const eventsToInsert: any[] = [];
        const lines = icsData.split(/\r?\n/);
        
        let inEvent = false;
        let currentEvent: any = {};

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
                line += lines[i+1].substring(1);
                i++;
            }

            if (line.startsWith('BEGIN:VEVENT')) {
                inEvent = true;
                currentEvent = {};
            } else if (line.startsWith('END:VEVENT')) {
                inEvent = false;
                
                if (currentEvent.summary && currentEvent.start) {
                    
                    const extractDate = (rawStr: string) => {
                        const clean = rawStr.replace(/[^0-9T]/g, '');
                        const parts = clean.split('T');
                        
                        if (parts[0].length >= 8) {
                            const y = parts[0].substring(0,4);
                            const m = parts[0].substring(4,6);
                            const d = parts[0].substring(6,8);
                            
                            let time = "09:00:00"; 
                            if (parts[1] && parts[1].length >= 4) {
                                const h = parts[1].substring(0,2);
                                const min = parts[1].substring(2,4);
                                time = `${h}:${min}:00`;
                            }
                            return { date: `${y}-${m}-${d}`, time };
                        }
                        return null;
                    };

                    const startObj = extractDate(currentEvent.start);
                    const endObj = currentEvent.end ? extractDate(currentEvent.end) : startObj;

                    if (startObj) {
                        eventsToInsert.push({
                            employee_id: user.id, // Collegato obbligatoriamente all'utente vero!
                            company_id: user.id,
                            title: `📥 ${currentEvent.summary.substring(0, 100)}`, 
                            description: currentEvent.description ? currentEvent.description.substring(0, 400) : 'Sincronizzato da calendario esterno',
                            event_date: startObj.date,
                            start_time: startObj.time,
                            end_time: endObj ? endObj.time : '23:59:00',
                            type: 'Meeting',
                            status: 'Scheduled'
                        });
                    }
                }
            } else if (inEvent) {
                if (line.startsWith('SUMMARY')) currentEvent.summary = line.substring(line.indexOf(':') + 1);
                else if (line.startsWith('DESCRIPTION')) currentEvent.description = line.substring(line.indexOf(':') + 1);
                else if (line.startsWith('DTSTART')) currentEvent.start = line.substring(line.indexOf(':') + 1);
                else if (line.startsWith('DTEND')) currentEvent.end = line.substring(line.indexOf(':') + 1);
            }
        }

        if (eventsToInsert.length === 0) {
            return NextResponse.json({ error: 'Calendario vuoto o formato non leggibile. Assicurati che il link contenga eventi.' }, { status: 400 });
        }

        const supabaseWithAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
                global: { headers: { Authorization: `Bearer ${token}` } }
            }
        );

        // 3. DEDUPLICAZIONE INTELLIGENTE PER IL SINGOLO UTENTE
        // L'API carica solo gli eventi dell'utente evitando collisioni cross-account
        const { data: existingEvents } = await supabaseWithAuth
            .from('calendar_events')
            .select('title, event_date')
            .eq('employee_id', user.id); 
        
        const uniqueEventsToInsert = eventsToInsert.filter(newEvent => {
            const isDuplicate = existingEvents?.some(ex => {
                const cleanExTitle = ex.title.replace(/[🎥✅🤖📥]/g, '').trim();
                const cleanNewTitle = newEvent.title.replace(/[🎥✅🤖📥]/g, '').trim();
                return ex.event_date === newEvent.event_date && cleanExTitle === cleanNewTitle;
            });
            return !isDuplicate;
        });

        if (uniqueEventsToInsert.length > 0) {
            const { error } = await supabaseWithAuth.from('calendar_events').insert(uniqueEventsToInsert);
            if (error) throw error;
        }

        // 4. SALVATAGGIO DELLA CONNESSIONE
        const { data: existingSyncs } = await supabaseWithAuth
            .from('calendar_syncs')
            .select('id')
            .eq('url', url)
            .eq('user_id', user.id);

        if (!existingSyncs || existingSyncs.length === 0) {
            let provider = 'Esterno';
            if (url.includes('google.com')) provider = 'Google Calendar';
            else if (url.includes('apple.com') || url.includes('icloud.com')) provider = 'Apple Calendar';
            else if (url.includes('outlook.com') || url.includes('office365.com')) provider = 'Outlook Microsoft';
                
            await supabaseWithAuth.from('calendar_syncs').insert({ user_id: user.id, provider, url });
        } else {
            // Aggiorniamo ultima sincronizzazione
            await supabaseWithAuth.from('calendar_syncs').update({ last_sync: new Date().toISOString() }).eq('id', existingSyncs[0].id);
        }

        return NextResponse.json({ 
            success: true, 
            importedCount: uniqueEventsToInsert.length,
            skippedCount: eventsToInsert.length - uniqueEventsToInsert.length
        }, { status: 200 });

    } catch (error: any) {
        console.error("Errore Importazione Calendario:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}