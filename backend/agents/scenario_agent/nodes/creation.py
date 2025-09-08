import logging
from typing import Dict, Any
from ..state import AgentState, ToolCall

logger = logging.getLogger(__name__)


async def creation_node(state: AgentState) -> Dict[str, Any]:
    """
    Create new scenarios based on user input using LLM tool
    
    The LLM should create the scenario in this format:
    
    export type Scenario = {
        title?: string;
        synopsis?: string;
        backstory?: string;
        writingStyle?: {
            genre?: string;
        };  
        storyarc?: string;
        characters?: [{ 
            name?: string; 
            alias?: string; 
            role?: string; 
            gender?: string; 
            appearance?: string; 
            backstory?: string; 
        }];
    }
    
    The LLM will generate the scenario JSON based on the user's request.
    """
    user_input = state.get("user_input", "")
    scenario = state.get("scenario", {})
    
    # Create tool call for scenario creation using LLM
    tool_call = ToolCall(
        action="create_scenario",
        parameters={
            "user_input": user_input,
            "existing_scenario": scenario,
            "context": """You are a creative story scenario generator. Create a new scenario based on the user's request.

Generate a complete scenario in valid JSON format using this structure:
{
  "title": "Story Title",
  "synopsis": "Brief story summary",
  "backstory": "Detailed background and world-building",
  "writingStyle": {
    "genre": "Genre (fantasy, sci-fi, horror, romance, etc.)"
  },
  "storyarc": "Main plot outline and story progression",
  "characters": [
    {
      "name": "Character Name",
      "alias": "Nickname or title",
      "role": "protagonist/antagonist/supporting",
      "gender": "Character gender",
      "appearance": "Physical description",
      "backstory": "Character background and motivations"
    }
  ]
}

Create engaging, detailed content that matches the user's vision. Include 2-3 well-developed characters minimum."""
        }
    )
    
    state["tool_calls"] = [tool_call.model_dump()]
    state["streaming_response"] = ["Creating new scenario..."]
    state["next_node"] = "supervisor"
    state["streaming_action"] = "create_scenario"  # Flag for streaming execution
    
    return state