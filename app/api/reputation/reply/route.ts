import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const { reviewText, reviewerName, rating, sentiment, platform } = await request.json()

        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) {
            // Demo fallback
            const demoReply = rating >= 4
                ? `Gentile ${reviewerName}, la ringraziamo di cuore per la sua recensione su ${platform}! È una grande soddisfazione sapere che abbiamo soddisfatto le sue aspettative. Siamo sempre al lavoro per migliorare i nostri servizi e il suo feedback è prezioso. Speriamo di rivederla presto!\n\nCordialmente,\nIl Team`
                : `Gentile ${reviewerName}, la ringraziamo per aver condiviso il suo feedback su ${platform}. Ci dispiace sinceramente che la sua esperienza non sia stata all'altezza delle sue aspettative. Tenga conto che il suo parere è fondamentale per noi: la invitiamo a contattarci direttamente per trovare insieme la soluzione migliore.\n\nCordialmente,\nIl Team`
            return NextResponse.json({ reply: demoReply })
        }

        const toneHint = rating >= 4 ? 'caloroso e grato' : rating === 3 ? 'professionale e costruttivo' : 'empatico e orientato alla risoluzione del problema'
        const prompt = `Sei il responsabile della comunicazione di un'azienda italiana professionale. Scrivi una risposta a questa recensione su ${platform}.

DATI:
- Nome Recensore: ${reviewerName}
- Voto: ${rating}/5
- Sentiment: ${sentiment}
- Testo recensione: "${reviewText || 'Nessun testo fornito'}"

ISTRUZIONI:
- Tono: ${toneHint}
- Rispondi in italiano, in modo professionale e personalizzato
- Se rating >= 4: ringrazia, rafforza il brand, invita a tornare
- Se rating <= 2: esprimi rammarico, proponi soluzione, chiedi di contattarti direttamente
- Se rating = 3: ringrazia, mostra impegno al miglioramento
- Massimo 100 parole
- Firma come "Il Team" senza il nome dell'azienda
- NON usare emoji`

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })

        const data = await response.json()
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gentile cliente, grazie per il suo feedback. Lo utilizzeremo per migliorare continuamente i nostri servizi.\n\nCordialmente, Il Team'

        return NextResponse.json({ reply: reply.trim() })

    } catch (error: any) {
        console.error('Reputation reply error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
