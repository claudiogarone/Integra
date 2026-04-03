import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

// ============================================================================
// SISTEMA DI EMBEDDING A CASCATA (Stessa logica di /api/ai/train)
// Livello 1: Google Gemini (gemini-embedding-001) — gratuito se disponibile
// Livello 2: HuggingFace Router (all-mpnet-base-v2, 768 dim) — gratuito con token
// Livello 3: Errore diagnostico pulito
// ============================================================================

type EmbeddingResult = {
    values: number[];
    provider: 'google' | 'huggingface';
};

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
                console.log(`✅ [GOOGLE] Embedding query generato con ${modelName}`);
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

        // Gestione cold-start (503)
        if (response.status === 503) {
            const body = await response.json().catch(() => ({}));
            const estimatedTime = body?.estimated_time || 20;
            const waitTime = Math.min(estimatedTime * 1000, 30000);
            console.log(`⏳ [HUGGINGFACE] Modello in caricamento, attendo ${(waitTime / 1000).toFixed(0)}s...`);

            await new Promise(resolve => setTimeout(resolve, waitTime));

            const retryResponse = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ inputs: text, options: { wait_for_model: true } })
            });

            if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                const embedding = extractHuggingFaceVector(retryData);
                if (embedding) {
                    console.log(`✅ [HUGGINGFACE] Embedding query generato al secondo tentativo`);
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
            console.log(`✅ [HUGGINGFACE] Embedding query generato con ${model}`);
            return { values: embedding, provider: 'huggingface' };
        }

        console.warn('⚠️ [HUGGINGFACE] Formato risposta non riconosciuto');
        return null;
    } catch (err: any) {
        console.warn(`⚠️ [HUGGINGFACE] Errore di rete: ${err.message}`);
        return null;
    }
}

function extractHuggingFaceVector(data: any): number[] | null {
    if (!data) return null;
    if (Array.isArray(data) && typeof data[0] === 'number') return data;
    if (Array.isArray(data) && Array.isArray(data[0]) && typeof data[0][0] === 'number') return data[0];
    return null;
}

