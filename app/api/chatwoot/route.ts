import { NextResponse } from 'next/server';

const CHATWOOT_URL = 'https://chat-web.server.integraos.tech'; 
const API_TOKEN = 'zeHgZgfbrKrEmSAmiqtnsyq9r'; 
const ACCOUNT_ID = '1';

export async function GET() {
  try {
    // Ho cambiato il modo di scrivere l'URL per evitare errori di copia incolla
    const finalUrl = CHATWOOT_URL + "/api/v1/accounts/" + ACCOUNT_ID + "/conversations?status=open";

    const response = await fetch(finalUrl, {
      headers: {
        'api_access_token': API_TOKEN,
        'Content-Type': 'application/json',
      },
      cache: 'no-store' 
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Errore Chatwoot: " + response.status }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}