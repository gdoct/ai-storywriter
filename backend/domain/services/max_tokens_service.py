"""
Centralized service for determining max_tokens values across the application.

This service provides a single source of truth for all max_tokens configurations,
making it easy to understand and adjust token limits for different contexts.
"""

from enum import Enum
from typing import Optional


class TokenContext(str, Enum):
    """Contexts for which max_tokens can be determined."""

    # Story generation contexts
    STORY_GENERATION = "story_generation"
    STORY_CONTINUATION_SUMMARY = "story_continuation_summary"
    STORY_CONTINUATION_START = "story_continuation_start"

    # Individual story element contexts
    STORY_TITLE = "story_title"
    STORY_SYNOPSIS = "story_synopsis"
    STORY_BACKSTORY = "story_backstory"
    STORY_ARC = "story_arc"
    STORY_NOTES = "story_notes"
    CHAPTER_CONTENT = "chapter_content"
    CHAPTER_SUMMARY = "chapter_summary"

    # Character contexts
    CHARACTER_FIELD = "character_field"
    CHARACTER_MULTIMODAL_ANALYSIS = "character_multimodal_analysis"

    # Vision/image contexts
    VISION_ANALYSIS = "vision_analysis"
    VISION_DETAILED = "vision_detailed"

    # Random generation contexts
    RANDOM_WRITING_STYLE = "random_writing_style"
    RANDOM_CHARACTER = "random_character"
    RANDOM_SCENARIO_NAME = "random_scenario_name"

    # General/chat contexts
    CHAT_DEFAULT = "chat_default"
    LLM_COMPLETION_DEFAULT = "llm_completion_default"


# Token limits by context - single source of truth
_TOKEN_LIMITS = {
    # Story generation - main content
    TokenContext.STORY_GENERATION: 2000,
    TokenContext.STORY_CONTINUATION_SUMMARY: 1000,
    TokenContext.STORY_CONTINUATION_START: 1500,

    # Individual story elements
    TokenContext.STORY_TITLE: 100,
    TokenContext.STORY_SYNOPSIS: 300,
    TokenContext.STORY_BACKSTORY: 1000,
    TokenContext.STORY_ARC: 1000,
    TokenContext.STORY_NOTES: 1000,
    TokenContext.CHAPTER_CONTENT: 2000,
    TokenContext.CHAPTER_SUMMARY: 200,

    # Character operations
    TokenContext.CHARACTER_FIELD: 200,
    TokenContext.CHARACTER_MULTIMODAL_ANALYSIS: 500,

    # Vision/image analysis
    TokenContext.VISION_ANALYSIS: 300,
    TokenContext.VISION_DETAILED: 1000,

    # Random generation
    TokenContext.RANDOM_WRITING_STYLE: 1000,
    TokenContext.RANDOM_CHARACTER: 1000,
    TokenContext.RANDOM_SCENARIO_NAME: 100,

    # General defaults
    TokenContext.CHAT_DEFAULT: 1024,
    TokenContext.LLM_COMPLETION_DEFAULT: 1024,
}


class MaxTokensService:
    """
    Service for determining appropriate max_tokens values.

    Usage:
        from domain.services.max_tokens_service import MaxTokensService, TokenContext

        # Get tokens for a specific context
        max_tokens = MaxTokensService.get_max_tokens(TokenContext.STORY_GENERATION)

        # Get with override (useful when user provides a value)
        max_tokens = MaxTokensService.get_max_tokens(
            TokenContext.STORY_GENERATION,
            override=user_provided_value
        )
    """

    @staticmethod
    def get_max_tokens(
        context: TokenContext,
        override: Optional[int] = None
    ) -> int:
        """
        Get the max_tokens value for a given context.

        Args:
            context: The TokenContext enum value indicating the use case
            override: Optional user-provided value that takes precedence

        Returns:
            The appropriate max_tokens value
        """
        if override is not None and override > 0:
            return override

        return _TOKEN_LIMITS.get(context, _TOKEN_LIMITS[TokenContext.LLM_COMPLETION_DEFAULT])

    @staticmethod
    def get_default(context: TokenContext) -> int:
        """
        Get the default max_tokens value for a context (ignoring any overrides).

        Args:
            context: The TokenContext enum value

        Returns:
            The default max_tokens value for this context
        """
        return _TOKEN_LIMITS.get(context, _TOKEN_LIMITS[TokenContext.LLM_COMPLETION_DEFAULT])

    @staticmethod
    def get_all_limits() -> dict:
        """
        Get all token limits for documentation/debugging purposes.

        Returns:
            Dictionary mapping context names to their token limits
        """
        return {ctx.value: limit for ctx, limit in _TOKEN_LIMITS.items()}
