/**
 * Minimal typed fetch wrapper for calling the Athlyt backend.
 *
 * Kept deliberately small at this stage — no auth headers, no retry/refresh
 * logic, since there's no auth yet (Feature 1). This is the one place that
 * knows the backend's base URL, so every future API call goes through here
 * rather than `fetch`ing a hardcoded URL from inside a component.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
