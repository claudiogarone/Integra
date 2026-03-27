import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { prompt, namespace = 'default-company' } = await request.json();
        
        const pineconeKey = process.env.PINECONE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) {
            return NextResponse.json({ error: 'Chiavi API mancanti' }, { status: 500 });
        }

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // 1. Trasforma la domanda dell'utente in un Vettore (Embedding)
        const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: prompt }] }
            })
        });
        const embedData = await embedRes.json();
        const queryEmbedding = embedData.embedding.values;

        // 2. Cerca nel database Pinecone i paragrafi che "assomigliano" matematicamente alla domanda
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: 4, // Prende i 4 paragrafi più rilevanti che gli abbiamo insegnato
            includeMetadata: true
        });

        // 3. Estrae il testo trovato
        const context = queryResponse.matches.map(m => m.metadata?.text).join('\n\n');

        // 4. Invia la domanda + Il contesto a Gemini per generare la risposta perfetta!
        const finalPrompt = `Sei l'Assistente AI ufficiale dell'azienda. 
DEVI rispondere alla DOMANDA dell'utente in modo altamente professionale, persuasivo e gentile. 
REGOLA FONDAMENTALE: Usa ESCLUSIVAMENTE le informazioni contenute nel CONTESTO AZIENDALE fornito qui sotto. Non inventare prezzi, non inventare servizi.
Se la risposta non è presente nel contesto, rispondi educatamente: "Mi dispiace, ma non ho questa informazione specifica. Ti invito a contattare un nostro operatore umano per i dettagli."

CONTESTO AZIENDALE TROVATO NEL DATABASE:
${context || 'Nessuna informazione specifica trovata.'}

DOMANDA UTENTE:
${prompt}`;

        const chatRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
                generationConfig: { temperature: 0.2 } // Temperatura bassa per renderlo preciso e poco fantasioso
            })
        });

        const chatData = await chatRes.json();
        const responseText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Errore nella generazione.";

        return NextResponse.json({ 
            response: responseText, 
            contextFound: queryResponse.matches.length > 0 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Errore Chat AI:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}