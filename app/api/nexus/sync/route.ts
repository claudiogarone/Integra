import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { triggerWorkflow } from '@/utils/workflow-trigger'
import { triggerAutomation } from '@/utils/automation-trigger'

export async function POST(req: Request) {
    try {
        const { app_id, data, userId } = await req.json()
        
        const supabase = await createClient()

        // 1. Aggiorna l'ultimo sync dell'integrazione
        await supabase.from('integrations')
            .update({ last_sync: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('app_id', app_id)

        // 2. Routing Intelligente (Router AI)
        // Se è uno scontrino POS, aggiorniamo il fatturato e triggeriamo Zap Automation
        if (app_id.includes('pos_')) {
            console.log(`Sync Nexus POS: ${data.amount}€ ricevuti da ${app_id}`)
            
            // Trigger Zap Automation (Nuovo Scontrino POS)
            await triggerAutomation('Scontrino POS Registrato', {
                amount: data.amount,
                items: data.items,
                source: app_id
            }, userId)
        }

        // Se è WhatsApp, triggeriamo i workflow di marketing
        if (app_id === 'whatsapp_sync') {
            console.log(`Sync Nexus WA: Nuovo messaggio da ${data.sender_phone}`)
            
            // Trigger CRM Workflow (Es: Risposta WhatsApp)
            // await triggerWorkflow('Messaggio WhatsApp Ricevuto', data, userId)
        }

        return NextResponse.json({ success: true, message: 'Sync Nexus completato' })

    } catch (error: any) {
        console.error("❌ NEXUS SYNC ERROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
