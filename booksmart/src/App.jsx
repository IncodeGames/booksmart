import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { RequireAuth, RequireProfile } from './utils/siteUtils';
import { Destinations } from './lib/routes.ts';
import { useAuthStore } from './stores/authStore';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import LandingPage from './components/LandingPage.tsx';
import AuthPage from './components/AuthPage.tsx';
import ProfileSetup from './components/ProfileSetup.tsx';
import Dashboard from './components/Dashboard.tsx';
import Clients from './components/Clients.tsx';
import Invoices from './components/Invoices.tsx';
import Settings from './components/Settings.tsx';
import TimeTracking from './components/TimeTracking.tsx';
import Billing from './modules/billing/BillingPage.tsx';
import GlobalTimerModal from './components/GlobalTimerModal.tsx';
import './App.css';

function App() {
  const { user, setUser, setLoading, setHasProfile, signOut, checkProfile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (user === null || user.id !== session?.user.id) {

        setUser(session?.user ?? null);

        if (user) {
          await checkProfile(session.user.id);
          navigate(Destinations.DASHBOARD);
        }
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          if (user !== session?.user) {

            setUser(session?.user ?? null);

            if (event === "SIGNED_IN") {
              await checkProfile(session.user.id)
              navigate(Destinations.DASHBOARD);

            } else if (event === 'SIGNED_OUT') {
              setHasProfile(false);
            }
          }
        }, 0)
      }
    );

    return () => subscription?.unsubscribe();
  }, [setUser, setLoading, setHasProfile, checkProfile]);

  return (
    <div className="App">
      <Routes>
        <Route path={Destinations.LANDING} element={<LandingPage />} />
        <Route path={Destinations.AUTH} element={<AuthPage />} />
        <Route path={Destinations.PROFILE_SETUP} element={
          <RequireAuth>
            <ProfileSetup user={user} onComplete={() => setHasProfile(true)} />
          </RequireAuth>
        } />
        <Route path={Destinations.DASHBOARD} element={
          <RequireAuth>
            <RequireProfile>
              <Dashboard user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path={Destinations.CLIENTS} element={
          <RequireAuth>
            <RequireProfile>
              <Clients user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path={Destinations.INVOICES} element={
          <RequireAuth>
            <RequireProfile>
              <Invoices user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path={Destinations.TIME_TRACKING} element={
          <RequireAuth>
            <RequireProfile>
              <TimeTracking user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path={Destinations.SETTINGS} element={
          <RequireAuth>
            <RequireProfile>
              <Settings user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path={Destinations.BILLING} element={
          <RequireAuth>
            <RequireProfile>
              <Billing user={user} onSignOut={signOut} />
            </RequireProfile>
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Global Timer Modal - persists across all authenticated pages */}
      {user && <GlobalTimerModal />}
    </div>
  );
}

export default App;