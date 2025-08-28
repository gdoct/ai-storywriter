Okay, here's API documentation for the two endpoints `/v1/models` and `/v1/chat/completions` as provided by LM Studio's local inference server. This documentation is tailored for implementing a TypeScript service, including example TypeScript interfaces.

---

## LM Studio Local API Documentation

**Base URL:** `http://localhost:1234` (This is the default. It can be changed in LM Studio's server settings.)

**Authentication:** None. The server runs locally and is typically not exposed to the internet.

**Content Type:** All requests and responses use `application/json`.

---

### 1. List Models

Lists the model(s) currently available through the server. For LM Studio, this will typically be the single model that is currently loaded in the LM Studio GUI.

*   **Endpoint:** `/v1/models`
*   **Method:** `GET`
*   **Headers:**
    *   `Content-Type: application/json` (Optional for GET, but good practice)

#### Request
No request body.

#### Response (Success: `200 OK`)

```json
{
  "object": "list",
  "data": [
    {
      "id": "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
      "object": "model",
      "created": 1677610600, // Example Unix timestamp
      "owned_by": "LM Studio"
    }
    // ... potentially other models if LM Studio changes behavior, but usually just one
  ]
}
```

#### TypeScript Interfaces:

```typescript
interface Model {
  id: string;         // Identifier of the model (often the filename or a configured alias)
  object: "model";
  created: number;    // Unix timestamp of when the model was created/loaded
  owned_by: string;   // Typically "LM Studio" or the organization if known
}

interface ModelsListResponse {
  object: "list";
  data: Model[];
}
```

#### Example Usage (TypeScript with `fetch`):

```typescript
async function getLoadedModel(): Promise<ModelsListResponse | null> {
  try {
    const response = await fetch("http://localhost:1234/v1/models");
    if (!response.ok) {
      console.error("Error fetching models:", response.status, await response.text());
      return null;
    }
    const data: ModelsListResponse = await response.json();
    console.log("Loaded model:", data.data[0]?.id);
    return data;
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return null;
  }
}
```

---

### 2. Chat Completions

Generates a model response for a given chat conversation.

*   **Endpoint:** `/v1/chat/completions`
*   **Method:** `POST`
*   **Headers:**
    *   `Content-Type: application/json`

#### Request Body:

```json
{
  "model": "loaded-model-name", // Often ignored by LM Studio; uses the GUI-loaded model.
                               // Still, good practice to include it.
  "messages": [
    { "role": "system", "content": "You are a helpful AI assistant." },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "temperature": 0.7,         // Optional, default depends on model/LM Studio
  "max_tokens": 150,          // Optional, default depends on model/LM Studio
  "stream": false,            // Optional, default: false. Set to true for streaming.
  "top_p": 0.95,              // Optional
  "stop": null                // Optional, e.g., ["\n", " User:"]
  // ... other OpenAI compatible parameters like presence_penalty, frequency_penalty
}
```

#### TypeScript Interfaces (Request):

```typescript
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null; // Content can be null for some assistant messages with tool_calls
  name?: string;          // Optional: For 'tool' role, the name of the tool.
                          // For 'assistant' role with tool_calls, can be the function name.
  tool_calls?: ToolCall[]; // Optional: For 'assistant' role if it decides to call tools.
  tool_call_id?: string;  // Optional: For 'tool' role, the ID of the tool call being responded to.
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

export interface ChatCompletionRequest {
  model: string;                 // Model ID, though LM Studio uses the currently loaded one.
  messages: ChatMessage[];
  temperature?: number;          // Range: 0.0 to 2.0
  max_tokens?: number;
  top_p?: number;                // Range: 0.0 to 1.0
  stream?: boolean;              // Default: false
  stop?: string | string[] | null;
  presence_penalty?: number;     // Range: -2.0 to 2.0
  frequency_penalty?: number;    // Range: -2.0 to 2.0
  // n?: number;                 // How many chat completion choices to generate (LM Studio might only support 1)
  // tools?: Tool[];             // For function calling
  // tool_choice?: "none" | "auto" | { type: "function"; function: { name: string } }; // For function calling
  // logit_bias?: Record<string, number>; // Modify likelihood of specified tokens
  // user?: string;              // A unique identifier representing your end-user
}

// If using function calling (tools):
// export interface Tool {
//   type: "function";
//   function: {
//     name: string;
//     description?: string;
//     parameters: object; // JSON Schema object
//   };
// }
```

#### Response (Success: `200 OK`, `stream: false`)

```json
{
  "id": "chatcmpl-xxxxxxxxxxxxxxxxxxxxxx",
  "object": "chat.completion",
  "created": 1677652288, // Example Unix timestamp
  "model": "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop" // "stop", "length", "tool_calls", "content_filter"
    }
  ],
  "usage": { // Usage stats might not always be accurate or present with local models
    "prompt_tokens": 23,
    "completion_tokens": 7,
    "total_tokens": 30
  }
}
```

#### TypeScript Interfaces (Response, `stream: false`):

```typescript
export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage; // The assistant's response message
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  // logprobs?: any; // If logprobs were requested (not commonly supported by LM Studio)
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;               // Unix timestamp
  model: string;                 // Model name used
  choices: ChatCompletionChoice[];
  usage?: Usage;                 // Optional: Token usage statistics
  // system_fingerprint?: string; // OpenAI specific, might not be present
}
```

#### Response (Success: `200 OK`, `stream: true`)

If `stream: true` is set in the request, the server will respond with a stream of Server-Sent Events (SSE). Each event is a JSON object prefixed with `data: `. The stream is terminated by `data: [DONE]`.

**Example Stream Chunks:**

```
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":"The"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":" capital"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":" of"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":" France"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":" is"},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{"content":" Paris."},"finish_reason":null}]}
data: {"id":"chatcmpl-xxxxxxxx","object":"chat.completion.chunk","created":1677652288,"model":"model-name","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
data: [DONE]
```

If `tool_calls` are involved, `delta` might look like:
`"delta": {"tool_calls": [{"index": 0, "id": "call_abc123", "type": "function", "function": {"name": "get_weather", "arguments": ""}}]}`
then
`"delta": {"tool_calls": [{"index": 0, "function": {"arguments": "{\"loc"}}]}"`
etc.

#### TypeScript Interfaces (Response, `stream: true` - for each chunk):

```typescript
export interface DeltaMessage {
  role?: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: ToolCallChunk[];
}

export interface ToolCallChunk {
  index: number;
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string; // Partial JSON string
  };
}

export interface ChunkChoice {
  index: number;
  delta: DeltaMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  // logprobs?: any;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChunkChoice[];
  // usage?: Usage; // OpenAI sends usage in a separate final chunk if requested in some SDKs, LM Studio might not.
  // system_fingerprint?: string;
}
```

#### Example Usage (TypeScript with `fetch` for `stream: false`):

```typescript
async function getChatCompletion(
  messages: ChatMessage[],
  modelName: string = "loaded-model" // Placeholder
): Promise<ChatCompletionResponse | null> {
  const requestBody: ChatCompletionRequest = {
    model: modelName,
    messages: messages,
    temperature: 0.7,
    max_tokens: 250,
    stream: false,
  };

  try {
    const response = await fetch("http://localhost:1234/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Error fetching chat completion:", response.status, await response.text());
      return null;
    }
    const data: ChatCompletionResponse = await response.json();
    console.log("Assistant:", data.choices[0]?.message.content);
    return data;
  } catch (error) {
    console.error("Failed to fetch chat completion:", error);
    return null;
  }
}

// Example call
// getChatCompletion([
//   { role: "system", content: "You are a helpful assistant." },
//   { role: "user", content: "Tell me a joke." }
// ]);
```

For handling `stream: true`, you would need to process the response body as a stream (e.g., using `response.body.getReader()` and a `TextDecoder`).

---

### Important Notes for LM Studio:

1.  **Model Selection:** The `model` parameter in the `/v1/chat/completions` request body is often *ignored*. LM Studio uses the model currently loaded in its GUI. It's still good practice to send it, as some client libraries or future LM Studio versions might use it.
2.  **`usage` Object:** The `usage` object in the response (containing token counts) might not always be present, or its accuracy can vary depending on the model and LM Studio version. Do not rely heavily on it for precise token counting unless verified for your specific setup.
3.  **Error Handling:** If an error occurs (e.g., model not loaded, malformed request), the server should return standard HTTP error codes (e.g., `400 Bad Request`, `500 Internal Server Error`) with a JSON body providing more details, similar to the OpenAI API.
    ```json
    {
      "error": {
        "message": "Specific error message here.",
        "type": "invalid_request_error", // or other error type
        "param": null,
        "code": null
      }
    }
    ```
4.  **Feature Parity:** While LM Studio aims for OpenAI API compatibility, not all advanced features or parameters (like `logit_bias`, `logprobs`, complex `tool_choice` options) might be fully implemented or behave identically. Always test thoroughly. Function calling (`tools` and `tool_calls`) support has improved but can vary by model and LM Studio version.
5.  **Server Configuration:** Ensure the "Start Server" button is clicked in LM Studio's `</>` (Server) tab, and note the port number if it's different from `1234`.

This documentation should provide a solid foundation for building your TypeScript service to interact with LM Studio.