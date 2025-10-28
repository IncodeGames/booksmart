import React from 'react';
import { TrialStatus } from '../types/subscription';
import './TrialBanner.css';

interface TrialBannerProps {
    trialStatus: TrialStatus;
    onUpgrade: () => void;
}

/**
 * Component for displaying trial status and encouraging upgrades
 * Shows different messages based on trial state (active, expiring soon, expired)
 */
const TrialBanner: React.FC<TrialBannerProps> = ({ trialStatus, onUpgrade }) => {
    if (!trialStatus.isTrialing && !trialStatus.hasTrialExpired) {
        return null;
    }

    const isExpiringSoon = trialStatus.daysRemaining !== undefined && trialStatus.daysRemaining <= 3;

    const getBannerClass = () => {
        if (trialStatus.hasTrialExpired) return 'trial-banner expired';
        if (isExpiringSoon) return 'trial-banner warning';
        return 'trial-banner active';
    };

    const getBannerMessage = () => {
        if (trialStatus.hasTrialExpired) {
            return {
                title: 'Your free trial has ended',
                message: 'Upgrade to continue using premium features.',
                buttonText: 'Upgrade Now'
            };
        }
        
        if (isExpiringSoon) {
            return {
                title: `${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} left in your trial`,
                message: 'Upgrade now to avoid interruption.',
                buttonText: 'Upgrade Now'
            };
        }

        return {
            title: `${trialStatus.daysRemaining} days left in your free trial`,
            message: 'Explore all features and upgrade when ready.',
            buttonText: 'View Plans'
        };
    };

    const bannerContent = getBannerMessage();

    return (
        <div className={getBannerClass()}>
            <div className="trial-banner-content">
                <div className="trial-banner-text">
                    <h3 className="trial-banner-title">{bannerContent.title}</h3>
                    <p className="trial-banner-message">{bannerContent.message}</p>
                </div>
                <button 
                    className="trial-banner-button"
                    onClick={onUpgrade}
                >
                    {bannerContent.buttonText}
                </button>
            </div>
        </div>
    );
};

export default TrialBanner;
