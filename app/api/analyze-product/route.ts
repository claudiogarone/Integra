import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Inizializza Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Immagine mancante' }, { status: 400 });
    }

    // 1. Pulizia Base64 per Claude
    // Il frontend manda "data:image/jpeg;base64,/9j/4AAQ..."
    // Claude vuole solo "/9j/4AAQ..." e il media type "image/jpeg" separati.
    const matches = imageBase64.match(/^data:((?:image\/(?:png|jpeg|gif|webp)));base64,(.*)$/);

    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: 'Formato immagine non valido' }, { status: 400 });
    }

    const mediaType = matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp"; 
    const data = matches[2];

    // 2. Chiamata a Claude 3 Haiku (Veloce ed Economico)
    // Se vuoi più intelligenza usa: "claude-3-5-sonnet-20240620"
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", 
      max_tokens: 300,
      temperature: 0,
      system: "Sei un assistente esperto di e-commerce. Rispondi SEMPRE e SOLO con un oggetto JSON valido. Non aggiungere saluti o altro testo.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: data,
              },
            },
            {
              type: "text",
              text: "Analizza questa immagine prodotto. Restituisci un JSON puro con questi campi: 'name' (nome breve commerciale in italiano), 'description' (descrizione accattivante di 2 frasi in italiano), 'price' (stima un numero realistico, es 49.99), 'category' (Scegli tra: 'Prodotti', 'Servizi'). Esempio output: {\"name\": \"Scarpe\", \"description\": \"...\", \"price\": \"50\", \"category\": \"Prodotti\"}"
            }
          ],
        },
      ],
    });

    // 3. Estrazione e Pulizia JSON
    // Claude a volte scrive del testo prima del JSON, prendiamo solo il blocco graffe
    const textResponse = msg.content[0].type === 'text' ? msg.content[0].text : "";
    
    // Cerchiamo la prima graffa aperta e l'ultima chiusa per isolare il JSON
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
       throw new Error("Impossibile leggere il JSON da Claude");
    }

    const cleanJson = JSON.parse(jsonMatch[0]);

    return NextResponse.json(cleanJson);

  } catch (error: any) {
    console.error('Errore Claude API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}