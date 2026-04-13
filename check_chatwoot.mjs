
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fetch from 'node-fetch';

async function checkChatwoot() {
    console.log("🔍 Diagnostica Connessione Chatwoot...");
    
    const baseUrl = (process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || process.env.NEXT_PUBLIC_CHATWOOT_URL || '').replace(/\/$/, '');
    const apiToken = process.env.CHATWOOT_API_TOKEN || process.env.CHATWOOT_API_KEY;
    const accountId = process.env.CHATWOOT_ACCOUNT_ID || '1';

    console.log(`📡 URL: ${baseUrl}`);
    console.log(`🔑 Token: ${apiToken ? (apiToken.substring(0, 4) + '...') : 'MANCANTE'}`);
    console.log(`🆔 Account ID: ${accountId}`);

    if (!baseUrl || !apiToken) {
        console.error("❌ Errore: URL o Token mancanti nel file .env.local");
        return;
    }

    try {
        console.log("\n1. Test di raggiungibilità del server...");
        // Usiamo un timeout breve per non bloccare
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/inboxes`, {
            method: 'GET',
            headers: {
                'api_access_token': apiToken,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Connessione Riuscita!");
            console.log(`📊 Inboxes trovati: ${data?.payload?.length || 0}`);
            if (data?.payload) {
                data.payload.forEach(i => console.log(`   - [${i.channel_type}] ${i.name} (ID: ${i.id})`));
            }
        } else {
            const errorText = await res.text();
            console.error(`❌ Il server ha risposto con errore ${res.status}: ${res.statusText}`);
            console.error(`📝 Dettagli: ${errorText.substring(0, 200)}`);
            
            if (res.status === 401) {
                console.log("👉 Suggerimento: Il TOKEN non è valido per questo account.");
            } else if (res.status === 404) {
                console.log("👉 Suggerimento: L'ACCOUNT_ID potrebbe essere sbagliato o l'URL dell'API non è corretto.");
            }
        }
    } catch (err) {
        console.error("❌ Errore di rete / connessione:");
        console.error(`   ${err.message}`);
        
        if (err.message.includes('self signed certificate') || err.message.includes('ERR_TLS_CERT_ALTNAME_INVALID')) {
            console.log("\n⚠️ ATTENZIONE: Il certificato SSL del server Chatwoot non è valido o è autoprodotto.");
            console.log("👉 Prova ad aggiungere 'NODE_TLS_REJECT_UNAUTHORIZED=0' prima del comando per ignorare questo errore (solo per test).");
        } else if (err.message.includes('ECONNREFUSED')) {
            console.log("👉 Suggerimento: Il server non è raggiungibile a quell'indirizzo o la porta è sbagliata.");
        }
    }
}

checkChatwoot();
