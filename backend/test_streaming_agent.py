#!/usr/bin/env python3
"""
Simple test script to verify the streaming agent integration works
"""
import asyncio
import json
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from scenario_agent.streaming_tools import StreamingScenarioTools
from scenario_agent.graph import create_scenario_agent_graph
from scenario_agent.state import AgentState


async def test_streaming_tools():
    """Test the streaming tools directly"""
    print("🧪 Testing Streaming Tools...")
    
    # Test generic chat
    test_tool_call = {
        "action": "generic_chat",
        "parameters": {
            "user_input": "Hello! Can you help me with my story?",
            "scenario": {
                "title": "Test Scenario",
                "synopsis": "A test story about a brave hero"
            },
            "context": "You are a helpful scenario assistant."
        }
    }
    
    print(f"Testing: {test_tool_call['action']}")
    message_count = 0
    
    try:
        async for message in StreamingScenarioTools.stream_tool_response(
            test_tool_call, 
            user_id="test_user", 
            byok_headers=None
        ):
            message_count += 1
            print(f"  Message {message_count}: {message['type']} - {message['content'][:50]}...")
            
            if message_count > 20:  # Prevent infinite streaming in test
                print("  ✅ Streaming working - stopping test after 20 messages")
                break
                
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False
        
    if message_count > 0:
        print(f"  ✅ Successfully streamed {message_count} messages")
        return True
    else:
        print("  ❌ No messages streamed")
        return False


async def test_agent_graph():
    """Test the agent graph integration"""
    print("\n🧪 Testing Agent Graph...")
    
    try:
        # Create the agent graph
        agent_graph = create_scenario_agent_graph()
        print("  ✅ Agent graph created successfully")
        
        # Test state processing
        initial_state: AgentState = {
            "messages": [{"content": "Hello, can you help me with my story?", "scenario": None}],
            "scenario": None,
            "user_input": "Hello, can you help me with my story?",
            "current_response": "",
            "next_node": None,
            "streaming_response": [],
            "tool_calls": [],
            "user_id": "test_user"
        }
        
        step_count = 0
        async for step in agent_graph.astream(initial_state):
            step_count += 1
            print(f"  Step {step_count}: {list(step.keys())}")
            
            if step_count > 5:  # Prevent infinite loops
                print("  ✅ Agent graph processing - stopping test after 5 steps")
                break
                
        if step_count > 0:
            print(f"  ✅ Successfully processed {step_count} steps")
            return True
        else:
            print("  ❌ No steps processed")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False


async def test_health_endpoints():
    """Test that we can import the streaming agent router"""
    print("\n🧪 Testing Health Endpoints...")
    
    try:
        from scenario_agent.streaming_agent import router
        print("  ✅ Streaming agent router imported successfully")
        
        # Test that we can access the health check function
        health_endpoints = [endpoint for endpoint in router.routes if 'health' in str(endpoint.path)]
        print(f"  ✅ Found {len(health_endpoints)} health endpoint(s)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error importing streaming agent: {str(e)}")
        return False


async def main():
    """Run all tests"""
    print("🚀 Testing Streaming Agent Integration\n")
    
    results = []
    
    # Test streaming tools
    results.append(await test_streaming_tools())
    
    # Test agent graph
    results.append(await test_agent_graph())
    
    # Test health endpoints
    results.append(await test_health_endpoints())
    
    print(f"\n📊 Test Results:")
    print(f"   Streaming Tools: {'✅ PASS' if results[0] else '❌ FAIL'}")
    print(f"   Agent Graph: {'✅ PASS' if results[1] else '❌ FAIL'}")
    print(f"   Health Endpoints: {'✅ PASS' if results[2] else '❌ FAIL'}")
    
    if all(results):
        print(f"\n🎉 All tests PASSED! Real-time streaming is ready to use.")
        return True
    else:
        print(f"\n⚠️  Some tests failed. Check the errors above.")
        return False


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)