import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import LandingPage from './components/LandingPage.tsx';
import RegistrationPage from './components/AuthPage.tsx';
import Dashboard from './components/Dashboard.tsx';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      // If user is logged in, go to dashboard
      if (session?.user) {
        setCurrentPage('dashboard');
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN') {
          setCurrentPage('dashboard');
        } else if (event === 'SIGNED_OUT') {
          setCurrentPage('landing');
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const navigateToAuth = () => {
    setCurrentPage('auth');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      {currentPage === 'dashboard' && user && (
        <Dashboard user={user} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

export default App;