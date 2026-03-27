import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prompt, namespace = 'default-company' } = await request.json();
        
        const pineconeKey = process.env.PINECONE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) return NextResponse.json({ error: 'Chiavi API mancanti' }, { status: 500 });

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // Trasforma la domanda in vettore
        const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text: prompt }] } })
        });
        const embedData = await embedRes.json();
        const queryEmbedding = embedData.embedding.values;

        // Cerca i 4 paragrafi più simili alla domanda nel database di Pinecone
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding, topK: 4, includeMetadata: true
        });

        const context = queryResponse.matches.map(m => m.metadata?.text).join('\n\n');

        // Crea il mega-prompt per Gemini
        const finalPrompt = `Sei l'Assistente AI dell'azienda.
DEVI rispondere alla DOMANDA in modo professionale. 
REGOLA D'ORO: Usa ESCLUSIVAMENTE le informazioni presenti nel CONTESTO AZIENDALE qui sotto.
Se la risposta non c'è nel contesto, di': "Mi dispiace, non ho questa informazione. Contatta un operatore umano."

CONTESTO AZIENDALE:
${context || 'Nessuna info trovata.'}

DOMANDA UTENTE:
${prompt}`;

        const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: finalPrompt }] }], generationConfig: { temperature: 0.1 } })
        });

        const chatData = await chatRes.json();
        const responseText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Errore.";

        return NextResponse.json({ response: responseText, contextFound: queryResponse.matches.length > 0 }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}