import { create } from 'zustand';

type Page = 'landing' | 'auth' | 'profile-setup' | 'dashboard' | 'clients' | 'invoices';
type DashboardView = 'dashboard' | 'invoice-template';

interface NavigationState {
    currentPage: Page;
    currentDashboardView: DashboardView;
    sidebarOpen: boolean;

    // Actions
    setCurrentPage: (page: Page) => void;
    setCurrentDashboardView: (view: DashboardView) => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
    currentPage: 'landing',
    currentDashboardView: 'dashboard',
    sidebarOpen: false,

    setCurrentPage: (page) => set({ currentPage: page }),
    setCurrentDashboardView: (view) => set({ currentDashboardView: view }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));