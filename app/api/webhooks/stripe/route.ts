import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// WEBHOOK STRIPE — POST /api/webhooks/stripe
// 
// Riceve gli eventi da Stripe in background (server-to-server).
// Gestisce: checkout.session.completed (pagamento corsi e abbonamenti)
// Sicurezza: Verifica la firma HMAC con STRIPE_WEBHOOK_SECRET
// ============================================================================

export const dynamic = 'force-dynamic';

const MOCK_COURSES: Record<string, { title: string, price: number }> = {
    'ai-sales-masterclass': { title: 'AI Sales Masterclass', price: 299 },
    'integraos-zero-to-hero': { title: 'IntegraOS: Zero to Hero', price: 149 },
    'marketing-automation': { title: 'Marketing Automation 3.0', price: 199 }
};

// IMPORTANTE: Il body deve essere letto come RAW (non JSON) per la verifica firma
export async function POST(request: Request) {
    const startTime = Date.now();

    // ---------- 1. VALIDAZIONE VARIABILI D'AMBIENTE ----------
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!stripeKey || !webhookSecret) {
        console.error('❌ [WEBHOOK] STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET mancanti in .env.local');
        return NextResponse.json(
            { error: 'Webhook non configurato: chiavi Stripe mancanti.' },
            { status: 500 }
        );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ [WEBHOOK] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local');
        return NextResponse.json(
            { error: 'Webhook non configurato: chiavi Supabase mancanti.' },
            { status: 500 }
        );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' as any });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ---------- 2. LETTURA RAW BODY + VERIFICA FIRMA ----------
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        console.warn('⚠️ [WEBHOOK] Header stripe-signature mancante. Richiesta rifiutata.');
        return NextResponse.json({ error: 'Firma mancante.' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const rawBody = await request.text();
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        console.log(`🔐 [WEBHOOK] Firma verificata! Evento: ${event.type} (ID: ${event.id})`);
    } catch (err: any) {
        console.error(`❌ [WEBHOOK] Verifica firma FALLITA: ${err.message}`);
        return NextResponse.json(
            { error: `Firma non valida: ${err.message}` },
            { status: 400 }
        );
    }

    // ---------- 3. GESTIONE EVENTI ----------
    try {
        switch (event.type) {

            // ====================================================================
            // EVENTO: checkout.session.completed
            // Scatta quando il cliente completa il pagamento su Stripe Checkout
            // ====================================================================
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};
                const customerEmail = session.customer_email || metadata.email || '';
                const mode = session.mode; // 'payment' | 'subscription'

                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`💰 [WEBHOOK] PAGAMENTO COMPLETATO!`);
                console.log(`   📧 Email: ${customerEmail}`);
                console.log(`   💳 Modo: ${mode}`);
                console.log(`   📦 Metadata:`, JSON.stringify(metadata));
                console.log(`   💵 Totale: €${((session.amount_total || 0) / 100).toFixed(2)}`);
                console.log(`   🆔 Session ID: ${session.id}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                // --- CASO A: Acquisto singolo corso Academy (mode: 'payment') ---
                if (mode === 'payment' && metadata.courseId) {
                    await handleCoursePayment(supabase, metadata, customerEmail, session);
                }

                // --- CASO B: Abbonamento al gestionale (mode: 'subscription') ---
                else if (mode === 'subscription') {
                    await handleSubscriptionPayment(supabase, customerEmail, session);
                }

                // --- CASO C: Pagamento generico senza metadata specifico ---
                else {
                    console.log(`ℹ️ [WEBHOOK] Pagamento generico processato. Nessuna azione speciale.`);
                    // Logga comunque per audit
                    await logTransaction(supabase, {
                        type: 'generic_payment',
                        email: customerEmail,
                        amount: (session.amount_total || 0) / 100,
                        stripe_session_id: session.id,
                        metadata
                    });
                }

                break;
            }

            // ====================================================================
            // EVENTO: invoice.payment_succeeded
            // Scatta quando un rinnovo dell'abbonamento viene pagato con successo
            // ====================================================================
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerEmail = typeof (invoice as any).customer_email === 'string' 
                    ? (invoice as any).customer_email 
                    : '';

                if ((invoice as any).subscription && customerEmail) {
                    console.log(`🔄 [WEBHOOK] Rinnovo abbonamento pagato per: ${customerEmail}`);

                    const { error } = await supabase
                        .from('profiles')
                        .update({
                            subscription_status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('email', customerEmail);

                    if (error) {
                        console.error(`❌ [WEBHOOK] Errore aggiornamento profilo rinnovo: ${error.message}`);
                    } else {
                        console.log(`✅ [WEBHOOK] Profilo rinnovato con successo per: ${customerEmail}`);
                    }
                }
                break;
            }

            // ====================================================================
            // EVENTO: customer.subscription.deleted
            // Scatta quando un abbonamento viene cancellato
            // ====================================================================
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                console.log(`🚫 [WEBHOOK] Abbonamento cancellato per customer: ${customerId}`);

                // Recupera l'email del customer da Stripe
                try {
                    const customer = await stripe.customers.retrieve(customerId);
                    if (!customer.deleted && 'email' in customer && customer.email) {
                        const { error } = await supabase
                            .from('profiles')
                            .update({
                                subscription_status: 'canceled',
                                updated_at: new Date().toISOString()
                            })
                            .eq('email', customer.email);

                        if (error) {
                            console.error(`❌ [WEBHOOK] Errore disattivazione profilo: ${error.message}`);
                        } else {
                            console.log(`✅ [WEBHOOK] Profilo disattivato per: ${customer.email}`);
                        }
                    }
                } catch (custErr: any) {
                    console.error(`❌ [WEBHOOK] Errore recupero customer: ${custErr.message}`);
                }
                break;
            }

            // ====================================================================
            // ALTRI EVENTI (Loggati ma non processati)
            // ====================================================================
            default:
                console.log(`ℹ️ [WEBHOOK] Evento non gestito: ${event.type}`);
        }

        const elapsed = Date.now() - startTime;
        console.log(`⏱️ [WEBHOOK] Evento ${event.type} processato in ${elapsed}ms`);

        // Stripe si aspetta una risposta 200 per confermare la ricezione
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error(`❌ [WEBHOOK] Errore fatale nella gestione dell'evento: ${error.message}`);
        // Restituiamo 200 comunque per evitare che Stripe continui a ritentare
        // L'errore è nostro, non di Stripe
        return NextResponse.json({ received: true, error: error.message }, { status: 200 });
    }
}

// ============================================================================
// HANDLER: Acquisto singolo corso Academy
// ============================================================================
async function handleCoursePayment(
    supabase: any,
    metadata: Record<string, string>,
    email: string,
    session: Stripe.Checkout.Session
) {
    const courseId = metadata.courseId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let actualCourseId: string | null = courseId;

    // Se il courseId non è un UUID (es. è un mock), cerca/crea il corso reale
    if (!uuidRegex.test(courseId)) {
        const { data: realCourses } = await supabase
            .from('academy_courses')
            .select('id')
            .limit(1);

        if (realCourses && realCourses.length > 0) {
            actualCourseId = realCourses[0].id;
        } else {
            console.log(`ℹ️ [WEBHOOK] courseId "${courseId}" non è un UUID e nessun corso reale trovato. Genero corso autogenerato come in simulazione.`);
            const { data: newCourse } = await supabase.from('academy_courses').insert({
                title: MOCK_COURSES[courseId]?.title || 'Corso Autogenerato',
                description: 'Creato in automatico dal webhook per completare l\'acquisto reale.',
                price: 0,
                status: 'Pubblicato'
            }).select().single();
            actualCourseId = newCourse ? newCourse.id : null;
        }
    }

    if (!actualCourseId) {
        console.error('❌ [WEBHOOK] Impossibile assegnare il corso: nessun courseId valido.');
        return;
    }

    // Genera un access token unico
    const accessToken = `tok_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Upsert: se l'utente ha già un record per questo corso, aggiorna; altrimenti crea
    const { data: existing } = await supabase
        .from('course_progress')
        .select('id')
        .eq('course_id', actualCourseId)
        .eq('agent_email', email)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('course_progress')
            .update({
                access_token: accessToken,
                status: 'assigned',
                stripe_session_id: session.id
            })
            .eq('id', existing.id);

        if (error) {
            console.error(`❌ [WEBHOOK] Errore update course_progress: ${error.message}`);
        } else {
            console.log(`✅ [WEBHOOK] Corso aggiornato per ${email} (token: ${accessToken})`);
        }
    } else {
        const { error } = await supabase
            .from('course_progress')
            .insert({
                course_id: actualCourseId,
                agent_email: email,
                progress: 0,
                status: 'assigned',
                access_token: accessToken,
                stripe_session_id: session.id
            });

        if (error) {
            console.error(`❌ [WEBHOOK] Errore insert course_progress: ${error.message}`);
        } else {
            console.log(`✅ [WEBHOOK] Corso assegnato a ${email} (ID: ${actualCourseId}, token: ${accessToken})`);
        }
    }

    // Logga la transazione
    await logTransaction(supabase, {
        type: 'course_purchase',
        email,
        course_id: actualCourseId,
        amount: (session.amount_total || 0) / 100,
        stripe_session_id: session.id,
        metadata: { courseId, accessToken }
    });
}

// ============================================================================
// HANDLER: Abbonamento al gestionale
// ============================================================================
async function handleSubscriptionPayment(
    supabase: any,
    email: string,
    session: Stripe.Checkout.Session
) {
    if (!email) {
        console.error('❌ [WEBHOOK] Email mancante per l\'abbonamento. Impossibile aggiornare profilo.');
        return;
    }

    const stripeSubscriptionId = session.subscription as string;

    // Aggiorna il profilo dell'utente
    const { data: profile, error } = await supabase
        .from('profiles')
        .update({
            subscription_status: 'active',
            stripe_subscription_id: stripeSubscriptionId || null,
            subscription_started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

    if (error) {
        // Se la colonna stripe_subscription_id non esiste, riprova senza
        console.warn(`⚠️ [WEBHOOK] Errore update profilo (tentativo con campi ridotti): ${error.message}`);
        const { error: retryError } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('email', email);

        if (retryError) {
            console.error(`❌ [WEBHOOK] Errore fatale update profilo: ${retryError.message}`);
        } else {
            console.log(`✅ [WEBHOOK] Abbonamento attivato per: ${email} (campi ridotti)`);
        }
    } else {
        console.log(`✅ [WEBHOOK] Abbonamento attivato per: ${email} (profilo ID: ${profile?.id})`);
    }

    // Logga la transazione
    await logTransaction(supabase, {
        type: 'subscription_activated',
        email,
        amount: (session.amount_total || 0) / 100,
        stripe_session_id: session.id,
        stripe_subscription_id: stripeSubscriptionId,
        metadata: session.metadata || {}
    });
}

// ============================================================================
// UTILITY: Logga transazione (tabella opzionale 'transactions')
// ============================================================================
async function logTransaction(supabase: any, data: Record<string, any>) {
    try {
        const { error } = await supabase.from('transactions').insert({
            type: data.type,
            email: data.email,
            amount: data.amount,
            stripe_session_id: data.stripe_session_id,
            details: data,
            created_at: new Date().toISOString()
        });

        // La tabella 'transactions' potrebbe non esistere ancora — è opzionale
        if (error) {
            console.log(`ℹ️ [WEBHOOK] Log transazione non salvato (tabella 'transactions' non trovata): ${error.message}`);
        } else {
            console.log(`📋 [WEBHOOK] Transazione loggata: ${data.type} — €${data.amount}`);
        }
    } catch {
        // Silenzioso: il logging non deve mai bloccare il webhook
    }
}
