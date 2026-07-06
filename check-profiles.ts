import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase
    .schema('easycorp')
    .from('profiles')
    .select('*');
    
  console.log('Profiles in DB:', data);
  if (error) console.error('Error:', error);
}

check();
