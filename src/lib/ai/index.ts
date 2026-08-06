// AI integration layer — placeholder for future implementation
export type AIRequest = {
  prompt: string;
  context?: Record<string, unknown>;
};

export type AIResponse = {
  result: string;
  confidence?: number;
};

export async function processAIRequest(
  _request: AIRequest
): Promise<AIResponse> {
  throw new Error("AI integration not yet implemented");
}
