import { generateCompletion, generateStreamingCompletion } from '../../src/services/llmBackend';

// Mock fetch globally
const globalAny: any = global;

describe('llmBackend service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should call the proxy controller and return chat completions (non-streaming)', async () => {
    const mockResponse = {
      choices: [
        { message: { content: 'Hello, world!' } }
      ]
    };
    globalAny.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await generateCompletion({ prompt: 'Say hello' });
    expect(globalAny.fetch).toHaveBeenCalledWith(
      '/proxy/llm/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String)
      })
    );
    expect(result).toBe('Hello, world!');
  });

  it('should handle chunked SSE responses in generateStreamingCompletion', async () => {
    // Simulate generateCompletion being called inside generateStreamingCompletion
    const mockText = 'Chunked response!';
    // Patch fetch to return a valid Response object with ok and body
    globalAny.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Chunked response!"}}]}\n'), done: false })
            .mockResolvedValueOnce({ value: new TextEncoder().encode('data: [DONE]\n'), done: false })
            .mockResolvedValueOnce({ value: undefined, done: true })
        })
      }
    });
    const onProgress = jest.fn();
    const result = await generateStreamingCompletion({ prompt: 'Stream it', onProgress });
    expect(onProgress).toHaveBeenCalledWith('Chunked response!');
    expect(result).toBe('Chunked response!');
  });

  it('should handle chunked SSE responses from the proxy controller (simulate SSE)', async () => {
    // Simulate a chunked SSE response as the backend would send
    const sseChunks = [
      'data: {"choices":[{"delta":{"content":"Hello "}}]}\n',
      'data: {"choices":[{"delta":{"content":"world!"}}]}\n',
      'data: [DONE]\n'
    ];
    // Create a mock ReadableStream for fetch
    const stream = new ReadableStream({
      start(controller) {
        sseChunks.forEach(chunk => {
          controller.enqueue(new TextEncoder().encode(chunk));
        });
        controller.close();
      }
    });
    globalAny.fetch = jest.fn().mockResolvedValue({
      ok: true,
      body: stream
    });

    // Patch generateStreamingCompletion to actually parse the SSE stream
    // (Assume the real implementation is updated to support this)
    // For this test, we simulate what the client should do
    const onProgress = jest.fn();
    // You may need to update generateStreamingCompletion to support streaming fetch
    // For now, just check that fetch is called and onProgress is called with the correct text
    // (This test will fail if the implementation does not support streaming)
    try {
      await generateStreamingCompletion({ prompt: 'Say hello', onProgress });
    } catch (e) {
      // Ignore errors for now
    }
    // The onProgress callback should be called with the concatenated content
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('Hello'));
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('world!'));
  });
});

export { }; // Ensure this file is treated as a module

