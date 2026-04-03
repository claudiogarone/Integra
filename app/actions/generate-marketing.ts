'use server'

import { createClient } from '@/utils/supabase/server'

export async function generateMarketingContent(prompt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Utente non loggato' }

  const apiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();
  if (!apiKey) return { error: 'Chiave AI mancante.' };

  try {
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: `Sei un esperto di Copywriting e Marketing per piccole imprese. Il tuo compito è suggerire Titoli e Testi persuasivi per Landing Page e Volantini. Sii breve, diretto e usa un tono commerciale accattivante. Rispondi in Italiano.\n\nRichiesta: ${prompt}` }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    
    if (result.error) {
      throw new Error(`Google API Error: ${result.error.message}`);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("❌ [GEMINI-EMPTY-RES]:", JSON.stringify(result));
      const reason = result.promptFeedback?.blockReason || "Motivo sconosciuto (probabile filtro sicurezza o quota)";
      throw new Error(`L'IA non ha restituito testo. Motivo: ${reason}`);
    }

    return { text };
  } catch (err: any) {
    console.error("❌ [AI-MARKETING-ERROR]:", err.message);
    return { error: 'Errore AI: ' + err.message }
  }
}