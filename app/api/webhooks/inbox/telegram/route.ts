import { NextResponse } from 'next/server'
import { trackUsage } from '@/utils/billing'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const url = new URL(req.url)
        const channelId = url.searchParams.get('channel_id')
        
        if (!channelId) {
            return NextResponse.json({ error: 'Missing channel_id' }, { status: 400 })
        }

        const body = await req.json()
        
        // Struttura webhook di Telegram
        const message = body.message || body.edited_message
        if (!message || !message.text) {
            return NextResponse.json({ status: 'ignored', reason: 'No text message' })
        }

        const telegramChatId = message.chat.id.toString()
        const telegramText = message.text
        const senderName = message.from?.first_name || 'Utente Sconosciuto'

        // IMPORTANTE: I webhook non hanno sessione utente (no cookies). 
        // Usiamo la SERVICE_ROLE_KEY per prelevare il canale saltando la protezione RLS che dava "Channel not found".
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Dati Canale Aziendale
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('*')
            .eq('id', channelId)
            .single()

        if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

        // 2. Registra il Contatto o aggiornalo
        let { data: contact, error: contactError } = await supabase
            .from('inbox_contacts')
            .select('*')
            .eq('channel_id', channel.id)
            .eq('external_id', telegramChatId)
            .single()

        if (!contact) {
            const { data: newContact } = await supabase.from('inbox_contacts').insert({
                user_id: channel.user_id,
                channel_id: channel.id,
                external_id: telegramChatId,
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
            message_type: 'text',
            content: telegramText,
            external_message_id: message.message_id.toString()
        })
        
        // 4. Fatturazione (Telegram è free, track come inbox_message_free)
        await trackUsage(channel.user_id, 'inbox_message_free', 1)

        // 5. Auto-Responder AI (GEMINI)
        if (channel.bot_enabled && channel.access_token) {
            let replyText = "Mi dispiace, ma non riesco a rispondere in questo momento."

            try {
                // Recupera API Key di Gemini (dal .env)
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
                const aiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

                // Recupera gli ultimi 8 messaggi come contesto
                const { data: historyMsgs } = await supabase.from('inbox_messages')
                    .select('direction, content')
                    .eq('inbox_contact_id', contact.id)
                    .order('created_at', { ascending: false })
                    .limit(8)
                
                // Gemini si aspetta 'user' e 'model' come role
                const chatHistory = historyMsgs ? historyMsgs.reverse().map(m => ({
                    role: m.direction === 'inbound' ? 'user' : 'model',
                    parts: [{ text: m.content || '' }]
                })) : []

                // Inizializza la chat inserendo il System Prompt
                const chat = aiModel.startChat({
                    history: chatHistory,
                    systemInstruction: { role: 'system', parts: [{ text: channel.bot_prompt || 'Sei un assistente AI cordiale e professionale.' }]}
                });

                // Genera la risposta dell'intelligenza artificiale
                const result = await chat.sendMessage(telegramText)
                replyText = result.response.text()

            } catch (aiErr: any) {
                console.error("[INBOX AI ERROR]", aiErr)
                replyText = "Scusami, al momento l'Intelligenza Artificiale è offline. Ti risponderà un umano al più presto."
            }

            // Manda messaggio a Telegram
            await fetch(`https://api.telegram.org/bot${channel.access_token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: replyText
                })
            })

            // Salva Outbound Message
            await supabase.from('inbox_messages').insert({
                user_id: channel.user_id,
                channel_id: channel.id,
                inbox_contact_id: contact.id,
                direction: 'outbound',
                content: replyText,
                is_ai_generated: true,
                status: 'delivered'
            })
            
            // Fattura l'invio e il consumo AI
            await trackUsage(channel.user_id, 'inbox_message_free', 1)
            await trackUsage(channel.user_id, 'ai_tokens', 1) // Tracciamo anche il consumo AI di base
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error("[INBOX WEBHOOK ERROR]", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
