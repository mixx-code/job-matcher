import { User } from '@supabase/supabase-js'; // Import tipe User dari supabase
import { supabase } from "./supabaseClient";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Tipe untuk user dengan profile
export type UserWithProfile = User & {
  full_name?: string | null;
  avatar_url?: string | null;
};

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getCurrentUserWithProfile(): Promise<UserWithProfile | null> {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return null;
    }
    
    // Buat objek user dengan tipe yang benar
    const user: UserWithProfile = {
      ...session.user,
      full_name: null,
      avatar_url: null,
    };
    
    // Try to fetch profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!profileError && profile) {
        // Update dengan data profile, handle null values
        user.full_name = profile.full_name || null;
      }
    } catch (profileError) {
      console.warn('Profiles table not found or error, using user data only:', profileError);
      // Continue with just user data
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user with profile:', error);
    return null;
  }
}

export async function checkAuthStatus() {
  const session = await getCurrentSession();
  const user = await getCurrentUserWithProfile();
  
  return {
    isAuthenticated: !!session,
    session,
    user,
  };
}