async function generateEmbedding(text: string, geminiKey: string): Promise<EmbeddingResult> {
    // LIVELLO 1: Google Gemini
    const googleResult = await tryGoogleEmbedding(text, geminiKey);
    if (googleResult) return googleResult;

    // LIVELLO 2: HuggingFace
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
// ROUTE HANDLER — POST /api/ai/rag-chat
// ============================================================================

export async function POST(request: Request) {
    try {
        const { prompt, namespace = 'default-company' } = await request.json();

        const pineconeKey = process.env.PINECONE_API_KEY?.replace(/['"]/g, '').trim();
        const geminiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!pineconeKey || !geminiKey) {
            return NextResponse.json(
                { error: 'Errore di sistema: Chiavi API mancanti (PINECONE_API_KEY, GEMINI_API_KEY).' },
                { status: 500 }
            );
        }

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');

        // 1. Generiamo il vettore della domanda (con fallback a cascata)
        console.log('🔍 [RAG-CHAT] Genero embedding per la domanda...');
        const queryResult = await generateEmbedding(prompt, geminiKey);
        const queryEmbedding = queryResult.values;

        // 2. Cerchiamo nei ricordi dell'Azienda su Pinecone
        const queryResponse = await index.namespace(namespace).query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true
        });

        // Filtra i match con score troppo basso (vettori incompatibili o irrilevanti)
        const relevantMatches = queryResponse.matches.filter(m => (m.score || 0) > 0.3);
        const context = relevantMatches.map(m => m.metadata?.text).filter(Boolean).join('\n\n');

        // LOG DIAGNOSTICO: Mostra esattamente cosa viene passato all'AI
        console.log(`📎 [RAG-CHAT] Match Pinecone: ${queryResponse.matches.length} totali, ${relevantMatches.length} rilevanti (score > 0.3)`);
        if (relevantMatches.length > 0) {
            relevantMatches.forEach((m, i) => console.log(`   📄 Match ${i + 1}: score=${m.score?.toFixed(3)} | "${String(m.metadata?.text || '').substring(0, 80)}..."`));
        }
        console.log(`📝 [RAG-CHAT] Contesto inviato all'AI: ${context.length} caratteri`);

        const finalPrompt = `Sei l'Assistente Virtuale ufficiale di questa azienda. Rispondi SEMPRE in italiano.
Rispondi in modo gentile, persuasivo e professionale, usando ESCLUSIVAMENTE le informazioni aziendali fornite qui sotto.
Se trovi l'informazione richiesta nei dati, rispondi in modo completo e utile.
Se l'informazione NON è presente, rispondi: "Mi dispiace, non ho questa informazione specifica. Ti invito a contattare direttamente un nostro operatore."

DATI AZIENDALI DISPONIBILI:
---
${context || 'Nessun dato aziendale trovato nel database.'}
---

DOMANDA DEL CLIENTE: ${prompt}`;

        // 3. Generazione risposta — cascata modelli Gemini (2.0-flash → 1.5-flash)
        const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        let responseText = '';
        let generationSuccess = false;

        for (const model of modelsToTry) {
            try {
                console.log(`🤖 [RAG-CHAT] Provo generazione con ${model}...`);
                const chatRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
                            generationConfig: { temperature: 0.1 }
                        })
                    }
                );

                if (!chatRes.ok) {
                    const errBody = await chatRes.text();
                    console.warn(`⚠️ [RAG-CHAT] ${model} ha risposto ${chatRes.status}: ${errBody.substring(0, 200)}`);
                    continue; // Prova il prossimo modello
                }

                const chatData = await chatRes.json();
                const text = chatData.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text && text.trim().length > 0) {
                    responseText = text;
                    generationSuccess = true;
                    console.log(`✅ [RAG-CHAT] Risposta generata con ${model}`);
                    break;
                } else {
                    console.warn(`⚠️ [RAG-CHAT] ${model}: risposta vuota o formato inaspettato`);
                }
            } catch (modelErr: any) {
                console.warn(`⚠️ [RAG-CHAT] ${model} errore: ${modelErr.message}`);
            }
        }

        // LIVELLO 3: Fallback Anthropic Claude (se Gemini è completamente bloccato)
        if (!generationSuccess) {
            const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
            if (anthropicKey) {
                try {
                    console.log('🔄 [RAG-CHAT] Google bloccato, passo a Claude Haiku 4.5...');
                    const anthropic = new Anthropic({ apiKey: anthropicKey });
                    const claudeRes = await anthropic.messages.create({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 1024,
                        messages: [{ role: 'user', content: finalPrompt }],
                        temperature: 0.1
                    });

                    const claudeText = claudeRes.content?.[0]?.type === 'text'
                        ? claudeRes.content[0].text
                        : null;

                    if (claudeText && claudeText.trim().length > 0) {
                        responseText = claudeText;
                        generationSuccess = true;
                        console.log('✅ [RAG-CHAT] Risposta generata con Claude Haiku (fallback)');
                    } else {
                        console.warn('⚠️ [RAG-CHAT] Claude: risposta vuota');
                    }
                } catch (claudeErr: any) {
                    const errMsg = claudeErr?.message || claudeErr?.error?.message || String(claudeErr);
                    const statusCode = claudeErr?.status || claudeErr?.statusCode || '';
                    console.error(`❌ [RAG-CHAT] Claude ERRORE (${statusCode}): ${errMsg}`);
                    
                    // Mostra l'errore esatto all'utente così può diagnosticare
                    responseText = `⚠️ Google Gemini è bloccato e anche Anthropic Claude ha restituito un errore (${statusCode}): ${errMsg}. Verifica che la tua ANTHROPIC_API_KEY abbia credito attivo su console.anthropic.com.`;
                }
            } else {
                console.warn('⚠️ [RAG-CHAT] ANTHROPIC_API_KEY non trovata in .env.local');
                responseText = '⚠️ Google Gemini è bloccato (quota/regione EU). Aggiungi ANTHROPIC_API_KEY nel file .env.local per attivare il fallback su Claude.';
            }
        }

        console.log(`✅ [RAG-CHAT] Risposta generata. Embedding via: ${queryResult.provider.toUpperCase()}, Contesto rilevante: ${relevantMatches.length > 0}`);

        return NextResponse.json({
            response: responseText,
            contextFound: relevantMatches.length > 0,
            embeddingProvider: queryResult.provider
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [RAG-CHAT] ERRORE:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}