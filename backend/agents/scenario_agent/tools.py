"""
Tool execution logic for the scenario agent
"""
import json
import logging
from typing import Dict, Any, Optional
"""Small dispatcher for scenario-agent tools.

This module keeps the old `ScenarioAgentTools.execute_tool` API but
delegates actual work to individual tool modules in the `tools` package.
The file is intentionally minimal to match the refactor.
"""

import logging
from typing import Dict, Any, Optional, Callable

from .tools.classify_input import classify_input
from .tools.create_scenario import create_scenario
from .tools.explain_scenario import explain_scenario
from .tools.generate_character import generate_character
from .tools.generate_location import generate_location
from .tools.generic_chat import generic_chat
from .tools.modify_scenario import modify_scenario
from .tools.rewrite_scenario import rewrite_scenario
from .tools.update_scenario import update_scenario

logger = logging.getLogger(__name__)

# Map action name -> callable
TOOLS: Dict[str, Callable[..., Any]] = {
    "classify_input": classify_input,
    "create_scenario": create_scenario,
    "explain_scenario": explain_scenario,
    "generate_character": generate_character,
    "generate_location": generate_location,
    "generic_chat": generic_chat,
    "modify_scenario": modify_scenario,
    "rewrite_scenario": rewrite_scenario,
    "update_scenario": update_scenario,
}


class ScenarioAgentTools:
    """Facade that dispatches tool calls to the concrete tool functions.

    This preserves the previous interface so other modules don't need
    to be updated during the refactor.
    """

    @staticmethod
    async def execute_tool(tool_call: Dict[str, Any], user_id: str, byok_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        action = tool_call.get("action")
        parameters = tool_call.get("parameters", {})

        func = TOOLS.get(action)
        if not func:
            return {"error": f"Unknown action: {action}", "status": "failed"}

        try:
            return await func(parameters, user_id, byok_headers)
        except Exception as e:
            logger.exception("Tool execution failed for action %s", action)
            return {"error": str(e), "status": "failed"}


__all__ = ["ScenarioAgentTools", "TOOLS"]