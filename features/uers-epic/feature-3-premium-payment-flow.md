# Feature 3: Premium Tier & Mocked Payment Flow

## 📋 Overview

**Epic:** Public Launch & Monetization Strategy  
**Feature ID:** F3  
**Priority:** HIGH  
**Effort:** 3 days  
**Dependencies:** F2 (User Account Dashboard)

## 🎯 Description

Implement the UI and frontend logic for the credit-based premium system. The actual payment processing will be mocked initially to enable complete user journey testing before integrating real payment providers.

## 👤 User Stories

### US3.1 - Credit Packages Page
**As a** user  
**I need** a dedicated "Buy Credits" page  
**So that** I can view and select credit packages

**Acceptance Criteria:**
- [ ] Displays multiple credit package options with clear pricing
- [ ] Shows cost per credit and total value calculations
- [ ] Highlights "best value" or "most popular" packages
- [ ] Clear package descriptions and benefits
- [ ] Responsive design for all devices

### US3.2 - Package Selection
**As a** user  
**I want** to easily compare and select credit packages  
**So that** I can choose the best option for my needs

**Acceptance Criteria:**
- [ ] Package cards with clear visual hierarchy
- [ ] Price comparison indicators
- [ ] Package benefits/features listed
- [ ] One-click package selection
- [ ] Visual feedback on selection

### US3.3 - Mock Payment Modal
**As a** user  
**When** I click a package, I should see a payment modal  
**So that** I can complete a simulated purchase

**Acceptance Criteria:**
- [ ] Modal opens with selected package details
- [ ] Contains realistic payment form fields
- [ ] Simulates successful and failed payments
- [ ] Shows processing states and animations
- [ ] Provides clear success/error feedback

### US3.4 - Credit Balance Update
**As a** user  
**When** I complete a mock successful payment  
**My** credit balance should update immediately  
**So that** I can continue using premium features

**Acceptance Criteria:**
- [ ] Credit balance updates in real-time
- [ ] Success notification displays
- [ ] Transaction appears in usage history
- [ ] Dashboard reflects new balance
- [ ] User can immediately use credits

### US3.5 - Payment Failure Handling
**As a** user  
**When** a mock payment fails  
**I want** clear error messages and retry options  
**So that** I understand what happened and can try again

**Acceptance Criteria:**
- [ ] Clear error messages for different failure types
- [ ] Retry button functionality
- [ ] No credit balance changes on failure
- [ ] Error tracking for future analysis

## 🔧 Technical Implementation

### Current State Analysis
The existing application has:
- Basic user dashboard foundation from F2
- Credit balance display in billing settings
- No payment processing capabilities
- Simple credit tracking in database

### Required Changes

#### 1. Buy Credits Page Component
**File:** `/frontend/src/pages/BuyCredits.tsx`

```tsx
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  isPopular?: boolean;
  isBestValue?: boolean;
  features: string[];
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 500,
    price: 5.00,
    features: ['Perfect for trying premium features', '~25 story generations']
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 1200,
    price: 10.00,
    isPopular: true,
    features: ['Most chosen by users', '~60 story generations', '20% bonus credits']
  },
  {
    id: 'value',
    name: 'Best Value Pack',
    credits: 3000,
    price: 20.00,
    isBestValue: true,
    features: ['Maximum savings', '~150 story generations', '50% bonus credits']
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 6000,
    price: 35.00,
    features: ['For heavy users', '~300 story generations', '71% bonus credits']
  }
];

const BuyCredits: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { username } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  return (
    <div className="buy-credits-container">
      <div className="buy-credits-header">
        <h1>Buy Credits</h1>
        <p>Choose a credit package to unlock premium AI features</p>
        {userProfile && (
          <div className="current-balance">
            Current balance: <strong>{userProfile.credits} credits</strong>
          </div>
        )}
      </div>

      <div className="packages-grid">
        {creditPackages.map(pkg => (
          <CreditPackageCard 
            key={pkg.id}
            package={pkg}
            onSelect={() => handlePackageSelect(pkg)}
          />
        ))}
      </div>

      {showPaymentModal && selectedPackage && (
        <MockPaymentModal
          package={selectedPackage}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
};
```

#### 2. Credit Package Card Component
**File:** `/frontend/src/components/payments/CreditPackageCard.tsx`

