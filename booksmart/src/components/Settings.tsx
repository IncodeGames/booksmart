import * as siteUtils from '../utils/siteUtils';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigationStore } from '../stores/navigationStore';
import './styles/Settings.css';

enum Currency {
    USD = 'usd',
    CAD = 'cad',
    EUR = 'eur',
    GBP = 'gbp',
    AUD = 'aud'
}

enum Timezone {
    UTC_BEHIND_1200 = 'utc-1200',
    UTC_BEHIND_1100 = 'utc-1100',
    UTC_BEHIND_0930 = 'utc-0930',
    UTC_BEHIND_0900 = 'utc-0900',
    UTC_BEHIND_0800 = 'utc-0800',
    UTC_BEHIND_0700 = 'utc-0700',
    UTC_BEHIND_0600 = 'utc-0600',
    UTC_BEHIND_0500 = 'utc-0500',
    UTC_BEHIND_0400 = 'utc-0400',
    UTC_BEHIND_0330 = 'utc-0330',
    UTC_BEHIND_0300 = 'utc-0300',
    UTC_BEHIND_0200 = 'utc-0200',
    UTC_BEHIND_0100 = 'utc-0100',
    UTC_0000 = 'utc+0000',
    UTC_AHEAD_0100 = 'utc+0100',
    UTC_AHEAD_0200 = 'utc+0200',
    UTC_AHEAD_0300 = 'utc+0300',
    UTC_AHEAD_0330 = 'utc+0330',
    UTC_AHEAD_0400 = 'utc+0400',
    UTC_AHEAD_0430 = 'utc+0430',
    UTC_AHEAD_0500 = 'utc+0500',
    UTC_AHEAD_0530 = 'utc+0530',
    UTC_AHEAD_0545 = 'utc+0545',
    UTC_AHEAD_0600 = 'utc+0600',
    UTC_AHEAD_0630 = 'utc+0630',
    UTC_AHEAD_0700 = 'utc+0700',
    UTC_AHEAD_0800 = 'utc+0800',
    UTC_AHEAD_0845 = 'utc+0845',
    UTC_AHEAD_0900 = 'utc+0900',
    UTC_AHEAD_0930 = 'utc+0930',
    UTC_AHEAD_1000 = 'utc+1000',
    UTC_AHEAD_1030 = 'utc+1030',
    UTC_AHEAD_1100 = 'utc+1100',
    UTC_AHEAD_1200 = 'utc+1200',
    UTC_AHEAD_1245 = 'utc+1245',
    UTC_AHEAD_1300 = 'utc+1300',
    UTC_AHEAD_1400 = 'utc+1400'
}

interface User {
    id: string;
    email?: string;
}

interface SettingsProps {
    user: User;
    onSignOut: () => void;
    onNavigateToDashboard: () => void;
}

interface Profile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    timezone: Timezone;
    currency: Currency;
}

