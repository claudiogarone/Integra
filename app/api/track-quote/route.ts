import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (id) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            // Verifica lo stato per non sovrascrivere "Accettato" se riapre la mail
            const { data } = await supabase.from('quotes').select('status').eq('id', id).single();
            if (data && data.status === 'Inviato') {
                await supabase.from('quotes').update({ status: 'Visionato' }).eq('id', id);
            }
        }
        
        // Restituisce un'immagine invisibile 1x1 pixel per non farsi scoprire
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        return new NextResponse(pixel, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
        });
    } catch (e) {
        return new NextResponse("ok", { status: 200 });
    }
}