```tsx
interface CreditPackageCardProps {
  package: CreditPackage;
  onSelect: () => void;
}

const CreditPackageCard: React.FC<CreditPackageCardProps> = ({ package: pkg, onSelect }) => {
  const costPerCredit = pkg.price / pkg.credits;
  
  return (
    <div className={`package-card ${pkg.isPopular ? 'popular' : ''} ${pkg.isBestValue ? 'best-value' : ''}`}>
      {pkg.isPopular && <div className="package-badge popular-badge">Most Popular</div>}
      {pkg.isBestValue && <div className="package-badge value-badge">Best Value</div>}
      
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
```

#### 3. Mock Payment Modal Component
**File:** `/frontend/src/components/payments/MockPaymentModal.tsx`

```tsx
interface MockPaymentModalProps {
  package: CreditPackage;
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
  onError: (error: PaymentError) => void;
}

const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ 
  package: pkg, 
  onClose, 
  onSuccess, 
  onError 
}) => {
  const [paymentState, setPaymentState] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handlePayment = async () => {
    setPaymentState('processing');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (simulateFailure || Math.random() < 0.1) { // 10% random failure for testing
      const error: PaymentError = {
        code: 'CARD_DECLINED',
        message: 'Your card was declined. Please try a different payment method.',
        retryable: true
      };
      setPaymentState('error');
      onError(error);
    } else {
      const transaction: Transaction = {
        id: `mock_${Date.now()}`,
        packageId: pkg.id,
        credits: pkg.credits,
        amount: pkg.price,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      setPaymentState('success');
      onSuccess(transaction);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="modal-header">
          <h2>Complete Your Purchase</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {paymentState === 'form' && (
          <PaymentForm 
            package={pkg}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            cardDetails={cardDetails}
            setCardDetails={setCardDetails}
            simulateFailure={simulateFailure}
            setSimulateFailure={setSimulateFailure}
            onSubmit={handlePayment}
            onCancel={onClose}
          />
        )}

        {paymentState === 'processing' && (
          <ProcessingState package={pkg} />
        )}

        {paymentState === 'success' && (
          <SuccessState package={pkg} onClose={onClose} />
        )}

        {paymentState === 'error' && (
          <ErrorState 
            onRetry={() => setPaymentState('form')}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
```

#### 4. Payment Form Component
**File:** `/frontend/src/components/payments/PaymentForm.tsx`

```tsx
const PaymentForm: React.FC<PaymentFormProps> = ({
  package: pkg,
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  simulateFailure,
  setSimulateFailure,
  onSubmit,
  onCancel
}) => {
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (paymentMethod === 'card') {
      setIsFormValid(
        cardDetails.number.length >= 16 &&
        cardDetails.expiry.length >= 5 &&
        cardDetails.cvv.length >= 3 &&
        cardDetails.name.trim().length > 0
      );
    } else {
      setIsFormValid(true); // PayPal doesn't need form validation
    }
  }, [cardDetails, paymentMethod]);

  return (
    <div className="payment-form">
      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="summary-line">
          <span>{pkg.name}</span>
          <span>€{pkg.price.toFixed(2)}</span>
        </div>
        <div className="summary-line">
          <span>{pkg.credits.toLocaleString()} Credits</span>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <span>€{pkg.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-methods">
        <h3>Payment Method</h3>
        <div className="method-selector">
          <button 
            className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            💳 Credit Card
          </button>
          <button 
            className={`method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('paypal')}
          >
            🅿️ PayPal
          </button>
        </div>
      </div>

      {paymentMethod === 'card' && (
        <div className="card-form">
          <div className="form-row">
            <label>Card Number</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
              maxLength={19}
            />
          </div>
          <div className="form-row-group">
            <div className="form-row">
              <label>Expiry Date</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                maxLength={5}
              />
            </div>
            <div className="form-row">
              <label>CVV</label>
              <input
                type="text"
                placeholder="123"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                maxLength={4}
              />
            </div>
          </div>
          <div className="form-row">
            <label>Cardholder Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardDetails.name}
              onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
            />
          </div>
        </div>
      )}

      {/* Development/Testing Controls */}
      <div className="dev-controls">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
          />
          Simulate payment failure (for testing)
        </label>
      </div>

      <div className="form-actions">
        <button 
          className="cancel-btn secondary-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className="pay-btn primary-btn"
          onClick={onSubmit}
          disabled={!isFormValid}
        >
          Pay €{pkg.price.toFixed(2)}
        </button>
      </div>
    </div>
  );
};
```

#### 5. Backend Mock Payment Endpoint
**File:** `/backend/controllers/payment_controller.py`

```python
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from data.repositories import UserRepository
import json
from datetime import datetime

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/api/payment/mock-purchase', methods=['POST'])
@jwt_required()
def mock_purchase():
    username = get_jwt_identity()
    user = UserRepository.get_user_by_username(username)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    package_id = data.get('packageId')
    credits = data.get('credits')
    amount = data.get('amount')
    simulate_failure = data.get('simulateFailure', False)
    
    # Simulate payment processing delay
    import time
    time.sleep(1)
    
    # Simulate random failures or forced failure
    if simulate_failure or (random.random() < 0.05):  # 5% random failure
        return jsonify({
            'success': False,
            'error': {
                'code': 'PAYMENT_FAILED',
                'message': 'Payment could not be processed. Please try again.'
            }
        }), 400
    
    # Update user credits
    current_credits = user.get('credits', 0)
    new_credits = current_credits + credits
    
    UserRepository.update_user_credits(user['id'], new_credits)
    
    # Record transaction
    transaction = {
        'id': f"mock_{int(time.time())}",
        'user_id': user['id'],
        'package_id': package_id,
        'credits': credits,
        'amount': amount,
        'timestamp': datetime.utcnow().isoformat(),
        'status': 'completed'
    }
    
    # Store transaction (would need new table)
    
    return jsonify({
        'success': True,
        'transaction': transaction,
        'newBalance': new_credits
    }), 200

