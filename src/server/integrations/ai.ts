import {
  getActiveIntegrationForCategory,
  getIntegrationConfig,
} from "./vault";

export type AiProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "claude"
  | "grok"
  | "xai"
  | "mistral"
  | "llama";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateAiCompletionInput {
  provider?: AiProvider | string;
  model?: string;
  systemPrompt?: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResult {
  provider: string;
  model: string;
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

interface AiConfig extends Record<string, unknown> {
  apiKey?: string;
  defaultModel?: string;
  baseUrl?: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  claude: "claude-3-5-sonnet-latest",
  grok: "grok-2-latest",
  xai: "grok-2-latest",
  mistral: "mistral-small-latest",
  llama: "llama-3.3-70b-versatile",
};

async function callGemini(
  model: string,
  input: GenerateAiCompletionInput,
  config: AiConfig
): Promise<AiCompletionResult> {
  if (!config.apiKey) {
    throw new Error("Gemini integration is missing apiKey.");
  }

  const contents = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      ...(input.temperature !== undefined
        ? { temperature: input.temperature }
        : {}),
      ...(input.maxTokens !== undefined
        ? { maxOutputTokens: input.maxTokens }
        : {}),
    },
  };

  if (input.systemPrompt) {
    payload.systemInstruction = { parts: [{ text: input.systemPrompt }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  return {
    provider: "gemini",
    model,
    content: text,
    usage: data.usageMetadata
      ? {
          inputTokens: data.usageMetadata.promptTokenCount,
          outputTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  };
}

async function callAnthropic(
  model: string,
  input: GenerateAiCompletionInput,
  config: AiConfig
): Promise<AiCompletionResult> {
  if (!config.apiKey) {
    throw new Error("Anthropic integration is missing apiKey.");
  }

  const messages = input.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxTokens ?? 2048,
      ...(input.systemPrompt ? { system: input.systemPrompt } : {}),
      ...(input.temperature !== undefined
        ? { temperature: input.temperature }
        : {}),
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text =
    data.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("") ?? "";

  return {
    provider: "anthropic",
    model,
    content: text,
    usage: data.usage
      ? {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens:
            (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined,
  };
}

async function callOpenAiCompatible(
  provider: string,
  endpoint: string,
  model: string,
  input: GenerateAiCompletionInput,
  config: AiConfig
): Promise<AiCompletionResult> {
  if (!config.apiKey) {
    throw new Error(`${provider} integration is missing apiKey.`);
  }

  const messages: AiChatMessage[] = [];
  if (input.systemPrompt) {
    messages.push({ role: "system", content: input.systemPrompt });
  }
  messages.push(...input.messages);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(input.temperature !== undefined
        ? { temperature: input.temperature }
        : {}),
      ...(input.maxTokens !== undefined ? { max_tokens: input.maxTokens } : {}),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${provider} API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  return {
    provider,
    model,
    content: data.choices?.[0]?.message?.content ?? "",
    usage: data.usage
      ? {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Generate a unified AI chat completion across Gemini, OpenAI, Anthropic Claude,
 * Grok (xAI), Mistral, and Llama.
 */
export async function generateAiCompletion(
  input: GenerateAiCompletionInput
): Promise<AiCompletionResult> {
  const integration = input.provider
    ? await getIntegrationConfig<AiConfig>("ai", input.provider.toLowerCase())
    : await getActiveIntegrationForCategory<AiConfig>("ai");

  if (!integration || !integration.enabled) {
    throw new Error(
      input.provider
        ? `AI provider "${input.provider}" is not configured or enabled.`
        : "No active AI integration is enabled."
    );
  }

  const provider = integration.provider.toLowerCase();
  const config = integration.config;
  const model =
    input.model || config.defaultModel || DEFAULT_MODELS[provider] || "";

  switch (provider) {
    case "gemini":
      return callGemini(model, input, config);
    case "anthropic":
    case "claude":
      return callAnthropic(model, input, config);
    case "openai":
      return callOpenAiCompatible(
        "openai",
        config.baseUrl ?? "https://api.openai.com/v1/chat/completions",
        model,
        input,
        config
      );
    case "grok":
    case "xai":
      return callOpenAiCompatible(
        "grok",
        config.baseUrl ?? "https://api.x.ai/v1/chat/completions",
        model,
        input,
        config
      );
    case "mistral":
      return callOpenAiCompatible(
        "mistral",
        config.baseUrl ?? "https://api.mistral.ai/v1/chat/completions",
        model,
        input,
        config
      );
    case "llama":
      return callOpenAiCompatible(
        "llama",
        config.baseUrl ?? "https://api.groq.com/openai/v1/chat/completions",
        model,
        input,
        config
      );
    default:
      throw new Error(`Unsupported AI provider: ${integration.provider}`);
  }
}
