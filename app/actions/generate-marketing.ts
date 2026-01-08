'use server'

import { createClient } from '../../utils/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function generateMarketingContent(prompt: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Utente non loggato' }

  // 1. Controllo Crediti (Opzionale: scommenta se vuoi scalare i crediti)
  /*
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile.ai_usage_count >= profile.ai_max_limit) {
    return { error: 'Crediti AI esauriti. Fai l\'upgrade!' }
  }
  await supabase.from('profiles').update({ ai_usage_count: profile.ai_usage_count + 1 }).eq('id', user.id)
  */

  // 2. Chiamata AI
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      system: "Sei un esperto di Copywriting e Marketing per piccole imprese. Il tuo compito è suggerire Titoli e Testi persuasivi per Landing Page e Volantini. Sii breve, diretto e usa un tono commerciale accattivante. Rispondi in Italiano.",
      messages: [{ role: "user", content: prompt }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return { text }
  } catch (err) {
    return { error: 'Errore AI: Riprova più tardi.' }
  }
}