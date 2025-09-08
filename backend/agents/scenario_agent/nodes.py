"""
Legacy nodes.py file - imports from the new modular structure.
This file is kept for backward compatibility.
"""

# Import all nodes from the new modular structure
from .nodes import (
    supervisor_node,
    input_classification_node,
    modification_node,
    details_node,
    creation_node,
    conversation_node,
    wrap_up_node
)

# Re-export for backward compatibility
__all__ = [
    "supervisor_node",
    "input_classification_node",
    "modification_node", 
    "details_node",
    "creation_node",
    "conversation_node",
    "wrap_up_node"
]