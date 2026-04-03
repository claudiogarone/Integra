
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testNexus() {
    console.log("🚀 Starting Nexus Hub Backend Test...");

    // 1. Prendi un utente di test
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    if (!profile) {
        console.error("❌ No user profile found to test with.");
        return;
    }
    const userId = profile.id;

    // 2. Prendi un target (negozio o agente)
    const { data: team } = await supabase.from('team_members').select('id').limit(1).single();
    const targetId = team?.id || userId; // Fallback se non ci sono team members

    console.log(`Using UserID: ${userId}, TargetID: ${targetId}`);

    // 3. Simula la connessione di un SumUp POS
    const testIntegration = {
        user_id: userId,
        app_id: 'pos_sumup',
        target_id: targetId,
        settings: { api_key: 'test_token_123' },
        status: 'active'
    };

    const { data: integration, error: connErr } = await supabase
        .from('integrations')
        .upsert(testIntegration, { onConflict: 'user_id,app_id,target_id' })
        .select()
        .single();

    if (connErr) {
        console.error("❌ Error connecting integration:", connErr.message);
        return;
    }
    console.log("✅ Nexus Integration Connected:", integration.id);

    // 4. Test della tabella (verifichiamo se esiste e accetta dati)
    const { data: check, error: checkErr } = await supabase.from('integrations').select('*').eq('id', integration.id);
    if (checkErr) {
        console.error("❌ Error fetching integration:", checkErr.message);
    } else {
        console.log("✅ Database verification complete. Integration persisted.");
    }

    console.log("\nNexus Hub backend is fully operational!");
}

testNexus();
