import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

// ============================================================================
// SISTEMA DI EMBEDDING A CASCATA (Fallback Multi-Provider)
// Livello 1: Google Gemini (gemini-embedding-001) — gratuito se disponibile
// Livello 2: HuggingFace Router (all-mpnet-base-v2, 768 dim) — gratuito con token
// Livello 3: Errore diagnostico pulito
// ============================================================================

type EmbeddingResult = {
    values: number[];
    provider: 'google' | 'huggingface';
};

/**
 * Tenta di generare un embedding con Google Gemini (gemini-embedding-001).
 * Ritorna null se fallisce (404 regionale EU, rate limit, ecc.)
 */
async function tryGoogleEmbedding(text: string, geminiKey: string): Promise<EmbeddingResult | null> {
    const modelName = 'gemini-embedding-001';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${geminiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${modelName}`,
                content: { parts: [{ text }] },
                outputDimensionality: 768
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data?.embedding?.values && Array.isArray(data.embedding.values)) {
                console.log(`✅ [GOOGLE] Embedding generato con ${modelName} (${data.embedding.values.length} dim)`);
                return { values: data.embedding.values, provider: 'google' };
            }
        }

        const errorText = await response.text();
        console.warn(`⚠️ [GOOGLE] ${modelName} ha risposto ${response.status}: ${errorText.substring(0, 200)}`);
        return null;
    } catch (err: any) {
        console.warn(`⚠️ [GOOGLE] Errore di rete: ${err.message}`);
        return null;
    }
}

/**
 * Fallback: genera un embedding con HuggingFace Router API.
 * NUOVO ENDPOINT (2026): https://router.huggingface.co/hf-inference/models/{model}/pipeline/feature-extraction
 * Modello: sentence-transformers/all-mpnet-base-v2 → 768 dimensioni esatte.
 * RICHIEDE: HUGGINGFACE_API_KEY nel file .env.local
 */
async function tryHuggingFaceEmbedding(text: string): Promise<EmbeddingResult | null> {
    const hfToken = process.env.HUGGINGFACE_API_KEY?.trim();

    if (!hfToken) {
        console.warn('⚠️ [HUGGINGFACE] HUGGINGFACE_API_KEY non trovata in .env.local. Fallback HuggingFace disattivato.');
        console.warn('💡 [HUGGINGFACE] Crea un token GRATUITO su https://huggingface.co/settings/tokens e aggiungilo come HUGGINGFACE_API_KEY=hf_xxx nel file .env.local');
        return null;
    }

    const model = 'sentence-transformers/all-mpnet-base-v2';
    const url = `https://router.huggingface.co/hf-inference/models/${model}/pipeline/feature-extraction`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hfToken}`
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                inputs: text,
                options: { wait_for_model: true }
            })
        });

        // Gestione cold-start (503) — il modello si sta caricando
        if (response.status === 503) {
            const body = await response.json().catch(() => ({}));
            const estimatedTime = body?.estimated_time || 20;
            const waitTime = Math.min(estimatedTime * 1000, 30000); // Max 30 secondi
            console.log(`⏳ [HUGGINGFACE] Modello in caricamento, attendo ${(waitTime / 1000).toFixed(0)}s...`);

            await new Promise(resolve => setTimeout(resolve, waitTime));

            // Secondo tentativo dopo il cold-start
            const retryResponse = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
            });

            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const embedding = extractHuggingFaceVector(retryData);
                if (embedding) {
                    console.log(`✅ [HUGGINGFACE] Embedding generato al secondo tentativo (${embedding.length} dim)`);
                    return { values: embedding, provider: 'huggingface' };
                }
            }

            const retryErr = await retryResponse.text().catch(() => 'Nessun dettaglio');
            console.warn(`⚠️ [HUGGINGFACE] Secondo tentativo fallito (${retryResponse.status}): ${retryErr.substring(0, 200)}`);
            return null;
        }

        // Gestione rate-limit (429)
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            console.warn(`⚠️ [HUGGINGFACE] Rate limit raggiunto (429). Retry-After: ${retryAfter || 'non specificato'}`);
            return null;
        }

        // Errore generico
        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️ [HUGGINGFACE] Errore ${response.status}: ${errorText.substring(0, 300)}`);
            return null;
        }

        const data = await response.json();
        const embedding = extractHuggingFaceVector(data);

        if (embedding) {
            console.log(`✅ [HUGGINGFACE] Embedding generato con ${model} (${embedding.length} dim)`);
            return { values: embedding, provider: 'huggingface' };
        }

        console.warn('⚠️ [HUGGINGFACE] Formato risposta non riconosciuto');
        return null;
    } catch (err: any) {
        console.warn(`⚠️ [HUGGINGFACE] Errore di rete: ${err.message}`);
        return null;
    }
}

/**
 * Estrae il vettore dal formato di risposta HuggingFace (gestisce varianti).
 * HuggingFace può restituire: [768 floats] oppure [[768 floats]]
 */
function extractHuggingFaceVector(data: any): number[] | null {
    if (!data) return null;
    if (Array.isArray(data) && typeof data[0] === 'number') return data;
    if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === 'number') return data[0];
    return null;
}

/**
 * Funzione principale: tenta Google → poi HuggingFace → poi errore pulito.
 */
async function generateEmbedding(text: string, geminiKey: string): Promise<EmbeddingResult> {
    // LIVELLO 1: Google Gemini
    const googleResult = await tryGoogleEmbedding(text, geminiKey);
    if (googleResult) return googleResult;

    // LIVELLO 2: HuggingFace (fallback con token)
    console.log('🔄 [FALLBACK] Google non disponibile, passo a HuggingFace...');
    const hfResult = await tryHuggingFaceEmbedding(text);
    if (hfResult) return hfResult;

    // LIVELLO 3: Errore diagnostico
    const hasHfKey = !!process.env.HUGGINGFACE_API_KEY?.trim();
    throw new Error(
        hasHfKey
            ? 'Nessun servizio di embedding disponibile. Google Gemini è bloccato (EU/quota) e HuggingFace non ha risposto. Riprova tra qualche minuto.'
            : 'Google Gemini è bloccato nella tua regione (EU). Per attivare il fallback automatico, crea un token GRATUITO su huggingface.co/settings/tokens e aggiungilo nel file .env.local come: HUGGINGFACE_API_KEY=hf_xxxxxxxxx — poi riavvia il server.'
    );
}

// ============================================================================
// ROUTE HANDLER — POST /api/ai/train
// ============================================================================

export async function POST(request: Request) {
    try {
        const { text, namespace = 'default-company' } = await request.json();

        const pineconeKey = process.env.PINECONE_API_KEY?.replace(/['"]/g, '').trim();
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) {
            return NextResponse.json(
                { error: 'Chiavi API mancanti nel sistema (.env.local). Servono PINECONE_API_KEY e GEMINI_API_KEY.' },
                { status: 500 }
            );
        }

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // Chunking del testo in paragrafi
        const chunks = text.split('\n\n').filter((c: string) => c.trim().length > 20);

        if (chunks.length === 0) {
            return NextResponse.json(
                { error: 'Nessun testo valido o file trovato da memorizzare.' },
                { status: 400 }
            );
        }

        console.log(`📚 [TRAIN] Inizio addestramento: ${chunks.length} paragrafi da elaborare`);

        let embeddingProvider = '';
        let failedChunks = 0;

        // Generiamo i vettori per ogni chunk — ogni chunk è protetto individualmente
        const rawVectors = await Promise.all(
            chunks.map(async (chunk: string, i: number) => {
                try {
                    const result = await generateEmbedding(chunk, geminiKey);
                    embeddingProvider = result.provider;

                    // Validazione: assicuriamoci che values sia un array non vuoto di numeri
                    if (!result.values || !Array.isArray(result.values) || result.values.length === 0) {
                        console.warn(`⚠️ [TRAIN] Chunk ${i}: embedding vuoto o invalido, salto.`);
                        failedChunks++;
                        return null;
                    }

                    console.log(`   📄 Chunk ${i + 1}/${chunks.length}: OK (${result.values.length} dim via ${result.provider})`);

                    return {
                        id: `memory-${Date.now()}-${i}`,
                        values: result.values,
                        metadata: { text: chunk }
                    };
                } catch (chunkErr: any) {
                    console.warn(`⚠️ [TRAIN] Chunk ${i} fallito: ${chunkErr.message}`);
                    failedChunks++;
                    return null;
                }
            })
        );

        // Filtro di sicurezza: rimuovi null, undefined e vettori con values vuoti
        const validVectors = rawVectors.filter(
            (v): v is { id: string; values: number[]; metadata: { text: string } } =>
                v !== null && v !== undefined && Array.isArray(v.values) && v.values.length > 0
        );

        console.log(`📊 [TRAIN] Risultato: ${validVectors.length} vettori validi su ${chunks.length} paragrafi (${failedChunks} falliti)`);

        // Controllo pre-upsert: non chiamare Pinecone con array vuoto
        if (validVectors.length === 0) {
            throw new Error(
                `Nessun vettore valido generato da salvare. ${failedChunks} paragrafi su ${chunks.length} sono falliti. ` +
                'Possibile causa: errore del provider di embedding (Google bloccato in EU + HuggingFace non disponibile). ' +
                'Verifica che HUGGINGFACE_API_KEY sia corretto nel file .env.local e riprova.'
            );
        }

        // Salvataggio su Pinecone — SOLO con vettori validati
        try {
            await index.namespace(namespace).upsert({ records: validVectors });
        } catch (pineconeErr: any) {
            console.error('❌ [PINECONE] Errore:', pineconeErr);
            throw new Error(
                `Pinecone ha rifiutato i vettori (${validVectors.length} record, ${validVectors[0]?.values?.length || '?'} dimensioni). ` +
                `Assicurati che l'Index 'integraos-brain' abbia Dimensions: 768. Dettaglio: ${pineconeErr.message}`
            );
        }

        console.log(`✅ [TRAIN] Addestramento completato! ${validVectors.length} vettori salvati via ${embeddingProvider.toUpperCase()}`);

        return NextResponse.json({
            success: true,
            chunksLearned: validVectors.length,
            failedChunks,
            provider: embeddingProvider
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [TRAIN] ERRORE FATALE:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}