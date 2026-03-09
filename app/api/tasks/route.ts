import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Recupera tutti i task/card della pipeline
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, crm_leads(first_name, last_name, email)') // Colleghiamo i dati del lead se presenti
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crea un nuovo task o aggiorna la colonna (Drag & Drop)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, column_id, priority, lead_id, due_date } = body;

        let taskData;

        // Se c'è l'ID, stiamo spostando o modificando
        if (id) {
            const { data, error } = await supabase
                .from('tasks')
                .update({ 
                    title, 
                    column_id, 
                    priority, 
                    due_date 
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            taskData = data;
        } 
        // Altrimenti creiamo un nuovo task
        else {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ 
                    title, 
                    column_id: column_id || 'todo', 
                    priority: priority || 'Medium',
                    lead_id,
                    due_date
                }])
                .select()
                .single();

            if (error) throw error;
            taskData = data;
        }

        return NextResponse.json({ success: true, task: taskData }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Elimina un task
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}