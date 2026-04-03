import { createClient } from '@/utils/supabase/server'

export async function triggerAutomation(triggerType: string, payload: any, userId: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        
        // Chiamata asincrona all'API delle automazioni per non bloccare il webhook principale
        await fetch(`${baseUrl}/api/automations/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ triggerType, payload, userId })
        }).catch(err => console.error("Error triggering automation:", err))
        
        return { success: true }
    } catch (error) {
        console.error("Failed to trigger automation logic:", error)
        return { success: false, error }
    }
}
