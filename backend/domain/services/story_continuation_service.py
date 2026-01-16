"""
Story Continuation Service
Handles story summarization and continuation scenario creation
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional

from infrastructure.database.repositories import UserRepository, ScenarioRepository, GeneratedTextRepository
from infrastructure.database.user_preferences_repository import UserPreferencesRepository
from domain.services.llm_proxy_service import LLMProxyService
from domain.services.credit_service import CreditService
from domain.services.max_tokens_service import MaxTokensService, TokenContext

logger = logging.getLogger(__name__)


class StoryContinuationService:
    """Service for creating story continuations"""

    SUMMARIZE_PROMPT = """You are a story summarizer. Read the following story and create a concise summary that captures:
- The main plot points and key events
- Character development and relationships
- The current state of affairs at the end of the story
- Any unresolved plot threads or cliffhangers

Write the summary in 2-3 paragraphs, using third person perspective. Focus on what a reader would need to know to understand a continuation of this story. Explain where the previous chapter ends.

STORY:
{story_text}

SUMMARY:"""

    STORY_START_PROMPT = """You are a creative fiction writer. Based on the following story and its summary, write the opening paragraphs for the next chapter/continuation of this story.

The opening should:
- Flow naturally from where the previous story ended
- Maintain the same writing style and tone
- Hook the reader and set up the next part of the story
- Be 3 short paragraphs and end with a plot twist or intriguing situation

PREVIOUS STORY SUMMARY:
{summary}

FULL STORY (for context and style reference):
{story_text}

