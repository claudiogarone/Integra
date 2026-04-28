import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// API per il polling IMAP delle email del cliente.
// Ogni azienda fornisce le proprie credenziali email (Gmail, Outlook, Aruba, ecc.)
// IntegraOS si connette via IMAP e scarica i messaggi non letti nell'Inbox.
//
// NOTA: Questa route usa `imapflow` — installare con:
// npm install imapflow

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurazioni IMAP predefinite per i provider più comuni
// Il cliente può sovrascrivere host/port se usa un server custom
const IMAP_PRESETS: Record<string, { host: string; port: number; tls: boolean }> = {
    'gmail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'googlemail.com': { host: 'imap.gmail.com', port: 993, tls: true },
    'outlook.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'hotmail.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'live.com': { host: 'outlook.office365.com', port: 993, tls: true },
    'libero.it': { host: 'imapmail.libero.it', port: 993, tls: true },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'yahoo.it': { host: 'imap.mail.yahoo.com', port: 993, tls: true },
    'aruba.it': { host: 'imaps.aruba.it', port: 993, tls: true },
    'virgilio.it': { host: 'imap.virgilio.it', port: 993, tls: true },
    'tiscali.it': { host: 'imap.tiscali.it', port: 993, tls: true },
};

function getImapConfig(email: string, customHost?: string, customPort?: number) {
    const domain = email.split('@')[1]?.toLowerCase();
    const preset = IMAP_PRESETS[domain] || { host: customHost || `imap.${domain}`, port: customPort || 993, tls: true };
    return preset;
}

