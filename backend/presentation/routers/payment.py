import random
import time
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from domain.models.payment import (
    MockPurchaseRequest, MockPurchaseResponse, CreditPackagesResponse,
    UserProfile, AddCreditsRequest, AddCreditsResponse,
    UpgradeUserRequest, UpgradeUserResponse, CreditPackage,
    Transaction, PaymentError
)
from infrastructure.database.repositories import UserRepository
from api.middleware.fastapi_auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/payment/mock-purchase", response_model=MockPurchaseResponse)
async def mock_purchase(
    purchase_data: MockPurchaseRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mock payment processing for testing purposes"""
    user_id = current_user['id']
    
    # Simulate payment processing delay
    time.sleep(1)
    
    # Simulate random failures or forced failure
    failure_scenarios = [
        {'code': 'CARD_DECLINED', 'message': 'Your card was declined. Please try a different payment method.'},
        {'code': 'INSUFFICIENT_FUNDS', 'message': 'Insufficient funds on your card. Please try a different card.'},
        {'code': 'NETWORK_ERROR', 'message': 'Network error occurred. Please try again.'},
        {'code': 'PAYMENT_FAILED', 'message': 'Payment could not be processed. Please try again.'}
    ]
    
    if purchase_data.simulateFailure or (random.random() < 0.05):  # 5% random failure
        error = random.choice(failure_scenarios)
        return MockPurchaseResponse(
            success=False,
            error=PaymentError(
                code=error['code'],
                message=error['message'],
                retryable=True
            )
        )
    
    # Update user credits by adding a transaction
    try:
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='purchase',
            amount=purchase_data.credits,
            description=f"Purchased {purchase_data.credits} credits with package {purchase_data.packageId}",
            related_entity_id=purchase_data.packageId
        )
    except Exception as e:
        logger.error(f"Failed to update user credits: {e}")
        return MockPurchaseResponse(
            success=False,
            error=PaymentError(
                code='DATABASE_ERROR',
                message='Failed to update account. Please contact support.',
                retryable=False
            )
        )
    
    # Create transaction record
    transaction = Transaction(
        id=f"mock_{int(time.time())}_{random.randint(1000, 9999)}",
        user_id=user_id,
        package_id=purchase_data.packageId,
        credits=purchase_data.credits,
        amount=purchase_data.amount,
        payment_method=purchase_data.paymentMethod,
        timestamp=datetime.utcnow().isoformat(),
        status='completed'
    )
    
    # Get new balance
    new_balance = UserRepository.get_user_credit_balance(user_id)
    
    return MockPurchaseResponse(
        success=True,
        transaction=transaction,
        newBalance=new_balance
    )

@router.get("/payment/packages", response_model=CreditPackagesResponse)
async def get_credit_packages():
    """Get available credit packages"""
    packages = [
        CreditPackage(
            id='starter',
            name='Starter Pack',
            credits=500,
            price=5.00,
            features=['Perfect for trying premium features', '~25 story generations']
        ),
        CreditPackage(
            id='popular',
            name='Popular Pack',
            credits=1200,
            price=10.00,
            isPopular=True,
            features=['Most chosen by users', '~60 story generations', '20% bonus credits']
        ),
        CreditPackage(
            id='value',
            name='Best Value Pack',
            credits=3000,
            price=20.00,
            isBestValue=True,
            features=['Maximum savings', '~150 story generations', '50% bonus credits']
        ),
        CreditPackage(
            id='professional',
            name='Professional Pack',
            credits=6000,
            price=35.00,
            features=['For heavy users', '~300 story generations', '71% bonus credits']
        )
    ]
    return CreditPackagesResponse(packages=packages)

@router.get("/user/profile", response_model=UserProfile)
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile including credit balance"""
    # Get credit balance from transactions
    credit_balance = UserRepository.get_user_credit_balance(current_user['id'])

    return UserProfile(
        username=current_user['username'],
        email=current_user.get('email', ''),
        tier=current_user.get('tier', 'free'),
        credits=credit_balance,
        created_at=current_user.get('created_at', ''),
        last_active=current_user.get('last_active', '')
    )

@router.post("/user/add-credits", response_model=AddCreditsResponse)
async def add_credits(
    credits_data: AddCreditsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Developer utility: Add credits to the current user (for testing only)"""
    user_id = current_user['id']
    
    if credits_data.credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid credits value'
        )
    
    try:
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='test_add',
            amount=credits_data.credits,
            description=f"Test add {credits_data.credits} credits",
            related_entity_id=None
        )
    except Exception as e:
        logger.error(f"Failed to add credits: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to add credits'
        )
    
    new_balance = UserRepository.get_user_credit_balance(user_id)
    return AddCreditsResponse(success=True, newBalance=new_balance)

@router.post("/admin/upgrade-user", response_model=UpgradeUserResponse)
async def upgrade_user_to_premium(
    upgrade_data: UpgradeUserRequest,
    current_user: dict = Depends(get_current_user)
):
    """Upgrade a user to premium and add credits. Admin only."""
    # Check if current user is admin (simplified check)
    admin_user = UserRepository.get_user_by_username_with_roles(current_user['username'])
    
    if not admin_user or 'admin' not in admin_user['roles']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Unauthorized access'
        )

    user = UserRepository.get_user_by_email(upgrade_data.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found'
        )

    try:
        # Upgrade user to premium
        UserRepository.update_user_tier(user['id'], 'premium')

        # Add 100,000 credits to the user
        UserRepository.add_credit_transaction(
            user_id=user['id'],
            transaction_type='admin_upgrade',
            amount=100000,
            description='Admin upgrade to premium with 100,000 credits',
            related_entity_id=None
        )
    except Exception as e:
        logger.error(f"Failed to upgrade user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to upgrade user'
        )

    return UpgradeUserResponse(
        success=True,
        message=f"User {upgrade_data.email} upgraded to premium with 100,000 credits"
    )