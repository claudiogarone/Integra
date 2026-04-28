import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Pro: max 300s. Hobby: 10s (usa 60 come default sicuro)

// Questo endpoint viene chiamato da Vercel Cron ogni 10 minuti.
// Scorre TUTTI i clienti con una casella email IMAP configurata
// e scarica i nuovi messaggi nell'Inbox per ognuno.
//
// Sicurezza: accettato solo se chiamato da Vercel (Authorization header)
// oppure internamente — non è esposto pubblicamente in modo utile.

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    // Verifica che la chiamata provenga da Vercel Cron (o da noi in locale)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const startTime = Date.now();

    try {
        // Recupera tutti i canali email IMAP attivi su tutti i tenant
        const { data: channels, error } = await supabase
            .from('inbox_channels')
            .select('user_id, id, provider_id, access_token, metadata, bot_enabled, bot_prompt')
            .eq('provider', 'email_imap')
            .not('access_token', 'is', null)
            .neq('access_token', '');

        if (error) throw error;
        if (!channels || channels.length === 0) {
            return NextResponse.json({ ok: true, message: 'Nessun canale email configurato', processed: 0 });
        }

        const results: Array<{ userId: string; email: string; imported: number; error?: string }> = [];

        // Processa ogni cliente in sequenza (evita di saturare le connessioni IMAP)
        for (const channel of channels) {
            try {
                // Chiama l'endpoint di polling esistente per questo specifico utente
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.integraos.tech';
                const res = await fetch(`${baseUrl}/api/inbox/email-poll`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        // Passa il secret per autorizzazione interna
                        'x-internal-secret': process.env.CRON_SECRET || 'internal'
                    },
                    body: JSON.stringify({ userId: channel.user_id }),
                    signal: AbortSignal.timeout(25000) // Max 25s per utente
                });

                const data = await res.json();
                results.push({
                    userId: channel.user_id,
                    email: channel.provider_id,
                    imported: data.importedCount || 0,
                    error: data.error
                });

            } catch (err: any) {
                results.push({
                    userId: channel.user_id,
                    email: channel.provider_id,
                    imported: 0,
                    error: err.message
                });
            }

            // Piccola pausa tra un utente e l'altro per non sovraccaricare i server IMAP
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        const totalImported = results.reduce((sum, r) => sum + r.imported, 0);
        const failed = results.filter(r => r.error);
        const elapsed = Date.now() - startTime;

        console.log(`[CRON SYNC EMAIL] Completato in ${elapsed}ms — ${channels.length} utenti, ${totalImported} email importate, ${failed.length} errori`);

        return NextResponse.json({
            ok: true,
            processed: channels.length,
            totalImported,
            failed: failed.length,
            elapsedMs: elapsed,
            // Includi i dettagli solo in sviluppo
            ...(process.env.NODE_ENV === 'development' ? { results } : {})
        });

    } catch (error: any) {
        console.error('[CRON SYNC EMAIL] Errore fatale:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
