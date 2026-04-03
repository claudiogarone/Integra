import { createClient } from './utils/supabase/client.js'; // Use .js for ES modules if needed or just .ts
// Note: I will use a simple node script with the server-side client to be sure of access.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient as createSupabaseClient } from '@supabase/supabase-client';

const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkEcosystem() {
    console.log("Checking Ecosystem Tables...");
    
    const { data: notifs, error: nErr } = await supabase.from('notifications').select('*').limit(5);
    console.log("Notifications:", notifs || nErr);

    const { data: queue, error: qErr } = await supabase.from('nurturing_queue').select('*').limit(5);
    console.log("Nurturing Queue:", queue || qErr);

    const { data: campaigns, error: cErr } = await supabase.from('nurturing_campaigns').select('*').limit(5);
    console.log("Nurturing Campaigns:", campaigns || cErr);
}

checkEcosystem();
