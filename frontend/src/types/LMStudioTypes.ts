export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  stop?: string | string[] | null;
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number | null;  // Added seed parameter for consistent outputs
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: Usage;
}

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
    arguments?: string;
  };
}

export interface ChunkChoice {
  index: number;
  delta: DeltaMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChunkChoice[];
}

// Types for the LMStudio configuration
export interface LMStudioConfig {
  baseUrl: string;
  modelName: string;
  seed: number | null;
}
