import random
import time
from datetime import datetime

from data.repositories import UserRepository
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

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
    simulate_failure = False # data.get('simulateFailure', False)
    payment_method = data.get('paymentMethod', 'card')
    
    # Validate required fields
    if not all([package_id, credits, amount]):
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Missing required payment information'
            }
        }), 400
    
    # Simulate payment processing delay
    time.sleep(1)
    
    # Simulate random failures or forced failure
    failure_scenarios = [
        {'code': 'CARD_DECLINED', 'message': 'Your card was declined. Please try a different payment method.'},
        {'code': 'INSUFFICIENT_FUNDS', 'message': 'Insufficient funds on your card. Please try a different card.'},
        {'code': 'NETWORK_ERROR', 'message': 'Network error occurred. Please try again.'},
        {'code': 'PAYMENT_FAILED', 'message': 'Payment could not be processed. Please try again.'}
    ]
    
    if simulate_failure or (random.random() < 0.05):  # 5% random failure
        error = random.choice(failure_scenarios)
        return jsonify({
            'success': False,
            'error': {
                'code': error['code'],
                'message': error['message'],
                'retryable': True
            }
        }), 400
    
    # Update user credits by adding a transaction
    try:
        # Get current balance to correctly reflect it in the transaction description if needed
        # This is optional, the core logic relies on summing transactions
        # current_balance_before_purchase = UserRepository.get_user_credit_balance(user['id'])
        
        UserRepository.add_credit_transaction(
            user_id=user['id'],
            transaction_type='purchase',
            amount=credits,
            description=f"Purchased {credits} credits with package {package_id}",
            related_entity_id=package_id
        )
    except Exception as e:
        print(f"Failed to update user credits: {e}")
        return jsonify({
            'success': False,
            'error': {
                'code': 'DATABASE_ERROR',
                'message': 'Failed to update account. Please contact support.',
                'retryable': False
            }
        }), 500
    
    # Create transaction record
    transaction = {
        'id': f"mock_{int(time.time())}_{random.randint(1000, 9999)}",
        'user_id': user['id'],
        'package_id': package_id,
        'credits': credits,
        'amount': amount,
        'payment_method': payment_method,
        'timestamp': datetime.utcnow().isoformat(),
        'status': 'completed'
    }
    
    # In a real implementation, we would store this transaction in a database
    # For now, we'll just return it in the response
    new_balance = UserRepository.get_user_credit_balance(user['id'])
    
    return jsonify({
        'success': True,
        'transaction': transaction,
        'newBalance': new_balance
    }, 200)

@payment_bp.route('/api/payment/packages', methods=['GET'])
def get_credit_packages():
    """Get available credit packages"""
    packages = [
        {
            'id': 'starter',
            'name': 'Starter Pack',
            'credits': 500,
            'price': 5.00,
            'features': ['Perfect for trying premium features', '~25 story generations']
        },
        {
            'id': 'popular',
            'name': 'Popular Pack',
            'credits': 1200,
            'price': 10.00,
            'isPopular': True,
            'features': ['Most chosen by users', '~60 story generations', '20% bonus credits']
        },
        {
            'id': 'value',
            'name': 'Best Value Pack',
            'credits': 3000,
            'price': 20.00,
            'isBestValue': True,
            'features': ['Maximum savings', '~150 story generations', '50% bonus credits']
        },
        {
            'id': 'professional',
            'name': 'Professional Pack',
            'credits': 6000,
            'price': 35.00,
            'features': ['For heavy users', '~300 story generations', '71% bonus credits']
        }
    ]
    return jsonify({'packages': packages}), 200

@payment_bp.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get user profile including credit balance"""
    username = get_jwt_identity()
    user = UserRepository.get_user_by_username(username)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get credit balance from transactions
    credit_balance = UserRepository.get_user_credit_balance(user['id'])

    profile = {
        'username': user['username'],
        'email': user['email'] if 'email' in user.keys() else '',
        'tier': user['tier'] if 'tier' in user.keys() else 'free',
        'credits': credit_balance,
        'created_at': user['created_at'] if 'created_at' in user.keys() else '',
        'last_active': user['last_active'] if 'last_active' in user.keys() else ''
    }
    
    return jsonify(profile), 200

@payment_bp.route('/api/user/add-credits', methods=['POST'])
@jwt_required()
def add_credits():
    """Developer utility: Add credits to the current user (for testing only)"""
    username = get_jwt_identity()
    user = UserRepository.get_user_by_username(username)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    credits = data.get('credits')
    if not isinstance(credits, int) or credits <= 0:
        return jsonify({'error': 'Invalid credits value'}), 400
    try:
        UserRepository.add_credit_transaction(
            user_id=user['id'],
            transaction_type='test_add',
            amount=credits,
            description=f"Test add {credits} credits",
            related_entity_id=None
        )
    except Exception as e:
        print(f"Failed to add credits: {e}")
        return jsonify({'error': 'Failed to add credits'}), 500
    new_balance = UserRepository.get_user_credit_balance(user['id'])
    return jsonify({'success': True, 'newBalance': new_balance}), 200

@payment_bp.route('/api/admin/upgrade-user', methods=['POST'])
@jwt_required()
def upgrade_user_to_premium():
    """Upgrade a user to premium and add credits. Admin only."""
    username = get_jwt_identity()
    admin_user = UserRepository.get_user_by_username_with_roles(username)

    if not admin_user or 'admin' not in admin_user['roles'] :
        return jsonify({'error': 'Unauthorized access'}), 403

    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = UserRepository.get_user_by_email(email)

    if not user:
        return jsonify({'error': 'User not found'}), 404

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
        print(f"Failed to upgrade user: {e}")
        return jsonify({'error': 'Failed to upgrade user'}), 500

    return jsonify({'success': True, 'message': f"User {email} upgraded to premium with 100,000 credits"}), 200
