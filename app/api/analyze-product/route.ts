import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'Immagine mancante. Riprova a caricare la foto.' }, { status: 400 });
        }

        const matches = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: 'Il formato della foto non è valido.' }, { status: 400 });
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];

        // ⚠️ ORA LEGGE DAL FILE .env.local IN MODO SICURO
        // Il replace rimuove eventuali virgolette singole o doppie messe per sbaglio
        const apiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

        if (!apiKey || apiKey === '') {
            return NextResponse.json({ error: "Chiave GEMINI_API_KEY non trovata nel file .env.local! Ricorda di riavviare il server." }, { status: 500 });
        }

        const prompt = "Sei un copywriter esperto. Analizza questa immagine e restituisci ESATTAMENTE un JSON con: 1) 'name' (nome accattivante), 2) 'description' (breve descrizione persuasiva), 3) 'price' (stima prezzo, solo numero), 4) 'category' (Scegli tra: Elettronica, Abbigliamento, Accessori, Casa, Servizi, Alimentari, Altro).";

        const payload = {
            contents: [{ 
                role: "user", 
                parts: [ 
                    { text: prompt }, 
                    { inlineData: { mimeType, data: base64Data } } 
                ] 
            }],
            generationConfig: { responseMimeType: "application/json" }
        };

        // L'URL ESATTO E FUNZIONANTE
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey // CHIAVE CARICATA DAL .ENV E INSERITA NELL'HEADER
            },
            body: JSON.stringify(payload),
            cache: 'no-store' 
        });
        
        const rawText = await res.text();

        if (!res.ok) {
            console.error("GOOGLE RAW ERROR:", rawText);
            return NextResponse.json({ 
                error: `RISPOSTA DI GOOGLE (Status ${res.status}): ${rawText}` 
            }, { status: 400 });
        }

        const result = JSON.parse(rawText);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) {
            return NextResponse.json({ error: "Google non ha generato nessun testo utile." }, { status: 500 });
        }

        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(cleanJson), { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: `CRASH INTERNO: ${error.message}` }, { status: 500 });
    }
}