@payment_bp.route('/api/payment/packages', methods=['GET'])
def get_credit_packages():
    packages = [
        {
            'id': 'starter',
            'name': 'Starter Pack',
            'credits': 500,
            'price': 5.00,
            'features': ['Perfect for trying premium features', '~25 story generations']
        },
        # ... other packages
    ]
    return jsonify({'packages': packages}), 200
```

## 🎨 UX Design Mockups

### Buy Credits Page Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    💳 BUY CREDITS                           │
│                                                             │
│    Choose a credit package to unlock premium AI features   │
│              Current balance: 247 credits                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │ STARTER │ │POPULAR ⭐│ │BEST VALUE│ │  PRO    │             │
│ │   500   │ │ 🔥 1,200│ │  💎 3,000│ │  6,000  │             │
│ │ credits │ │ credits │ │  credits │ │ credits │             │
│ │         │ │         │ │          │ │         │             │
│ │  €5.00  │ │ €10.00  │ │  €20.00  │ │ €35.00  │             │
│ │         │ │         │ │          │ │         │             │
│ │ ✓ Try   │ │ ✓ Most  │ │ ✓ Max    │ │ ✓ Heavy │             │
│ │ premium │ │ popular │ │ savings  │ │ users   │             │
│ │ ✓ ~25   │ │ ✓ ~60   │ │ ✓ ~150   │ │ ✓ ~300  │             │
│ │ stories │ │ stories │ │ stories  │ │ stories │             │
│ │         │ │ ✓ 20%   │ │ ✓ 50%    │ │ ✓ 71%   │             │
│ │[Select] │ │ bonus   │ │ bonus    │ │ bonus   │             │
│ │         │ │[Select] │ │ [Select] │ │[Select] │             │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Payment Modal - Form State
```
┌─────────────────────────────────────────────────────────────┐
│ Complete Your Purchase                                   ×  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📋 Order Summary                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Popular Pack                                €10.00     │ │
│ │ 1,200 Credits                                          │ │
│ │ ─────────────────────────────────                      │ │
│ │ Total                                     €10.00     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💳 Payment Method                                           │
│ [💳 Credit Card] [🅿️ PayPal]                              │
│                                                             │
│ Card Number: [1234 5678 9012 3456.....................]    │
│ Expiry: [MM/YY]           CVV: [123]                       │
│ Name: [John Doe.................................]           │
│                                                             │
│ ☐ Simulate payment failure (for testing)                   │
│                                                             │
│                            [Cancel] [Pay €10.00]           │
└─────────────────────────────────────────────────────────────┘
```

### Payment Modal - Processing State
```
┌─────────────────────────────────────────────────────────────┐
│ Complete Your Purchase                                   ×  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     🔄 Processing Payment                   │
│                                                             │
│                 Please wait while we process               │
│                      your payment...                       │
│                                                             │
│                     [━━━━━━━━━━] 75%                        │
│                                                             │
│                 Do not close this window                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Payment Modal - Success State
```
┌─────────────────────────────────────────────────────────────┐
│ Payment Successful                                       ×  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ✅ Success!                         │
│                                                             │
│              Your payment has been processed               │
│                                                             │
│         🎉 1,200 credits added to your account! 🎉         │
│                                                             │
│              New balance: 1,447 credits                    │
│                                                             │
│           Transaction ID: mock_1686567891234               │
│                                                             │
│                      [Continue]                            │
└─────────────────────────────────────────────────────────────┘
```

