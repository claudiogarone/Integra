import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return new NextResponse("Mancante: userId", { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('employee_id', userId); // SICUREZZA MULTITENANT: Ritorna SOLO il calendario di questo utente

        if (error) throw error;

        // Costruiamo l'header standard VCALENDAR (Compatibilità Estesa)
        let icsString = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//IntegraOS//IT",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:Agenda IntegraOS",
            "X-WR-TIMEZONE:Europe/Rome",
            "REFRESH-INTERVAL;VALUE=DURATION:PT15M", // Suggerisce a Apple di ricaricare ogni 15 min
            "X-PUBLISHED-TTL:PT15M"
        ].join("\r\n") + "\r\n";

        if (events && events.length > 0) {
            events.forEach(ev => {
                try {
                    const start = new Date(`${ev.event_date}T${ev.start_time}`).toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
                    const end = new Date(`${ev.event_date}T${ev.end_time}`).toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
                    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
                    
                    icsString += [
                        "BEGIN:VEVENT",
                        `UID:${ev.id}@integraos.it`,
                        `DTSTAMP:${stamp}`,
                        `DTSTART:${start}`,
                        `DTEND:${end}`,
                        `SUMMARY:${ev.title.replace(/[\r\n]/g, ' ')}`,
                        `DESCRIPTION:${(ev.description || '').replace(/[\r\n]/g, '\\n')}`,
                        "END:VEVENT"
                    ].join("\r\n") + "\r\n";
                } catch(e) {}
            });
        }

        icsString += "END:VCALENDAR";

        return new NextResponse(icsString, {
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
                'Content-Disposition': 'attachment; filename="integraos_agenda.ics"',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        });

    } catch (error: any) {
        console.error("Errore generazione iCal:", error);
        return new NextResponse("Errore Server Generazione Calendario", { status: 500 });
    }
}