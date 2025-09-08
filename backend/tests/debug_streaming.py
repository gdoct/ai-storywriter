#!/usr/bin/env python3
"""
Debug streaming agent to see exactly what's happening
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from agents.scenario_agent.graph import create_scenario_agent_graph
from agents.scenario_agent.state import AgentState


async def debug_graph_flow():
    """Debug the exact graph flow to see why streaming isn't triggered"""
    
    print("🔍 Debugging streaming agent graph flow...\n")
    
    # Create the agent graph
    agent_graph = create_scenario_agent_graph()
    
    # Initialize state
    initial_state: AgentState = {
        "messages": [{"content": "Explain the plot of my story", "scenario": {"title": "Test Story"}}],
        "scenario": {"title": "Test Story"},
        "user_input": "Explain the plot of my story",
        "current_response": "",
        "next_node": None,
        "streaming_response": [],
        "tool_calls": [],
        "user_id": "debug_user"
    }
    
    step_count = 0
    streaming_tool_found = False
    
    async for step in agent_graph.astream(initial_state):
        step_count += 1
        print(f"📍 STEP {step_count}:")
        
        for node_name, state in step.items():
            print(f"  Node: {node_name}")
            print(f"  Category: {state.get('category')}")
            print(f"  Streaming Action: {state.get('streaming_action')}")
            print(f"  Tool Calls: {len(state.get('tool_calls', []))} calls")
            print(f"  Next Node: {state.get('next_node')}")
            
            # Check if this is a streaming node
            tool_calls = state.get("tool_calls", [])
            if tool_calls and state.get("streaming_action"):
                print(f"  🎯 FOUND STREAMING TOOL CALL!")
                print(f"     Action: {state.get('streaming_action')}")
                print(f"     Tool: {tool_calls[0]}")
                streaming_tool_found = True
                
            print()
            
        if step_count > 10:  # Prevent infinite loops
            print("  ⚠️  Stopping after 10 steps to prevent infinite loop")
            break
    
    if streaming_tool_found:
        print("✅ SUCCESS: Streaming tool call was found in the graph flow!")
    else:
        print("❌ FAILURE: No streaming tool call found in the graph flow")
        print("   This explains why the streaming agent returns default messages")
    
    return streaming_tool_found


if __name__ == "__main__":
    try:
        success = asyncio.run(debug_graph_flow())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"💥 Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)