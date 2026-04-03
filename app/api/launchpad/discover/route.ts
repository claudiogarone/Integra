import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { partnerId, displayName, type, city, companyName } = await request.json();

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) return NextResponse.json({ error: 'Manca la chiave RESEND' }, { status: 500 });
        const resend = new Resend(apiKey);

        // INVIO EMAIL A CLAUDIO GARONE (LEAD GENERATION)
        const emailContent = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #00665E;">🚀 NUOVA RICHIESTA PARTNER RADAR</h2>
                <p>L'azienda <strong>${companyName}</strong> ha richiesto di scoprire l'identità del seguente partner media:</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tipo:</strong> ${type}</p>
                    <p><strong>Descrizione AI:</strong> ${displayName}</p>
                    <p><strong>Zona / Città:</strong> ${city}</p>
                    <p><strong>ID Suggerito:</strong> ${partnerId}</p>
                </div>

                <p><strong>Dettagli Azienda Richiedente:</strong></p>
                <ul>
                    <li>User ID: ${user.id}</li>
                    <li>Email Account: ${user.email}</li>
                </ul>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #666;">Richiesta generata automaticamente da IntegraOS Launchpad.</p>
            </div>
        `;

        await resend.emails.send({
            from: 'IntegraOS Radar <onboarding@resend.dev>',
            to: 'claudiogarone@gmail.com',
            subject: `[LEAD RADAR] Richiesta Partner: ${displayName} (${city})`,
            html: emailContent,
        });

        return NextResponse.json({ success: true, message: 'Richiesta inviata con successo.' }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [RADAR-DISCOVER] ERRORE:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
