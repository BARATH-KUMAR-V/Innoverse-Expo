const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = body?.message || "Something went wrong. Please try again.";
    const code = body?.error || "server_error";
    throw new ApiError(res.status, code, message);
  }

  return body as T;
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(0, "network_error", "Unable to connect. Please check your internet connection.");
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
    return await handleResponse<T>(res);
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPost<T = unknown>(path: string, data?: unknown): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return await handleResponse<T>(res);
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiPut<T = unknown>(path: string, data?: unknown): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    return await handleResponse<T>(res);
  } catch (err) {
    throw toApiError(err);
  }
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", credentials: "include" });
    return await handleResponse<T>(res);
  } catch (err) {
    throw toApiError(err);
  }
}

/** Downloads a file response (e.g. the admin CSV export) as a Blob, honoring the same error contract as the JSON helpers. */
export async function apiDownload(path: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error || "server_error", body?.message || "Download failed.");
  }
  return res.blob();
}

/** Full-page navigation target for "Continue with Google" - this cannot be a fetch() call, it must be a real browser navigation so Google's own login UI can load. */
export function googleLoginUrl(): string {
  return `${API_BASE}/auth/google`;
}
