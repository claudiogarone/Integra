import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const getAdminClient = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Invia email a un utente (o gruppo) via Resend
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { to_email, to_name, subject, body: emailBody, send_to_all, emails_list } = body

        const RESEND_KEY = process.env.RESEND_API_KEY
        if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY non configurata' }, { status: 500 })

        // Lista destinatari
        const recipients: string[] = send_to_all && emails_list ? emails_list : [to_email]

        const results = []
        const supabase = getAdminClient()

        for (const email of recipients) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_KEY}` },
                    body: JSON.stringify({
                        from: 'IntegraOS Admin <admin@integraos.tech>',
                        to: [email],
                        subject: subject || 'Messaggio da IntegraOS',
                        html: `
                            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0d1117; color: #e6edf3; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #00665E, #004d46); padding: 32px; text-align: center;">
                                    <h1 style="color: white; font-size: 28px; font-weight: 900; margin: 0;">IntegraOS</h1>
                                    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 14px;">Messaggio dalla piattaforma</p>
                                </div>
                                <div style="padding: 40px 32px;">
                                    ${to_name ? `<p style="color: #8b949e; font-size: 14px; margin: 0 0 24px 0;">Ciao <strong style="color: #e6edf3;">${to_name}</strong>,</p>` : ''}
                                    <div style="color: #c9d1d9; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">${emailBody}</div>
                                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #21262d; text-align: center;">
                                        <p style="color: #484f58; font-size: 12px; margin: 0;">© 2026 IntegraOS — La piattaforma per imprenditori</p>
                                    </div>
                                </div>
                            </div>
                        `
                    })
                })
                const resData = await res.json()
                results.push({ email, success: res.ok, id: resData?.id })

                // Log nel DB
                await supabase.from('admin_messages').insert({
                    to_email: email, to_name, subject, body: emailBody,
                    status: res.ok ? 'sent' : 'failed'
                })
            } catch (err: any) {
                results.push({ email, success: false, error: err.message })
            }
        }

        return NextResponse.json({
            sent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

// GET: Storico messaggi inviati
export async function GET() {
    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('admin_messages')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(100)
        if (error) throw error
        return NextResponse.json({ messages: data || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
