import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase';
import { User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null;
  loading: boolean;
  hasProfile: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHasProfile: (hasProfile: boolean) => void;
  signOut: () => Promise<void>;
  checkProfile: (userId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      hasProfile: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setHasProfile: (hasProfile) => set({ hasProfile }),

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, hasProfile: false });
      },

      checkProfile: async (userId: string) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();

        const hasProfile = !!profile;
        set({ hasProfile });
        return hasProfile;
      },
    }),
    { name: "auth-store" })
);