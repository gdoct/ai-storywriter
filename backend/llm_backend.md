# LLM API DOCUMENTATION

This document provides an overview of the StoryWriter LLM (Large Language Model) backend, a Python-based application built with the FastAPI framework. It serves as the core AI engine for the frontend, handling story generation, scenario analysis, and other AI-powered features.

## Project Overview

The LLM backend is responsible for:

-   **AI/LLM Orchestration**: Managing complex interactions with Large Language Models using [LangChain](https://www.langchain.com/) and [LangGraph](https://langchain-ai.github.io/langgraph/) to build and run sophisticated AI agents.
-   **LLM Service Abstraction**: Providing a unified interface to multiple LLM backends (like LM Studio, OpenAI, etc.), allowing users to bring their own keys (BYOK) or use a centrally configured model.
-   **Streaming API**: Offering real-time, streaming responses from AI agents to create a dynamic user experience.
-   **API Endpoints**: Exposing a set of RESTful endpoints for the frontend to consume AI functionalities.

## LLM-Related API Endpoints

The backend exposes several endpoints for interacting with the AI. These are grouped by functionality.

---

### 1. LLM Proxy Endpoints

These endpoints provide a generic proxy to the configured LLM backend, handling model listing, status checks, and direct chat completions. They are primarily defined in `routers/llm_proxy.py`.

-   **`GET /api/proxy/llm/v1/status`**
    -   **Description**: Checks if the AI service is currently busy processing a request. This is a non-blocking endpoint that returns the status of a global lock.
    -   **Returns**: `{"busy": boolean}`.

-   **`GET /api/proxy/llm/v1/models`**
    -   **Description**: Retrieves a list of available LLM models. It dynamically determines which models to show based on the user's configuration (e.g., if they are using a "Bring Your Own Key" setup).
    -   **Returns**: A list of available model IDs, e.g., `{"data": [{"id": "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF"}, ...]}`.

-   **`POST /api/proxy/llm/v1/frontend/chat/completions`**
    -   **Description**: A simplified, streaming-first endpoint designed for quick AI interactions initiated from the frontend (e.g., AI-powered buttons). It bypasses complex agent logic for direct, fast responses.
    -   **Request Body**: `LLMCompletionRequest` model, including messages, model, and stream flag.
    -   **Returns**: A `StreamingResponse` with the LLM's generated text.

-   **`POST /api/proxy/llm/v1/chat/completions`**
    -   **Description**: The main endpoint for handling both streaming and non-streaming chat completions. It's a more robust version of the `frontend` endpoint, including token counting, cost estimation (for credit systems), and detailed error handling.
    -   **Request Body**: `LLMCompletionRequest` model.
    -   **Returns**: A `StreamingResponse` if `stream=True`, otherwise a `JSONResponse` with the complete response.

---

### 2. Streaming Scenario Agent Endpoints

This is the core endpoint for the AI Scenario Writer, which uses a `LangGraph` agent to generate and analyze stories based on a user's scenario. It provides true, real-time streaming of the agent's thoughts and actions. It is defined in `scenario_agent/streaming_agent.py`.

-   **`POST /api/streaming_agent/scenario/stream`**
    -   **Description**: Initiates a streaming session with the scenario agent. The agent processes the user's message and scenario through a graph of steps (e.g., planning, tool use, generation) and streams back status updates, tool calls, and the final generated text in real-time.
    -   **Request Body**: `StreamingAgentRequest` model, containing the user's `message` and the full `scenario` object.
    -   **Returns**: A `StreamingResponse` that sends server-sent events (`text/event-stream`). Each event is a JSON object indicating the type of message (e.g., `status`, `tool_call`, `stream`, `final`).

---

