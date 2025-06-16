// src/api/client.ts
import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://localhost:3000";

interface ClientOptions {
  headers?: Record<string, string>;
  /** Will be merged into `body` for POST/PATCH */
  body?: any;
  /** Query params for GET/DELETE */
  params?: Record<string, string | number>;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("jwt");
}

function buildUrl(path: string, params?: Record<string, string | number>) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    url += `?${query}`;
  }
  return url;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  options: ClientOptions = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const init: RequestInit = { method, headers };

  if (options.body != null) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(buildUrl(path, options.params), init);

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response
    data = text;
  }

  if (!res.ok) {
    const err = data?.message || res.statusText;
    throw new Error(err);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, params?: ClientOptions["params"]) =>
    request<T>("GET", path, { params }),

  post: <T>(path: string, body?: ClientOptions["body"]) =>
    request<T>("POST", path, { body }),

  patch: <T>(path: string, body?: ClientOptions["body"]) =>
    request<T>("PATCH", path, { body }),

  del: <T>(path: string, params?: ClientOptions["params"]) =>
    request<T>("DELETE", path, { params }),
};
