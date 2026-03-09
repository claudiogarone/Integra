import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usiamo la chiave Service per bypassare RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        const eventType = payload.type; // Può essere 'email.opened' o 'email.clicked'
        const tags = payload.data?.tags || [];
        
        // Cerchiamo il tag 'campaign_id' che abbiamo attaccato alla mail in partenza
        const campaignTag = tags.find((t: any) => t.name === 'campaign_id');

        if (campaignTag && campaignTag.value) {
            const campaignId = campaignTag.value;

            // Recuperiamo la campagna per sommare i numeri
            const { data: campaign } = await supabase
                .from('campaigns')
                .select('opened_count, clicked_count')
                .eq('id', campaignId)
                .single();

            if (campaign) {
                const updates: any = {};
                
                // Se è stata aperta, aggiungiamo +1 alle letture
                if (eventType === 'email.opened') {
                    updates.opened_count = (campaign.opened_count || 0) + 1;
                } 
                // Se hanno cliccato un link (es. il prodotto allegato), aggiungiamo +1 ai click
                else if (eventType === 'email.clicked') {
                    updates.clicked_count = (campaign.clicked_count || 0) + 1;
                }

                // Salviamo i dati reali nel Database
                if (Object.keys(updates).length > 0) {
                    await supabase.from('campaigns').update(updates).eq('id', campaignId);
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("Errore Webhook Resend:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}