// POST: Esegue il polling IMAP per un singolo utente
export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        if (!userId) return NextResponse.json({ error: 'userId mancante' }, { status: 400 });

        // Recupera le credenziali email salvate per questo utente
        const { data: channel } = await supabase
            .from('inbox_channels')
            .select('id, user_id, provider_id, access_token, metadata, bot_enabled, bot_prompt')
            .eq('user_id', userId)
            .eq('provider', 'email_imap')
            .single();

        if (!channel) {
            return NextResponse.json({ error: 'Nessuna casella email configurata' }, { status: 404 });
        }

        const emailAddress = channel.provider_id; // Es: info@miazienda.it
        const appPassword = channel.access_token;   // App Password (non la password normale)
        const customHost = channel.metadata?.imap_host;
        const customPort = channel.metadata?.imap_port;

        if (!emailAddress || !appPassword) {
            return NextResponse.json({ error: 'Credenziali IMAP incomplete' }, { status: 400 });
        }

        const imapConfig = getImapConfig(emailAddress, customHost, customPort);

        // Import dinamico di imapflow (evita errori di build se non installato)
        let ImapFlow: any;
        try {
            const module = await import('imapflow');
            ImapFlow = module.ImapFlow;
        } catch {
            return NextResponse.json({ 
                error: 'Libreria IMAP non installata. Esegui: npm install imapflow' 
            }, { status: 500 });
        }

        const client = new ImapFlow({
            host: imapConfig.host,
            port: imapConfig.port,
            secure: imapConfig.tls,
            auth: { user: emailAddress, pass: appPassword },
            logger: false, // Disabilita log verbosi
        });

        await client.connect();

        let importedCount = 0;
        const errors: string[] = [];

        try {
            // Seleziona la INBOX
            const mailbox = await client.mailboxOpen('INBOX');
            
            // Recupera l'ultima data di sincronizzazione
            const lastSync = channel.metadata?.last_sync 
                ? new Date(channel.metadata.last_sync) 
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: ultimi 7 giorni

            // Cerca messaggi non letti o più recenti dell'ultima sync
            const sinceDate = lastSync.toISOString().split('T')[0]; // Formato YYYY-MM-DD

            for await (const msg of client.fetch(
                { since: new Date(sinceDate) }, 
                { envelope: true, bodyStructure: true, source: true }
            )) {
                try {
                    const messageId = msg.envelope.messageId || `${emailAddress}-${msg.uid}`;
                    const fromEmail = msg.envelope.from?.[0]?.address || 'unknown@email.com';
                    const fromName = msg.envelope.from?.[0]?.name || fromEmail;
                    const subject = msg.envelope.subject || '(nessun oggetto)';
                    const date = msg.envelope.date || new Date();

                    // Ignora le email inviate da se stessi (outbound)
                    if (fromEmail.toLowerCase() === emailAddress.toLowerCase()) continue;

                    // Deduplicazione per message-id
                    const { data: existingMsg } = await supabase
                        .from('inbox_messages')
                        .select('id')
                        .eq('external_message_id', messageId)
                        .single();

                    if (existingMsg) continue;

                    // Trova o crea il contatto per questo mittente
                    let { data: contact } = await supabase
                        .from('inbox_contacts')
                        .select('id')
                        .eq('channel_id', channel.id)
                        .eq('external_id', fromEmail)
                        .single();

                    if (!contact) {
                        const { data: newContact } = await supabase
                            .from('inbox_contacts')
                            .insert({
                                user_id: channel.user_id,
                                channel_id: channel.id,
                                external_id: fromEmail,
                                name: fromName,
                                email: fromEmail
                            })
                            .select('id')
                            .single();
                        contact = newContact;
                    } else {
                        await supabase
                            .from('inbox_contacts')
                            .update({ last_interaction: new Date().toISOString() })
                            .eq('id', contact.id);
                    }

                    if (!contact) continue;

                    // Estrai il testo del messaggio dal source raw
                    const source = msg.source?.toString() || '';
                    // Estrazione semplice del corpo testo (dopo gli header)
                    const bodyStart = source.indexOf('\r\n\r\n');
                    let bodyText = bodyStart > -1 ? source.substring(bodyStart + 4) : source;
                    // Rimuovi encoding Base64 e HTML di base
                    bodyText = bodyText.replace(/<[^>]*>/g, '').replace(/=\r\n/g, '').trim();
                    if (bodyText.length > 1000) bodyText = bodyText.substring(0, 1000) + '...';

                    const fullContent = `📧 Oggetto: ${subject}\n📅 ${date.toLocaleString('it-IT')}\n\n${bodyText || '(contenuto non disponibile)'}`;

                    await supabase.from('inbox_messages').insert({
                        user_id: channel.user_id,
                        channel_id: channel.id,
                        inbox_contact_id: contact.id,
                        direction: 'inbound',
                        message_type: 'text',
                        content: fullContent,
                        status: 'delivered',
                        external_message_id: messageId,
                    });

                    importedCount++;
                } catch (msgErr: any) {
                    errors.push(msgErr.message);
                }
            }
        } finally {
            await client.logout();
        }

        // Aggiorna il timestamp dell'ultima sincronizzazione
        await supabase
            .from('inbox_channels')
            .update({ 
                metadata: { 
                    ...channel.metadata, 
                    last_sync: new Date().toISOString(),
                    imap_host: channel.metadata?.imap_host,
                    imap_port: channel.metadata?.imap_port,
                } 
            })
            .eq('id', channel.id);

        return NextResponse.json({ 
            success: true, 
            importedCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('[EMAIL IMAP POLL] Errore:', error.message);
        
        // Errori comuni e messaggi leggibili
        if (error.message?.includes('Invalid credentials') || error.message?.includes('AUTHENTICATIONFAILED')) {
            return NextResponse.json({ 
                error: 'Credenziali non valide. Per Gmail usa una "Password per le App", non la password normale.' 
            }, { status: 401 });
        }
        if (error.message?.includes('ECONNREFUSED') || error.message?.includes('ETIMEDOUT')) {
            return NextResponse.json({ 
                error: 'Impossibile connettersi al server IMAP. Verifica host e porta.' 
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Testa la connessione IMAP senza scaricare email (per verifica credenziali)
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        const password = url.searchParams.get('password');
        const host = url.searchParams.get('host') || '';
        const port = parseInt(url.searchParams.get('port') || '993');

        if (!email || !password) {
            return NextResponse.json({ error: 'email e password richiesti' }, { status: 400 });
        }

        let ImapFlow: any;
        try {
            const module = await import('imapflow');
            ImapFlow = module.ImapFlow;
        } catch {
            return NextResponse.json({ error: 'npm install imapflow richiesto' }, { status: 500 });
        }

        const imapConfig = getImapConfig(email, host || undefined, port || undefined);

        const client = new ImapFlow({
            host: imapConfig.host,
            port: imapConfig.port,
            secure: imapConfig.tls,
            auth: { user: email, pass: password },
            logger: false,
        });

        await client.connect();
        const mailbox = await client.mailboxOpen('INBOX');
        const messageCount = mailbox.exists;
        await client.logout();

        return NextResponse.json({ 
            success: true, 
            host: imapConfig.host,
            messageCount,
            message: `✅ Connessione riuscita! Trovate ${messageCount} email nella INBOX.`
        });

    } catch (error: any) {
        if (error.message?.includes('Invalid credentials') || error.message?.includes('AUTHENTICATIONFAILED')) {
            return NextResponse.json({ 
                error: 'Credenziali non valide. Per Gmail: usa una "Password per le App" da account.google.com → Sicurezza → Password per le app.' 
            }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
