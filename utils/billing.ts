import { createClient } from './supabase/server'

export type UsageType = 'voice_min' | 'chat_message' | 'ai_tokens'

interface PlanLimit {
  name: string
  voice_min: number
  chat_messages: number
}

const PLAN_LIMITS: Record<string, PlanLimit> = {
  'Base': { name: 'Base', voice_min: 30, chat_messages: 100 },
  'Enterprise': { name: 'Enterprise', voice_min: 200, chat_messages: 1000 },
  'Ambassador': { name: 'Ambassador', voice_min: 1000, chat_messages: 5000 }
}

// COSTI REALI (BASE) - Esempio in EURO
const BASE_COSTS: Record<UsageType, number> = {
  'voice_min': 0.05,       // 5 cent/min
  'chat_message': 0.002,   // 0.2 cent/messaggio (media tokens)
  'ai_tokens': 0.0005      // per 1k tokens
}

const INTEGRA_MARKUP = 1.4 // +40%

export async function trackUsage(userId: string, type: UsageType, quantity: number) {
  const supabase = await createClient()
  
  // 1. Recupera piano utente
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, usage_voice, usage_chat')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'Profilo non trovato' }

  const plan = profile.plan || 'Base'
  const limits = PLAN_LIMITS[plan]

  // 2. Verifica se \u00e8 gratuito (Monthly credits)
  let isFree = false
  if (type === 'voice_min' && (profile.usage_voice || 0) < limits.voice_min) isFree = true
  if (type === 'chat_message' && (profile.usage_chat || 0) < limits.chat_messages) isFree = true

  // 3. Calcola costi se non \u00e8 gratuito
  const baseCost = BASE_COSTS[type] * quantity
  const userCost = isFree ? 0 : baseCost * INTEGRA_MARKUP

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
  if (type === 'chat_message') updateData.usage_chat = (profile.usage_chat || 0) + quantity

  await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)

  return { 
    success: true, 
    userCost, 
    remainingFree: type === 'voice_min' ? limits.voice_min - (updateData.usage_voice || 0) : limits.chat_messages - (updateData.usage_chat || 0)
  }
}
