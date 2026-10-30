/**
 * Typed, user-safe errors for the UPWISE AI service.
 *
 * Messages in this class are safe to return to API clients: they never contain
 * credentials, stack traces, upstream response bodies or prompt content.
 */
export class AiServiceError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfter?: number;

  constructor(message: string, status = 500, code = 'AI_ERROR', retryAfter?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export function isAiServiceError(error: unknown): error is AiServiceError {
  return error instanceof AiServiceError;
}
