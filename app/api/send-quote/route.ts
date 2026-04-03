import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { triggerWorkflow } from '@/utils/workflow-trigger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split('Bearer ')[1];

        if (!token) return NextResponse.json({ error: 'Token non fornito' }, { status: 401 });

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Utente non autorizzato' }, { status: 401 });

        // company_name e company_logo non vengono più presi dal request, ma li prendiamo dal backend
        const { client_email, client_name, quote_details, quote_id, quote_number, base_url } = await request.json();
        
        const { data: profile } = await supabase.from('profiles').select('company_name, logo_url').eq('id', user.id).single();
        const finalCompanyName = profile?.company_name || 'IntegraOS';
        const company_logo = profile?.logo_url || '';

        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return NextResponse.json({ error: 'Manca la chiave RESEND' }, { status: 500 });
        const resend = new Resend(apiKey);

        // =========================================================
        // COSTRUZIONE TABELLA PRODOTTI (CON IVA PERSONALIZZATA)
        // =========================================================
        let itemsHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: Arial, sans-serif; font-size: 14px;">
                <thead>
                    <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b;">
                        <th style="padding: 12px 8px;">Descrizione</th>
                        <th style="padding: 12px 8px; text-align: center;">Q.tà</th>
                        <th style="padding: 12px 8px; text-align: center;">IVA</th>
                        <th style="padding: 12px 8px; text-align: right;">Prezzo Un.</th>
                        <th style="padding: 12px 8px; text-align: right;">Totale</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        quote_details.items.forEach((item: any) => {
            itemsHtml += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 12px 8px;"><strong>${item.name}</strong><br><small style="color: #94a3b8;">${item.description || ''}</small></td>
                    <td style="padding: 12px 8px; text-align: center;">${item.qty}</td>
                    <td style="padding: 12px 8px; text-align: center;">${item.taxRate}%</td>
                    <td style="padding: 12px 8px; text-align: right;">€ ${item.price.toFixed(2)}</td>
                    <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #0f172a;">€ ${(item.price * item.qty).toFixed(2)}</td>
                </tr>
            `;
        });
        
        itemsHtml += `
                </tbody>
            </table>
            
            <div style="text-align: right; margin-top: 24px; font-size: 14px; font-family: Arial, sans-serif; color: #475569;">
                <p style="margin: 4px 0;">Imponibile: € ${quote_details.subtotal.toFixed(2)}</p>
                <p style="margin: 4px 0;">Imposte (IVA): € ${quote_details.tax.toFixed(2)}</p>
                <h2 style="color: #00665E; margin: 10px 0 0 0; font-size: 24px;">Totale: € ${quote_details.total.toFixed(2)}</h2>
            </div>
        `;

        // =========================================================
        // HEADER AZIENDALE INFALLIBILE
        // =========================================================
        const firstLetter = finalCompanyName.charAt(0).toUpperCase();
        
        const topHeaderHtml = `
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                  <td style="text-align: center;">
                      ${company_logo && company_logo.trim() !== '' && company_logo.startsWith('http') 
                          ? `<img src="${company_logo}" alt="${finalCompanyName}" style="max-height: 80px; max-width: 250px; display: block; margin: 0 auto;" />` 
                          : `
                          <div style="background-color: #1e293b; color: white; width: 50px; height: 50px; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 50px; margin: 0 auto 10px auto;">
                              ${firstLetter}
                          </div>
                          <h2 style="color: #1e293b; margin:0; letter-spacing: 1px; font-weight: 900; text-transform: uppercase;">
                              ${finalCompanyName}
                          </h2>
                          `
                      }
                  </td>
              </tr>
          </table>
        `;

        const trackingUrl = `${base_url}/api/track-quote?id=${quote_id}`;
        const acceptUrl = `${base_url}/api/accept-quote?id=${quote_id}`;

        await resend.emails.send({
            from: `${finalCompanyName} <onboarding@resend.dev>`, 
            to: client_email,
            subject: `Preventivo N° ${quote_number} - ${finalCompanyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    
                    <!-- HEADER LOGO AZIENDA -->
                    <div style="text-align: center; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
                       ${topHeaderHtml}
                    </div>

                    <h2 style="color: #00665E; margin-top: 0; font-size: 20px;">Gentile ${client_name},</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Le inviamo in allegato il riepilogo del <strong>Preventivo N° ${quote_number}</strong>.</p>
                    
                    ${itemsHtml}
                    
                    <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 12px; font-size: 13px; color: #64748b; line-height: 1.5;">
                        <strong style="color: #0f172a;">Termini e Note:</strong><br>
                        ${quote_details.notes}
                    </div>

                    <div style="margin-top: 40px; text-align: center;">
                        <a href="${acceptUrl}" style="background-color: #10B981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">✅ Accetta Preventivo Online</a>
                        <p style="font-size: 11px; color: #94a3b8; margin-top: 15px;">Cliccando sul bottone, confermerai l'accettazione di questo documento commerciale.</p>
                    </div>

                    <!-- FOOTER POWERED BY INTEGRAOS -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Gestione commerciale generata ed inviata tramite</p>
                        <a href="https://integraos.it" target="_blank" style="text-decoration: none; display: inline-block;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background-color: #00665E; color: white; border-radius: 8px; width: 32px; height: 32px; text-align: center; font-weight: 900; font-size: 18px;">I</td>
                                    <td style="padding-left: 10px; font-size: 22px; font-weight: 900; color: #00665E; letter-spacing: -0.5px;">INTEGRA<span style="font-weight: 300; color: #64748b;">OS</span></td>
                                </tr>
                            </table>
                        </a>
                    </div>
                    
                    <!-- Pixel Segreto per capire se ha letto la mail -->
                    <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />
                </div>
            `
        });

        // Trigger Workflow Automazione CRM
        await triggerWorkflow('Preventivo Creato', {
            id: quote_id,
            number: quote_number,
            client_name,
            client_email,
            total: quote_details.total,
            status: 'Aperto'
        }, user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}