// lib/serverAuth.ts
import { GetServerSidePropsContext } from 'next';
import { createClient } from '@supabase/supabase-js';

export interface ServerSession {
  user: {
    id: string;
    email?: string;
    // tambahkan field lain jika perlu
  } | null;
  access_token?: string;
}

export async function getServerSession(context: GetServerSidePropsContext): Promise<ServerSession | null> {
  try {
    // Ambil cookies dari request headers
    const cookies = context.req.headers.cookie || '';
    
    // Buat Supabase client dengan cookie dari request
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            Cookie: cookies,
          },
        },
      }
    );

    // Get session dari cookies
    const { data: { session }, error } = await supabaseServer.auth.getSession();

    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }

    if (!session) {
      return null;
    }

    return {
      user: session.user,
      access_token: session.access_token,
    };
  } catch (error) {
    console.error('Error in getServerSession:', error);
    return null;
  }
}

// Atau gunakan versi yang lebih sederhana jika hanya butuh check auth
export async function checkAuthStatus(context: GetServerSidePropsContext) {
  const session = await getServerSession(context);
  
  return {
    isAuthenticated: !!session?.user,
    session,
    user: session?.user || null,
  };
}