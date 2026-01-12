import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { clientName, products, total } = await req.json();

    const productNames = products.map((p: any) => p.name).join(", ");

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", 
      max_tokens: 400,
      temperature: 0.7, // Un po' di creatività per il tono persuasivo
      system: "Sei un esperto commerciale italiano. Scrivi una email breve, professionale ma calda e persuasiva per inviare un preventivo. Non mettere oggetti JSON, solo il testo dell'email.",
      messages: [
        {
          role: "user",
          content: `Scrivi una email per il cliente "${clientName}". 
          Gli sto inviando un preventivo di €${total} che include: ${productNames}.
          
          Struttura richiesta:
          1. Oggetto della mail (accattivante)
          2. Corpo del testo (ringrazia per l'interesse, valorizza i prodotti scelti, call to action per accettare).
          
          Usa dei segnaposto [Tuo Nome] e [Tua Azienda] alla fine.`
        }
      ],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : "";
    
    return NextResponse.json({ emailText: text });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}