import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MOCK_COURSES: any = {
    'ai-sales-masterclass': { title: 'AI Sales Masterclass', price: 299 },
    'integraos-zero-to-hero': { title: 'IntegraOS: Zero to Hero', price: 149 },
    'marketing-automation': { title: 'Marketing Automation 3.0', price: 199 }
};

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
    return createClient(supabaseUrl, supabaseServiceKey);
}

function getStripe() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    return new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });
}

export async function POST(request: Request) {
    try {
        const { courseId, email } = await request.json();
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        const stripeKey = process.env.STRIPE_SECRET_KEY || '';

        // FALLBACK DI SICUREZZA: Se manca la chiave vera, simuliamo passando i parametri al GET
        if (!stripeKey) {
            console.warn("⚠️ Nessuna STRIPE_SECRET_KEY trovata. Attivo la Simulazione di Acquisto.");
            return NextResponse.json({ url: `${origin}/api/checkout?session_id=simulata&course_id=${courseId}&email=${email}` });
        }

        const stripe = getStripe();
        const supabase = getSupabase();

        let title = 'Corso IntegraOS Academy';
        let price = 99;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(courseId)) {
            const { data: dbCourse } = await supabase.from('academy_courses').select('title, price').eq('id', courseId).single();
            if (dbCourse) {
                title = dbCourse.title;
                price = dbCourse.price || 99;
            }
        } else if (MOCK_COURSES[courseId]) {
            title = MOCK_COURSES[courseId].title;
            price = MOCK_COURSES[courseId].price;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: { name: title },
                        unit_amount: Math.round(price * 100),
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');
    const email = searchParams.get('email');
    const origin = new URL(request.url).origin;

    if (course_id && email) {
        const supabase = getSupabase();
        let actualCourseId: string | null = course_id;
        
        if (['ai-sales-masterclass', 'integraos-zero-to-hero', 'marketing-automation'].includes(course_id)) {
             const { data: realCourses } = await supabase.from('academy_courses').select('id').limit(1);
             if (realCourses && realCourses.length > 0) {
                 actualCourseId = realCourses[0].id;
             } else {
                 // FIX ASSOLUTO: Se il database è vuoto, creiamo un corso finto per spezzare il loop!
                 const { data: newCourse } = await supabase.from('academy_courses').insert({
                     title: MOCK_COURSES[course_id]?.title || 'Corso Autogenerato',
                     description: 'Generato in automatico dal sistema per farti testare il portale.',
                     price: 0,
                     status: 'Pubblicato',
                     user_id: '00000000-0000-0000-0000-000000000000'
                 }).select().single();
                 
                 if (newCourse) actualCourseId = newCourse.id;
                 else actualCourseId = null;
             }
        }

        if (actualCourseId) {
            const magicToken = `tok_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            
            await supabase.from('course_progress').upsert({
                course_id: actualCourseId,
                agent_email: email,
                progress: 0,
                status: 'assigned',
                access_token: magicToken
            }, { onConflict: 'course_id, agent_email' });
        }
    }

    return NextResponse.redirect(`${origin}/learning/dashboard?success=true`);
}