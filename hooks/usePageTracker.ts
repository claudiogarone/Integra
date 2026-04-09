/**
 * usePageTracker — Hook per tracciare le visualizzazioni di pagina
 * Chiama POST /api/admin/views per registrare ogni visita
 * 
 * Utilizzo:
 *   usePageTracker('integraos_platform', 'crm')
 *   usePageTracker('formazione_esterna', 'corso-leadership')
 */

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export function usePageTracker(page: string, section?: string) {
    useEffect(() => {
        const track = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                
                // Genera session ID se non esiste
                let sessionId = sessionStorage.getItem('integraos_session')
                if (!sessionId) {
                    sessionId = Math.random().toString(36).slice(2)
                    sessionStorage.setItem('integraos_session', sessionId)
                }

                await fetch('/api/admin/views', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page,
                        section,
                        user_id: user?.id || null,
                        user_email: user?.email || null,
                        session_id: sessionId,
                        referrer: document.referrer || null,
                    })
                })
            } catch { /* silent fail — tracking non deve rompere la UI */ }
        }

        track()
    }, [page, section])
}
