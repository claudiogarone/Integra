'use server'

const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN || process.env.CHATWOOT_API_KEY;
const CHATWOOT_BASE_URL = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || process.env.NEXT_PUBLIC_CHATWOOT_URL;
const ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID || '1';

async function chatwootFetch(endpoint: string, options: RequestInit = {}) {
  // Controlla che le chiavi esistano
  if (!CHATWOOT_API_TOKEN || !CHATWOOT_BASE_URL) {
    console.error("❌ ERRORE CRITICO: Variabili Chatwoot mancanti!");
    return null;
  }

  // Pulisce l'URL (toglie lo slash finale se c'è)
  const baseUrl = CHATWOOT_BASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/api/v1/accounts/${ACCOUNT_ID}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'api_access_token': CHATWOOT_API_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: 'no-store' // Importante: non salvare nella cache, vogliamo messaggi freschi
    });

    if (!response.ok) {
      console.error(`❌ Errore API Chatwoot [${response.status}]:`, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Errore di connessione a Chatwoot:", error);
    return null;
  }
}

// Funzioni che usa la tua pagina Inbox
export async function getConversations() {
  const data = await chatwootFetch('/conversations?status=open&sort_by=last_activity_at');
  return data?.data?.payload || [];
}

export async function getMessages(conversationId: number) {
  const data = await chatwootFetch(`/conversations/${conversationId}/messages`);
  return data?.payload || [];
}

export async function sendMessage(conversationId: number, content: string) {
  return await chatwootFetch(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, message_type: 'outgoing' }),
  });
}