const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  const { data, error } = await supabase.from('GlobalSettings').select('*');
  if (error) {
    console.error('Supabase query error:', error.message);
    return null;
  }
  return data;
}

module.exports = {
  supabase,
  testConnection,
};
