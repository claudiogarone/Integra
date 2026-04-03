import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient as createSupabaseClient } from '@supabase/supabase-client';

const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSeeds() {
    const { count: cCount } = await supabase.from('academy_courses').select('*', { count: 'exact', head: true });
    const { count: nCount } = await supabase.from('nurturing_campaigns').select('*', { count: 'exact', head: true });
    const { count: eCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });

    console.log(`Academy Courses: ${cCount}`);
    console.log(`Nurturing Campaigns: ${nCount}`);
    console.log(`Employees: ${eCount}`);
    
    if (cCount === 0) console.log("⚠️ Academy Courses is empty. Bridge will fail for Incognito.");
    if (nCount === 0) console.log("⚠️ Nurturing Campaigns is empty. Bridge will fail for CRM.");
}

checkSeeds();
