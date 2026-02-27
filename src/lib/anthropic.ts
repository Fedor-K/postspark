import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export async function generateWithClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const { maxTokens = 4096, temperature = 0.8, systemPrompt } = options;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    temperature,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }

  throw new Error("Unexpected response type from Claude");
}
