import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient as createSupabaseClient } from '@supabase/supabase-client';

const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seedEcosystem() {
    console.log("Seeding Ecosystem Demo Data...");

    // 1. Employee di test se non esiste
    const { data: agent } = await supabase.from('team_members').select('id').eq('type', 'human').limit(1).single();
    if (!agent) {
        console.log("Adding Test Agent...");
        await supabase.from('team_members').insert({ name: 'Giovanni Test', role: 'Sales Agent', type: 'human' });
    }

    // 2. Academy Course "Vendita"
    const { data: course } = await supabase.from('academy_courses').select('id').ilike('title', '%vendita%').limit(1).single();
    if (!course) {
        console.log("Adding Academy Course...");
        await supabase.from('academy_courses').insert({ 
            title: 'Tecniche di Vendita & Persuasione', 
            description: 'Corso automatico per agenti con performance sotto la media.',
            price: 0,
            status: 'active'
        });
    }

    // 3. Nurturing Campaign
    const { data: campaign } = await supabase.from('nurturing_campaigns').select('id').limit(1).single();
    if (!campaign) {
        console.log("Adding Nurturing Campaign...");
        await supabase.from('nurturing_campaigns').insert({ 
            industry: 'Generale',
            tone: 'Empatico/Recupero',
            content: { 
                name: 'Recupero Autopilot', 
                steps: [
                    { day: 1, subject: 'Ci manchi!', body: 'Abbiamo notato che non sei più dei nostri...' }
                ] 
            }
        });
    }

    console.log("✅ Seed Complete!");
}

seedEcosystem();
