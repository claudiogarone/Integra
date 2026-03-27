import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { namespace = 'default-company' } = await request.json();
        const pineconeKey = process.env.PINECONE_API_KEY;
        
        if (!pineconeKey) return NextResponse.json({ error: 'Chiave Pinecone mancante' }, { status: 500 });

        const pc = new Pinecone({ apiKey: pineconeKey });
        const index = pc.index('integraos-brain');
        
        await index.namespace(namespace).deleteAll();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}