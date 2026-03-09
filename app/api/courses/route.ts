import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// DISABILITA LA CACHE DI NEXT.JS
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, description, price, lessons } = body;

        if (!title || !price) {
            return NextResponse.json({ error: 'Titolo e Prezzo sono obbligatori' }, { status: 400 });
        }

        let courseData;

        // SE C'È L'ID, STIAMO MODIFICANDO
        if (id) {
            const { data, error } = await supabase
                .from('academy_courses')
                .update({ title, description, price: parseFloat(price) })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            courseData = data;

            await supabase.from('academy_lessons').delete().eq('course_id', id);
        } 
        // ALTRIMENTI, CREIAMO NUOVO
        else {
            const { data, error } = await supabase
                .from('academy_courses')
                .insert([{ title, description, price: parseFloat(price), status: 'Pubblicato' }])
                .select()
                .single();
            
            if (error) throw error;
            courseData = data;
        }

        // SALVIAMO LE LEZIONI
        if (lessons && lessons.length > 0) {
            const lessonsToInsert = lessons.map((lesson: any, index: number) => ({
                course_id: courseData.id,
                title: lesson.title,
                video_url: lesson.url || lesson.video_url,
                lesson_order: index + 1
            }));

            const { error: lessonsError } = await supabase.from('academy_lessons').insert(lessonsToInsert);
            if (lessonsError) throw lessonsError;
        }

        const { data: fullCourse } = await supabase.from('academy_courses').select('*, academy_lessons(*)').eq('id', courseData.id).single();

        return NextResponse.json({ success: true, course: fullCourse || courseData }, { status: 200 });

    } catch (error: any) {
        console.error('Errore POST corsi:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('academy_courses')
            .select('*, academy_lessons (*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        console.error('Errore GET corsi:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// METODO ELIMINA MIGLIORATO
export async function DELETE(request: Request) {
    try {
        // Usa URL in modo sicuro
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            console.error("Tentativo di eliminazione senza ID fornito.");
            return NextResponse.json({ error: 'ID del corso mancante nella richiesta.' }, { status: 400 });
        }

        console.log(`Tentativo di eliminazione del corso con ID: ${id}`);

        // La foreign key "ON DELETE CASCADE" in academy_lessons eliminerà automaticamente anche le lezioni.
        // Eseguiamo la cancellazione del corso.
        const { error, count } = await supabase
            .from('academy_courses')
            .delete({ count: 'exact' }) // Richiediamo il numero esatto di righe eliminate
            .eq('id', id);
            
        if (error) {
            console.error("Errore Supabase durante l'eliminazione:", error);
            throw error;
        }

        console.log(`Eliminazione completata. Righe interessate: ${count}`);
        
        return NextResponse.json({ success: true, message: "Corso eliminato correttamente." }, { status: 200 });
    } catch (error: any) {
        console.error('Errore fatale DELETE corsi:', error);
        return NextResponse.json({ error: error.message || 'Errore interno del server durante l\'eliminazione.' }, { status: 500 });
    }
}