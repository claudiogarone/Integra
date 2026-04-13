import { NextResponse } from 'next/server'
import { trackUsage } from '@/utils/billing'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 1. VERIFICA WEBHOOK META (Richiesta GET per confermare l'URL)
export async function GET(req: Request) {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Qui puoi impostare un token globale di IntegraOS per identificare che il webhook sei tu
    const VERIFY_TOKEN = 'integra_os_whatsapp_secure_webhook'

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED')
            return new NextResponse(challenge, { status: 200 })
        } else {
            return new NextResponse('Forbidden', { status: 403 })
        }
    }
    return new NextResponse('Bad Request', { status: 400 })
}


// 2. RICEZIONE MESSAGGI (Richiesta POST)
export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        // Meta non supporta facilmente parametri custom nell'URL base del Webhook aziendale,
        // ma noi possiamo estrarre il channel_id o usare l'ID del numero Meta fornito nel body per trovare il tenant.
        
        const body = await req.json()
        
        // Verifica se l'evento è un messaggio di WhatsApp
        if (body.object !== 'whatsapp_business_account' || !body.entry || !body.entry[0].changes) {
            return NextResponse.json({ status: 'ignored' }, { status: 200 }) // Meta deve ricevere 200 altrimenti disabilita il webhook
        }

        const value = body.entry[0].changes[0].value
        if (!value.messages || !value.messages[0]) {
            return NextResponse.json({ status: 'ignored', reason: 'Non è un messaggio testuale (es. status update)' }, { status: 200 })
        }

        const message = value.messages[0]
        const contactInfo = value.contacts[0]
        
        const waPhoneNumber = message.from // Il numero del cliente (senza +)
        const waText = message.text?.body || '[Allegato Multimediale]'
        const waMessageId = message.id
        const senderName = contactInfo?.profile?.name || 'Utente WhatsApp'
        
        // L'ID numerico dell'account WhatsApp Business che ha RICEVUTO il messaggio (ci serve per trovare a quale cliente IntegraOS appartiene)
        const businessPhoneNumberId = value.metadata.phone_number_id

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Dati Canale Aziendale basato sul numero WhatsApp o Token
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('*')
            .eq('provider', 'whatsapp')
            .eq('provider_id', businessPhoneNumberId) // Salviamo questo ID nel provider_id in settings
            .single()

        if (!channel) return NextResponse.json({ error: 'WhatsApp Channel not found in IntegraOS' }, { status: 404 })

        // 2. Registra o trova il Contatto nel CRM (utilizzando il numero di telefono)
        let { data: contact } = await supabase
            .from('inbox_contacts')
            .select('*')
            .eq('channel_id', channel.id)
            .eq('external_id', waPhoneNumber)
            .single()

        if (!contact) {
            const { data: newContact } = await supabase.from('inbox_contacts').insert({
                user_id: channel.user_id,
                channel_id: channel.id,
                external_id: waPhoneNumber,
                phone: '+' + waPhoneNumber,
                name: senderName
            }).select().single()
            contact = newContact
        }

        // 3. Salva Inbound Message
        await supabase.from('inbox_messages').insert({
            user_id: channel.user_id,
            channel_id: channel.id,
            inbox_contact_id: contact.id,
            direction: 'inbound',
            message_type: message.type === 'text' ? 'text' : 'attachment',
            content: waText,
            external_message_id: waMessageId
        })
        
        // 4. Fatturazione (WhatsApp = CANALE A PAGAMENTO)
        // Addebita costo Premium (+50% di markup calcolato su utils/billing)
        await trackUsage(channel.user_id, 'inbox_message_paid', 1)

        // 5. Auto-Responder AI (GEMINI PRO)
        if (channel.bot_enabled && channel.access_token) {
            let replyText = "Mi dispiace, ma non riesco a rispondere in questo momento."

            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
                const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

                const { data: historyMsgs } = await supabase.from('inbox_messages')
                    .select('direction, content')
                    .eq('inbox_contact_id', contact.id)
                    .order('created_at', { ascending: false })
                    .limit(8)
                
                const chatHistory = historyMsgs ? historyMsgs.reverse().map((m: any) => ({
                    role: m.direction === 'inbound' ? 'user' : 'model',
                    parts: [{ text: m.content || '' }]
                })) : []

                const chat = aiModel.startChat({
                    history: chatHistory,
                    systemInstruction: { role: 'system', parts: [{ text: channel.bot_prompt || 'Sei un assistente commerciale su WhatsApp. Sii breve e diretto.' }]}
                });

                const result = await chat.sendMessage(waText)
                replyText = result.response.text()

            } catch (aiErr: any) {
                console.error("[WA AI ERROR]", aiErr)
                replyText = "Scusami, al momento l'Intelligenza Artificiale è offline. Ti scriverà un operatore il prima possibile."
            }

            // Invia il messaggio tramite Meta Cloud API (WhatsApp)
            await fetch(`https://graph.facebook.com/v19.0/${businessPhoneNumberId}/messages`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channel.access_token}` // Il token Permanente generato su Meta Developers
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: waPhoneNumber,
                    text: { body: replyText }
                })
            })

            // Salva Outbound Message
            await supabase.from('inbox_messages').insert({
                user_id: channel.user_id,
                channel_id: channel.id,
                inbox_contact_id: contact!.id,
                direction: 'outbound',
                content: replyText,
                is_ai_generated: true,
                status: 'delivered'
            })
            
            // Fattura l'invio e il consumo AI (Costo WhatsApp in uscita + Consumo AI Tokens)
            await trackUsage(channel.user_id, 'inbox_message_paid', 1)
            await trackUsage(channel.user_id, 'ai_tokens', 1) 
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (err: any) {
        console.error("[INBOX WA WEBHOOK ERROR]", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
