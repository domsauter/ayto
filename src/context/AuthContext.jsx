import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const getSessionAndProfile = async () => {
      try {
        // Add a 10-second timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
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
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        // Clear potentially corrupted auth token
        if (error.message === 'Session check timeout' || error.message?.includes('ECONNABORTED')) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error('Error signing out:', e);
          }
        }
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSessionAndProfile();

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
      // Ensure loading is false when auth state changes (e.g. sign out)
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
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
