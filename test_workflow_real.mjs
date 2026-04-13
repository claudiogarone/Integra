
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testWorkflow() {
    console.log("🚀 Starting CRM Workflow Backend Test...");

    // 1. Prendi un utente di test
    let { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
    
    if (!profile) {
        console.warn("⚠️ No profile found in 'profiles' table. Attempting to create one from Auth...");
        const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1 });
        if (!users || users.length === 0) {
            console.error("❌ No users found in Auth. Please register a user first.");
            return;
        }
        
        const firstUser = users[0];
        console.log(`Creating test profile for ${firstUser.email}...`);
        
        const { data: newProfile, error: insErr } = await supabase.from('profiles').insert({
            id: firstUser.id,
            email: firstUser.email,
            company_name: 'IntegraOS Test Corp',
            role: 'admin',
            plan: 'Ambassador'
        }).select().single();

        if (insErr) {
            console.error("❌ Failed to create test profile:", insErr.message);
            return;
        }
        profile = newProfile;
    }
    
    const userId = profile.id;
    console.log(`✅ Using UserID: ${userId}`);

    // 2. Crea un workflow di test (Nuovo Lead -> AI -> Email)
    const testWorkflow = {
        user_id: userId,
        name: "Test CRM Automation",
        status: true,
        nodes: 3,
        configuration: [
            { id: "1", type: "trigger", title: "Nuovo Lead Creato", color: "bg-indigo-500" },
            { id: "2", type: "ai_processor", title: "AI Logic (Gemini)", color: "bg-purple-600" },
            { id: "3", type: "action", title: "Invia Email Follow-up", color: "bg-blue-600" }
        ]
    };

    const { data: wf, error: wfErr } = await supabase
        .from('workflows')
        .upsert(testWorkflow, { onConflict: 'name,user_id' }) // Simple way to upsert for test
        .select()
        .single();

    if (wfErr) {
        console.error("❌ Error creating test workflow:", wfErr.message);
        return;
    }
    console.log("✅ Test Workflow Created/Updated:", wf.id);

    // 3. Verifichiamo lo schema delle tabelle correlate
    const { error: logErr } = await supabase.from('workflow_logs').select('*').limit(1);
    if (logErr) {
        console.error("❌ workflow_logs table test failed:", logErr.message);
    } else {
        console.log("✅ workflow_logs table is ready.");
    }

    const { error: entryErr } = await supabase.from('workflow_entries').select('*').limit(1);
    if (entryErr) {
        console.error("❌ workflow_entries table test failed:", entryErr.message);
    } else {
        console.log("✅ workflow_entries table (for delays) is ready.");
    }

    console.log("\nBackend Workflow system is fully prepared!");
}

testWorkflow();
