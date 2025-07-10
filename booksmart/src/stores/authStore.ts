import { create } from 'zustand';
import { supabase } from '../supabase';

interface User {
  id: string;
  email?: string;
}

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

export const useAuthStore = create<AuthState>((set, get) => ({
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
}));