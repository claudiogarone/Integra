import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, inputs, companyName } = body;

        const apiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
        if (!apiKey) return NextResponse.json({ error: "Chiave GEMINI mancante." }, { status: 500 });

        let prompt = "";

        if (type === 'packaging') {
            prompt = `Sei un Packaging Designer esperto e Analista di Mercato. 
            Prodotto: ${inputs.productType}. Target: ${inputs.targetAudience}. Stile: ${inputs.vibe}. Azienda: ${companyName}.
            Esegui un'analisi strategica del packaging e proponi il design ideale.
            
            Rispondi ESATTAMENTE con questo JSON:
            {
                "title": "Analisi Packaging: ${inputs.productType}",
                "score": 85,
                "rationale": "Spiegazione tecnica e strategica del perché questo design attirerà il target ${inputs.targetAudience}.",
                "recommendation": "Dettaglio sui materiali (es. carta riciclata, vetro ambrato) e finiture.",
                "images": [
                    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80\u0026w=600\u0026h=600",
                    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80\u0026w=600\u0026h=600"
                ]
            }`;
        } 
        else if (type === 'rebranding') {
            prompt = `Sei un esperto di Brand Identity e Neuromarketing.
            Valori Aziendali: ${inputs.brandValues}. Stile Desiderato: ${inputs.rebrandStyle}. Azienda: ${companyName}.
            Proponi un piano di rebranding moderno ed efficace.
            
            Rispondi ESATTAMENTE con questo JSON:
            {
                "title": "Rebrand: ${companyName}",
                "score": 90,
                "rationale": "Analisi di come il nuovo logo e il nuovo stile comunicano i valori ${inputs.brandValues}.",
                "visual_guide": "Suggerimenti su palette colori (es. #00665E, #f8fafc) e tipografia suggerita.",
                "images": [
                    "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80\u0026w=600\u0026h=600",
                    "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80\u0026w=600\u0026h=600"
                ]
            }`;
        }
        else if (type === 'neuromarketing') {
            prompt = `Sei un esperto di Neuromarketing ed Eye-Tracking. 
            Asset da analizzare: ${inputs.selectedCampaign || inputs.fileName}. Azienda: ${companyName}.
            Simula un'analisi di eye-tracking sull'asset fornito e indica i punti di forza e debolezza.
            
            Rispondi ESATTAMENTE con questo JSON:
            {
                "title": "Report Neuromarketing: ${inputs.selectedCampaign || inputs.fileName}",
                "score": 75,
                "rationale": "Analisi dettagliata di dove cadrà lo sguardo dell'utente e perché la CTA è efficace o meno.",
                "heatmap_data": "Zone ad alto calore: Titolo, Volto, Logo. Zone fredde: Footer.",
                "images": [
                    "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80\u0026w=800\u0026h=500"
                ]
            }`;
        }

        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResponse) throw new Error("Nessuna risposta dall'AI.");

        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return NextResponse.json(JSON.parse(cleanJson), { status: 200 });

    } catch (error: any) {
        console.error('❌ [CREATIVE-STUDIO AI-ERROR]:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
