import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { text, namespace = 'default-company' } = await request.json();
        
        const pineconeKey = process.env.PINECONE_API_KEY?.replace(/['"]/g, '').trim();
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) {
            return NextResponse.json({ error: 'Chiavi API mancanti nel sistema (.env.local).' }, { status: 500 });
        }

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        const chunks = text.split('\n\n').filter((c: string) => c.trim().length > 20);
        
        if (chunks.length === 0) return NextResponse.json({ error: 'Nessun testo valido o file trovato da memorizzare.' }, { status: 400 });

        const vectors = await Promise.all(chunks.map(async (chunk: string, i: number) => {
            
            // I due modelli supportati ufficialmente (Il nuovo e il vecchio indistruttibile)
            const modelsToTry = ["text-embedding-004", "embedding-001"];

            let data = null;
            let lastError = "";

            for (const modelName of modelsToTry) {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${geminiKey}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        model: `models/${modelName}`, // ⚠️ IL FIX È QUI: Google lo pretende anche dentro il Body!
                        content: { parts: [{ text: chunk }] } 
                    })
                });

                if (response.ok) {
                    data = await response.json();
                    console.log(`✅ Vettore generato con successo usando il modello: ${modelName}`);
                    break; // Successo! Trovato il server giusto.
                } else {
                    lastError = await response.text();
                    console.log(`⚠️ Fallito con ${modelName}, passo al prossimo...`);
                }
            }

            if (!data) {
                console.error("ERRORE GOOGLE FINALE:", lastError);
                throw new Error(`Google ha rifiutato la generazione dei vettori. Errore: ${lastError}`);
            }
            
            return {
                id: `memory-${Date.now()}-${i}`,
                values: data.embedding.values,
                metadata: { text: chunk } 
            };
        }));

        try {
            // @ts-ignore
            await index.namespace(namespace).upsert(vectors);
        } catch (pineconeErr: any) {
            console.error("ERRORE PINECONE:", pineconeErr);
            throw new Error(`Pinecone ha rifiutato il database. Assicurati che l'Index sia Dimensions: 768`);
        }

        return NextResponse.json({ success: true, chunksLearned: vectors.length }, { status: 200 });

    } catch (error: any) {
        console.error("ERRORE FATALE:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}