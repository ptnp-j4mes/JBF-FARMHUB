import axios, { type AxiosError } from 'axios';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatValidationErrors(errors: unknown): string | null {
  if (!isRecord(errors)) return null;

  const details = Object.entries(errors)
    .flatMap(([, values]) => {
      if (Array.isArray(values)) {
        return values
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
      }

      if (typeof values === 'string') {
        const trimmed = values.trim();
        return trimmed ? [trimmed] : [];
      }

      return [];
    })
    .filter((value, index, source) => source.indexOf(value) === index);

  return details.length > 0 ? details.join(' / ') : null;
}

function extractMessageFromPayload(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  const message = toNonEmptyString(payload.message) ?? toNonEmptyString(payload.Message);
  if (message) return message;

  const detail = toNonEmptyString(payload.detail) ?? toNonEmptyString(payload.Detail);
  if (detail) return detail;

  const errorValue = payload.error ?? payload.Error;
  const errorString = toNonEmptyString(errorValue);
  if (errorString) return errorString;

  if (isRecord(errorValue)) {
    const nestedMessage =
      toNonEmptyString(errorValue.message) ??
      toNonEmptyString(errorValue.Message) ??
      toNonEmptyString(errorValue.detail) ??
      toNonEmptyString(errorValue.Detail);
    if (nestedMessage) return nestedMessage;
  }

  const title = toNonEmptyString(payload.title) ?? toNonEmptyString(payload.Title);
  if (title) {
    const errors = formatValidationErrors(payload.errors ?? payload.Errors);
    return errors ? `${title}: ${errors}` : title;
  }

  const errors = formatValidationErrors(payload.errors ?? payload.Errors);
  if (errors) return errors;

  return null;
}

function extractCode(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  return toNonEmptyString(payload.code) ?? toNonEmptyString(payload.Code);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public details?: unknown,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function parseApiError(
  error: unknown,
  fallbackMessage = 'Request failed',
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    return parseAxiosApiError(error, fallbackMessage);
  }

  if (error instanceof Error) {
    return new ApiError(0, undefined, error.message || fallbackMessage);
  }

  return new ApiError(0, undefined, fallbackMessage);
}

function parseAxiosApiError(
  error: AxiosError,
  fallbackMessage: string,
): ApiError {
  const response = error.response;
  const data = response?.data;
  const status = response?.status ?? 0;
  const code = extractCode(data) ?? error.code ?? undefined;
  const message =
    extractMessageFromPayload(data) ??
    toNonEmptyString(error.message) ??
    fallbackMessage;
  const details = isRecord(data) ? data.details ?? data.Details : undefined;

  return new ApiError(status, code, message, details, data);
}
