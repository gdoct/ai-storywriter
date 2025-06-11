import React from 'react';
import { Link } from 'react-router-dom';
import './PricingSection.css';

const PricingSection: React.FC = () => {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out StoryWriter',
      features: [
        '5 stories per month',
        'Basic AI models',
        'Community support',
        'Standard templates'
      ],
      cta: 'Get Started',
      link: '/signup',
      popular: false
    },
    {
      name: 'BYOK',
      price: '$0',
      period: '/month',
      description: 'Bring Your Own Key - Unlimited with your API',
      features: [
        'Unlimited stories',
        'Your own API key',
        'All AI models',
        'Advanced controls',
        'Priority support'
      ],
      cta: 'Get Started',
      link: '/signup',
      popular: true
    },
    {
      name: 'Premium',
      price: 'Credits',
      period: '',
      description: 'Pay-as-you-go with our hosted API',
      features: [
        'Pay per story',
        'No API key needed',
        'Premium AI models',
        'Advanced features',
        'Priority support',
        'Custom integrations'
      ],
      cta: 'Coming Soon',
      link: '#',
      popular: false
    }
  ];

  return (
    <section className="pricing-section">
      <div className="pricing-container">
        <div className="pricing-header">
          <h2>Choose Your Plan</h2>
          <p>Start free and scale as you grow</p>
        </div>
        <div className="pricing-grid">
          {tiers.map((tier, index) => (
            <div key={index} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <div className="pricing-header-card">
                <h3 className="tier-name">{tier.name}</h3>
                <div className="tier-price">
                  <span className="price">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
                <p className="tier-description">{tier.description}</p>
              </div>
              <ul className="features-list">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="feature-item">
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="pricing-cta">
                {tier.link === '#' ? (
                  <button className="btn btn-pricing" disabled>
                    {tier.cta}
                  </button>
                ) : (
                  <Link to={tier.link} className="btn btn-pricing">
                    {tier.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
