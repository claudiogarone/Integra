import { createClient } from '../../../../utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    try {
        const { type, event, agents } = await req.json()
        const resendApiKey = process.env.RESEND_API_KEY

        if (!resendApiKey) {
            return NextResponse.json({ error: 'Resend API Key non configurata' }, { status: 500 })
        }

        const results = []

        for (const agent of agents) {
            let subject = ''
            let html = ''

            if (type === 'reminder') {
                subject = `⏰ Promemoria Live: ${event.title}`
                html = `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #00665E;">Promemoria Diretta Formativa</h2>
                        <p>Ciao <strong>${agent.name}</strong>,</p>
                        <p>Ti ricordiamo l'appuntamento per la live: <strong>${event.title}</strong>.</p>
                        <p>Inizio: <strong>${new Date(event.start_time).toLocaleString()}</strong></p>
                        <p>Puoi accedere alla stanza qui: <a href="${event.platform_link}">${event.platform_link}</a></p>
                    </div>
                `
            } else if (type === 'certificate') {
                subject = `🏆 Il tuo Attestato è pronto: ${event.title}`
                html = `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #00665E;">Congratulazioni! 🏆</h2>
                        <p>Ciao <strong>${agent.name}</strong>,</p>
                        <p>Hai completato con successo: <strong>${event.title}</strong>.</p>
                        <p>Il tuo attestato di partecipazione è ora disponibile nel tuo portale studente.</p>
                    </div>
                `
            }

            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'IntegraOS Academy <academy@resend.dev>',
                    to: [agent.email],
                    subject: subject,
                    html: html
                })
            })
            results.push({ email: agent.email, status: res.status })
        }

        return NextResponse.json({ success: true, results })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}