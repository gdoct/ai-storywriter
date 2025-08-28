import React from 'react';
import CTASection from '../components/marketing/CTASection';
import FeaturesSection from '../components/marketing/FeaturesSection';
import HeroSection from '../components/marketing/HeroSection';
import MarketingFooter from '../components/marketing/MarketingFooter';
import PricingSection from '../components/marketing/PricingSection';
import './MarketingHome.css';

const MarketingHome: React.FC = () => {
  return (
    <div className="marketing-home">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
      <MarketingFooter />
    </div>
  );
};

export default MarketingHome;
