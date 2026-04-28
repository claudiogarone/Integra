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
                contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nMessaggio SMS da ${prompt}` }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 160 } // SMS max ~160 char
            })
        }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function sendSMS(accountSid: string, authToken: string, fromNumber: string, toNumber: string, body: string) {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: body })
    });
}

// POST: Riceve SMS in entrata da Twilio (Twilio usa form-urlencoded, non JSON)
export async function POST(request: Request) {
    try {
        // Twilio invia i dati come form-urlencoded
        const formData = await request.formData();
        const fromNumber = formData.get('From') as string;
        const toNumber = formData.get('To') as string; // Il nostro numero Twilio = identifica il tenant
        const body = formData.get('Body') as string;
        const messageSid = formData.get('MessageSid') as string;
        const senderName = formData.get('FromCity') ? 
            `${formData.get('FromCity')}, ${formData.get('FromCountry')}` : fromNumber;

        if (!fromNumber || !body || !toNumber) {
            return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
                headers: { 'Content-Type': 'text/xml' }
            });
        }

        // Trova il canale tramite il numero Twilio (identifica univocamente il tenant)
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id, user_id, bot_enabled, bot_prompt, metadata')
            .eq('provider', 'sms')
            .eq('provider_id', toNumber) // Il numero Twilio assegnato all'azienda
            .single();

        if (!channel) {
            console.error('[SMS WEBHOOK] Nessun canale per numero:', toNumber);
            return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
                headers: { 'Content-Type': 'text/xml' }
            });
        }

        // Trova o crea contatto
        let { data: contact } = await supabase
            .from('inbox_contacts')
            .select('id')
            .eq('channel_id', channel.id)
            .eq('external_id', fromNumber)
            .single();

        if (!contact) {
            const { data: newContact } = await supabase
                .from('inbox_contacts')
                .insert({
                    user_id: channel.user_id, channel_id: channel.id,
                    external_id: fromNumber, name: fromNumber, phone: fromNumber
                })
                .select('id').single();
            contact = newContact;
        } else {
            await supabase.from('inbox_contacts').update({ last_interaction: new Date().toISOString() }).eq('id', contact.id);
        }

        if (!contact) {
            return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
                headers: { 'Content-Type': 'text/xml' }
            });
        }

        // Deduplicazione
        const { data: existingMsg } = await supabase.from('inbox_messages').select('id').eq('external_message_id', messageSid).single();
        
        let twimlResponse = '';

        if (!existingMsg) {
            await supabase.from('inbox_messages').insert({
                user_id: channel.user_id, channel_id: channel.id, inbox_contact_id: contact.id,
                direction: 'inbound', message_type: 'text', content: body,
                status: 'delivered', external_message_id: messageSid,
            });

            if (channel.bot_enabled) {
                const aiReply = await callGemini(body, channel.bot_prompt || 'Sei un assistente professionale. Rispondi in modo molto conciso (max 160 caratteri).');
                if (aiReply) {
                    // Risposta via TwiML (più efficiente per SMS — risponde direttamente senza API call separata)
                    const cleanReply = aiReply.substring(0, 320); // Max 2 SMS
                    twimlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${cleanReply}</Message></Response>`;

                    await supabase.from('inbox_messages').insert({
                        user_id: channel.user_id, channel_id: channel.id, inbox_contact_id: contact.id,
                        direction: 'outbound', message_type: 'text', content: cleanReply,
                        status: 'sent', is_ai_generated: true,
                    });
                }
            }
        }

        // Rispondi sempre con TwiML (anche vuoto per dire a Twilio che abbiamo ricevuto)
        return new Response(
            twimlResponse || '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { headers: { 'Content-Type': 'text/xml' } }
        );

    } catch (error: any) {
        console.error('[SMS WEBHOOK] Errore:', error.message);
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
            headers: { 'Content-Type': 'text/xml' }
        });
    }
}
