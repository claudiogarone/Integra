import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Client con Service Role KEY: necessario qui perché Telegram chiama il webhook
// senza un utente autenticato IntegraOS. L'isolamento è garantito dal token del bot
// che mappa univocamente all'azienda (user_id).
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return '';

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nMessaggio del cliente: ${prompt}` }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
            })
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function sendTelegramMessage(botToken: string, chatId: string | number, text: string) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Struttura tipica di un update Telegram
        const message = body.message || body.edited_message;
        if (!message || !message.text) {
            return NextResponse.json({ ok: true }); // Ignora update senza testo (foto, sticker, ecc.)
        }

        const chatId = message.chat.id;
        const fromName = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ') || 'Utente Telegram';
        const externalId = String(message.from?.id || chatId);
        const text = message.text;

        // 1. Troviamo a quale azienda (tenant) appartiene questo webhook.
        // Telegram invia l'update a UN SOLO endpoint per bot, ma noi abbiamo un endpoint
        // unico condiviso. Usiamo il token passato nell'URL (?token=...) oppure leggiamo
        // TUTTI i canali Telegram attivi e facciamo match. La soluzione più robusta e
        // scalabile è usare il token nell'URL di registrazione del webhook.
        const url = new URL(request.url);
        const botToken = url.searchParams.get('token');

        if (!botToken) {
            console.error('[TELEGRAM WEBHOOK] Token mancante nell\'URL');
            return NextResponse.json({ ok: true }); // Rispondi sempre 200 a Telegram
        }

        // 2. Trova il canale Telegram corrispondente a questo bot token
        const { data: channel, error: channelErr } = await supabase
            .from('inbox_channels')
            .select('id, user_id, bot_enabled, bot_prompt')
            .eq('provider', 'telegram')
            .eq('access_token', botToken)
            .single();

        if (channelErr || !channel) {
            console.error('[TELEGRAM WEBHOOK] Canale non trovato per questo token:', botToken);
            return NextResponse.json({ ok: true });
        }

        // 3. Trova o crea il contatto inbox per questo utente Telegram
        let { data: contact } = await supabase
            .from('inbox_contacts')
            .select('id')
            .eq('channel_id', channel.id)
            .eq('external_id', externalId)
            .single();

        if (!contact) {
            const { data: newContact } = await supabase
                .from('inbox_contacts')
                .insert({
                    user_id: channel.user_id,
                    channel_id: channel.id,
                    external_id: externalId,
                    name: fromName,
                })
                .select('id')
                .single();
            contact = newContact;
        } else {
            // Aggiorna il timestamp dell'ultima interazione
            await supabase
                .from('inbox_contacts')
                .update({ last_interaction: new Date().toISOString(), name: fromName })
                .eq('id', contact.id);
        }

        if (!contact) {
            console.error('[TELEGRAM WEBHOOK] Impossibile creare il contatto');
            return NextResponse.json({ ok: true });
        }

        // 4. Salva il messaggio in entrata
        await supabase.from('inbox_messages').insert({
            user_id: channel.user_id,
            channel_id: channel.id,
            inbox_contact_id: contact.id,
            direction: 'inbound',
            message_type: 'text',
            content: text,
            status: 'delivered',
            external_message_id: String(message.message_id),
        });

        // 5. Se il bot AI è attivo, genera e invia una risposta automatica
        if (channel.bot_enabled) {
            const aiReply = await callGemini(text, channel.bot_prompt || 'Sei un assistente professionale e cordiale.');

            if (aiReply) {
                // Invia la risposta a Telegram
                await sendTelegramMessage(botToken, chatId, aiReply);

                // Salva la risposta outbound nel DB
                await supabase.from('inbox_messages').insert({
                    user_id: channel.user_id,
                    channel_id: channel.id,
                    inbox_contact_id: contact.id,
                    direction: 'outbound',
                    message_type: 'text',
                    content: aiReply,
                    status: 'sent',
                    is_ai_generated: true,
                });
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('[TELEGRAM WEBHOOK] Errore:', error.message);
        // Rispondi sempre 200 a Telegram per evitare retry infiniti
        return NextResponse.json({ ok: true });
    }
}
