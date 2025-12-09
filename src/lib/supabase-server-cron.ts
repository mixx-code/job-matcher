// Update supabase-server-cron.ts dengan config yang benar
// lib/supabase-server-cron.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createCronClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  console.log('🔧 Creating cron client with URL:', supabaseUrl.substring(0, 30) + '...');
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public', // Explicit schema
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
}

export const supabaseCron = createCronClient();