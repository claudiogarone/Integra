import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

        const { type, customerEmail, customerName, cardCode, points, amountSpent, baseUrl } = await request.json();
        
        if (type !== 'points_added') return NextResponse.json({ error: 'Tipo email non supportato' }, { status: 400 });

        // Estrai nome azienda e logo reali dal DB legati a questo utente
        const { data: profile } = await supabase.from('profiles').select('company_name, logo_url').eq('id', user.id).single();
        const companyName = profile?.company_name || 'IntegraOS';
        const companyLogo = profile?.logo_url || '';

        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return NextResponse.json({ error: 'Manca la chiave RESEND' }, { status: 500 });
        const resend = new Resend(apiKey);

        const firstLetter = companyName.charAt(0).toUpperCase();
        
        const topHeaderHtml = `
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                  <td style="text-align: center;">
                      ${companyLogo && companyLogo.trim() !== '' && companyLogo.startsWith('http') 
                          ? `<img src="${companyLogo}" alt="${companyName}" style="max-height: 80px; max-width: 250px; display: block; margin: 0 auto;" />` 
                          : `
                          <div style="background-color: #1e293b; color: white; width: 50px; height: 50px; border-radius: 12px; font-size: 24px; font-weight: bold; line-height: 50px; margin: 0 auto 10px auto;">
                              ${firstLetter}
                          </div>
                          <h2 style="color: #1e293b; margin:0; letter-spacing: 1px; font-weight: 900; text-transform: uppercase;">
                              ${companyName}
                          </h2>
                          `
                      }
                  </td>
              </tr>
          </table>
        `;

        await resend.emails.send({
            from: `${companyName} <onboarding@resend.dev>`, 
            to: customerEmail,
            subject: `Punti Fedeltà Aggiornati - ${companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                    
                    <div style="text-align: center; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
                       ${topHeaderHtml}
                    </div>

                    <h2 style="color: #00665E; margin-top: 0; font-size: 20px;">Ciao ${customerName},</h2>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Ti informiamo che abbiamo appena aggiornato il saldo della tua Fidelity Card (Codice: <strong>${cardCode}</strong>).</p>
                    
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                        <p style="font-size: 13px; color: #64748b; margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Dettagli Ultima Transazione</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                            <span style="color: #64748b;">Spesa Rilevata:</span>
                            <span style="font-weight: bold; color: #0f172a;">€ ${amountSpent.toFixed(2)}</span>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #64748b;">Punti Accumulati:</span>
                            <span style="font-size: 24px; font-weight: 900; color: #10B981;">+${points}</span>
                        </div>
                    </div>

                    <p style="color: #475569; font-size: 14px; text-align: center;">Continua ad acquistare da noi per raggiungere nuovi traguardi VIP e sbloccare premi esclusivi!</p>

                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                        <p style="margin: 0 0 12px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Gestione Fidelity Powered By</p>
                        <a href="https://integraos.it" target="_blank" style="text-decoration: none; display: inline-block;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background-color: #00665E; color: white; border-radius: 8px; width: 32px; height: 32px; text-align: center; font-weight: 900; font-size: 18px;">I</td>
                                    <td style="padding-left: 10px; font-size: 22px; font-weight: 900; color: #00665E; letter-spacing: -0.5px;">INTEGRA<span style="font-weight: 300; color: #64748b;">OS</span></td>
                                </tr>
                            </table>
                        </a>
                    </div>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
