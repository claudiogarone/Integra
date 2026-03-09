import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Variabili d'ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!; // Peschiamo la chiave di Resend!

// Inizializziamo Supabase con privilegi di amministratore
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, consent_given } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email mancante' }, { status: 400 });
        }

        // ==========================================
        // 1. SALVATAGGIO IN SUPABASE (Come prima)
        // ==========================================
        const { data, error } = await supabase
            .from('hot_leads')
            .upsert(
                { 
                    email: email, 
                    consent_given: consent_given,
                    source: 'Landing Page Principale'
                }, 
                { onConflict: 'email' }
            )
            .select();

        if (error) throw error;

        // ==========================================
        // 2. INVIO EMAIL AUTOMATICA CON RESEND
        // ==========================================
        if (resendApiKey) {
            
            // Disegniamo la grafica dell'email in HTML
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #cbd5e1; background-color: #020817; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #1e293b; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0;">INTEGRA<span style="color: #64748b; font-weight: 300;">OS</span></h1>
                    </div>
                    <h2 style="color: #10b981; text-align: center;">Benvenuto a bordo! 🚀</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Ciao,</p>
                    <p style="font-size: 16px; line-height: 1.6;">Grazie per aver mostrato interesse per <strong>IntegraOS</strong>. La tua richiesta è stata registrata con successo.</p>
                    <p style="font-size: 16px; line-height: 1.6;">Stai per scoprire il primo Ecosistema basato sull'Intelligenza Artificiale che automatizza le vendite, gestisce il CRM e taglia i costi operativi della tua azienda.</p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://tuosito.com" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Accedi alla Dashboard</a>
                    </div>
                    
                    <p style="font-size: 14px; line-height: 1.6;">A breve un nostro specialista ti contatterà. Nel frattempo, puoi esplorare la nostra Academy per formare il tuo team.</p>
                    <br/>
                    <p style="font-size: 14px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">
                        Il Team di IntegraOS<br/>Concept ADV & Enestar
                    </p>
                </div>
            `;

            // Chiamata alle API ufficiali di Resend
            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'IntegraOS <onboarding@resend.dev>', 
                    to: [email],
                    subject: 'Benvenuto nel futuro del Business! 🚀',
                    html: emailHtml
                })
            });

            if (!emailRes.ok) {
                const errData = await emailRes.json();
                console.error("Errore Invio Email Resend:", errData);
                // NOTA: Se l'email fallisce, non blocchiamo tutto. Il lead è comunque nel database.
            } else {
                console.log("Email Inviata con successo a:", email);
            }
        }

        // Rispondiamo al Pop-Up che è andato tutto a meraviglia
        return NextResponse.json({ success: true, message: 'Lead salvato ed Email inviata', data }, { status: 200 });

    } catch (error: any) {
        console.error('Errore Backend Leads:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
