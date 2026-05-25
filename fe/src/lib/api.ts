import { ApiError } from "@/types";
import { getAccessToken } from "./auth";
import { API_BASE_URL } from "./constants";

export class ApiClientError extends Error {
  constructor(public error: ApiError) {
    super(error.message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = await getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else if (requireAuth) throw new ApiClientError({ code: "UNAUTHORIZED", message: "Not authenticated" });

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    // FastAPI raises HTTPException with { detail: { code, message } } or { detail: "string" }
    const detail = data?.detail;
    const error: ApiError =
      detail && typeof detail === "object" && detail.code
        ? detail
        : Array.isArray(detail)
          ? {
              code: "BAD_REQUEST",
              message: detail
                .map((item) => item?.msg)
                .filter(Boolean)
                .join(" ") || "Invalid request",
              details: detail,
            }
        : { code: "INTERNAL_ERROR", message: typeof detail === "string" ? detail : "Unknown error" };
    throw new ApiClientError(error);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// SWR fetcher
export const fetcher = <T>(path: string) => api.get<T>(path);
