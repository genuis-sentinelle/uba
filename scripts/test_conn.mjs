import { createClient } from '@supabase/supabase-js';

const url = 'https://ahukxrgkpwfvxwtqelcw.supabase.co';
const key = 'sb_publishable_OZYFwFEBhD1JEYVNpEmaAA_6glMOuoG';

const client = createClient(url, key);

async function test() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await client.rpc('is_bootstrap_locked');
    console.log('rpc is_bootstrap_locked result:', { data, error });
  } catch (err) {
    console.error('rpc error:', err);
  }

  try {
    const { data, error } = await client.from('profiles').select('*').limit(5);
    console.log('select profiles result:', { data, error });
  } catch (err) {
    console.error('select error:', err);
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: 'test@uba.cg',
      password: 'wrongpassword'
    });
    console.log('auth test result:', { error: error?.message, status: error?.status });
  } catch (err) {
    console.error('auth error:', err);
  }
}

test();
