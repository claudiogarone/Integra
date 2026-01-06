import Anthropic from '@anthropic-ai/sdk'; // O OpenAI, quello che hai scelto
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Configura AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 2. Configura Supabase ADMIN (per scrivere nel database dal server)
// NOTA: Ci serve la chiave "SERVICE_ROLE" per modificare i contatori senza permessi utente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(request: Request) {
  try {
    const { message, instructions, website, userId } = await request.json();

    if (!userId) return NextResponse.json({ error: 'Utente non identificato' }, { status: 401 });

    // --- CONTROLLO LIMITI ---
    // 1. Leggi quanti crediti ha usato l'utente
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('ai_usage_count, ai_max_limit')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Se non esiste il profilo (utenti vecchi), creiamolo al volo o diamo errore
      return NextResponse.json({ error: 'Profilo utente non trovato. Prova a registrarti di nuovo.' }, { status: 400 });
    }

    // 2. Sei fuori limite?
    if (profile.ai_usage_count >= profile.ai_max_limit) {
      return NextResponse.json({ 
        reply: "⛔ HAI FINITO I CREDITI GRATUITI (100/100).\n\nPer continuare a usare l'assistente, contatta l'amministrazione per passare al piano PRO." 
      });
    }

    // --- CHIAMATA AI ---
    const systemPrompt = `Sei un assistente marketing per il sito ${website}. Istruzioni: ${instructions}`;

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 500, // Riduciamo i token per risparmiare
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    // @ts-ignore
    const reply = msg.content[0].text;

    // --- AGGIORNA CONTATORE ---
    // Incrementiamo di 1 l'uso
    await supabaseAdmin
      .from('profiles')
      .update({ ai_usage_count: profile.ai_usage_count + 1 })
      .eq('id', userId);

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: 'Errore interno AI' }, { status: 500 });
  }
}