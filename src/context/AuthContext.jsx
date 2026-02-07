import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authLoadTimeout;

    // Clear potentially corrupted auth tokens if session retrieval hangs
    const clearCorruptedTokens = async () => {
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(key => key.includes('auth') || key.includes('sb-'));
      authKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Failed to remove ${key}:`, e);
        }
      });
    };

    const initializeAuth = async () => {
      try {
        // Set a hard timeout for session check - if it takes too long, force clear auth
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 8000)
        );

        await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]);
      } catch (error) {
        console.warn('Auth initialization timeout or error:', error.message);
        if (isMounted) {
          // Clear corrupted tokens and force auth off
          await clearCorruptedTokens();
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Initialize auth with timeout protection
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (isMounted) {
            setProfile(profile);
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          if (isMounted) {
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }
      
      // Mark loading as complete when auth state is determined
      if (isMounted) {
        setLoading(false);
      }
    });

    // Set absolute maximum loading time
    authLoadTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth loading exceeded 10 seconds, forcing completion');
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(authLoadTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    profile,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Lade Benutzer...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
