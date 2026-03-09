'use server'

// Definizione sicura delle variabili
const TOKEN = process.env.CHATWOOT_API_TOKEN || process.env.CHATWOOT_API_KEY || '';
const BASE = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || process.env.NEXT_PUBLIC_CHATWOOT_URL || '';
const ACCOUNT = process.env.CHATWOOT_ACCOUNT_ID || '1';

async function chatwootFetch(endpoint: string, options: RequestInit = {}) {
  if (!TOKEN || !BASE) {
    console.error("❌ CHATWOOT ERROR: Mancano le chiavi nel file .env.local");
    return { payload: [] }; 
  }

  const cleanBase = BASE.replace(/\/$/, '');
  const url = `${cleanBase}/api/v1/accounts/${ACCOUNT}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'api_access_token': TOKEN,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
        console.error(`❌ ERRORE CHATWOOT [${res.status}]: Impossibile leggere da ${url}`);
        return { payload: [] };
    }
    
    const json = await res.json();
    
    // Log nel terminale di VS Code per farti vedere cosa succede in background
    console.log(`✅ CHATWOOT SYNC: Endpoint ${endpoint.split('?')[0]} -> Trovati: ${json.payload ? json.payload.length : 0} elementi.`);
    
    return json;
  } catch (e) {
    console.error("❌ FETCH ERROR CHATWOOT:", e);
    return { payload: [] };
  }
}

// 1. PRENDE TUTTE LE CONVERSAZIONI
export async function getConversations() {
  // FIX 1: Aggiunto assignee_type=all per prendere anche le chat "Unassigned" (Non assegnate)
  const res = await chatwootFetch('/conversations?status=open&assignee_type=all&sort_by=last_activity_at');
  
  // FIX 2: Adattato il parser per leggere il formato corretto di Chatwoot (legge sia payload diretto che data.payload)
  return res?.payload || res?.data?.payload || [];
}

// 2. PRENDE I MESSAGGI DI UNA SINGOLA CHAT
export async function getMessages(id: number) {
  const res = await chatwootFetch(`/conversations/${id}/messages`);
  return res?.payload || [];
}

// 3. INVIA UN MESSAGGIO
export async function sendMessage(id: number, content: string) {
  return await chatwootFetch(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type: 'outgoing' }),
  });
}