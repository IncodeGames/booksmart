import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import useSubscriptionStore from './stores/subscriptionStore';
import { supabase } from '../../lib/supabase';
import PlanCard from './components/PlanCard';
import PaymentDetails from './components/PaymentDetails';
import BillingHistory from './components/BillingHistory';
import { Button, Card, Switch, Typography, Divider, Flex, Spin } from 'antd';
import { CreditCardOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './BillingPage.css';

const { Title, Text } = Typography;

const Billing = () => {
    // const navigate = useNavigate();
    const { currentPlan, setCurrentPlan, fetchSubscriptionData, isLoading } = useSubscriptionStore();
    const [yearlyBilling, setYearlyBilling] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                // fetchSubscriptionData(data.user.id);
            } else {
                // navigate('/login');
            }
        };

        getUser();
    }, [/*navigate,*/ fetchSubscriptionData]);

    const handlePlanChange = async (planId: string) => {
        // This would typically redirect to Stripe Checkout or show a modal
        console.log(`Upgrading to plan: ${planId}`);
        // Implementation will depend on your Stripe integration
    };

    const handleBillingCycleChange = (checked: boolean) => {
        setYearlyBilling(checked);
    };

    if (isLoading) {
        return (
            <div className="billing-loading-container">
                <Spin size="large" />
                <Text>Loading subscription information...</Text>
            </div>
        );
    }

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Basic bookkeeping features for individuals',
            price: yearlyBilling ? 0 : 0,
            interval: yearlyBilling ? 'year' : 'month',
            features: [
                'Up to 50 transactions per month',
                'Basic reporting',
                'Single user access',
            ],
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Advanced features for small businesses',
            price: yearlyBilling ? 108 : 9.99,
            interval: yearlyBilling ? 'year' : 'month',
            features: [
                'Unlimited transactions',
                'Advanced reporting',
                'Up to 3 team members',
                'Invoice generation',
                'Bank account sync',
            ],
        },
        {
            id: 'expert',
            name: 'Expert',
            description: 'Complete solution for growing businesses',
            price: yearlyBilling ? 288 : 29.99,
            interval: yearlyBilling ? 'year' : 'month',
            features: [
                'Everything in Pro',
                'Unlimited team members',
                'Tax preparation assistance',
                'Custom financial reports',
                'Dedicated support',
                'API access',
            ],
        },
    ];

    return (
        <div className="billing-container">
            <Title level={2}>Subscription & Billing</Title>

            <Card className="current-plan-card">
                <Title level={4}>Current Plan</Title>
                <div className="current-plan-info">
                    <div>
                        <Text strong>{currentPlan?.name || 'Free'}</Text>
                        <div>
                            {currentPlan?.id !== 'free' ? (
                                <Text type="success">
                                    <CheckCircleOutlined /> Active
                                </Text>
                            ) : (
                                <Text>Free tier</Text>
                            )}
                        </div>
                    </div>
                    {currentPlan?.id !== 'free' && (
                        <Button type="primary" ghost>
                            Manage Subscription
                        </Button>
                    )}
                </div>
            </Card>

            <div className="billing-cycle-toggle">
                <Text>Monthly</Text>
                <Switch
                    checked={yearlyBilling}
                    onChange={handleBillingCycleChange}
                />
                <Text>Yearly</Text>
                {yearlyBilling && <Text type="success">Save up to 25%</Text>}
            </div>

            <div className="plans-container">
                {plans.map((plan) => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrentPlan={currentPlan?.id === plan.id}
                        onSelect={handlePlanChange}
                    />
                ))}
            </div>

            <Divider />

            <PaymentDetails user={user} />

            <Divider />

            <BillingHistory user={user} />
        </div>
    );
};

export default Billing;