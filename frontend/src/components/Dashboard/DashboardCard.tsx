import React from 'react';
import { Card, Button } from '@drdata/docomo';

interface DashboardCardProps {
  title: string;
  metadata: Array<{
    icon: string;
    text: string;
  }>;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'text' | 'warning'  ;
  }>;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  metadata,
  actions
}) => {
  // Map variants to docomo Button variants
  const mapVariant = (variant?: string) => {
    switch (variant) {
      case 'text': return 'secondary';
      case 'warning': return 'danger';
      default: return variant as 'primary' | 'secondary' | 'danger';
    }
  };

  return (
    <Card>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: 'var(--spacing-md)'
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 'var(--spacing-sm)',
            margin: 0
          }}>
            {title}
          </h4>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
            marginTop: 'var(--spacing-sm)'
          }}>
            {metadata.map((item, index) => (
              <span 
                key={index} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: 'var(--color-background)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <span>{item.icon}</span>
                {item.text}
              </span>
            ))}
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--spacing-xs)',
          flexShrink: 0
        }}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={mapVariant(action.variant)}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard;
