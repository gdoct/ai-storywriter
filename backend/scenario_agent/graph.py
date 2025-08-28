from typing import Any, Dict
from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import (
    supervisor_node,
    input_classification_node,
    modification_node,
    details_node,
    creation_node,
    conversation_node,
    wrap_up_node
)


def create_scenario_agent_graph() -> StateGraph:
    """Create the scenario agent graph with all nodes and transitions"""
    
    # Create the graph
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("input_classification", input_classification_node)
    workflow.add_node("modification", modification_node)
    workflow.add_node("details", details_node) 
    workflow.add_node("creation", creation_node)
    workflow.add_node("conversation", conversation_node)
    workflow.add_node("wrap_up", wrap_up_node)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add conditional edges from supervisor
    def route_from_supervisor(state: AgentState) -> str:
        """Route from supervisor to appropriate node based on next_node"""
        next_node = state.get("next_node")
        if next_node in ["input_classification", "modification", "details", "creation"]:
            return next_node
        return "wrap_up"
    
    workflow.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "input_classification": "input_classification",
            "modification": "modification",
            "details": "details", 
            "creation": "creation",
            "wrap_up": "wrap_up"
        }
    )
    
    # Classification node routes to appropriate handler based on classification result
    def route_from_classification(state: AgentState) -> str:
        """Route from classification to appropriate node based on category"""
        category = state.get("category", "general conversation")
        
        category_to_node = {
            "modification": "modification",
            "details": "details", 
            "creation": "creation",
            "general conversation": "conversation"
        }
        
        next_node = category_to_node.get(category, "conversation")
        return next_node
    
    workflow.add_conditional_edges(
        "input_classification",
        route_from_classification,
        {
            "modification": "modification",
            "details": "details", 
            "creation": "creation",
            "conversation": "conversation"
        }
    )
    
    # All specialized nodes return to supervisor
    workflow.add_edge("modification", "supervisor")
    workflow.add_edge("details", "supervisor") 
    workflow.add_edge("creation", "supervisor")
    workflow.add_edge("conversation", "supervisor")
    
    # Wrap up node ends the conversation
    workflow.add_edge("wrap_up", END)
    
    return workflow.compile()