import { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router';
import { useAuthStore } from '../stores/authStore'

interface WindowSize {
    width: number;
    height: number;
}

export const useWindowSize = (): WindowSize => {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = (): void => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

export const isMobile = (windowSize: WindowSize): boolean => {
    return (windowSize.width <= 768);
};

export function RequireAuth({ children }) {
    const { user, loading } = useAuthStore();
    const location = useLocation();
    if (loading) return (
        <div className="app-loading" >
            <div className="loading-spinner" > </div>
        </div>
    );
    if (!user) return <Navigate to="/auth" state={{ from: location }
    } replace />;
    return children;
}

export function RequireProfile({ children }) {
    const { hasProfile, loading } = useAuthStore();
    const location = useLocation();
    if (loading) return (
        <div className="app-loading" >
            <div className="loading-spinner" > </div>
        </div>
    );
    if (!hasProfile) return <Navigate to="/profile-setup" state={{ from: location }
    } replace />;
    return children;
}