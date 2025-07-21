import { create } from 'zustand';

interface NavigationState {
    sidebarOpen: boolean;

    // Actions
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    currentDashboardView: 'dashboard',
    sidebarOpen: false,

    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));