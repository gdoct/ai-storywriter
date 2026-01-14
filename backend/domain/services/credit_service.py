from typing import Dict, Any, Optional
from infrastructure.database.repositories import UserRepository
from infrastructure.database.llm_repository import LLMRepository

class CreditService:
    """Service for managing credits and token-based billing"""
    
    @staticmethod
    def calculate_credits_for_usage(tokens_sent: int, tokens_received: int, 
                                   provider: str) -> int:
        """Calculate credits needed for a request based on tokens and provider multiplier"""
        # Get provider preset to get credit multiplier
        provider_preset = LLMRepository.get_provider_preset(provider)
        if not provider_preset:
            # Fallback to 1.0 multiplier if provider not found
            credit_multiplier = 1.0
        else:
            credit_multiplier = provider_preset.get('credit_multiplier', 1.0)
        
        total_tokens = tokens_sent + tokens_received
        return int(total_tokens * credit_multiplier)
    
    @staticmethod
    def check_and_reserve_credits(user_id: str, estimated_tokens: int, 
                                provider: str, model: str) -> bool:
        """Check if user has enough credits and reserve them for the request"""
        # Calculate estimated credits needed
        estimated_credits = CreditService.calculate_credits_for_usage(
            estimated_tokens, 0, provider
        )
        
        # Check current balance
        current_balance = UserRepository.get_user_credit_balance(user_id)
        
        if current_balance < estimated_credits:
            return False
        
        # Reserve the estimated credits
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='usage_request',
            amount=-estimated_credits,
            description=f"Reserved credits for {provider} {model} request",
            related_entity_id=model
        )
        
        return True
    
    @staticmethod
    def finalize_credit_usage(user_id: str, tokens_sent: int, tokens_received: int,
                            provider: str, model: str, estimated_tokens: int) -> int:
        """Finalize credit usage after getting actual token counts"""
        # Calculate actual credits used
        actual_credits = CreditService.calculate_credits_for_usage(
            tokens_sent, tokens_received, provider
        )
        
        # Calculate estimated credits that were reserved
        estimated_credits = CreditService.calculate_credits_for_usage(
            estimated_tokens, 0, provider
        )
        
        # Calculate difference (could be positive or negative)
        credit_adjustment = actual_credits - estimated_credits
        
        if credit_adjustment != 0:
            # Adjust credits based on actual usage
            transaction_type = 'usage_adjustment_debit' if credit_adjustment > 0 else 'usage_adjustment_credit'
            description = f"Credit adjustment for {provider} {model} - actual vs estimated"
            
            UserRepository.add_credit_transaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=-credit_adjustment,  # Negative because we're adjusting the balance
                description=description,
                related_entity_id=model
            )
        
        # Record final usage transaction for tracking
        UserRepository.add_credit_transaction(
            user_id=user_id,
            transaction_type='usage_final',
            amount=0,  # No balance change, just tracking
            description=f"Final usage: {tokens_sent + tokens_received} tokens, {actual_credits} credits for {provider} {model}",
            related_entity_id=model
        )
        
        return actual_credits
    
    @staticmethod
    def get_provider_credit_rates() -> Dict[str, Dict[str, Any]]:
        """Get credit rates and multipliers for all enabled providers"""
        providers = LLMRepository.get_enabled_providers()
        
        rates = {}
        for provider in providers:
            rates[provider['provider_name']] = {
                'display_name': provider['display_name'],
                'credit_multiplier': provider['credit_multiplier'],
                'is_enabled': provider['is_enabled'],
                'cost_per_1k_tokens': provider['credit_multiplier']  # Assuming 1 credit = 1 token base rate
            }
        
        return rates

    @staticmethod
    async def check_sufficient_credits(user_id: str, required_credits: int) -> bool:
        """Check if user has sufficient credits for a request"""
        current_balance = UserRepository.get_user_credit_balance(user_id)
        return current_balance >= required_credits

    @staticmethod
    async def deduct_credits(user_id: str, amount: int, transaction_type: str, description: str) -> bool:
        """Deduct credits from user account with transaction record"""
        try:
            UserRepository.add_credit_transaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=-amount,  # Negative for deduction
                description=description,
                related_entity_id=None
            )
            return True
        except Exception:
            return False

    @staticmethod
    def estimate_cost(message_text: str, provider: str, model: str = "gpt-3.5-turbo") -> Dict[str, Any]:
        """Estimate the cost of a request in credits"""
        try:
            import tiktoken
            
            # Count tokens
            try:
                encoding = tiktoken.encoding_for_model(model)
            except KeyError:
                # Fallback for models not directly supported
                encoding = tiktoken.get_encoding("cl100k_base")
            
            tokens = len(encoding.encode(message_text))
            
            # Get provider multiplier
            provider_preset = LLMRepository.get_provider_preset(provider)
            multiplier = provider_preset.get('credit_multiplier', 1.0) if provider_preset else 1.0
            
            # Estimate total cost (input + estimated output)
            # Assume output will be roughly 50% of input length
            estimated_output_tokens = int(tokens * 0.5)
            total_tokens = tokens + estimated_output_tokens
            total_credits = int(total_tokens * multiplier)
            
            return {
                'input_tokens': tokens,
                'estimated_output_tokens': estimated_output_tokens,
                'total_estimated_tokens': total_tokens,
                'credit_multiplier': multiplier,
                'estimated_credits': total_credits,
                'provider': provider,
                'model': model
            }
            
        except Exception as e:
            # Fallback estimation if tiktoken fails
            # Rough estimate: 1 token per 4 characters
            estimated_tokens = len(message_text) // 4
            estimated_output = estimated_tokens // 2
            total_tokens = estimated_tokens + estimated_output
            
            provider_preset = LLMRepository.get_provider_preset(provider)
            multiplier = provider_preset.get('credit_multiplier', 1.0) if provider_preset else 1.0
            
            return {
                'input_tokens': estimated_tokens,
                'estimated_output_tokens': estimated_output,
                'total_estimated_tokens': total_tokens,
                'credit_multiplier': multiplier,
                'estimated_credits': int(total_tokens * multiplier),
                'provider': provider,
                'model': model,
                'estimation_method': 'fallback',
                'error': str(e)
            }