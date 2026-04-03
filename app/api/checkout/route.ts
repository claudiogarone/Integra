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
        const { courseId, plan, email } = await request.json();
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

        // ------------------------------------------------------------------
        // FALLBACK DI SICUREZZA: Simulazione (in assenza chiavi Stripe)
        // ------------------------------------------------------------------
        if (!stripeKey) {
            console.warn("⚠️ Nessuna STRIPE_SECRET_KEY trovata. Attivo la Simulazione.");
            if (plan) {
                // Simuliamo redirect a dashboard post-acquisto abbonamento
                return NextResponse.json({ url: `${origin}/dashboard?session_id=simulata&plan=${plan}&email=${email}&success=true` });
            } else {
                // Simuliamo acquisto corso
                return NextResponse.json({ url: `${origin}/api/checkout?session_id=simulata&course_id=${courseId}&email=${email}` });
            }
        }

        const stripe = getStripe();
        const supabase = getSupabase();

        let stripeMode: 'payment' | 'subscription' = 'payment';
        let lineItem: any = {};
        let successUrl = '';
        let cancelUrl = '';
        let metadata: any = { email };

        // ------------------------------------------------------------------
        // CASO A: ABBONAMENTO AL GESTIONALE (SaaS)
        // ------------------------------------------------------------------
        if (plan) {
            stripeMode = 'subscription';
            metadata.plan = plan;
            
            // Piani predefiniti
            const PLANS: Record<string, { title: string, price: number }> = {
                'base': { title: 'Piano Base', price: 29 },
                'enterprise': { title: 'Piano Enterprise', price: 99 },
                'ambassador': { title: 'Piano Ambassador', price: 199 }
            };
            
            const planDetails = PLANS[plan.toLowerCase()] || { title: 'Abbonamento IntegraOS', price: 29 };

            lineItem = {
                price_data: {
                    currency: 'eur',
                    product_data: { name: planDetails.title },
                    unit_amount: Math.round(planDetails.price * 100),
                    recurring: { interval: 'month' }
                },
                quantity: 1,
            };

            successUrl = `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
            cancelUrl = `${origin}/pricing?canceled=true`;
            
        } 
        // ------------------------------------------------------------------
        // CASO B: ACQUISTO CORSO ACADEMY
        // ------------------------------------------------------------------
        else if (courseId) {
            stripeMode = 'payment';
            metadata.courseId = courseId;
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

            lineItem = {
                price_data: {
                    currency: 'eur',
                    product_data: { name: title },
                    unit_amount: Math.round(price * 100),
                },
                quantity: 1,
            };

            successUrl = `${origin}/api/checkout?session_id={CHECKOUT_SESSION_ID}&course_id=${courseId}&email=${email}`;
            cancelUrl = `${origin}/formazione/dashboard?canceled=true`;
            
        } else {
            return NextResponse.json({ error: 'Nessun courseId o plan fornito.' }, { status: 400 });
        }

        // ----------- CREAZIONE SESSIONE STRIPE -----------
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            customer_email: email,
            line_items: [lineItem],
            mode: stripeMode,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: metadata
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

    if (course_id && email) {
        const supabase = getSupabase();
        let actualCourseId: string | null = course_id;
        
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(course_id)) {
             const { data: realCourses } = await supabase.from('academy_courses').select('id').limit(1);
             if (realCourses && realCourses.length > 0) {
                 actualCourseId = realCourses[0].id;
             } else {
                 const { data: newCourse } = await supabase.from('academy_courses').insert({
                     title: MOCK_COURSES[course_id]?.title || 'Corso Autogenerato',
                     description: 'Creato in automatico dal sistema per completare il test di acquisto.',
                     price: 0,
                     status: 'Pubblicato'
                 }).select().single();
                 actualCourseId = newCourse ? newCourse.id : null;
             }
        }

        if (actualCourseId) {
            const magicToken = `tok_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            
            // QUI AGISCE DA ADMIN (Bypassando i limiti degli studenti)
            const { data: existingProgress } = await supabase.from('course_progress')
                .select('id').eq('course_id', actualCourseId).eq('agent_email', email).single();

            if (existingProgress) {
                await supabase.from('course_progress').update({ access_token: magicToken }).eq('id', existingProgress.id);
            } else {
                await supabase.from('course_progress').insert({
                    course_id: actualCourseId,
                    agent_email: email,
                    progress: 0,
                    status: 'assigned',
                    access_token: magicToken
                });
            }
        }
    }

    // FIX DEFINITIVO: Redirect robusto per Vercel
    return NextResponse.redirect(new URL('/formazione/dashboard?success=true', request.url));
}