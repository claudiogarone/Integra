import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic, tone } = await req.json();

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307", 
      max_tokens: 500,
      temperature: 0.8,
      system: "Sei un esperto di Email Marketing. Rispondi SOLO con un oggetto JSON valido contenente 'subject' e 'content'. Niente altro testo.",
      messages: [
        {
          role: "user",
          content: `Scrivi una email di marketing sull'argomento: "${topic}".
          Tono di voce: ${tone}.
          
          Formatta la risposta ESATTAMENTE così:
          {
            "subject": "Qui scrivi l'oggetto accattivante (max 50 caratteri)",
            "content": "Qui scrivi il corpo dell'email in HTML semplice (usa <br> per a capo, <b> per grassetto)."
          }`
        }
      ],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : "";
    // Pulizia JSON bruta (per sicurezza)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Errore parsing AI");
    
    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}