### Payment Modal - Error State
```
┌─────────────────────────────────────────────────────────────┐
│ Payment Failed                                           ×  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ❌ Payment Failed                   │
│                                                             │
│         Your card was declined. Please try a               │
│           different payment method or card.                │
│                                                             │
│                   Error Code: CARD_DECLINED               │
│                                                             │
│                  [Try Again] [Cancel]                      │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Implementation Tasks

### Phase 1: Buy Credits Page (1 day)
- [ ] Create `BuyCredits.tsx` main page component
- [ ] Create `CreditPackageCard.tsx` component
- [ ] Design and implement credit packages data structure
- [ ] Add routing for buy credits page
- [ ] Style credit packages grid layout

### Phase 2: Mock Payment Modal (1.5 days)
- [ ] Create `MockPaymentModal.tsx` component
- [ ] Implement `PaymentForm.tsx` with card/PayPal options
- [ ] Create processing, success, and error state components
- [ ] Add form validation and user feedback
- [ ] Style modal and form components

### Phase 3: Backend Integration (0.5 days)
- [ ] Create mock payment endpoint
- [ ] Add transaction recording capability
- [ ] Implement credit balance updates
- [ ] Add error simulation for testing
- [ ] Create credit packages API endpoint

## 🧪 Testing Strategy

### Manual Testing Scenarios
1. **Package Selection Flow:**
   - View all credit packages
   - Select different packages
   - Verify modal opens with correct details

2. **Payment Form Testing:**
   - Test card form validation
   - Test PayPal selection
   - Test form error states

3. **Mock Payment Processing:**
   - Test successful payment flow
   - Test payment failure scenarios  
   - Verify credit balance updates
   - Test retry functionality

4. **Integration Testing:**
   - Payment to dashboard balance update
   - Transaction history recording
   - Multi-user payment isolation

### Automated Testing
- [ ] Unit tests for payment components
- [ ] API endpoint testing
- [ ] Credit balance calculation tests
- [ ] Form validation tests

## 🚀 Success Metrics

### Immediate (Launch)
- [ ] Payment modal opens in < 500ms
- [ ] Form validation works correctly
- [ ] Credit balance updates immediately after purchase
- [ ] Error handling works for all failure scenarios

### Post-Launch (1 week)
- [ ] Payment flow completion rate > 80%
- [ ] Average time to complete purchase < 2 minutes
- [ ] Error recovery rate > 90%
- [ ] User satisfaction with purchase flow > 4.2/5

## 📊 Analytics & Tracking

### Events to Track
- Buy credits page visits
- Package selection clicks
- Payment modal opens
- Payment form submissions
- Payment success/failure rates
- Retry attempts
- Purchase completion time

### Conversion Funnel
1. Buy credits page visit
2. Package selection
3. Payment modal open
4. Payment form completion
5. Successful purchase
6. Credit usage

## 🔗 Dependencies & Risks

### Dependencies
- User dashboard system (F2)
- Credit balance tracking
- Mock payment infrastructure

### Risks & Mitigation
- **Risk:** Payment form UX complexity
  - **Mitigation:** Simple, clear form design with good validation

- **Risk:** Mock payment state confusion
  - **Mitigation:** Clear indicators that payments are simulated

- **Risk:** Credit balance synchronization issues
  - **Mitigation:** Atomic database transactions

## 📋 Definition of Done

- [ ] All user stories meet acceptance criteria
- [ ] Buy credits page displays all packages correctly
- [ ] Payment modal supports full purchase flow
- [ ] Mock payment processing works for success/failure scenarios
- [ ] Credit balances update correctly after purchase
- [ ] Error handling covers all edge cases
- [ ] Responsive design works on all devices
- [ ] Code is reviewed and tested
- [ ] Analytics tracking is implemented
- [ ] Documentation is complete
