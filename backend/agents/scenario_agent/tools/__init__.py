"""Compatibility facade for scenario-agent tools package.

This module exposes `ScenarioAgentTools` (the old compatibility API)
and dispatches calls to the individual tool modules in this package.
Defining the facade here avoids circular imports between the module
file `tools.py` and this package directory.
"""

import logging
from typing import Dict, Any, Optional, Callable

from .classify_input import classify_input
from .create_scenario import create_scenario
from .explain_scenario import explain_scenario
from .generate_character import generate_character
from .generate_followup_questions import generate_followup_questions
from .generate_location import generate_location
from .generic_chat import generic_chat
from .modify_scenario import modify_scenario
from .rewrite_scenario import rewrite_scenario
from .update_scenario import update_scenario

logger = logging.getLogger(__name__)

TOOLS: Dict[str, Callable[..., Any]] = {
	"classify_input": classify_input,
	"create_scenario": create_scenario,
	"explain_scenario": explain_scenario,
	"generate_character": generate_character,
	"generate_followup_questions": generate_followup_questions,
	"generate_location": generate_location,
	"generic_chat": generic_chat,
	"modify_scenario": modify_scenario,
	"rewrite_scenario": rewrite_scenario,
	"update_scenario": update_scenario,
}


class ScenarioAgentTools:
	"""Facade that dispatches tool calls to the concrete tool functions.

	Keep the same API as before: `execute_tool(tool_call, user_id, byok_headers)`.
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
