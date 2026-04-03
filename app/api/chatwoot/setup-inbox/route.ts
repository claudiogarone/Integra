import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const CHATWOOT_BASE = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '';
const CHATWOOT_TOKEN = process.env.CHATWOOT_API_TOKEN || '';
const CHATWOOT_ACCOUNT = process.env.CHATWOOT_ACCOUNT_ID || '1';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper per chiamare l'API Chatwoot
async function chatwootAPI(endpoint: string, method: string = 'GET', body?: any) {
    const cleanBase = CHATWOOT_BASE.replace(/\/$/, '');
    const url = `${cleanBase}/api/v1/accounts/${CHATWOOT_ACCOUNT}${endpoint}`;
    
    const res = await fetch(url, {
        method,
        headers: {
            'api_access_token': CHATWOOT_TOKEN,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
}

// GET: Ritorna lo stato degli inbox attualmente configurati su Chatwoot
export async function GET() {
    if (!CHATWOOT_BASE || !CHATWOOT_TOKEN) {
        return NextResponse.json({ 
            error: 'Chatwoot non configurato. Aggiungi CHATWOOT_API_TOKEN e NEXT_PUBLIC_CHATWOOT_BASE_URL nel file .env.local'
        }, { status: 500 });
    }
    
    try {
        const { ok, data } = await chatwootAPI('/inboxes');
        if (!ok) throw new Error('Impossibile leggere gli inbox da Chatwoot');
        
        const inboxes = data?.payload || [];
        return NextResponse.json({ 
            inboxes: inboxes.map((i: any) => ({
                id: i.id,
                name: i.name,
                channel_type: i.channel_type,
                enabled: i.enable_auto_assignment !== false,
            }))
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Auto-configura gli inbox da profilo utente
export async function POST(request: Request) {
    if (!CHATWOOT_BASE || !CHATWOOT_TOKEN) {
        return NextResponse.json({ 
            error: 'Chatwoot non configurato. Aggiungi CHATWOOT_API_TOKEN e NEXT_PUBLIC_CHATWOOT_BASE_URL nel file .env.local.' 
        }, { status: 500 });
    }

    try {
        const { userId } = await request.json();
        
        // 1. Leggi il profilo dell'utente da Supabase
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('company_name, company_email, whatsapp_number, social_links, websites')
            .eq('id', userId)
            .single();

        if (profileErr || !profile) {
            return NextResponse.json({ error: 'Profilo utente non trovato. Salva prima i dati nelle Impostazioni.' }, { status: 404 });
        }

        // 2. Recupera gli inbox già esistenti per evitare duplicati
        const { data: existingData } = await chatwootAPI('/inboxes');
        const existingInboxes: any[] = existingData?.payload || [];
        const existingNames = existingInboxes.map((i: any) => i.name?.toLowerCase());
        
        const results: { channel: string; status: string; detail: string }[] = [];
        const companyName = profile.company_name || 'IntegraOS';

        // ─────────────────────────────────────
        // 3A. CANALE EMAIL
        // ─────────────────────────────────────
        if (profile.company_email) {
            const emailInboxName = `${companyName} — Email`;
            if (existingNames.includes(emailInboxName.toLowerCase())) {
                results.push({ channel: 'Email', status: 'skip', detail: 'Già configurato' });
            } else {
                const { ok, data } = await chatwootAPI('/inboxes', 'POST', {
                    name: emailInboxName,
                    channel: {
                        type: 'email',
                        email: profile.company_email,
                    }
                });
                results.push({ 
                    channel: 'Email', 
                    status: ok ? 'ok' : 'error', 
                    detail: ok ? `Inbox creato (ID: ${data?.id})` : `Errore Chatwoot: ${JSON.stringify(data)}` 
                });
            }
        }

        // ─────────────────────────────────────
        // 3B. CANALE WEB WIDGET (Live Chat)
        // ─────────────────────────────────────
        const webInboxName = `${companyName} — Live Chat`;
        if (!existingNames.includes(webInboxName.toLowerCase())) {
            const websiteUrl = profile.websites?.main || profile.websites?.ecommerce || 'https://integraos.it';
            const { ok, data } = await chatwootAPI('/inboxes', 'POST', {
                name: webInboxName,
                channel: {
                    type: 'web_widget',
                    website_url: websiteUrl,
                    welcome_title: `Benvenuto da ${companyName}!`,
                    welcome_tagline: 'Ti rispondiamo subito. Scrivici pure!',
                    widget_color: '#00665E',
                }
            });
            results.push({ 
                channel: 'Live Chat', 
                status: ok ? 'ok' : 'error', 
                detail: ok ? `Widget creato (ID: ${data?.id})` : `Errore: ${JSON.stringify(data)}` 
            });
        } else {
            results.push({ channel: 'Live Chat', status: 'skip', detail: 'Già configurato' });
        }

        // ─────────────────────────────────────
        // 3C. CANALE TELEGRAM
        // ─────────────────────────────────────
        const telegramLink = profile.social_links?.telegram;
        if (telegramLink && telegramLink.trim()) {
            const tgInboxName = `${companyName} — Telegram`;
            if (!existingNames.includes(tgInboxName.toLowerCase())) {
                // Chatwoot si aspetta il Bot Token di Telegram, non il link. 
                // Verifichiamo se l'utente ha inserito il token (bot123456:ABC...)
                const isBotToken = telegramLink.includes(':');
                
                if (isBotToken) {
                    const { ok, data } = await chatwootAPI('/inboxes', 'POST', {
                        name: tgInboxName,
                        channel: {
                            type: 'telegram',
                            bot_token: telegramLink.trim(),
                        }
                    });
                    results.push({ 
                        channel: 'Telegram', 
                        status: ok ? 'ok' : 'error', 
                        detail: ok ? `Bot collegato (ID: ${data?.id})` : `Errore: ${JSON.stringify(data)}` 
                    });
                } else {
                    results.push({ 
                        channel: 'Telegram', 
                        status: 'warning', 
                        detail: 'Per attivare Telegram, inserisci il Bot Token (es. 123456:ABCdef...) nel campo Telegram delle Impostazioni, non il semplice link.' 
                    });
                }
            } else {
                results.push({ channel: 'Telegram', status: 'skip', detail: 'Già configurato' });
            }
        }
        
        // ─────────────────────────────────────
        // 3D. CANALE WHATSAPP (via API)
        // ─────────────────────────────────────
        if (profile.whatsapp_number && profile.whatsapp_number.trim()) {
            const waInboxName = `${companyName} — WhatsApp`;
            if (!existingNames.includes(waInboxName.toLowerCase())) {
                // WhatsApp richiede una configurazione più complessa (Twilio o Meta Cloud API)
                // Creiamo un inbox di tipo "api" channel come ponte, che l'utente può poi collegare
                const { ok, data } = await chatwootAPI('/inboxes', 'POST', {
                    name: waInboxName,
                    channel: {
                        type: 'api',
                        webhook_url: '', // Verrà configurato dall'utente
                    }
                });
                results.push({ 
                    channel: 'WhatsApp', 
                    status: ok ? 'partial' : 'error', 
                    detail: ok 
                        ? `Canale API Bridge creato (ID: ${data?.id}). Per collegare il numero ${profile.whatsapp_number} serve configurare Meta Cloud API o Twilio nel pannello Chatwoot.`
                        : `Errore: ${JSON.stringify(data)}` 
                });
            } else {
                results.push({ channel: 'WhatsApp', status: 'skip', detail: 'Già configurato' });
            }
        }

        // ─────────────────────────────────────
        // 3E. CANALE FACEBOOK
        // ─────────────────────────────────────
        const facebookLink = profile.social_links?.facebook;
        if (facebookLink && facebookLink.trim()) {
            const fbInboxName = `${companyName} — Facebook`;
            if (!existingNames.includes(fbInboxName.toLowerCase())) {
                results.push({ 
                    channel: 'Facebook', 
                    status: 'manual', 
                    detail: `Per attivare Facebook Messenger, devi collegare la Pagina (${facebookLink}) dal pannello Chatwoot → Inboxes → Facebook. Serve l'autenticazione OAuth di Facebook.`
                });
            } else {
                results.push({ channel: 'Facebook', status: 'skip', detail: 'Già configurato' });
            }
        }

        // ─────────────────────────────────────
        // 3F. CANALE INSTAGRAM
        // ─────────────────────────────────────
        const instagramLink = profile.social_links?.instagram;
        if (instagramLink && instagramLink.trim()) {
            const igInboxName = `${companyName} — Instagram`;
            if (!existingNames.includes(igInboxName.toLowerCase())) {
                results.push({ 
                    channel: 'Instagram', 
                    status: 'manual', 
                    detail: `Instagram DM richiede collegamento tramite Facebook Business. Vai nel pannello Chatwoot → Inboxes → Instagram.` 
                });
            } else {
                results.push({ channel: 'Instagram', status: 'skip', detail: 'Già configurato' });
            }
        }

        // ─────────────────────────────────────
        // 3G. CANALE X (Twitter)
        // ─────────────────────────────────────
        const xLink = profile.social_links?.x;
        if (xLink && xLink.trim()) {
            const xInboxName = `${companyName} — X (Twitter)`;
            if (!existingNames.includes(xInboxName.toLowerCase())) {
                results.push({ 
                    channel: 'X (Twitter)', 
                    status: 'manual', 
                    detail: `Per collegare X, serve un Twitter Developer Account con accesso OAuth. Configuralo in Chatwoot → Inboxes → Twitter.` 
                });
            } else {
                results.push({ channel: 'X (Twitter)', status: 'skip', detail: 'Già configurato' });
            }
        }

        // 4. Calcola il riepilogo
        const created = results.filter(r => r.status === 'ok').length;
        const skipped = results.filter(r => r.status === 'skip').length;
        const warnings = results.filter(r => r.status === 'warning' || r.status === 'manual' || r.status === 'partial').length;
        const errors = results.filter(r => r.status === 'error').length;

        console.log(`\n🔧 AUTO-CONFIG CHATWOOT: ${created} creati, ${skipped} già esistenti, ${warnings} manuali, ${errors} errori\n`);
        results.forEach(r => console.log(`   [${r.status.toUpperCase()}] ${r.channel}: ${r.detail}`));

        return NextResponse.json({ 
            success: true, 
            summary: { created, skipped, warnings, errors },
            results 
        });

    } catch (err: any) {
        console.error('❌ Errore auto-config Chatwoot:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
