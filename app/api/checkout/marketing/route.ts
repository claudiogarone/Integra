import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16' as any,
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { campaignId, amount, channel, recipientsCount } = await request.json();

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() } } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

        // Valuta il prezzo minimo di Stripe (50 centesimi di euro)
        if (amount < 0.50) {
            return NextResponse.json({ error: 'L\'importo minimo per il pagamento Stripe è di 0,50€.' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Campagna Marketing Omnicanale (${channel.toUpperCase()})`,
                            description: `Invio di ${recipientsCount} messaggi tramite canale ${channel}.`,
                        },
                        unit_amount: Math.round(amount * 100), // In centesimi
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/marketing?success=true&campaign_id=${campaignId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/marketing?canceled=true`,
            metadata: {
                campaign_id: campaignId,
                user_id: user.id
            },
        });

        // Aggiorna lo stato nel DB come 'Pagamento Pendente'
        await supabase.from('campaigns').update({ 
            status: 'Pagamento Pendente',
            payment_intent: session.id 
        }).eq('id', campaignId);

        return NextResponse.json({ url: session.url }, { status: 200 });

    } catch (error: any) {
        console.error('❌ [STRIPE-CHECKOUT] ERRORE:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
