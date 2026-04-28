import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nMessaggio Instagram: ${prompt}` }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
            })
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function sendInstagramReply(accessToken: string, recipientId: string, text: string) {
    await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text }
        })
    });
}

// GET: Verifica webhook (Instagram usa la stessa infrastruttura Meta)
export async function GET(request: Request) {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token) {
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id')
            .eq('provider', 'instagram')
            .eq('user_id', token)
            .single();

        if (channel) return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
}

// POST: Riceve messaggi Instagram DM
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Instagram usa object: 'instagram' nei webhook
        if (body.object !== 'instagram') return NextResponse.json({ ok: true });

        for (const entry of (body.entry || [])) {
            const instagramId = entry.id; // Instagram Business Account ID
            const messaging = entry.messaging?.[0];
            if (!messaging?.message?.text) continue;

            const senderId = messaging.sender?.id;
            const text = messaging.message.text;
            const messageId = messaging.message.mid;

            if (!senderId || !text) continue;

            // Trova il canale tramite l'Instagram Business ID
            const { data: channel } = await supabase
                .from('inbox_channels')
                .select('id, user_id, bot_enabled, bot_prompt, access_token')
                .eq('provider', 'instagram')
                .eq('provider_id', instagramId)
                .single();

            if (!channel) {
                console.error('[INSTAGRAM WEBHOOK] Nessun canale per instagram_id:', instagramId);
                continue;
            }

            // Trova o crea contatto
            let { data: contact } = await supabase
                .from('inbox_contacts')
                .select('id')
                .eq('channel_id', channel.id)
                .eq('external_id', senderId)
                .single();

            if (!contact) {
                // Recupera username Instagram
                let senderName = `@ig_${senderId.substring(0, 6)}`;
                try {
                    const igRes = await fetch(
                        `https://graph.facebook.com/v19.0/${senderId}?fields=name,username&access_token=${channel.access_token}`
                    );
                    const igData = await igRes.json();
                    if (igData.username) senderName = `@${igData.username}`;
                    else if (igData.name) senderName = igData.name;
                } catch {}

                const { data: newContact } = await supabase
                    .from('inbox_contacts')
                    .insert({ user_id: channel.user_id, channel_id: channel.id, external_id: senderId, name: senderName })
                    .select('id').single();
                contact = newContact;
            } else {
                await supabase.from('inbox_contacts').update({ last_interaction: new Date().toISOString() }).eq('id', contact.id);
            }

            if (!contact) continue;

            const { data: existingMsg } = await supabase.from('inbox_messages').select('id').eq('external_message_id', messageId).single();
            if (existingMsg) continue;

            await supabase.from('inbox_messages').insert({
                user_id: channel.user_id, channel_id: channel.id, inbox_contact_id: contact.id,
                direction: 'inbound', message_type: 'text', content: text,
                status: 'delivered', external_message_id: messageId,
            });

            if (channel.bot_enabled && channel.access_token) {
                const aiReply = await callGemini(text, channel.bot_prompt || 'Sei un assistente professionale.');
                if (aiReply) {
                    await sendInstagramReply(channel.access_token, senderId, aiReply);
                    await supabase.from('inbox_messages').insert({
                        user_id: channel.user_id, channel_id: channel.id, inbox_contact_id: contact.id,
                        direction: 'outbound', message_type: 'text', content: aiReply,
                        status: 'sent', is_ai_generated: true,
                    });
                }
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[INSTAGRAM WEBHOOK] Errore:', error.message);
        return NextResponse.json({ ok: true });
    }
}
