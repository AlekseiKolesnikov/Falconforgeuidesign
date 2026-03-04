// 'use client';
// import { createContext, useContext, useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase';
// import type { Session } from '@supabase/supabase-js';

// type AuthContextType = {
//   session: Session | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
// };

// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [session, setSession] = useState<Session | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setLoading(false);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
//       setSession(s);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw new Error(error.message);
//   };

//   const signUp = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signUp({ email, password });
//     if (error) throw new Error(error.message);
//   };

//   if (loading) return <div className="flex min-h-screen items-center justify-center text-xl">Loading...</div>;

//   return (
//     <AuthContext.Provider value={{ session, loading, signIn, signUp }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// };
