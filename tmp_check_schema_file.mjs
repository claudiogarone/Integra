import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  let output = "";
  const { data, error } = await supabase.from('calendar_events').select('*').limit(1);
  if (data && data.length > 0) {
    output += "calendar_events columns: " + Object.keys(data[0]).join(", ") + "\n";
  } else {
    const { data: cols } = await supabase.rpc('get_columns_for_table', { table_name: 'calendar_events' });
    output += "No data found for calendar_events. " + JSON.stringify(cols) + "\n";
  }

  const { data: data2 } = await supabase.from('calendar_syncs').select('*').limit(1);
  if (data2 && data2.length > 0) {
    output += "calendar_syncs columns: " + Object.keys(data2[0]).join(", ") + "\n";
  }
  
  fs.writeFileSync('schema_out.txt', output);
}

checkSchema();
