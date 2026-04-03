
import { createClient } from './utils/supabase/server.ts';

async function checkAutomationSchema() {
  const supabase = await createClient();
  
  console.log("Checking automations table...");
  const { data: automations, error: autoError } = await supabase
    .from('automations')
    .select('*')
    .limit(1);
    
  if (autoError) {
    console.error("Error fetching automations:", autoError.message);
  } else {
    console.log("Automations sample:", automations);
  }

  console.log("Checking automation_logs table...");
  const { data: logs, error: logError } = await supabase
    .from('automation_logs')
    .select('*')
    .limit(1);
    
  if (logError) {
    console.error("Error fetching automation_logs:", logError.message);
  } else {
    console.log("Automation logs sample:", logs);
  }
}

checkAutomationSchema();
