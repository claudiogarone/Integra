import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Dati mockati nel caso si scelgano i corsi finti dalla vetrina
const MOCK_COURSES: any = {
    'ai-sales-masterclass': { title: 'AI Sales Masterclass', price: 299 },
    'integraos-zero-to-hero': { title: 'IntegraOS: Zero to Hero', price: 149 },
    'marketing-automation': { title: 'Marketing Automation 3.0', price: 199 }
};

// Funzione helper per evitare crash in fase di compilazione su Vercel
function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
    return createClient(supabaseUrl, supabaseServiceKey);
}

// Funzione helper per accendere Stripe solo quando serve
function getStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
    return new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });
}

// ======================================================================
// METODO POST: CREA LA SESSIONE E REINDIRIZZA ALLA PAGINA DI STRIPE
// ======================================================================
export async function POST(request: Request) {
    try {
        const { courseId, email } = await request.json();
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // Carichiamo la chiave in tempo reale
        const stripeKey = process.env.STRIPE_SECRET_KEY || '';

        // FALLBACK DI SICUREZZA: Se manca la chiave vera, simuliamo
        if (!stripeKey) {
            console.warn("⚠️ Nessuna STRIPE_SECRET_KEY trovata. Attivo la Simulazione di Acquisto.");
            return NextResponse.json({ url: `${origin}/api/checkout?session_id=simulata&course_id=${courseId}&email=${email}` });
        }

        const stripe = getStripe();
        const supabase = getSupabase();

        // TROVA IL CORSO: Prima cerca nel DB Reale, altrimenti nei Mock
        let title = 'Corso IntegraOS Academy';
        let price = 99;

        const { data: dbCourse } = await supabase.from('academy_courses').select('title, price').eq('id', courseId).single();
        
        if (dbCourse) {
            title = dbCourse.title;
            price = dbCourse.price || 99;
        } else if (MOCK_COURSES[courseId]) {
            title = MOCK_COURSES[courseId].title;
            price = MOCK_COURSES[courseId].price;
        }

        // CREAZIONE VERA SESSIONE STRIPE
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: { name: title },
                        unit_amount: Math.round(price * 100), // In centesimi
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/api/checkout?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}&email=${email}`,
            cancel_url: `${origin}/learning/dashboard?canceled=true`,
            metadata: { courseId, email }
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error("Errore Stripe:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ======================================================================
// METODO GET: RICEVE IL SUCCESSO DA STRIPE E SBLOCCA IL CORSO NEL DB
// ======================================================================
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');
    const email = searchParams.get('email');
    const origin = new URL(request.url).origin;

    if (course_id && email) {
        const supabase = getSupabase();
        let actualCourseId = course_id;
        
        if (['ai-sales-masterclass', 'integraos-zero-to-hero', 'marketing-automation'].includes(course_id)) {
             const { data: realCourses } = await supabase.from('academy_courses').select('id').limit(1);
             if (realCourses && realCourses.length > 0) {
                 actualCourseId = realCourses[0].id;
             }
        }

        await supabase.from('course_progress').upsert({
            course_id: actualCourseId,
            agent_email: email,
            progress: 0,
            status: 'assigned'
        }, { onConflict: 'course_id, agent_email' });
    }

    return NextResponse.redirect(`${origin}/learning/dashboard?success=true`);
}