import { createClient } from './supabase/server'

export type UsageType = 'voice_min' | 'voice_min_ai' | 'chat_message' | 'ai_tokens' | 'inbox_message_free' | 'inbox_message_paid'

interface PlanLimit {
  name: string
  voice_min: number
  chat_messages: number
  inbox_messages_free: number
}

const PLAN_LIMITS: Record<string, PlanLimit> = {
  'Base': { name: 'Base', voice_min: 30, chat_messages: 100, inbox_messages_free: 2000 },
  'Enterprise': { name: 'Enterprise', voice_min: 200, chat_messages: 1000, inbox_messages_free: 5000 },
  'Ambassador': { name: 'Ambassador', voice_min: 1000, chat_messages: 5000, inbox_messages_free: 50000 }
}

// COSTI REALI (BASE) - Esempio in EURO
const BASE_COSTS: Record<UsageType, number> = {
  'voice_min': 0.05,             // 5 cent/min per VOIP classico
  'voice_min_ai': 0.101,         // Costo Vapi.ai + Motore LLM (~10 centesimi / min)
  'chat_message': 0.002,         // vecchi log
  'ai_tokens': 0.0005,           // per 1k tokens
  'inbox_message_free': 0.01,    // Costo sforamento soglia canali gratuiti (es. Telegram > 2000)
  'inbox_message_paid': 0.05     // Costo vivo canali a pagamento (es. WA Business API)
}

const INTEGRA_MARKUP = 1.4 // +40% default per app/voice classica
const INBOX_MARKUP = 1.5   // +50% markup sui messaggi Omnichannel
const AI_VOICE_MARKUP = 1.15 // +15% ricarico su Voice AI (Costo finale al cliente: ~0.116 €/min = 7€ l'ora)

export async function trackUsage(userId: string, type: UsageType, quantity: number, serviceClient?: any) {
  const supabase = serviceClient || await createClient()
  
  // 1. Recupera piano utente
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, usage_voice, usage_chat, usage_inbox, voice_current_spend')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'Profilo non trovato' }

  const plan = profile.plan || 'Base'
  const limits = PLAN_LIMITS[plan]

  // 2. Verifica se e' gratuito
  let isFree = false
  if (type === 'voice_min' && (profile.usage_voice || 0) < limits.voice_min) isFree = true
  if (type === 'chat_message' && (profile.usage_chat || 0) < limits.chat_messages) isFree = true
  if (type === 'inbox_message_free' && (profile.usage_inbox || 0) < limits.inbox_messages_free) isFree = true
  // Note: type === 'inbox_message_paid' is NEVER free

  // 3. Calcola costi
  const baseCost = BASE_COSTS[type] * quantity
  let userCost = 0
  
  if (!isFree) {
      if (type === 'voice_min_ai') {
          userCost = baseCost * AI_VOICE_MARKUP
      } else if (type.includes('inbox_message')) {
          userCost = baseCost * INBOX_MARKUP // Markup garantito del 50%
      } else {
          userCost = baseCost * INTEGRA_MARKUP // Markup 40% per gli altri servizi
      }
  }

  // 4. Salva log utilizzo
  const { error: logError } = await supabase
    .from('usage_metrics')
    .insert({
      user_id: userId,
      resource_type: type,
      amount: quantity,
      cost_base: baseCost,
      cost_user: userCost,
      is_free: isFree,
      timestamp: new Date().toISOString()
    })

  if (logError) console.error('Errore log usage:', logError)

  // 5. Aggiorna contatori nel profilo
  const updateData: any = {}
  if (type === 'voice_min') updateData.usage_voice = (profile.usage_voice || 0) + quantity
  if (type === 'voice_min_ai') {
      // Per il voice AI non diamo minuti gratis iniziali nel piano Base, si paga a consumo diretto fin da subito
      updateData.voice_current_spend = (profile.voice_current_spend || 0) + userCost
  }
  if (type === 'chat_message') updateData.usage_chat = (profile.usage_chat || 0) + quantity
  if (type === 'inbox_message_free' || type === 'inbox_message_paid') updateData.usage_inbox = (profile.usage_inbox || 0) + quantity

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  return { 
    success: true, 
    userCost, 
    remainingFree: type === 'voice_min' ? limits.voice_min - (updateData.usage_voice || 0) : 
                   type.includes('inbox') ? limits.inbox_messages_free - (updateData.usage_inbox || 0) :
                   limits.chat_messages - (updateData.usage_chat || 0)
  }
}
