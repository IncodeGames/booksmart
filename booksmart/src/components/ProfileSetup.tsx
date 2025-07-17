import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import './styles/ProfileSetup.css';

interface User {
    id: string;
    email?: string;
}

interface ProfileSetupProps {
    user: User;
    onComplete: () => void;
}

interface WindowSize {
    width: number;
    height: number;
}

interface Message {
    text: string;
    type: 'success' | 'error' | '';
}

type UserType = 'sole_proprietor' | 'business' | null;

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

interface ProfileData {
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

interface CompanyData {
    name: string;
    legal_name: string;
    tax_id: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
}

const ProfileSetup = ({ user, onComplete }: ProfileSetupProps) => {
    const [currentStep, setCurrentStep] = useState<'select' | 'profile' | 'company'>('select');
    const [userType, setUserType] = useState<UserType>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<Message>({ text: '', type: '' });
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });

    const [profileData, setProfileData] = useState<ProfileData>({
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

    const [companyData, setCompanyData] = useState<CompanyData>({
        name: '',
        legal_name: '',
        tax_id: '',
        email: user.email || '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US'
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

    const handleUserTypeSelect = (type: UserType) => {
        setUserType(type);
        setCurrentStep('profile');
        setMessage({ text: '', type: '' });
    };

    const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!profileData.first_name || !profileData.last_name) {
            setMessage({ text: 'First name and last name are required', type: 'error' });
            return;
        }

        if (userType === 'business') {
            setCurrentStep('company');
            return;
        }

        // For sole proprietor, submit profile only
        await submitProfile();
    };

    const handleCompanySubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!companyData.name) {
            setMessage({ text: 'Company name is required', type: 'error' });
            return;
        }

        await submitProfile();
    };

    const submitProfile = async (): Promise<void> => {
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            // Insert profile data
            const profilePayload = {
                id: user.id,
                email: user.email,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                company_name: userType === 'sole_proprietor' ? profileData.company_name : null,
                phone: profileData.phone || null,
                address: profileData.address || null,
                city: profileData.city || null,
                state: profileData.state || null,
                postal_code: profileData.postal_code || null,
                country: profileData.country,
                timezone: profileData.timezone,
                currency: profileData.currency
            };

            const { error: profileError } = await supabase
                .from('profiles')
                .insert(profilePayload);

            if (profileError) throw profileError;

            // If business, also insert company data
            if (userType === 'business') {
                const companyPayload = {
                    owner_id: user.id,
                    name: companyData.name,
                    legal_name: companyData.legal_name || null,
                    tax_id: companyData.tax_id || null,
                    email: companyData.email || null,
                    phone: companyData.phone || null,
                    website: companyData.website || null,
                    address: companyData.address || null,
                    city: companyData.city || null,
                    state: companyData.state || null,
                    postal_code: companyData.postal_code || null,
                    country: companyData.country
                };

                const { error: companyError } = await supabase
                    .from('companies')
                    .insert(companyPayload);

                if (companyError) throw companyError;
            }

            setMessage({ text: 'Profile setup completed successfully!', type: 'success' });
            setTimeout(() => {
                onComplete();
            }, 1500);

        } catch (error: any) {
            console.error('Error setting up profile:', error);
            setMessage({ text: error.message || 'An error occurred during setup', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (field: keyof ProfileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleCompanyChange = (field: keyof CompanyData, value: string) => {
        setCompanyData(prev => ({ ...prev, [field]: value }));
    };

    const isMobile: boolean = windowSize.width <= 768;

    const renderUserTypeSelection = () => (
        <div className="setup-content">
            <div className="setup-header">
                <h1>Welcome! Let's set up your account</h1>
                <p>Tell us about your business structure to customize your experience</p>
            </div>

            <div className="user-type-options">
                <button
                    type="button"
                    className="user-type-card"
                    onClick={() => handleUserTypeSelect('sole_proprietor')}
                >
                    <div className="card-icon">👤</div>
                    <h3>Sole Proprietor</h3>
                    <p>I work independently or as a freelancer</p>
                    <div className="card-arrow">→</div>
                </button>

                <button
                    type="button"
                    className="user-type-card"
                    onClick={() => handleUserTypeSelect('business')}
                >
                    <div className="card-icon">🏢</div>
                    <h3>Business</h3>
                    <p>I represent a company or organization</p>
                    <div className="card-arrow">→</div>
                </button>
            </div>
        </div>
    );

    const renderProfileForm = () => (
        <div className="setup-content">
            <div className="setup-header">
                <h1>Personal Information</h1>
                <p>Please provide your personal details</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="setup-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="first_name">First Name *</label>
                        <input
                            id="first_name"
                            type="text"
                            value={profileData.first_name}
                            onChange={(e) => handleProfileChange('first_name', e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="last_name">Last Name *</label>
                        <input
                            id="last_name"
                            type="text"
                            value={profileData.last_name}
                            onChange={(e) => handleProfileChange('last_name', e.target.value)}
                            required
                        />
                    </div>
                </div>

                {userType === 'sole_proprietor' && (
                    <div className="form-group">
                        <label htmlFor="company_name">Business Name (Optional)</label>
                        <input
                            id="company_name"
                            type="text"
                            value={profileData.company_name}
                            onChange={(e) => handleProfileChange('company_name', e.target.value)}
                            placeholder="Your business or freelance name"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                        id="address"
                        type="text"
                        value={profileData.address}
                        onChange={(e) => handleProfileChange('address', e.target.value)}
                        placeholder="Street address"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="city">City</label>
                        <input
                            id="city"
                            type="text"
                            value={profileData.city}
                            onChange={(e) => handleProfileChange('city', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="state">State</label>
                        <input
                            id="state"
                            type="text"
                            value={profileData.state}
                            onChange={(e) => handleProfileChange('state', e.target.value)}
                            placeholder="CA"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="postal_code">ZIP Code</label>
                        <input
                            id="postal_code"
                            type="text"
                            value={profileData.postal_code}
                            onChange={(e) => handleProfileChange('postal_code', e.target.value)}
                            placeholder="12345"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="timezone">Timezone</label>
                        <select
                            id="timezone"
                            value={profileData.timezone}
                            onChange={(e) => handleProfileChange('timezone', e.target.value)}
                        >
                            <option value={Timezone.UTC_BEHIND_0500}>Eastern Time</option>
                            <option value={Timezone.UTC_BEHIND_0600}>Central Time</option>
                            <option value={Timezone.UTC_BEHIND_0700}>Mountain Time</option>
                            <option value={Timezone.UTC_BEHIND_0800}>Pacific Time</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="currency">Currency</label>
                        <select
                            id="currency"
                            value={profileData.currency}
                            onChange={(e) => handleProfileChange('currency', e.target.value)}
                        >
                            <option value={Currency.USD}>USD — US Dollar ($)</option>
                            <option value={Currency.EUR}>EUR — Euro (€)</option>
                            <option value={Currency.GBP}>GBP — Pound Sterling (£)</option>
                            <option value={Currency.CAD}>CAD — Canadian Dollar (C$)</option>
                            <option value={Currency.AUD}>AUD — Australian Dollar (C$)</option>
                        </select>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCurrentStep('select')}
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : userType === 'business' ? (
                            'Next: Company Info'
                        ) : (
                            'Complete Setup'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderCompanyForm = () => (
        <div className="setup-content">
            <div className="setup-header">
                <h1>Company Information</h1>
                <p>Please provide your company details</p>
            </div>

            <form onSubmit={handleCompanySubmit} className="setup-form">
                <div className="form-group">
                    <label htmlFor="company_name">Company Name *</label>
                    <input
                        id="company_name"
                        type="text"
                        value={companyData.name}
                        onChange={(e) => handleCompanyChange('name', e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="legal_name">Legal Name</label>
                    <input
                        id="legal_name"
                        type="text"
                        value={companyData.legal_name}
                        onChange={(e) => handleCompanyChange('legal_name', e.target.value)}
                        placeholder="If different from company name"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tax_id">Tax ID / EIN</label>
                        <input
                            id="tax_id"
                            type="text"
                            value={companyData.tax_id}
                            onChange={(e) => handleCompanyChange('tax_id', e.target.value)}
                            placeholder="12-3456789"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="company_email">Company Email</label>
                        <input
                            id="company_email"
                            type="email"
                            value={companyData.email}
                            onChange={(e) => handleCompanyChange('email', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="company_phone">Company Phone</label>
                        <input
                            id="company_phone"
                            type="tel"
                            value={companyData.phone}
                            onChange={(e) => handleCompanyChange('phone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="website">Website</label>
                        <input
                            id="website"
                            type="url"
                            value={companyData.website}
                            onChange={(e) => handleCompanyChange('website', e.target.value)}
                            placeholder="https://yourcompany.com"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="company_address">Company Address</label>
                    <input
                        id="company_address"
                        type="text"
                        value={companyData.address}
                        onChange={(e) => handleCompanyChange('address', e.target.value)}
                        placeholder="Street address"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="company_city">City</label>
                        <input
                            id="company_city"
                            type="text"
                            value={companyData.city}
                            onChange={(e) => handleCompanyChange('city', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="company_state">State</label>
                        <input
                            id="company_state"
                            type="text"
                            value={companyData.state}
                            onChange={(e) => handleCompanyChange('state', e.target.value)}
                            placeholder="CA"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="company_postal_code">ZIP Code</label>
                        <input
                            id="company_postal_code"
                            type="text"
                            value={companyData.postal_code}
                            onChange={(e) => handleCompanyChange('postal_code', e.target.value)}
                            placeholder="12345"
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCurrentStep('profile')}
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="loading-spinner"></div>
                        ) : (
                            'Complete Setup'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div className="profile-setup">
            <div className="setup-container">
                <div className={`setup-card ${isMobile ? 'mobile' : 'desktop'}`}>
                    {message.text && (
                        <div className={`message ${message.type}`}>
                            <div className="message-content">
                                {message.text}
                            </div>
                        </div>
                    )}

                    {currentStep === 'select' && renderUserTypeSelection()}
                    {currentStep === 'profile' && renderProfileForm()}
                    {currentStep === 'company' && renderCompanyForm()}
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;