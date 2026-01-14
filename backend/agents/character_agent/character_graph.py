import asyncio
import logging
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from agents.character_agent.nodes import (
    character_generation_node,
    character_modification_node,
    multimodal_analysis_node,
    image_generation_node,
    validation_node
)

logger = logging.getLogger(__name__)

class CharacterAgentGraph:
    """LangGraph-based character agent for generation and modification"""

    def __init__(self):
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for character operations"""

        # Create state graph with dict instead of TypedDict for compatibility
        workflow = StateGraph(dict)

        # Add nodes
        workflow.add_node("validate", validation_node)
        workflow.add_node("multimodal_analysis", multimodal_analysis_node)
        workflow.add_node("character_generation", character_generation_node)
        workflow.add_node("character_modification", character_modification_node)
        workflow.add_node("image_generation", image_generation_node)

        # Define entry point
        workflow.set_entry_point("validate")

        # Add edges for validation flow
        def route_after_validation(state: Dict[str, Any]) -> str:
            """Route after validation based on operation type"""
            if state.get("validation_error"):
                return END

            operation_type = state.get("operation_type")
            has_image_input = bool(state.get("image_data") or state.get("image_uri"))

            if has_image_input:
                return "multimodal_analysis"
            elif operation_type == "generate":
                return "character_generation"
            elif operation_type == "modify":
                return "character_modification"
            else:
                return END

        workflow.add_conditional_edges(
            "validate",
            route_after_validation,
            {
                "multimodal_analysis": "multimodal_analysis",
                "character_generation": "character_generation",
                "character_modification": "character_modification",
                END: END
            }
        )

        # Add edges after multimodal analysis
        def route_after_multimodal(state: Dict[str, Any]) -> str:
            """Route after multimodal analysis"""
            if state.get("multimodal_error"):
                return END

            operation_type = state.get("operation_type")
            if operation_type == "generate":
                return "character_generation"
            elif operation_type == "modify":
                return "character_modification"
            else:
                return END

        workflow.add_conditional_edges(
            "multimodal_analysis",
            route_after_multimodal,
            {
                "character_generation": "character_generation",
                "character_modification": "character_modification",
                END: END
            }
        )

        # Add edges for character generation/modification to image generation
        def route_to_image_generation(state: Dict[str, Any]) -> str:
            """Route to image generation if requested"""
            if state.get("generate_image", False) and not state.get("character_error"):
                return "image_generation"
            else:
                return END

        workflow.add_conditional_edges(
            "character_generation",
            route_to_image_generation,
            {
                "image_generation": "image_generation",
                END: END
            }
        )

        workflow.add_conditional_edges(
            "character_modification",
            route_to_image_generation,
            {
                "image_generation": "image_generation",
                END: END
            }
        )

        # Image generation always ends
        workflow.add_edge("image_generation", END)

        return workflow.compile()

    async def run_character_operation(
        self,
        operation_type: str,
        scenario: Dict[str, Any],
        user_id: str,
        character_id: Optional[str] = None,
        fields_to_modify: Optional[List[str]] = None,
        image_data: Optional[bytes] = None,
        image_uri: Optional[str] = None,
        generate_image: bool = False,
        image_generation_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Run character operation through the LangGraph workflow

        Args:
            operation_type: "generate" or "modify"
            scenario: Scenario context
            user_id: User ID for service access
            character_id: Character ID for modifications
            fields_to_modify: List of fields to modify (for modify operations)
            image_data: Binary image data for multimodal analysis
            image_uri: Image URI for multimodal analysis
            generate_image: Whether to generate character image
            image_generation_options: Options for image generation
        """

        # Initialize state
        initial_state = {
            "operation_type": operation_type,
            "scenario": scenario,
            "user_id": user_id,
            "character_id": character_id,
            "fields_to_modify": fields_to_modify or [],
            "image_data": image_data,
            "image_uri": image_uri,
            "generate_image": generate_image,
            "image_generation_options": image_generation_options or {},
            "character_fields": [],
            "completed_fields": [],
            "streaming_events": [],
            "current_step": "validation"
        }

        try:
            # Run the workflow
            final_state = await self.graph.ainvoke(initial_state)
            return final_state

        except Exception as e:
            logger.error(f"Character agent workflow error: {str(e)}")
            error_state = initial_state.copy()
            error_state["error"] = str(e)
            error_state["current_step"] = "error"
            return error_state

    async def stream_character_operation(
        self,
        operation_type: str,
        scenario: Dict[str, Any],
        user_id: str,
        character_id: Optional[str] = None,
        fields_to_modify: Optional[List[str]] = None,
        image_data: Optional[bytes] = None,
        image_uri: Optional[str] = None,
        generate_image: bool = False,
        image_generation_options: Optional[Dict[str, Any]] = None
    ):
        """
        Stream character operation with real-time updates

        Yields state updates as the workflow progresses
        """

        # Initialize state
        initial_state = {
            "operation_type": operation_type,
            "scenario": scenario,
            "user_id": user_id,
            "character_id": character_id,
            "fields_to_modify": fields_to_modify or [],
            "image_data": image_data,
            "image_uri": image_uri,
            "generate_image": generate_image,
            "image_generation_options": image_generation_options or {},
            "character_fields": [],
            "completed_fields": [],
            "streaming_events": [],
            "current_step": "validation"
        }

        try:
            # Stream the workflow execution
            async for state in self.graph.astream(initial_state):
                # Yield state updates for each step
                current_node = list(state.keys())[0] if state else "unknown"
                node_state = list(state.values())[0] if state else {}

                # Update current step
                if isinstance(node_state, dict):
                    node_state["current_step"] = current_node

                yield node_state

        except Exception as e:
            logger.error(f"Character agent streaming error: {str(e)}")
            error_state = initial_state.copy()
            error_state["error"] = str(e)
            error_state["current_step"] = "error"
            yield error_state