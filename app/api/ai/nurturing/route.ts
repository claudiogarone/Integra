import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const body = await req.json()
        const { industry, toneOfVoice, customInstructions } = body
        
        const supabase = await createClient()
        
        const authHeader = req.headers.get('Authorization')
        const token = authHeader ? authHeader.replace('Bearer ', '') : null
        
        let user;
        if (token) {
            const { data } = await supabase.auth.getUser(token)
            user = data.user
        } else {
            const { data } = await supabase.auth.getUser()
            user = data.user
        }
        
        if (!user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        const prompt = `Sei un esperto di Marketing Automation e Fidelizzazione Clienti per IntegraOS.
Crea una campagna di "Nurturing" di 4 settimane per un'azienda nel settore: ${industry}.
Il tono di voce deve essere: ${toneOfVoice}.
Istruzioni aggiuntive: ${customInstructions || 'Nessuna'}.

Ogni settimana deve avere un contenuto di alto valore (consiglio, curiosità, regalo o dietro le quinte) da inviare via WhatsApp/Email.
Il testo deve includere il segnaposto {{Nome}} per la personalizzazione.

Rispondi ESCLUSIVAMENTE con un array JSON nel seguente formato:
[
  {
    "id": 1,
    "week": "Settimana 1",
    "date": "Venerdì prossimo",
    "type": "Consiglio/Regalo/...",
    "title": "Titolo accattivante",
    "text": "Contenuto del messaggio..."
  },
  ... (fino alla settimana 4)
]`;

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Pulizia del testo JSON (rimozione markdown se presente)
        let campaignData = [];
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
            campaignData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanedText)
        } catch (e) {
            console.error("❌ ERRORE PARSING JSON CAMPAGNA:", e)
            throw new Error("L'AI ha risposto con un formato non valido. Riprova.")
        }

        // Salvataggio su Supabase (opzionale, ma consigliato per persistenza)
        const { data: campaign, error: saveError } = await supabase
            .from('nurturing_campaigns')
            .insert({
                user_id: user.id,
                industry: industry,
                tone: toneOfVoice,
                content: campaignData
            })
            .select()
            .single()

        if (saveError) {
            console.error("❌ Errore salvataggio campagna:", saveError.message)
            // Se la tabella non esiste, ritorniamo comunque il dato all'utente
        }

        return NextResponse.json({ 
            success: true, 
            campaign: campaignData,
            id: campaign?.id
        })

    } catch (error: any) {
        console.error("❌ NURTURING ENGINE ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
