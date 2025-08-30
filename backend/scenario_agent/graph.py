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
from .nodes.modify_character import modify_character_node
from .nodes.modify_location import modify_location_node
from .nodes.modify_backstory import modify_backstory_node
from .nodes.modify_title import modify_title_node
from .nodes.modify_storyarc import modify_storyarc_node
from .nodes.modify_writingStyle import modify_writingStyle_node
from .nodes.create_character import create_character_node
from .nodes.create_location import create_location_node
from .nodes.create_backstory import create_backstory_node
from .nodes.multi_operation import multi_operation_node, advance_multi_operation_node


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
    
    # Add specialized modification nodes
    workflow.add_node("modify_character", modify_character_node)
    workflow.add_node("modify_location", modify_location_node)
    workflow.add_node("modify_backstory", modify_backstory_node)
    workflow.add_node("modify_title", modify_title_node)
    workflow.add_node("modify_storyarc", modify_storyarc_node)
    workflow.add_node("modify_writingStyle", modify_writingStyle_node)
    
    # Add specialized creation nodes
    workflow.add_node("create_character", create_character_node)
    workflow.add_node("create_location", create_location_node)
    workflow.add_node("create_backstory", create_backstory_node)
    
    # Add multi-operation nodes
    workflow.add_node("multi_operation", multi_operation_node)
    workflow.add_node("advance_multi_operation", advance_multi_operation_node)
    
    # Set entry point
    workflow.set_entry_point("supervisor")
    
    # Add conditional edges from supervisor
    def route_from_supervisor(state: AgentState) -> str:
        """Route from supervisor to appropriate node based on next_node"""
        next_node = state.get("next_node")
        valid_nodes = [
            "input_classification", "modification", "details", "creation", "conversation",
            "modify_character", "modify_location", "modify_backstory", 
            "modify_title", "modify_storyarc", "modify_writingStyle",
            "create_character", "create_location", "create_backstory",
            "multi_operation", "advance_multi_operation"
        ]
        if next_node in valid_nodes:
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
            "conversation": "conversation",
            "modify_character": "modify_character",
            "modify_location": "modify_location",
            "modify_backstory": "modify_backstory",
            "modify_title": "modify_title",
            "modify_storyarc": "modify_storyarc",
            "modify_writingStyle": "modify_writingStyle",
            "create_character": "create_character",
            "create_location": "create_location",
            "create_backstory": "create_backstory",
            "multi_operation": "multi_operation",
            "advance_multi_operation": "advance_multi_operation",
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
    
    # Specialized modification nodes also return to supervisor
    workflow.add_edge("modify_character", "supervisor")
    workflow.add_edge("modify_location", "supervisor")
    workflow.add_edge("modify_backstory", "supervisor")
    workflow.add_edge("modify_title", "supervisor")
    workflow.add_edge("modify_storyarc", "supervisor")
    workflow.add_edge("modify_writingStyle", "supervisor")
    
    # Specialized creation nodes also return to supervisor
    workflow.add_edge("create_character", "supervisor")
    workflow.add_edge("create_location", "supervisor")
    workflow.add_edge("create_backstory", "supervisor")
    
    # Multi-operation nodes also return to supervisor
    workflow.add_edge("multi_operation", "supervisor")
    workflow.add_edge("advance_multi_operation", "supervisor")
    
    # Wrap up node ends the conversation
    workflow.add_edge("wrap_up", END)
    
    return workflow.compile()