CONTINUATION OPENING:"""

    @staticmethod
    async def summarize_story(
        story_text: str,
        user_id: str,
        byok_headers: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Use LLM to create a concise summary of the story.
        Deducts credits for the LLM call.

        Args:
            story_text: The full text of the story to summarize
            user_id: User ID for credit deduction and LLM service selection
            byok_headers: Optional BYOK headers for API credentials

        Returns:
            A summary of the story (2-3 paragraphs)
        """
        # Get LLM service for the user
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)

        # Build the prompt
        prompt = StoryContinuationService.SUMMARIZE_PROMPT.format(story_text=story_text)

        # Estimate credits needed
        credit_service = CreditService()
        estimated_credits = credit_service.estimate_cost(prompt, provider).get('estimated_credits', 100)

        # Check credits for member mode
        if mode == 'member':
            current_balance = UserRepository.get_user_credit_balance(user_id)
            if current_balance < estimated_credits:
                raise ValueError(f"Insufficient credits. Need approximately {estimated_credits}, have {current_balance}.")

        # Make LLM call
        payload = {
            'model': 'default',  # Let the service use its default model
            'messages': [
                {"role": "system", "content": "You are a helpful assistant that summarizes stories concisely and accurately."},
                {"role": "user", "content": prompt}
            ],
            'temperature': 0.5,  # Lower temperature for more consistent summaries
            'max_tokens': MaxTokensService.get_max_tokens(TokenContext.STORY_CONTINUATION_SUMMARY),
            'stream': False
        }

        try:
            response = service.chat_completion(payload)

            # Extract the summary from the response
            if isinstance(response, dict) and 'choices' in response:
                summary = response['choices'][0]['message']['content'].strip()

                # Deduct credits for member mode
                if mode == 'member':
                    usage = response.get('usage', {})
                    total_tokens = usage.get('total_tokens', estimated_credits)
                    UserRepository.add_credit_transaction(
                        user_id=user_id,
                        transaction_type='story_summarization',
                        amount=-total_tokens,
                        description=f"Story summarization for continuation",
                        related_entity_id=None
                    )
                    
                return summary
            else:
                raise ValueError("Unexpected response format from LLM service")

        except Exception as e:
            logger.error(f"Story summarization failed: {str(e)}")
            raise

    @staticmethod
    async def generate_story_start(
        story_text: str,
        summary: str,
        user_id: str,
        byok_headers: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Use LLM to generate the opening of the next chapter.
        Deducts credits for the LLM call.

        Args:
            story_text: The full text of the original story
            summary: The summary of the story
            user_id: User ID for credit deduction and LLM service selection
            byok_headers: Optional BYOK headers for API credentials

        Returns:
            Opening paragraphs for the story continuation
        """

        # Get LLM service for the user
        service, provider, mode = LLMProxyService.get_llm_service_for_user(user_id, byok_headers)

        # Build the prompt
        prompt = StoryContinuationService.STORY_START_PROMPT.format(
            summary=summary,
            story_text=story_text
        )

        # Estimate credits needed
        credit_service = CreditService()
        estimated_credits = credit_service.estimate_cost(prompt, provider).get('estimated_credits', 150)

        # Check credits for member mode
        if mode == 'member':
            current_balance = UserRepository.get_user_credit_balance(user_id)
            if current_balance < estimated_credits:
                raise ValueError(f"Insufficient credits. Need approximately {estimated_credits}, have {current_balance}.")

        # Make LLM call
        payload = {
            'model': 'default',
            'messages': [
                {"role": "system", "content": "You are a creative fiction writer who writes engaging story continuations."},
                {"role": "user", "content": prompt}
            ],
            'temperature': 0.8,  # Higher temperature for more creative output
            'max_tokens': MaxTokensService.get_max_tokens(TokenContext.STORY_CONTINUATION_START),
            'stream': False
        }

        try:
            response = service.chat_completion(payload)

            # Extract the story start from the response
            if isinstance(response, dict) and 'choices' in response:
                story_start = response['choices'][0]['message']['content'].strip()

                # Deduct credits for member mode
                if mode == 'member':
                    usage = response.get('usage', {})
                    total_tokens = usage.get('total_tokens', estimated_credits)
                    UserRepository.add_credit_transaction(
                        user_id=user_id,
                        transaction_type='story_start_generation',
                        amount=-total_tokens,
                        description=f"Story continuation opening generation",
                        related_entity_id=None
                    )

                return story_start
            else:
                raise ValueError("Unexpected response format from LLM service")

        except Exception as e:
            logger.error(f"Story start generation failed: {str(e)}")
            raise

    @staticmethod
    async def create_continuation_scenario(
        original_story_id: str,
        original_scenario_id: str,
        user_id: str,
        byok_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Create a new scenario for continuing an existing story.

        1. Fetch original story and scenario
        2. Summarize the story (deducts credits)
        3. Generate story start (deducts credits)
        4. Create new scenario with same characters, locations, style, notes
        5. Set synopsis to summary and fillIn.beginning to story start
        6. Save and return the new scenario

        Args:
            original_story_id: ID of the story to continue
            original_scenario_id: ID of the original scenario
            user_id: User ID for ownership verification and credits
            byok_headers: Optional BYOK headers for API credentials

        Returns:
            The newly created continuation scenario
        """

        # Fetch the original story
        story = GeneratedTextRepository.get_story_by_id(original_story_id)
        if not story:
            raise ValueError(f"Story {original_story_id} not found")

        # Verify the story belongs to the specified scenario
        if story['scenario_id'] != original_scenario_id:
            raise ValueError("Story does not belong to the specified scenario")

        # Fetch the original scenario
        scenario = ScenarioRepository.get_scenario_by_id(original_scenario_id)
        if not scenario:
            raise ValueError(f"Scenario {original_scenario_id} not found")

        # Verify user owns the scenario
        if scenario['user_id'] != user_id:
            raise ValueError("You don't have permission to continue this story")

        # Parse the original scenario data
        try:
            original_data = json.loads(scenario['jsondata'])
        except json.JSONDecodeError:
            raise ValueError("Invalid scenario data")

        story_text = story['text']

        # Step 1: Summarize the story
        summary = await StoryContinuationService.summarize_story(
            story_text, user_id, byok_headers
        )

        # Step 2: Generate story start
        story_start = await StoryContinuationService.generate_story_start(
            story_text, summary, user_id, byok_headers
        )

        # Step 3: Create new scenario

        # Generate new ID
        new_id = str(uuid.uuid4())

        # Build the new scenario data
        original_title = original_data.get('title', 'Untitled')
        new_scenario_data = {
            'id': new_id,
            'userId': user_id,
            'title': f"{original_title} - Continued",
            'synopsis': summary,  # Summary goes to synopsis
            'fillIn': {
                'beginning': story_start,  # Story start goes to fill-in beginning
                'ending': ''  # User can optionally add an ending
            },
            # Copy these from original
            'characters': original_data.get('characters', []),
            'locations': original_data.get('locations', []),
            'writingStyle': original_data.get('writingStyle', {}),
            'notes': original_data.get('notes', ''),
            'backstory': original_data.get('backstory', ''),
            'storyarc': '',  # Clear story arc for the new continuation
            'timeline': [],  # Clear timeline for the new continuation
            'scenes': [],  # Clear scenes
            'promptSettings': original_data.get('promptSettings', {}),
            'imageId': original_data.get('imageId'),
            'imageUrl': original_data.get('imageUrl'),
        }

        # Save to database
        jsondata = json.dumps(new_scenario_data)
        created_scenario = ScenarioRepository.create_scenario(
            user_id=user_id,
            title=new_scenario_data['title'],
            jsondata=jsondata
        )

        # Return the full scenario data with the database ID
        new_scenario_data['id'] = created_scenario['id']

        return new_scenario_data
