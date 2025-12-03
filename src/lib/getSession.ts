import { supabase } from "./supabaseClient";

export interface UserProfile {
  id: string;
  email?: string;
  // tambahkan field lain dari profiles table jika ada
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

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

export async function getCurrentUserWithProfile() {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user) {
      return null;
    }
    
    let userWithProfile = {
      ...session.user,
      // Default values
      full_name: '',
      avatar_url: '',
    };
    
    // Try to fetch profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!profileError && profile) {
        userWithProfile = {
          ...userWithProfile,
          ...profile,
        };
      }
    } catch (profileError) {
      console.warn('Profiles table not found or error, using user data only:', profileError);
      // Continue with just user data
    }
    
    return userWithProfile;
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