
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAffiliation() {
    console.log("🚀 Starting Affiliation Network Backend Test...");

    // 1. Prendi un utente di test
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    if (!profile) {
        console.error("❌ No user profile found to test with.");
        return;
    }
    const userId = profile.id;

    // 2. Simula l'aggiornamento della Vetrina Host
    const { error: profErr } = await supabase.from('profiles').update({
        host_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        host_meeting_url: 'https://calendly.com/test'
    }).eq('id', userId);

    if (profErr) {
        console.error("❌ Error updating profile:", profErr.message);
    } else {
        console.log("✅ Profile (Host Showcase) updated.");
    }

    // 3. Simula la creazione di un partner affiliato
    const testAffiliate = {
        user_id: userId,
        name: 'Azienda Partner Test',
        description: 'Una splendida azienda che collabora con noi.',
        website: 'https://partner.test'
    };

    const { data: aff, error: affErr } = await supabase
        .from('affiliates')
        .upsert(testAffiliate, { onConflict: 'name,user_id' })
        .select()
        .single();

    if (affErr) {
        console.error("❌ Error creating test affiliate:", affErr.message);
        return;
    }
    console.log("✅ Test Affiliate Created/Updated:", aff.id);

    console.log("\nAffiliation Network backend is fully operational!");
}

testAffiliation();
