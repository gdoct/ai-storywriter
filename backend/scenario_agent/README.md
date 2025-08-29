# Scenario Agent Architecture

This document outlines the architecture of the scenario agent, which is implemented using the LangGraph library. The agent is designed as a state machine that processes user requests for creating, modifying, and discussing story scenarios.

## Core Architecture

The agent's architecture is built around a `StateGraph` from LangGraph. This graph defines a set of nodes (functions) and edges (transitions) that represent the flow of conversation and task execution. The entire process is stateful, with an `AgentState` object being passed between nodes. This state object accumulates information throughout the agent's execution cycle.

The design follows a supervisor pattern. A central supervisor node acts as the entry point and orchestrates the flow, delegating tasks to specialized worker nodes based on the user's intent.

## Agent State

The `AgentState` is a crucial component that maintains the context of the interaction. It is a TypedDict that holds all relevant information, including:

-   The history of messages in the conversation.
-   The current state of the story scenario being worked on.
-   The most recent user input.
-   Information about which node should be executed next.
-   Data for streaming responses back to the client.
-   Details of any tool calls that need to be executed.
-   The classification of the user's intent.

## Agent Nodes

The agent is composed of several distinct nodes, each with a specific responsibility:

-   **`supervisor_node`**: This is the entry point for the graph. It initializes the process and is the central point to which all worker nodes return after completing their tasks. It directs the initial user input to the classification node.

-   **`input_classification_node`**: This node's purpose is to analyze the user's input and determine their intent. It classifies the request into categories such as "creation," "modification," "details," or "general conversation." The result of this classification dictates the next step in the graph.

-   **`creation_node`**: This node is responsible for creating a new story scenario from scratch based on the user's prompt.

-   **`modification_node`**: This node handles requests to alter or add to an existing scenario.

-   **`details_node`**: This node is activated when the user asks for explanations, summaries, or clarifications about the current scenario.

-   **`conversation_node`**: This node handles general conversational turns that do not fall into the other categories. It allows for more natural, chat-like interactions.

-   **`wrap_up_node`**: This is the terminal node of the main workflow. It provides a concluding message and can suggest contextual follow-up actions to the user.

## Routing and Supervision

Routing is managed through conditional edges in the `StateGraph`. The process begins at the `supervisor_node`, which immediately passes control to the `input_classification_node`.

The `input_classification_node` determines the user's intent and updates the agent's state with a `category`. The graph then uses a conditional edge to route the flow to the appropriate specialized node (`creation`, `modification`, `details`, or `conversation`).

After a specialized node has finished its processing, the graph unconditionally routes the flow back to the `supervisor_node`. The supervisor then re-evaluates the state and determines the next step, which could be to wrap up the interaction or continue processing if more steps are needed. This creates a loop that allows for a continuous, multi-turn conversation.

## Streaming Responses

The agent provides real-time feedback to the client using a streaming mechanism. The FastAPI endpoint for the agent returns a `StreamingResponse`.

The streaming logic iterates through the agent graph's execution stream (`astream`). As each node executes, it can add status messages to the `AgentState`. These status messages are immediately sent to the client to provide updates on the agent's progress (e.g., "Analyzing your request...", "Modifying scenario...").

When a node requires an LLM to generate content (e.g., creating a character or modifying a backstory), it triggers a streaming tool call. The system then streams the LLM's response token-by-token directly to the client. This provides a true real-time generation effect. The final output of the tool (such as the updated scenario JSON) is sent as a distinct message at the end of the stream, allowing the client to apply the final changes.
