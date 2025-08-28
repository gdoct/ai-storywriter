import React from 'react';
import { CreditPackage } from '../../pages/BuyCredits';
import './CreditPackageCard.css';

interface CreditPackageCardProps {
  package: CreditPackage;
  onSelect: () => void;
}

const CreditPackageCard: React.FC<CreditPackageCardProps> = ({ package: pkg, onSelect }) => {
  const costPerCredit = pkg.price / pkg.credits;
  
  return (
    <div className={`package-card ${pkg.isPopular ? 'popular' : ''} ${pkg.isBestValue ? 'best-value' : ''}`}>
      {pkg.isPopular && <div className="package-badge popular-badge">⭐ Most Popular</div>}
      {pkg.isBestValue && <div className="package-badge value-badge">💎 Best Value</div>}
      
      <div className="package-header">
        <h3>{pkg.name}</h3>
        <div className="package-price">
          <span className="currency">€</span>
          <span className="amount">{pkg.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="package-credits">
        <span className="credits-amount">{pkg.credits.toLocaleString()}</span>
        <span className="credits-label">Credits</span>
        <div className="cost-per-credit">
          €{costPerCredit.toFixed(3)} per credit
        </div>
      </div>

      <div className="package-features">
        {pkg.features.map((feature, index) => (
          <div key={index} className="feature-item">
            <span className="feature-icon">✓</span>
            <span className="feature-text">{feature}</span>
          </div>
        ))}
      </div>

      <button 
        className="select-package-btn"
        onClick={onSelect}
      >
        Select Package
      </button>
    </div>
  );
};

export default CreditPackageCard;
