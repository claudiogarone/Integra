import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('calendar_events').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("calendar_events columns:", Object.keys(data[0]).join(", "));
  } else {
    // try to get table info from postgres if data is empty
    const { data: cols } = await supabase.rpc('get_columns_for_table', { table_name: 'calendar_events' });
    console.log("No data found. Is it empty?");
  }

  const { data: data2 } = await supabase.from('calendar_syncs').select('*').limit(1);
  if (data2 && data2.length > 0) {
    console.log("calendar_syncs columns:", Object.keys(data2[0]).join(", "));
  }
}

checkSchema();
