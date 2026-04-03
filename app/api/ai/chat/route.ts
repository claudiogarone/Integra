import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { sendMessage } from '@/app/actions/chatwoot'
import { trackUsage } from '@/utils/billing'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function POST(req: Request) {
    try {
        const body = await req.json()
        
        // 1. Filtro: Rispondi solo ai messaggi in entrata dai clienti
        if (body.event !== 'message_created' || body.message_type !== 'incoming') {
            return NextResponse.json({ skipped: true })
        }

        const conversationId = body.conversation.id
        const content = body.content
        const accountId = body.account.id
        
        // Trova l'utente proprietario della conversazione per addebitare i costi
        const supabase = await createClient()
        // In un sistema multi-tenant reale, cerchiamo il tenant_id associato all'account Chatwoot
        // Supponiamo che l'API_KEY sia legata a un profilo specifico
        const { data: profile } = await supabase.from('profiles').select('id, ai_reply_enabled').single()

        if (!profile?.ai_reply_enabled) {
            return NextResponse.json({ ai_disabled: true })
        }

        // 2. Generazione Risposta AI con Gemini
        const prompt = `Sei un assistente virtuale professionale per IntegraOS. 
        Rispondi in modo conciso e utile al cliente.
        Messaggio del cliente: "${content}"
        Risposta:`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const aiText = response.text()

        // 3. Invia risposta a Chatwoot
        await sendMessage(conversationId, aiText)

        // 4. Fatturazione (Markup 40% gi\u00e0 incluso in trackUsage)
        await trackUsage(profile.id, 'chat_message', 1)

        return NextResponse.json({ success: true, ai_response: aiText })

    } catch (error: any) {
        console.error("❌ CHAT AI ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
