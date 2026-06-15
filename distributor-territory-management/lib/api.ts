import type { Distributor, Territory, LatLng, SessionUser } from "@/types";

/**
 * Base URL of the DTMS backend API. Override with NEXT_PUBLIC_API_URL.
 * On Netlify, requests go through a proxy function at /.netlify/functions/api-proxy
 * which forwards to the backend. In dev, use localhost backend or set NEXT_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/.netlify/functions/api-proxy";

const TOKEN_KEY = "dtm.token";

// --- Token storage (the bearer token is kept in localStorage) ---------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Thin fetch wrapper: attaches the bearer token, sends/parses JSON, and throws
 * an ApiError on non-2xx responses. On 401 it clears the stored token.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // When using the Netlify proxy, pass the path as a query parameter
  const url =
    API_BASE_URL === "/.netlify/functions/api-proxy"
      ? `${API_BASE_URL}?path=${encodeURIComponent(path)}`
      : `${API_BASE_URL}${path}`;

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    throw new ApiError(401, "Unauthorized");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const text = await res.text();
      if (text) message = text;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) return undefined as T;
  return (await res.json()) as T;
}

// --- Auth -------------------------------------------------------------------

export interface AuthResponse {
  user: SessionUser;
  token: string;
  expiresAt: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, name?: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),

  me: () => request<SessionUser>("/auth/me"),
};

// --- Distributors -----------------------------------------------------------

export interface DistributorInput {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: string;
  code?: string;
  joinedAt?: string;
  avatarColor?: string;
}

export const distributorApi = {
  list: () => request<Distributor[]>("/distributors"),

  create: (input: DistributorInput) =>
    request<Distributor>("/distributors", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: DistributorInput) =>
    request<Distributor>(`/distributors/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/distributors/${id}`, { method: "DELETE" }),
};

// --- Territories ------------------------------------------------------------

export interface TerritoryInput {
  name: string;
  coverageArea: string;
  notes?: string;
  color?: string;
  coordinates?: LatLng[];
  distributorId?: string | null;
  monthlySales?: number;
  targetSales?: number;
  performance?: string;
  outlets?: number;
  population?: number;
}

export const territoryApi = {
  list: () => request<Territory[]>("/territories"),

  create: (input: TerritoryInput) =>
    request<Territory>("/territories", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (id: string, input: TerritoryInput) =>
    request<Territory>(`/territories/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  updateCoordinates: (id: string, coordinates: LatLng[]) =>
    request<Territory>(`/territories/${id}/coordinates`, {
      method: "PUT",
      body: JSON.stringify({ coordinates }),
    }),

  assign: (id: string, distributorId: string | null) =>
    request<Territory>(`/territories/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({ distributorId }),
    }),

  remove: (id: string) =>
    request<void>(`/territories/${id}`, { method: "DELETE" }),
};
