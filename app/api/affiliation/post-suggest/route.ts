import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        const { affiliateName, affiliateDesc, hostName, hostIndustry } = await req.json()
        
        const prompt = `Sei un esperto di Social Media Marketing. 
        Scrivi un post coinvolgente per Facebook/Instagram per annunciare una partnership tra la mia azienda (${hostName}) e ${affiliateName}.
        
        Dati Partner (${affiliateName}):
        - Descrizione: ${affiliateDesc}
        
        Dati Host (${hostName}):
        - Settore: ${hostIndustry}
        
        Linee guida:
        - Usa un tono professionale ma amichevole.
        - Usa emoji pertinenti.
        - Includi hashtag strategici.
        - Focus sulla collaborazione, fiducia e qualità.
        - Invita gli utenti a scoprire di più sul partner.
        
        Rispondi solo con il testo del post (pronto per essere copiato).`

        const result = await model.generateContent(prompt)
        const postText = result.response.text()

        return NextResponse.json({ postText })

    } catch (error: any) {
        console.error("❌ AI POST ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
