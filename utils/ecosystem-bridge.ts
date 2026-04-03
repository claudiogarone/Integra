import { createClient } from './supabase/client'

/**
 * EcosystemBridge: Il "Cervello" di IntegraOS che collega i moduli.
 */
export const EcosystemBridge = {
    
    // 1. NOTIFICHE AL BOSS
    async notifyBoss(userId: string, title: string, message: string, type: 'alert' | 'info' | 'success' | 'warning', link?: string) {
        const supabase = createClient()
        await supabase.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type,
            link
        })
    },

    // 2. AUTO-TRAINING (Incognito -> Academy)
    async triggerAutoTraining(userId: string, agentId: string, agentName: string, score: number) {
        const supabase = createClient()
        
        if (score < 6) {
            // Cerchiamo un corso di default "Tecniche di Vendita"
            const { data: course } = await supabase
                .from('academy_courses')
                .select('id, title')
                .ilike('title', '%vendita%')
                .limit(1)
                .single()

            if (course) {
                // Iscriviamo l'agente al corso (Logica semplificata per demo)
                await supabase.from('academy_enrollments').insert({
                    user_id: userId, // Id del Boss/Admin che possiede l'Academy
                    course_id: course.id,
                    payment_status: 'Free (Auto-Assigned)',
                    progress_percentage: 0
                })

                await this.notifyBoss(
                    userId, 
                    '🚨 Formazione Automatica Necessaria', 
                    `L'agente ${agentName} ha ottenuto un voto basso (${score}). È stato iscritto automaticamente al corso: ${course.title}.`,
                    'warning',
                    '/dashboard/academy'
                )
            }
        }
    },

    // 3. AUTO-NURTURING (CRM -> Nurturing Queue)
    async triggerAutoNurturing(userId: string, contactId: string, contactName: string, status: string) {
        const supabase = createClient()

        if (status === 'Perso' || status === 'Abbandono') {
            // Troviamo una campagna di "Recupero" attiva
            const { data: campaign } = await supabase
                .from('nurturing_campaigns')
                .select('id')
                .limit(1)
                .single()

            if (campaign) {
                // Programmiamo l'invio tra 24 ore
                const scheduledDate = new Date()
                scheduledDate.setHours(scheduledDate.getHours() + 24)

                await supabase.from('nurturing_queue').insert({
                    user_id: userId,
                    campaign_id: campaign.id,
                    contact_id: contactId,
                    scheduled_for: scheduledDate.toISOString(),
                    status: 'pending'
                })

                await this.notifyBoss(
                    userId, 
                    '🔄 Recupero Lead Attivato', 
                    `Il lead ${contactName} è stato perso. L'AI ha programmato un messaggio di recupero per domani.`,
                    'info',
                    '/dashboard/nurturing'
                )
            }
        }
    }
}
