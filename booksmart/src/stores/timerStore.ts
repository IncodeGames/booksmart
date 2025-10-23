import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client, TimerState } from '../types';
import { supabase } from '../lib/supabase';

interface TimerStore extends TimerState {
  isModalOpen: boolean;
  isExpanded: boolean;
  clients: Client[];
  
  // Actions
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setClient: (client: Client | null) => void;
  setDescription: (description: string) => void;
  setModalOpen: (isOpen: boolean) => void;
  setExpanded: (isExpanded: boolean) => void;
  updateElapsedTime: () => void;
  logTime: () => Promise<boolean>;
  discardTimer: () => void;
  fetchClients: () => Promise<void>;
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isRunning: false,
      startTime: null,
      elapsedTime: 0,
      description: '',
      client: undefined,
      isModalOpen: false,
      isExpanded: false,
      clients: [],

      // Start the timer
      startTimer: () => {
        const now = new Date();
        set({
          isRunning: true,
          startTime: now,
          elapsedTime: 0,
          description: '',
          client: undefined,
          isModalOpen: true,
          isExpanded: false,
        });
      },

      // Stop the timer (without logging)
      stopTimer: () => {
        set({
          isRunning: false,
        });
      },

      // Reset timer to initial state
      resetTimer: () => {
        set({
          isRunning: false,
          startTime: null,
          elapsedTime: 0,
          description: '',
          client: undefined,
        });
      },

      // Set the client for the timer
      setClient: (client: Client | null) => {
        set({ client: client || undefined });
      },

      // Set the description for the timer
      setDescription: (description: string) => {
        set({ description });
      },

      // Set modal open/closed
      setModalOpen: (isModalOpen: boolean) => {
        set({ isModalOpen });
      },

      // Set modal expanded/collapsed
      setExpanded: (isExpanded: boolean) => {
        set({ isExpanded });
      },

      // Update elapsed time based on start time
      updateElapsedTime: () => {
        const state = get();
        if (state.isRunning && state.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000);
          set({ elapsedTime: elapsed });
        }
      },

      // Log the time entry to the database
      logTime: async () => {
        const state = get();
        
        if (!state.startTime) {
          console.error('Cannot log time: no start time');
          return false;
        }

        const endTime = new Date();
        const durationSeconds = Math.floor(
          (endTime.getTime() - new Date(state.startTime).getTime()) / 1000
        );

        // TODO: Ensure user authentication is checked before inserting
        const { error } = await supabase
          .from('time_entries')
          .insert([
            {
              client_id: state.client?.id || null,
              description: state.description || null,
              start_time: new Date(state.startTime).toISOString(),
              end_time: endTime.toISOString(),
              duration: durationSeconds,
            },
          ]);

        if (error) {
          console.error('Error logging time:', error);
          return false;
        }

        // Reset timer after successful log
        set({
          isRunning: false,
          startTime: null,
          elapsedTime: 0,
          description: '',
          client: undefined,
          isModalOpen: false,
          isExpanded: false,
        });

        return true;
      },

      // Discard the current timer
      discardTimer: () => {
        set({
          isRunning: false,
          startTime: null,
          elapsedTime: 0,
          description: '',
          client: undefined,
          isModalOpen: false,
          isExpanded: false,
        });
      },

      // Fetch clients from the database
      fetchClients: async () => {
        // TODO: Ensure user authentication is checked before fetching
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching clients:', error);
        } else {
          set({ clients: data || [] });
        }
      },
    }),
    {
      name: 'timer-store',
      // Custom storage to handle Date serialization
      partialize: (state) => ({
        isRunning: state.isRunning,
        startTime: state.startTime ? new Date(state.startTime).toISOString() : null,
        elapsedTime: state.elapsedTime,
        description: state.description,
        client: state.client,
        isModalOpen: state.isModalOpen,
        isExpanded: state.isExpanded,
      }),
      // Merge stored state with initial state
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        startTime: persistedState?.startTime ? new Date(persistedState.startTime) : null,
      }),
    }
  )
);
