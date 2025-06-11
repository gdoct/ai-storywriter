import React from 'react';
import { Link } from 'react-router-dom';
import MarketingFooter from '../components/marketing/MarketingFooter';
import './PricingPage.css';

const PricingPage: React.FC = () => {
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
        'Standard templates',
        'Export to TXT format'
      ],
      limitations: [
        'Limited to 1,000 words per story',
        'Basic AI models only',
        'Community support only'
      ],
      cta: 'Get Started',
      link: '/signup',
      popular: false,
      color: '#64748b'
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
        'Priority support',
        'Export to all formats',
        'Version history',
        'Advanced templates'
      ],
      limitations: [
        'Requires your own AI API key',
        'You pay AI provider directly'
      ],
      cta: 'Get Started',
      link: '/signup',
      popular: true,
      color: '#4f46e5'
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
        'Custom integrations',
        'Analytics and insights',
        'Team collaboration'
      ],
      limitations: [
        'Per-story pricing',
        'Credit-based system'
      ],
      cta: 'Coming Soon',
      link: '#',
      popular: false,
      color: '#059669'
    }
  ];

  const faqs = [
    {
      question: 'What does "BYOK" mean?',
      answer: 'BYOK stands for "Bring Your Own Key". This means you use your own API key from providers like OpenAI, Anthropic, or others. You get unlimited usage but pay the AI provider directly for API calls.'
    },
    {
      question: 'Can I switch plans anytime?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges or credits.'
    },
    {
      question: 'What AI models are supported?',
      answer: 'We support OpenAI GPT models, Anthropic Claude, local models via LM Studio and Ollama, and many others. The availability depends on your plan and API keys.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. Your stories are stored securely and never shared. With BYOK plans, your data goes directly to your chosen AI provider. We never store or access your API keys.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. Credits are non-refundable but never expire.'
    }
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-page-container">
        <header className="pricing-page-header">
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that fits your writing needs. Start free and scale as you grow.</p>
        </header>

        <div className="pricing-tiers">
          {tiers.map((tier, index) => (
            <div key={index} className={`pricing-tier ${tier.popular ? 'popular' : ''}`}>
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="tier-header">
                <h3 className="tier-name" style={{ color: tier.color }}>{tier.name}</h3>
                <div className="tier-price">
                  <span className="price">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
                <p className="tier-description">{tier.description}</p>
              </div>

              <div className="tier-features">
                <h4>What's included:</h4>
                <ul className="features-list">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="feature-item">
                      <span className="check-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                {tier.limitations.length > 0 && (
                  <div className="limitations">
                    <h4>Limitations:</h4>
                    <ul className="limitations-list">
                      {tier.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="limitation-item">
                          <span className="info-icon">ℹ</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="tier-cta">
                {tier.link === '#' ? (
                  <button className="btn btn-tier" disabled style={{ backgroundColor: tier.color }}>
                    {tier.cta}
                  </button>
                ) : (
                  <Link to={tier.link} className="btn btn-tier" style={{ backgroundColor: tier.color }}>
                    {tier.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pricing-cta-section">
          <h2>Ready to Start Writing?</h2>
          <p>Join thousands of writers using AI to enhance their creativity</p>
          <div className="pricing-cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">Start Free Trial</Link>
            <Link to="/features" className="btn btn-secondary btn-large">Learn More</Link>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
};

export default PricingPage;
