'use server'

// Definizione sicura delle variabili
const TOKEN = process.env.CHATWOOT_API_TOKEN || process.env.CHATWOOT_API_KEY || '';
const BASE = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || process.env.NEXT_PUBLIC_CHATWOOT_URL || '';
const ACCOUNT = process.env.CHATWOOT_ACCOUNT_ID || '1';

// Tipi per evitare errori di build TS
interface ChatwootResponse {
  payload?: any;
  data?: { payload: any };
}

async function chatwootFetch(endpoint: string, options: RequestInit = {}) {
  if (!TOKEN || !BASE) {
    console.error("❌ CHATWOOT ERROR: Missing Env Vars");
    return []; // Ritorna array vuoto invece di null per non rompere .map
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

    if (!res.ok) return [];
    
    const json = await res.json() as ChatwootResponse;
    return json;
  } catch (e) {
    console.error("FETCH ERROR:", e);
    return [];
  }
}

export async function getConversations() {
  const res = await chatwootFetch('/conversations?status=open&sort_by=last_activity_at');
  // @ts-ignore
  return res?.data?.payload || [];
}

export async function getMessages(id: number) {
  const res = await chatwootFetch(`/conversations/${id}/messages`);
  // @ts-ignore
  return res?.payload || [];
}

export async function sendMessage(id: number, content: string) {
  return await chatwootFetch(`/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type: 'outgoing' }),
  });
}