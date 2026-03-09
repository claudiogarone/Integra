import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, target, settore, companyName, city, budget, selectedPartner, plan } = body; 

        const apiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
        if (!apiKey) return NextResponse.json({ error: "Chiave GEMINI mancante." }, { status: 500 });

        let prompt = "";

        if (type === 'copy') {
            prompt = `Sei un copywriter esperto di marketing. Azienda: ${companyName || 'Azienda'}. Settore: ${settore}. Target: ${target}.
            Scrivi il testo per un volantino/post social accattivante.
            Regole: Titolo max 5 parole d'impatto. Descrizione max 20 parole persuasive con Call to Action.
            Rispondi ESATTAMENTE con questo JSON: { "title": "...", "desc": "..." }`;
        } 
        else if (type === 'mediaplan') {
            const partnerInstruction = selectedPartner ? `DEVI OBBLIGATORIAMENTE includere "${selectedPartner}" come uno dei canali principali, allocandogli una parte logica del budget.` : '';

            prompt = `Sei un media planner senior. Crea una strategia di marketing locale e dettagliata per l'azienda "${companyName || 'Azienda'}".
            Città di riferimento: ${city}. Budget a disposizione: €${budget}.
            Suddividi questo budget tra i canali locali.
            ${partnerInstruction}
            Regole: Fornisci una strategia dettagliata e un piano d'azione diviso per le 4 settimane del mese.
            Rispondi ESATTAMENTE con questo JSON strutturato così:
            {
                "strategy": "Spiegazione strategica molto dettagliata (minimo 60 parole) su come dominare il mercato a ${city} ottimizzando il budget.",
                "allocations": [
                    { "channel": "Nome Canale 1", "amount": importo_numerico, "roi": "Stima (es. +15% visite)" },
                    { "channel": "Nome Canale 2", "amount": importo_numerico, "roi": "..." }
                ],
                "weekly_plan": [
                    { "week": "Settimana 1 - Lancio", "action": "Cosa fare la prima settimana..." },
                    { "week": "Settimana 2 - Ottimizzazione", "action": "Cosa fare la seconda settimana..." },
                    { "week": "Settimana 3 - Retargeting", "action": "Cosa fare la terza settimana..." },
                    { "week": "Settimana 4 - Analisi e Chiusura", "action": "Cosa fare la quarta settimana..." }
                ]
            }`;
        }
        else if (type === 'radar') {
            // DECIDIAMO IL NUMERO DI PROPOSTE IN BASE AL PIANO DELL'UTENTE
            let numResults = 4; // Base
            if (plan === 'Enterprise') numResults = 8;
            if (plan === 'Ambassador') numResults = 12;

            prompt = `Sei un esperto di media locali italiani. Trova ${numResults} mezzi di comunicazione principali reali (o molto realistici) per fare pubblicità locale nella città di: ${city}.
            Includi Radio della zona, Giornali locali, opzioni Outdoor (Affissioni) e TV/Web locale.
            Rispondi ESATTAMENTE con questo JSON:
            {
                "media": [
                    { "id": 1, "type": "Radio", "name": "Nome Radio (es. Radio Marte se a Napoli)", "reach": "es. 50.000 ascoltatori", "cost": "Medio-Basso", "match": 90 },
                    ... restituisci ESATTAMENTE ${numResults} oggetti formattati in questo modo.
                ]
            }`;
        }

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        const rawText = await res.text();
        if (!res.ok) throw new Error("Errore Google API");

        const result = JSON.parse(rawText);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) throw new Error("Nessuna risposta generata.");

        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(cleanJson), { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}