import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Questa API viene chiamata dalla pagina Impostazioni dopo il salvataggio del token.
// Registra automaticamente il webhook su Telegram, così l'azienda non deve fare nulla
// manualmente — IntegraOS lo fa in autonomia.
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

        const { botToken } = await request.json();
        if (!botToken || !botToken.includes(':')) {
            return NextResponse.json({ error: 'Token del bot non valido. Deve avere il formato: 123456:ABCdef...' }, { status: 400 });
        }

        // URL del nostro webhook con il token come query param per il routing multi-tenant
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.integraos.tech';
        const webhookUrl = `${baseUrl}/api/inbox/webhook/telegram?token=${encodeURIComponent(botToken)}`;

        // 1. Chiama l'API Telegram per registrare il webhook
        const tgRes = await fetch(
            `https://api.telegram.org/bot${botToken}/setWebhook`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: webhookUrl,
                    allowed_updates: ['message', 'edited_message'],
                    drop_pending_updates: true
                })
            }
        );

        const tgData = await tgRes.json();

        if (!tgData.ok) {
            return NextResponse.json({
                error: `Telegram ha rifiutato il token: ${tgData.description}. Verifica di aver copiato il token corretto da @BotFather.`
            }, { status: 400 });
        }

        // 2. Recupera info del bot per salvare il nome
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meData = await meRes.json();
        const botName = meData.result?.username ? `@${meData.result.username}` : 'Telegram Bot';

        // 3. Salva/aggiorna il canale in Supabase con il nome del bot reale
        const { error: dbErr } = await supabase.from('inbox_channels').upsert({
            user_id: user.id,
            provider: 'telegram',
            provider_id: String(meData.result?.id || 'default_tg'),
            name: botName,
            access_token: botToken,
            bot_enabled: true,
        }, { onConflict: 'user_id,provider,provider_id' });

        if (dbErr) throw dbErr;

        return NextResponse.json({
            success: true,
            botName,
            webhookUrl,
            message: `✅ Bot ${botName} collegato! I messaggi arriveranno nell'Inbox in tempo reale.`
        });

    } catch (error: any) {
        console.error('[REGISTER TELEGRAM]', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Controlla lo stato attuale del webhook su Telegram
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const botToken = url.searchParams.get('token');
        if (!botToken) return NextResponse.json({ error: 'Token mancante' }, { status: 400 });

        const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const data = await res.json();

        return NextResponse.json({
            ok: data.ok,
            webhookUrl: data.result?.url || null,
            pendingUpdates: data.result?.pending_update_count || 0,
            lastError: data.result?.last_error_message || null
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
