import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Email inbound via Resend Webhooks.
// Ogni azienda ottiene un indirizzo univoco: {shortId}@mail.integraos.tech
// L'azienda configura il forward della sua email aziendale verso questo indirizzo.
// Resend cattura l'email e la invia a questo endpoint.

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateInboxEmail(userId: string): string {
    // Usa i primi 12 caratteri dello user_id (abbastanza univoco, leggibile)
    const shortId = userId.replace(/-/g, '').substring(0, 12).toLowerCase();
    return `inbox-${shortId}@mail.integraos.tech`;
}

// POST: Riceve email inbound da Resend webhook
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Struttura payload Resend inbound email
        // Ref: https://resend.com/docs/api-reference/emails/receive
        const toAddress = body.to?.[0]?.email || body.to;
        const fromEmail = body.from?.email || body.from;
        const fromName = body.from?.name || fromEmail;
        const subject = body.subject || '(nessun oggetto)';
        const textBody = body.text || body.html?.replace(/<[^>]*>/g, '') || '';
        const messageId = body.id || body.headers?.['message-id'] || `${Date.now()}`;

        if (!toAddress || !fromEmail) {
            return NextResponse.json({ ok: true });
        }

        // Trova il tenant dall'indirizzo email di destinazione
        // Formato: inbox-{shortId}@mail.integraos.tech
        const shortIdMatch = toAddress.match(/inbox-([a-z0-9]+)@/);
        if (!shortIdMatch) {
            console.error('[EMAIL WEBHOOK] Indirizzo non riconosciuto:', toAddress);
            return NextResponse.json({ ok: true });
        }
        const shortId = shortIdMatch[1];

        // Ricostruisce il pattern userId per la ricerca
        // I primi 12 char dello userId senza trattini
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id, user_id, bot_enabled, bot_prompt, access_token')
            .eq('provider', 'email')
            .eq('provider_id', toAddress)
            .single();

        if (!channel) {
            console.error('[EMAIL WEBHOOK] Nessun canale email per:', toAddress);
            return NextResponse.json({ ok: true });
        }

        // Trova o crea contatto
        let { data: contact } = await supabase
            .from('inbox_contacts')
            .select('id')
            .eq('channel_id', channel.id)
            .eq('external_id', fromEmail)
            .single();

        if (!contact) {
            const { data: newContact } = await supabase
                .from('inbox_contacts')
                .insert({
                    user_id: channel.user_id, channel_id: channel.id,
                    external_id: fromEmail, name: fromName, email: fromEmail
                })
                .select('id').single();
            contact = newContact;
        } else {
            await supabase.from('inbox_contacts').update({ last_interaction: new Date().toISOString() }).eq('id', contact.id);
        }

        if (!contact) return NextResponse.json({ ok: true });

        // Deduplicazione per message-id
        const { data: existingMsg } = await supabase.from('inbox_messages').select('id').eq('external_message_id', messageId).single();
        if (existingMsg) return NextResponse.json({ ok: true });

        // Il contenuto comprende oggetto + corpo per leggibilità nell'inbox
        const fullContent = subject !== '(nessun oggetto)' 
            ? `📧 Oggetto: ${subject}\n\n${textBody}` 
            : textBody;

        await supabase.from('inbox_messages').insert({
            user_id: channel.user_id, channel_id: channel.id, inbox_contact_id: contact.id,
            direction: 'inbound', message_type: 'text', content: fullContent,
            status: 'delivered', external_message_id: messageId,
        });

        // Auto-risposta via email (usa Resend, già configurato nel progetto)
        if (channel.bot_enabled) {
            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
                const aiPrompt = channel.bot_prompt || 'Sei un assistente professionale. Rispondi in modo cortese ed esaustivo.';
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: `${aiPrompt}\n\nEmail ricevuta:\nOggetto: ${subject}\n\n${textBody}` }] }],
                            generationConfig: { temperature: 0.4, maxOutputTokens: 500 }
                        })
                    }
                );
                const aiData = await res.json();
                const aiReply = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

                if (aiReply) {
                    // Invia risposta via Resend
                    const { Resend } = await import('resend');
                    const resendClient = new Resend(process.env.RESEND_API_KEY!);
                    await resendClient.emails.send({
                        from: `IntegraOS Inbox <${toAddress}>`,
                        to: fromEmail,
                        subject: `Re: ${subject}`,
                        text: aiReply,
                    });

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
        console.error('[EMAIL WEBHOOK] Errore:', error.message);
        return NextResponse.json({ ok: true });
    }
}

// GET: Ritorna l'indirizzo email univoco dell'azienda (usato nella pagina Settings)
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        if (!userId) return NextResponse.json({ error: 'userId mancante' }, { status: 400 });

        const inboxEmail = generateInboxEmail(userId);
        return NextResponse.json({ inboxEmail });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
