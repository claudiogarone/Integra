import { createClient } from './utils/supabase/server.js';

async function checkTables() {
  const supabase = await createClient();
  
  const tables = ['nurturing_campaigns', 'mystery_shopper_logs'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      console.log(`${table}: NOT_FOUND`);
    } else if (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    } else {
      console.log(`${table}: EXISTS`);
    }
  }
}

checkTables();
