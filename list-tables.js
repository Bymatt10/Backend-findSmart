const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    const { data, error } = await supabase.rpc('get_tables'); // Or a generic raw query if not available, but let's try calling pg_meta through rest or just generic supabase
    if(error) console.log(error.message);
}
run();
