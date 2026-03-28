import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prompt, namespace = 'default-company' } = await request.json();
        
        const pineconeKey = process.env.PINECONE_API_KEY?.replace(/['"]/g, '').trim();
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) return NextResponse.json({ error: 'Errore di sistema: Chiavi mancanti.' }, { status: 500 });

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // 1. Troviamo le coordinate della domanda
        const modelsToTry = ["text-embedding-004", "embedding-001"];
        let embedData = null;
        
        for (const modelName of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${geminiKey}`;
            const response = await fetch(url, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    model: `models/${modelName}`, // ⚠️ FIX INSERITO ANCHE QUI
                    content: { parts: [{ text: prompt }] } 
                })
            });
            if (response.ok) { embedData = await response.json(); break; }
        }

        if (!embedData) throw new Error("Errore di comprensione della domanda da parte di Google.");

        const queryEmbedding = embedData.embedding.values;

        // 2. Cerchiamo nei ricordi dell'Azienda
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding, topK: 4, includeMetadata: true
        });

        const context = queryResponse.matches.map(m => m.metadata?.text).join('\n\n');

        const finalPrompt = `Sei l'Assistente Virtuale ufficiale di questa azienda.
DEVI rispondere alla DOMANDA in modo gentile, persuasivo e altamente professionale.
REGOLA ASSOLUTA: Usa ESCLUSIVAMENTE le informazioni aziendali presenti qui sotto.
Se la risposta non si trova nelle informazioni fornite, NON inventare nulla. Rispondi: "Mi dispiace, ma non ho questa informazione specifica. Ti invito a contattare direttamente un nostro operatore."

INFORMAZIONI AZIENDALI DISPONIBILI:
${context || 'Nessuna informazione aziendale trovata nel database.'}

DOMANDA DEL CLIENTE:
${prompt}`;

        // 3. Rispondiamo
        const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: finalPrompt }] }], generationConfig: { temperature: 0.1 } })
        });

        const chatData = await chatRes.json();
        const responseText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Errore nella generazione della risposta.";

        return NextResponse.json({ response: responseText, contextFound: queryResponse.matches.length > 0 }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}