const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDb() {
  console.log('--- CANDIDATES ---');
  const { data: candidates, error: cErr } = await supabaseAdmin
    .from('candidates')
    .select('id, nama, email, status, token');
  if (cErr) {
    console.error('Candidates error:', cErr);
  } else {
    console.log(JSON.stringify(candidates, null, 2));
  }

  console.log('--- WPT TESTS ---');
  const { data: wptTests, error: wErr } = await supabaseAdmin
    .from('wpt_tests')
    .select('id, candidate_id, skor, kategori');
  if (wErr) {
    console.error('WPT Tests error:', wErr);
  } else {
    console.log(JSON.stringify(wptTests, null, 2));
  }

  console.log('--- DISC TESTS ---');
  const { data: discTests, error: dErr } = await supabaseAdmin
    .from('disc_tests')
    .select('id, candidate_id, tipe_primer');
  if (dErr) {
    console.error('DISC Tests error:', dErr);
  } else {
    console.log(JSON.stringify(discTests, null, 2));
  }

  console.log('--- SELECTION TEST RESULTS ---');
  const { data: selectionResults, error: sErr } = await supabaseAdmin
    .from('selection_test_results')
    .select('id, candidate_id, komponen');
  if (sErr) {
    console.error('Selection Results error:', sErr);
  } else {
    console.log(JSON.stringify(selectionResults, null, 2));
  }
}

checkDb().then(() => console.log('Done'));
