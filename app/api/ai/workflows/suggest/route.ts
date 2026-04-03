import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Raccogliamo statistiche reali per l'AI
        const { count: leadCount } = await supabase.from('hot_leads').select('*', { count: 'exact', head: true })
        // Nota: Assumiamo che ci sia una tabella 'quotes' o simile.
        // Se non c'è, usiamo dati generici per mostrare il funzionamento.
        
        const prompt = `Sei un consulente aziendale AI per la piattaforma IntegraOS. 
        Statistiche attuali dell'utente:
        - Lead totali: ${leadCount || 0}
        - Settore: Automazione Business
        
        Genera una singola frase di consiglio (max 150 caratteri) su quale automazione CRM creare oggi per migliorare le vendite. 
        Sii specifico e professionale. Rispondi solo con il consiglio.`

        const result = await model.generateContent(prompt)
        const suggestion = result.response.text()

        return NextResponse.json({ suggestion })

    } catch (error: any) {
        return NextResponse.json({ suggestion: "Analisi in corso... prova a creare un workflow di follow-up per i nuovi lead." })
    }
}
