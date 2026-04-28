import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Service Role necessario: il webhook è chiamato da Meta, non da un utente autenticato.
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
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nMessaggio: ${prompt}` }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
            })
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text }
        })
    });
}

// GET: Verifica webhook richiesta da Meta durante la configurazione
export async function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Ogni azienda usa il suo user_id come verify_token — semplicissimo per loro
    if (mode === 'subscribe' && token) {
        // Verifichiamo che il token corrisponda a un utente registrato
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id')
            .eq('provider', 'whatsapp')
            .eq('metadata->>verify_token', token)
            .single();

        if (channel) {
            console.log('[WHATSAPP WEBHOOK] Verifica completata per token:', token);
            return new Response(challenge, { status: 200 });
        }
    }

    return new Response('Forbidden', { status: 403 });
}

// POST: Riceve messaggi WhatsApp in entrata
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Struttura tipica del payload Meta Cloud API
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        if (!value?.messages?.length) {
            return NextResponse.json({ ok: true }); // Status/delivery update, ignoriamo
        }

        const message = value.messages[0];
        const phoneNumberId = value.metadata?.phone_number_id;
        const fromNumber = message.from; // Es. "393331234567"
        const text = message.text?.body;
        const messageId = message.id;

        if (!text || !phoneNumberId || !fromNumber) {
            return NextResponse.json({ ok: true });
        }

        // Trova il canale di questo Phone Number ID (identifica il tenant)
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id, user_id, bot_enabled, bot_prompt, access_token, metadata')
            .eq('provider', 'whatsapp')
            .eq('metadata->>phone_number_id', phoneNumberId)
            .single();

        if (!channel) {
            console.error('[WHATSAPP WEBHOOK] Nessun canale trovato per phone_number_id:', phoneNumberId);
            return NextResponse.json({ ok: true });
        }

        // Trova o crea il contatto
        let { data: contact } = await supabase
            .from('inbox_contacts')
            .select('id')
            .eq('channel_id', channel.id)
            .eq('external_id', fromNumber)
            .single();

        const contactName = value.contacts?.[0]?.profile?.name || `+${fromNumber}`;

        if (!contact) {
            const { data: newContact } = await supabase
                .from('inbox_contacts')
                .insert({
                    user_id: channel.user_id,
                    channel_id: channel.id,
                    external_id: fromNumber,
                    name: contactName,
                    phone: `+${fromNumber}`,
                })
                .select('id')
                .single();
            contact = newContact;
        } else {
            await supabase
                .from('inbox_contacts')
                .update({ last_interaction: new Date().toISOString() })
                .eq('id', contact.id);
        }

        if (!contact) return NextResponse.json({ ok: true });

        // Controlla duplicati (Meta può inviare lo stesso messaggio più volte)
        const { data: existingMsg } = await supabase
            .from('inbox_messages')
            .select('id')
            .eq('external_message_id', messageId)
            .single();

        if (existingMsg) return NextResponse.json({ ok: true }); // Già processato

        // Salva il messaggio in entrata
        await supabase.from('inbox_messages').insert({
            user_id: channel.user_id,
            channel_id: channel.id,
            inbox_contact_id: contact.id,
            direction: 'inbound',
            message_type: 'text',
            content: text,
            status: 'delivered',
            external_message_id: messageId,
        });

        // Auto-risposta AI
        if (channel.bot_enabled) {
            const aiReply = await callGemini(text, channel.bot_prompt || 'Sei un assistente professionale e cordiale.');

            if (aiReply && channel.access_token && channel.metadata?.phone_number_id) {
                await sendWhatsAppMessage(
                    channel.metadata.phone_number_id,
                    channel.access_token,
                    fromNumber,
                    aiReply
                );

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
        console.error('[WHATSAPP WEBHOOK] Errore:', error.message);
        return NextResponse.json({ ok: true }); // Sempre 200 a Meta
    }
}
