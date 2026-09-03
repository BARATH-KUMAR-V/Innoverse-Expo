/**
 * A thrown HttpError becomes a clean, predictable JSON error response via
 * the shared `handleRoute` wrapper in `lib/api-handler.ts` - the message
 * here is always safe to show to the end user (never a stack trace or DB
 * detail).
 */
export class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
