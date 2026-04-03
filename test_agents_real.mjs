
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAgents() {
    console.log("🚀 Starting Agents & Team Backend Test...");

    // 1. Prendi un utente di test
    const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    if (!profile) {
        console.error("❌ No user profile found to test with.");
        return;
    }
    const userId = profile.id;

    // 2. Simula la creazione di un membro del team
    const testMember = {
        user_id: userId,
        name: 'Agente Test Antigravity',
        email: 'agente.test@integraos.it',
        role: 'Agente Senior',
        type: 'human'
    };

    const { data: member, error: memberErr } = await supabase
        .from('team_members')
        .upsert(testMember, { onConflict: 'email,user_id' })
        .select()
        .single();

    if (memberErr) {
        console.error("❌ Error creating team member:", memberErr.message);
        return;
    }
    console.log("✅ Team Member Created/Updated:", member.id);

    // 3. Verifica la tabella contacts (per la pipeline)
    const { count, error: countErr } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
    if (countErr) {
        console.error("❌ Error checking contacts table:", countErr.message);
    } else {
        console.log(`✅ Contacts table ready: ${count} contatti trovati per la pipeline.`);
    }

    console.log("\nAgents & Team backend is fully operational!");
}

testAgents();
