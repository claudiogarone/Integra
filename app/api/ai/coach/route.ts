import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function POST(req: Request) {
    try {
        const { agentName, metrics } = await req.json()
        
        const prompt = `Sei un esperto High-Level Sales Coach. 
        Analizza le performance di questo agente commerciale:
        
        Nome Agente: ${agentName}
        Metriche attuali:
        - Lead totali gestiti: ${metrics.leads}
        - Conversione in Trattativa: ${metrics.inNegotiationPerc}%
        - Chiusure (Vinti): ${metrics.won}
        - Win Rate Totale: ${metrics.winRate}%
        
        Problema rilevato dall'algoritmo: ${metrics.winRate < 15 ? 'Difficoltà in chiusura' : 'Lentezza nell\'ingaggio iniziale'}.
        
        Genera un feedback strutturato in 3 parti:
        1. STRATEGIA: Un consiglio tecnico su come migliorare la conversione (es: script di telefonata, gestione obiezioni).
        2. TASK: Un compito pratico e misurabile da assegnare all'agente oggi stesso (es: "Fai 5 chiamate entro 10 minuti dal lead").
        3. MOTIVAZIONE: Una frase motivazionale forte e professionale.
        
        Rispondi in formato JSON (solo JSON):
        {
            "strategy": "...",
            "task": "...",
            "problem": "...",
            "winRate": ${metrics.winRate}
        }`

        const result = await model.generateContent(prompt)
        const text = result.response.text()
        
        // Pulizia dell'output JSON se Gemini include markdown
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const coachData = JSON.parse(cleaned)

        return NextResponse.json(coachData)

    } catch (error: any) {
        console.error("❌ AI COACH ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
