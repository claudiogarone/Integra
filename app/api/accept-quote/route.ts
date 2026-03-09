import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.from('quotes').update({ status: 'Accettato' }).eq('id', id);
    }
    
    // Mostra al cliente una bellissima pagina di ringraziamento
    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Preventivo Accettato</title>
            </head>
            <body style="font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #F8FAFC; margin: 0;">
                <div style="background: white; padding: 50px 40px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%;">
                    <div style="font-size: 70px; margin-bottom: 10px;">🎉</div>
                    <h1 style="color: #1e293b; font-size: 28px; margin: 0 0 10px 0; font-weight: 900;">Preventivo Accettato!</h1>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.5; margin: 0;">L'azienda è stata notificata istantaneamente. Grazie per aver scelto i nostri servizi.</p>
                </div>
            </body>
        </html>
    `;
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}