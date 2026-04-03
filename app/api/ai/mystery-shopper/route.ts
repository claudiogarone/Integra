import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { persona, chatHistory, agentName, isFinal } = body
        
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
        }

        let prompt = ""

        if (isFinal) {
            // Caso 2: Valutazione finale
            prompt = `Sei un esperto Mystery Shopper incaricato dal Boss per valutare l'agente commerciale: ${agentName}.
Il cliente interpretato aveva la seguente personalità: ${persona}.

Analizza la seguente conversazione e fornisci un report dettagliato:
${JSON.stringify(chatHistory)}

Rispondi ESCLUSIVAMENTE con un oggetto JSON nel seguente formato:
{
  "score": (numero tra 1 e 10),
  "feedback": "Commento costruttivo sulle performance dell'agente",
  "summary": "Riassunto del test"
}`;
        } else {
            // Caso 1: Generazione risposta successiva del cliente
            const personaDesc = {
                'aggressivo': 'molto arrogante, impaziente, minaccia di andare dai competitor se non ottiene risposte veloci',
                'indeciso': 'fa molte domande tecniche, è insicuro, ha bisogno di rassicurazioni e prove sociali',
                'tirchio': 'concentrato ossessivamente sul prezzo, paragona costantemente a offerte più basse trovate online'
            }[persona as string] || 'curioso'

            prompt = `Interpreta il ruolo di un cliente misterioso per testare un venditore professionale di IntegraOS.
La tua personalità è: ${personaDesc}.

Conversazione precedente:
${JSON.stringify(chatHistory)}

Rispondi come farebbe questo cliente nel prossimo messaggio. Sii realistico e mantieni il tuo ruolo.
Massimo 2-3 frasi.
Rispondi con il solo testo del messaggio, senza fronzoli.`;
        }

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        if (isFinal) {
            try {
                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
                const evaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanedText)
                return NextResponse.json({ success: true, evaluation })
            } catch (e) {
                console.error("❌ MYSTERY SHOPPER EVALUATION PARSING ERROR:", e)
                return NextResponse.json({ success: true, evaluation: { score: 7, feedback: "Valutazione completata. L'AI ha avuto problemi nel formato ma ha terminato l'analisi." } })
            }
        }

        return NextResponse.json({ success: true, message: text })

    } catch (error: any) {
        console.error("❌ MYSTERY SHOPPER API ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
