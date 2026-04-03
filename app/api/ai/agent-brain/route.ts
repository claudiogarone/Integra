import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { objective, data, type } = await request.json();
        const geminiKey = process.env.GEMINI_API_KEY?.trim();

        if (!geminiKey) {
            return NextResponse.json({ error: 'Manca la chiave GEMINI_API_KEY. AI disattivata.' }, { status: 500 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

        // 1. COSTRUZIONE PROMPT BASATO SUL TIPO DI RICHIESTA (COACH O OBIEZIONE)
        let systemPrompt = '';
        let userPrompt = '';

        if (type === 'objection') {
            systemPrompt = `Sei il Master Negotiator di IntegraOS. Usa tecniche avanzate di persuasione psicologica (come la 'Riorientazione del Valore' o 'Feel-Felt-Found') per smontare l'obiezione del cliente in modo professionale e dominante. Non limitarti a rispondere, 'vendi' la soluzione. Rispondi in modo conciso (massimo 3 frasi).`;
            userPrompt = `Il cliente ha fatto questa obiezione: "${objective}". Come posso rispondere per chiudere la vendita ora?`;
        } else {
            systemPrompt = `Sei l'Elite Business Strategist di IntegraOS. La tua missione è trasformare i dati grezzi in profitto netto. Analizza le metriche dell'utente con precisione chirurgica. Fornisci UN SOLO consiglio ad alto impatto (High-Leverage) che utilizzi l'ecosistema IntegraOS (automazioni, CRM o AI) per scalare oggi stesso. Tono: Professionale, Affilato, Visionario. Rispondi in massimo 3 frasi.`;
            userPrompt = `Ecco i miei dati attuali del business: 
${JSON.stringify(data, null, 2)}
Dammi un consiglio strategico ad alto impatto per raggiungere il mio obiettivo di €${data?.monthlyTarget || 0}.`;
        }

        // 2. CHIAMATA A GEMINI 2.0 FLASH (Ultra veloce per risposte UI-live)
        const chatRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ 
                        role: 'user', 
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
                    }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 250 }
                })
            }
        );

        if (!chatRes.ok) {
            const err = await chatRes.text();
            throw new Error(`Gemini Error: ${err}`);
        }

        const chatData = await chatRes.json();
        const responseText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Non sono riuscito a elaborare un consiglio al momento. Riprova più tardi.";

        return NextResponse.json({ response: responseText }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [AGENT-BRAIN] ERRORE:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
