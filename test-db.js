import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qblrzlztdbdblikdvwsu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibHJ6bHp0ZGJkYmxpa2R2d3N1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM2Mjg5MSwiZXhwIjoyMDk0OTM4ODkxfQ.nJ5_ezF0qpz3jnTLf1S7cx2yymbOFX0MBSScQLiSh_0'
);

async function run() {
  // Test if ai_analysis column exists in candidates
  const { data, error } = await supabase.from('candidates').select('ai_analysis').limit(1);
  if (error) {
    console.error('ai_analysis column check error:', error.message);
  } else {
    console.log('ai_analysis column exists!');
  }
  
  // Test if ai_analysis_results table exists
  const { data: tData, error: tError } = await supabase.from('ai_analysis_results').select('id').limit(1);
  if (tError) {
    console.error('ai_analysis_results table check error:', tError.message);
  } else {
    console.log('ai_analysis_results table exists!');
  }
}

run();
