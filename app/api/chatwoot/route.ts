import { NextResponse } from 'next/server';

const CHATWOOT_URL = ''; const API_TOKEN = 'zeHgZgfbrKrEmSAmiqtnsyq9r'; const ACCOUNT_ID = '1';

export async function GET() { try { const response = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${ACCOUNT_ID}/conversations?status=open`, { headers: { 'api_access_token': API_TOKEN, 'Content-Type': 'application/json', }, cache: 'no-store' });

} catch (error: any) { return NextResponse.json({ error: error.message }, { status: 500 }); } }