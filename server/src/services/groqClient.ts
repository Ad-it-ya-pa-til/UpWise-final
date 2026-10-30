import path from 'path';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { AiServiceError } from './aiErrors.js';

/**
 * Load server/.env before any client is created. dotenv never overrides values
 * that are already present in the process environment, so production secrets
 * supplied by the host always win.
 */
function loadEnvironment(): void {
  if (process.env.GROQ_API_KEY && process.env.GROQ_MODEL) return;

  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'server', '.env'),
    path.resolve(process.cwd(), '..', 'server', '.env'),
  ];

  for (const candidate of candidates) {
    dotenv.config({ path: candidate });
    if (process.env.GROQ_API_KEY && process.env.GROQ_MODEL) return;
  }
}

loadEnvironment();

let groqClient: Groq | null = null;
let cachedApiKey: string | null = null;

export const GROQ_REQUEST_TIMEOUT_MS = 30_000;

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
}

export function getGroqModel(): string {
  const model = process.env.GROQ_MODEL?.trim();
  if (!model) {
    throw new AiServiceError(
      'The AI service is not configured: GROQ_MODEL is missing on the server.',
      503,
      'AI_MODEL_NOT_CONFIGURED'
    );
  }
  return model;
}

/**
 * Lazily creates a single, shared Groq client. Recreates it only if the key
 * changes, which keeps tests and key rotation safe without duplicate clients.
 */
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AiServiceError(
      'The AI service is not configured: GROQ_API_KEY is missing on the server.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  if (!groqClient || cachedApiKey !== apiKey) {
    groqClient = new Groq({
      apiKey,
      timeout: GROQ_REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    });
    cachedApiKey = apiKey;
  }

  return groqClient;
}

function readRetryAfter(error: Record<string, unknown>): number | undefined {
  const headers = error.headers as
    | Record<string, string | number | undefined>
    | { get?: (name: string) => string | null }
    | undefined;

  let raw: string | number | null | undefined;
  if (headers && typeof (headers as { get?: unknown }).get === 'function') {
    raw = (headers as { get: (name: string) => string | null }).get('retry-after');
  } else if (headers) {
    const record = headers as Record<string, string | number | undefined>;
    raw = record['retry-after'] ?? record['Retry-After'];
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : undefined;
}

/**
 * Converts Groq SDK failures into safe, actionable AiServiceErrors.
 * Never includes the upstream body, request headers or credentials.
 */
export function mapGroqError(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;

  const err = (error ?? {}) as Record<string, any>;
  const status = typeof err.status === 'number' ? err.status : undefined;
  const name = String(err.name || '');
  const message = String(err.message || '');
  const retryAfter = readRetryAfter(err);

  if (status === 401 || status === 403) {
    return new AiServiceError(
      'The AI service could not authenticate with Groq. Please contact the UPWISE administrator.',
      502,
      'AI_AUTH_FAILED'
    );
  }

  if (status === 429) {
    return new AiServiceError(
      retryAfter
        ? `The AI service is handling too many requests right now. Please retry in ${retryAfter} seconds.`
        : 'The AI service is handling too many requests right now. Please pause for a moment and retry.',
      429,
      'AI_RATE_LIMITED',
      retryAfter
    );
  }

  if (status === 404 || /model.*(not found|unavailable|decommission|does not exist)/i.test(message)) {
    return new AiServiceError(
      'The configured AI model is currently unavailable. Please try again later or contact the UPWISE administrator.',
      503,
      'AI_MODEL_UNAVAILABLE'
    );
  }

  if (status === 400 || status === 422) {
    return new AiServiceError(
      'The AI service could not process this request. Please shorten or rephrase your message and try again.',
      400,
      'AI_BAD_REQUEST'
    );
  }

  if (name === 'APIConnectionTimeoutError' || /timed? ?out/i.test(message)) {
    return new AiServiceError(
      'The AI service took too long to respond. Please try again.',
      504,
      'AI_TIMEOUT'
    );
  }

  if (name === 'APIConnectionError' || /fetch failed|network|ECONN|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return new AiServiceError(
      'Could not reach the AI service. Please check the server connection and try again.',
      502,
      'AI_NETWORK_ERROR'
    );
  }

  if (status && status >= 500) {
    return new AiServiceError(
      'The AI service is temporarily unavailable. Please try again shortly.',
      502,
      'AI_UPSTREAM_ERROR'
    );
  }

  return new AiServiceError(
    'The AI service is temporarily unavailable. Please try again shortly.',
    502,
    'AI_UPSTREAM_ERROR'
  );
}

export interface ModelVerification {
  ok: boolean;
  model: string;
  availableChatModels: string[];
  error?: string;
}

/**
 * Verifies the configured model against Groq's live model catalogue.
 * Used by the server startup check; never returns or logs the API key.
 */
export async function verifyGroqModel(): Promise<ModelVerification> {
  const model = getGroqModel();
  try {
    const response = await getGroqClient().models.list();
    const availableChatModels = (response.data || [])
      .map((item: { id: string }) => item.id)
      .filter((id: string) => !/^whisper|^canopylabs\/orpheus|prompt-guard/i.test(id))
      .sort();

    return {
      ok: availableChatModels.includes(model),
      model,
      availableChatModels,
      ...(availableChatModels.includes(model)
        ? {}
        : { error: 'Configured GROQ_MODEL is not present in the current Groq model catalogue.' }),
    };
  } catch (error) {
    return {
      ok: false,
      model,
      availableChatModels: [],
      error: mapGroqError(error).message,
    };
  }
}
