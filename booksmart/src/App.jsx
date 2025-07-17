import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useNavigationStore } from './stores/navigationStore';
import LandingPage from './components/LandingPage.tsx';
import RegistrationPage from './components/AuthPage.tsx';
import ProfileSetup from './components/ProfileSetup.tsx';
import Dashboard from './components/Dashboard.tsx';
import Clients from './components/Clients.tsx';
import Invoices from './components/Invoices.tsx';
import Settings from './components/Settings.tsx';
import TimeTracking from './components/TimeTracking.tsx';
import Billing from './modules/billing/BillingPage.tsx';
import './App.css';

function App() {
  const { user, loading, hasProfile, setUser, setLoading, setHasProfile, signOut, checkProfile } = useAuthStore();
  const { currentPage, setCurrentPage } = useNavigationStore();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileExists = await checkProfile(session.user.id);

        if (profileExists) {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage('profile-setup');
        }
      }

      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setTimeout(async () => {
          setUser(session?.user ?? null);

          if (event === 'SIGNED_IN') {
            const profileExists = await checkProfile(session.user.id);

            if (profileExists) {
              setCurrentPage('dashboard');
            } else {
              setCurrentPage('profile-setup');
            }
          } else if (event === 'SIGNED_OUT') {
            setCurrentPage('landing');
            setHasProfile(false);
          }
        }, 0)
      }
    );

    return () => subscription?.unsubscribe();
  }, [setUser, setLoading, setHasProfile, setCurrentPage, checkProfile]);

  const navigateToAuth = () => {
    setCurrentPage('auth');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleProfileSetupComplete = () => {
    setHasProfile(true);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'landing' && (
        <LandingPage onNavigateToAuth={navigateToAuth} />
      )}
      {currentPage === 'auth' && (
        <RegistrationPage onNavigateToLanding={navigateToLanding} />
      )}
      {currentPage === 'profile-setup' && user && (
        <ProfileSetup
          user={user}
          onComplete={handleProfileSetupComplete}
        />
      )}
      {currentPage === 'dashboard' && user && hasProfile && (
        <Dashboard
          user={user}
          onSignOut={signOut}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === 'clients' && user && (
        <Clients user={user} onSignOut={signOut} onNavigateToDashboard={navigateToDashboard} />
      )}
      {currentPage === 'invoices' && user && (
        <Invoices user={user} onSignOut={signOut} onNavigateToDashboard={navigateToDashboard} />
      )}
      {currentPage === 'time-tracking' && user && (
        <TimeTracking user={user} onSignOut={signOut} onNavigateToDashboard={navigateToDashboard} />
      )}
      {currentPage === 'settings' && user && (
        <Settings user={user} onSignOut={signOut} onNavigateToDashboard={navigateToDashboard} />
      )}
      {currentPage === 'billing' && user && (
        <Billing user={user} onSignOut={signOut} onNavigateToDashboard={navigateToDashboard} />
      )}
    </div>
  );
}

export default App;