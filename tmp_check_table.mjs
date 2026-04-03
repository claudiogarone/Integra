import { createClient } from './utils/supabase/server.js';

async function checkTable() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('nurturing_campaigns')
    .select('id')
    .limit(1);
    
  if (error && error.code === '42P01') {
    console.log('TABLE_NOT_FOUND');
  } else if (error) {
    console.log('ERROR: ' + error.message);
  } else {
    console.log('TABLE_EXISTS');
  }
}

checkTable();
