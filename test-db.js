import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qblrzlztdbdblikdvwsu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibHJ6bHp0ZGJkYmxpa2R2d3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM2Mjg5MSwiZXhwIjoyMDk0OTM4ODkxfQ.nJ5_ezF0qpz3jnTLf1S7cx2yymbOFX0MBSScQLiSh_0'
);

async function run() {
  const { data, error } = await supabase.from('candidates').select('id, nama');
  if (error) {
    console.error('Error fetching candidates:', error);
  } else {
    console.log(data.map(c => `${c.id} - ${c.nama}`).join('\n'));
  }
}

run();