const Settings = ({ user, onSignOut, onNavigateToDashboard }: SettingsProps) => {
    const windowSize = siteUtils.useWindowSize();
    const { sidebarOpen, setSidebarOpen } = useNavigationStore();

    const [profile, setProfile] = useState<Profile>({
        id: user.id,
        email: user.email || '',
        first_name: '',
        last_name: '',
        company_name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        timezone: Timezone.UTC_BEHIND_0500,
        currency: Currency.USD
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [darkMode, setDarkMode] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState(false);

    useEffect(() => {
        fetchProfile();
        loadThemeSettings();
    }, [user.id]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage('Error loading profile data');
        } finally {
            setLoading(false);
        }
    };

    const loadThemeSettings = () => {
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        const savedColorBlindMode = localStorage.getItem('colorBlindMode') === 'true';
        setDarkMode(savedDarkMode);
        setColorBlindMode(savedColorBlindMode);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    ...profile,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Error updating profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDarkModeToggle = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode.toString());
        // Apply dark mode logic here
        applyDarkMode(newDarkMode);
    };

    const handleColorBlindModeToggle = () => {
        const newColorBlindMode = !colorBlindMode;
        setColorBlindMode(newColorBlindMode);
        localStorage.setItem('colorBlindMode', newColorBlindMode.toString());
        // Apply color blind mode logic here
        applyColorBlindMode(newColorBlindMode);
    };

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon"></div>
                        <span className="logo-text">YourApp</span>
                    </div>
                    {siteUtils.isMobile(windowSize) && (
                        <button
                            className="sidebar-close"
                            onClick={() => setSidebarOpen(false)}
                        >
                            ×
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item" onClick={onNavigateToDashboard}>
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">👥</span>
                        Clients
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">🧾</span>
                        Invoices
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">📄</span>
                        Invoice Templates
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">📈</span>
                        Analytics
                    </a>
                    <a href="#" className="nav-item active">
                        <span className="nav-icon">⚙️</span>
                        Settings
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        {siteUtils.isMobile(windowSize) && (
                            <button
                                className="menu-toggle"
                                onClick={() => setSidebarOpen(true)}
                            >
                                ☰
                            </button>
                        )}
                        <h1>Settings</h1>
                    </div>

                    <div className="header-right">
                        <div className="user-menu">
                            <div className="user-avatar">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user.email}</span>
                                <button className="sign-out-btn" onClick={onSignOut}>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Settings Content */}
                <div className="dashboard-content">
                    <div className="settings-container">
                        {/* Profile Settings */}
                        <div className="settings-section">
                            <div className="settings-card">
                                <div className="card-header">
                                    <h2>Profile Information</h2>
                                    <p>Update your personal and business information</p>
                                </div>

                                {message && (
                                    <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                                        {message}
                                    </div>
                                )}

                                <form onSubmit={handleSaveProfile} className="settings-form">
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label htmlFor="first_name">First Name</label>
                                            <input
                                                type="text"
                                                id="first_name"
                                                name="first_name"
                                                value={profile?.first_name || ''}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="last_name">Last Name</label>
                                            <input
                                                type="text"
                                                id="last_name"
                                                name="last_name"
                                                value={profile?.last_name || ""}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={profile?.email || ''}
                                                disabled
                                                className="disabled"
                                            />
                                        </div>

                                        <div className="form-group full-width">
                                            <label htmlFor="company_name">Company Name</label>
                                            <input
                                                type="text"
                                                id="company_name"
                                                name="company_name"
                                                value={profile?.company_name || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="phone">Phone</label>
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                value={profile?.phone || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="timezone">Timezone</label>
                                            <select
                                                id="timezone"
                                                name="timezone"
                                                value={profile?.timezone}
                                                onChange={handleInputChange}
                                            >
                                                <option value={Timezone.UTC_BEHIND_0500}>America/New York</option>
                                                <option value={Timezone.UTC_BEHIND_0600}>America/Chicago</option>
                                                <option value={Timezone.UTC_BEHIND_0700}>America/Denver</option>
                                                <option value={Timezone.UTC_BEHIND_0800}>America/Los Angeles</option>
                                            </select>
                                        </div>

                                        <div className="form-group full-width">
                                            <label htmlFor="address">Address</label>
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                value={profile?.address || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="city">City</label>
                                            <input
                                                type="text"
                                                id="city"
                                                name="city"
                                                value={profile?.city || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="state">State</label>
                                            <input
                                                type="text"
                                                id="state"
                                                name="state"
                                                value={profile?.state || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="postal_code">Postal Code</label>
                                            <input
                                                type="text"
                                                id="postal_code"
                                                name="postal_code"
                                                value={profile?.postal_code || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="currency">Currency</label>
                                            <select
                                                id="currency"
                                                name="currency"
                                                value={profile.currency}
                                                onChange={handleInputChange}
                                            >
                                                <option value={Currency.USD}>USD - US Dollar</option>
                                                <option value={Currency.EUR}>EUR - Euro</option>
                                                <option value={Currency.GBP}>GBP - British Pound</option>
                                                <option value={Currency.CAD}>CAD - Canadian Dollar</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="save-btn"
                                            disabled={saving || loading}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Appearance Settings */}
                        <div className="settings-section">
                            <div className="settings-card">
                                <div className="card-header">
                                    <h2>Appearance</h2>
                                    <p>Customize the look and feel of your application</p>
                                </div>

                                <div className="appearance-settings">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Dark Mode</h3>
                                            <p>Switch between light and dark themes</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={darkMode}
                                                onChange={handleDarkModeToggle}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <h3>Color Blind Friendly</h3>
                                            <p>Use alternative colors for better accessibility</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={colorBlindMode}
                                                onChange={handleColorBlindModeToggle}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {siteUtils.isMobile(windowSize) && sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

// Theme application functions (snippets)
const applyDarkMode = (isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) {
        root.classList.add('dark-mode');
    } else {
        root.classList.remove('dark-mode');
    }
};

const applyColorBlindMode = (isColorBlind: boolean) => {
    const root = document.documentElement;
    if (isColorBlind) {
        root.classList.add('color-blind-mode');
    } else {
        root.classList.remove('color-blind-mode');
    }
};

export default Settings;