import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

// POST: Gemini AI analizza i dati CRM e genera insight
export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY mancante' }, { status: 500 })

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

        const body = await req.json()
        const { funnelData, objectives, totalContacts, conversionRate, churnRate, topSources } = body

        const prompt = `Sei un consulente commerciale esperto. Analizza questi dati CRM dell'azienda e fornisci massimo 5 insight operativi concreti in italiano.

DATI FUNNEL:
${JSON.stringify(funnelData)}

OBIETTIVI KPI:
${JSON.stringify(objectives)}

METRICHE:
- Contatti totali: ${totalContacts}
- Tasso di conversione: ${conversionRate}%
- Churn rate: ${churnRate}%
- Fonti principali: ${JSON.stringify(topSources)}

Rispondi in formato JSON con questa struttura:
{
  "insights": [
    {
      "type": "alert|warning|success|info",
      "title": "Titolo breve",
      "description": "Descrizione dell'insight con dati concreti",
      "action": "Azione specifica suggerita"
    }
  ],
  "overall_score": "A+|A|B+|B|C|D",
  "summary": "Riepilogo in 2 righe dello stato commerciale"
}`

        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // Estrai JSON dalla risposta
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return NextResponse.json(parsed)
        }

        return NextResponse.json({ 
            insights: [{ type: 'info', title: 'Analisi generata', description: text, action: 'Rivedi i dati' }],
            overall_score: 'B',
            summary: text.substring(0, 200)
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
