import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { text, namespace = 'default-company' } = await request.json();
        
        const pineconeKey = process.env.PINECONE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) {
            return NextResponse.json({ error: 'Chiavi API (Pinecone o Gemini) mancanti nel file .env.local' }, { status: 500 });
        }

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // Spezzetta il testo in piccoli blocchi logici (Chunks)
        const chunks = text.split('\n\n').filter((c: string) => c.trim().length > 20);
        
        if (chunks.length === 0) return NextResponse.json({ error: 'Testo troppo breve.' }, { status: 400 });

        // Trasforma il testo in Vettori tramite Gemini
        const vectors = await Promise.all(chunks.map(async (chunk: string, i: number) => {
            const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: chunk }] }
                })
            });
            
            if (!embedRes.ok) throw new Error("Errore generazione Embedding con Gemini");
            
            const embedData = await embedRes.json();
            const embedding = embedData.embedding.values;

            return {
                id: `chunk-${Date.now()}-${i}`,
                values: embedding,
                metadata: { text: chunk } // Salva la frase originale per poterla rileggere!
            };
        }));

        // Carica su Pinecone
        await index.namespace(namespace).upsert({ records: vectors });

        return NextResponse.json({ success: true, chunksLearned: vectors.length }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}