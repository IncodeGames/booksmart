
import React from 'react';
import { Card, Button, Typography, List } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
}

interface PlanCardProps {
    plan: Plan;
    isCurrentPlan: boolean;
    onSelect: (planId: string) => void;
}

const PlanCard = ({ plan, isCurrentPlan, onSelect }: PlanCardProps) => {
    return (
        <Card
            className={`plan-card ${isCurrentPlan ? 'current-plan' : ''}`}
            hoverable
        >
            <Title level={3}>{plan.name}</Title>
            <Text type="secondary">{plan.description}</Text>

            <div className="plan-price">
                <Title level={2}>
                    ${plan.price.toFixed(2)}
                    <span className="price-interval">/{plan.interval}</span>
                </Title>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={plan.features}
                renderItem={(item) => (
                    <List.Item>
                        <CheckOutlined className="feature-icon" /> {item}
                    </List.Item>
                )}
            />

            <Button
                type={isCurrentPlan ? "default" : "primary"}
                block
                onClick={() => onSelect(plan.id)}
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
            </Button>
        </Card>
    );
};

export default PlanCard;