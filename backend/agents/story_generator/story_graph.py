"""
Story Generator LangGraph Implementation
Main orchestration graph for story generation with specialized processing nodes
"""

import asyncio
import logging
from typing import Dict, Any, AsyncGenerator, List
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from .models.request_models import StoryGenerationRequest
from .models.response_models import StoryStreamingEvent, ProcessingSummary
from .models.state_models import StoryGeneratorState
from .nodes import (
    scenario_analysis_node,
    general_processing_node,
    characters_processing_node,
    locations_processing_node,
    backstory_processing_node,
    storyarc_processing_node,
    timeline_processing_node,
    notes_processing_node,
    custom_prompts_processing_node,
    fillin_processing_node,
    prompt_construction_node,
    story_generation_node,
    output_formatting_node
)
from .prompts import PromptRepository

logger = logging.getLogger(__name__)


class StoryGeneratorGraph:
    """Main LangGraph implementation for story generation"""

    def __init__(self):
        self.prompt_repository = PromptRepository()
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state graph"""
        # Use the typed state model
        graph_builder = StateGraph(StoryGeneratorState)

        # Add all processing nodes
        graph_builder.add_node("scenario_analysis", scenario_analysis_node)
        graph_builder.add_node("general_processing", general_processing_node)
        graph_builder.add_node("characters_processing", characters_processing_node)
        graph_builder.add_node("locations_processing", locations_processing_node)
        graph_builder.add_node("backstory_processing", backstory_processing_node)
        graph_builder.add_node("storyarc_processing", storyarc_processing_node)
        graph_builder.add_node("timeline_processing", timeline_processing_node)
        graph_builder.add_node("notes_processing", notes_processing_node)
        graph_builder.add_node("custom_prompts_processing", custom_prompts_processing_node)
        graph_builder.add_node("fillin_processing", fillin_processing_node)
        graph_builder.add_node("prompt_construction", prompt_construction_node)
        graph_builder.add_node("story_generation", story_generation_node)
        graph_builder.add_node("output_formatting", output_formatting_node)

        # Set entry point
        graph_builder.set_entry_point("scenario_analysis")

        # Define conditional routing based on analysis
        graph_builder.add_conditional_edges(
            "scenario_analysis",
            self._route_after_analysis,
            {
                "general_processing": "general_processing",
                "characters_processing": "characters_processing",
                "locations_processing": "locations_processing",
                "backstory_processing": "backstory_processing",
                "storyarc_processing": "storyarc_processing",
                "timeline_processing": "timeline_processing",
                "notes_processing": "notes_processing",
                "custom_prompts_processing": "custom_prompts_processing",
                "fillin_processing": "fillin_processing",
                "prompt_construction": "prompt_construction",
                "error": END
            }
        )

        # Add edges for each processing node to route to next or prompt construction
        processing_nodes = [
            "general_processing", "characters_processing", "locations_processing",
            "backstory_processing", "storyarc_processing", "timeline_processing",
            "notes_processing", "custom_prompts_processing", "fillin_processing"
        ]

        for node in processing_nodes:
            graph_builder.add_conditional_edges(
                node,
                self._route_to_next_node,
                {
                    **{next_node: next_node for next_node in processing_nodes},
                    "prompt_construction": "prompt_construction",
                    "error": END
                }
            )

        # Final processing chain
        graph_builder.add_edge("prompt_construction", "story_generation")
        graph_builder.add_edge("story_generation", "output_formatting")
        graph_builder.add_edge("output_formatting", END)

        return graph_builder.compile()

    def _route_after_analysis(self, state: Dict[str, Any]) -> str:
        """Route to first processing node after analysis"""
        if state.get("error"):
            return "error"

        nodes_to_process = state.get("nodes_to_process", [])
        if not nodes_to_process:
            return "prompt_construction"

        return nodes_to_process[0]

    def _route_to_next_node(self, state: Dict[str, Any]) -> str:
        """Route to next processing node or prompt construction"""
        if state.get("error"):
            return "error"

        nodes_to_process = state.get("nodes_to_process", [])
        current_step = state.get("current_step", 0)

        # Find next node that hasn't been processed
        for node in nodes_to_process:
            if node not in ["general_processing", "characters_processing", "locations_processing",
                           "backstory_processing", "storyarc_processing", "timeline_processing",
                           "notes_processing", "custom_prompts_processing", "fillin_processing"]:
                continue

            # Check if this node should be processed based on analysis
            analysis = state.get("analysis", {})
            if self._should_process_node(node, analysis, state):
                return node

        return "prompt_construction"

    def _should_process_node(self, node: str, analysis: Dict[str, Any], state: Dict[str, Any]) -> bool:
        """Determine if a specific node should be processed"""
        processed_keys = {
            "general_processing": "processed_general",
            "characters_processing": "processed_characters",
            "locations_processing": "processed_locations",
            "backstory_processing": "processed_backstory",
            "storyarc_processing": "processed_storyarc",
            "timeline_processing": "processed_timeline",
            "notes_processing": "processed_notes",
            "custom_prompts_processing": "processed_custom_prompts",
            "fillin_processing": "processed_fillin"
        }

        # Check if already processed (key exists AND has a non-None value)
        processed_key = processed_keys.get(node)
        if processed_key and state.get(processed_key) is not None:
            return False

        # Check if should be processed based on analysis
        node_requirements = {
            "general_processing": lambda a: a.get("has_title") or a.get("has_synopsis") or a.get("has_writing_style"),
            "characters_processing": lambda a: a.get("character_count", 0) > 0,
            "locations_processing": lambda a: a.get("location_count", 0) > 0,
            "backstory_processing": lambda a: a.get("has_backstory"),
            "storyarc_processing": lambda a: a.get("has_storyarc"),
            "timeline_processing": lambda a: a.get("timeline_event_count", 0) > 0,
            "notes_processing": lambda a: a.get("has_notes"),
            "custom_prompts_processing": lambda a: a.get("has_custom_prompts"),
            "fillin_processing": lambda a: a.get("has_fill_in")
        }

        requirement_check = node_requirements.get(node)
        return requirement_check(analysis) if requirement_check else False

    async def stream_story_generation(
        self,
        request: StoryGenerationRequest,
        user_id: str
    ) -> AsyncGenerator[StoryStreamingEvent, None]:
        """
        Stream story generation with real-time updates.
        Runs graph nodes until story_generation, then streams LLM output directly.
        """
        from infrastructure.llm_services.llm_service import get_llm_service
        from .nodes.story_generation import _extract_text_from_chunk

        try:
            # Validate request data
            if not request.scenario:
                raise ValueError("Scenario data is required but missing from request")

            # Initialize state with proper StoryGeneratorState structure
            initial_state: StoryGeneratorState = {
                "scenario": request.scenario.dict(),
                "generation_options": request.generation_options.dict(),
                "user_id": user_id,
                "analysis": {},
                "nodes_to_process": [],
                "total_steps": 0,
                "current_step": 0,
                "processed_general": None,
                "processed_characters": None,
                "processed_locations": None,
                "processed_backstory": None,
                "processed_storyarc": None,
                "processed_timeline": None,
                "processed_notes": None,
                "processed_custom_prompts": None,
                "processed_fillin": None,
                "narrative_context": None,
                "character_context": None,
                "location_context": None,
                "final_prompt": None,
                "generated_story": None,
                "formatted_story": None,
                "llm_config": None,
                "llm_payload": None,
                "model_name": None,
                "input_tokens": None,
                "ready_for_streaming": None,
                "streaming_events": [],
                "processing_summary": {},
                "error": None,
                "complete": False
            }

            # Track state across nodes
            accumulated_state = dict(initial_state)
            accumulated_story = ""
            total_tokens = 0
            credits_used = 0
            input_tokens = 0

            # Stream through the graph
            async for state_update in self.graph.astream(initial_state):
                # Extract node name and state from the update
                # LangGraph astream returns {node_name: node_output}
                for node_name, node_output in state_update.items():
                    if not isinstance(node_output, dict):
                        continue

                    # Merge into accumulated state
                    accumulated_state.update(node_output)

                    # Emit any streaming events from the current state
                    events = node_output.get("streaming_events", [])
                    for event_data in events:
                        if isinstance(event_data, dict):
                            yield StoryStreamingEvent(**event_data)
                        else:
                            yield event_data

                    # Check if story_generation node is ready for streaming
                    if node_output.get("ready_for_streaming"):

                        # Get LLM config from state
                        llm_config = node_output.get("llm_config", {})
                        llm_payload = node_output.get("llm_payload", {})
                        input_tokens = node_output.get("input_tokens", 0)

                        # Emit status
                        yield StoryStreamingEvent(
                            type="status",
                            message="Generating story..."
                        )

                        # Get LLM service and stream directly
                        try:
                            service = get_llm_service(llm_config['provider_type'], llm_config)
                            output_tokens = 0

                            for chunk in service.chat_completion_stream(llm_payload):
                                if chunk:
                                    chunk_text = _extract_text_from_chunk(chunk)
                                    if chunk_text:
                                        accumulated_story += chunk_text
                                        output_tokens += 1

                                        # Yield content immediately
                                        yield StoryStreamingEvent(
                                            type="content",
                                            content=chunk_text
                                        )

                                # Allow other tasks to run
                                await asyncio.sleep(0)

                            # Calculate totals
                            total_tokens = input_tokens + output_tokens
                            credits_used = total_tokens


                            # We've completed streaming - emit complete event and return
                            # Skip remaining graph nodes since we handled streaming directly
                            processing_summary = accumulated_state.get("processing_summary", {})
                            summary_defaults = {
                                "nodes_processed": processing_summary.get("nodes_processed", 0) + 1,
                                "characters": processing_summary.get("characters", 0),
                                "locations": processing_summary.get("locations", 0),
                                "timeline_events": processing_summary.get("timeline_events", 0),
                                "has_backstory": processing_summary.get("has_backstory", False),
                                "has_storyarc": processing_summary.get("has_storyarc", False),
                                "has_notes": processing_summary.get("has_notes", False),
                                "has_custom_prompts": processing_summary.get("has_custom_prompts", False),
                                "has_fill_in": processing_summary.get("has_fill_in", False),
                            }
                            yield StoryStreamingEvent(
                                type="complete",
                                story=accumulated_story,
                                total_tokens=total_tokens,
                                credits_used=credits_used,
                                processing_summary=ProcessingSummary(**summary_defaults)
                            )
                            return

                        except Exception as e:
                            logger.error(f"LLM streaming failed: {str(e)}")
                            yield StoryStreamingEvent(
                                type="error",
                                error=f"Story generation failed: {str(e)}"
                            )
                            return

                    # Track story content from other nodes
                    if node_output.get("generated_story"):
                        accumulated_story = node_output["generated_story"]
                    if node_output.get("formatted_story"):
                        accumulated_story = node_output["formatted_story"]
                    if node_output.get("total_tokens"):
                        total_tokens = node_output["total_tokens"]
                    if node_output.get("credits_used"):
                        credits_used = node_output["credits_used"]

                    # Check for completion (output_formatting node)
                    if node_output.get("complete"):
                        processing_summary = node_output.get("processing_summary", {})
                        summary_defaults = {
                            "nodes_processed": processing_summary.get("nodes_processed", 0),
                            "characters": processing_summary.get("characters", 0),
                            "locations": processing_summary.get("locations", 0),
                            "timeline_events": processing_summary.get("timeline_events", 0),
                            "has_backstory": processing_summary.get("has_backstory", False),
                            "has_storyarc": processing_summary.get("has_storyarc", False),
                            "has_notes": processing_summary.get("has_notes", False),
                            "has_custom_prompts": processing_summary.get("has_custom_prompts", False),
                            "has_fill_in": processing_summary.get("has_fill_in", False),
                        }
                        yield StoryStreamingEvent(
                            type="complete",
                            story=accumulated_story,
                            total_tokens=total_tokens,
                            credits_used=credits_used,
                            processing_summary=ProcessingSummary(**summary_defaults)
                        )
                        return

                    # Check for errors
                    if node_output.get("error"):
                        yield StoryStreamingEvent(
                            type="error",
                            error=node_output["error"]
                        )
                        return

        except Exception as e:
            logger.error(f"Story generation failed: {str(e)}")
            yield StoryStreamingEvent(
                type="error",
                error=f"Story generation failed: {str(e)}"
            )


# Global instance for use in FastAPI router
story_generator = StoryGeneratorGraph()