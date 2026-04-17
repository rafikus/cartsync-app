// src/services/api.ts
import Constants from "expo-constants";

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://10.0.2.2:6300";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  listIds?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  listIds?: string[];
}

export interface ListItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  addedBy: string;
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  inviteCode: string;
  members: User[];
  items: ListItem[];
  createdAt: string;
}

export interface Store {
  id: string;
  listId: string;
  name: string;
  tripCount: number;
  learnedOrder: Record<string, number>;
}

export interface Trip {
  id: string;
  listId: string;
  storeId?: string;
  storeName?: string;
  completedBy: string;
  completedAt: string;
  itemCount: number;
  receiptUrl?: string;
}

export interface Suggestion {
  name: string;
  unit: string;
  frequencyLabel: string;
}

// ── HTTP core ─────────────────────────────────────────────────────────────────

let _token: string | null = null;

export function setAuthToken(t: string | null) {
  _token = t;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  console.log(BASE_URL, method, path, body ?? "");

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  console.log("API Response", method, path, body ?? "", "=>", res.status);

  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = (await res.json()).message ?? msg;
    } catch {}
    console.log("API Error", method, path, body ?? "", "=>", res.status, msg);
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

const get = <T>(path: string) => request<T>("GET", path);
const post = <T>(path: string, body: unknown) => request<T>("POST", path, body);
const patch = <T>(path: string, body: unknown) =>
  request<T>("PATCH", path, body);
const del = <T>(path: string) => request<T>("DELETE", path);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, name: string) =>
    post<AuthResponse>("/auth/register", { email, password, name }),
  login: (email: string, password: string) =>
    post<AuthResponse>("/auth/login", { email, password }),
  me: () => get<User>("/auth/me"),
};

// ── Lists ─────────────────────────────────────────────────────────────────────

export const listsApi = {
  create: (name: string) => post<ShoppingList>("/lists", { name }),
  join: (inviteCode: string) =>
    post<ShoppingList>("/lists/join", { inviteCode }),
  get: (listId: string) => get<ShoppingList>(`/lists/${listId}`),
  rename: (listId: string, name: string) =>
    patch<ShoppingList>(`/lists/${listId}`, { name }),
};

// ── Items ─────────────────────────────────────────────────────────────────────

export const itemsApi = {
  add: (listId: string, name: string, quantity: number, unit: string) =>
    post<ListItem>(`/lists/${listId}/items`, { name, quantity, unit }),
  update: (
    listId: string,
    itemId: string,
    changes: Partial<Pick<ListItem, "name" | "quantity" | "unit" | "checked">>,
  ) => patch<ListItem>(`/lists/${listId}/items/${itemId}`, changes),
  remove: (listId: string, itemId: string) =>
    del<void>(`/lists/${listId}/items/${itemId}`),
};

// ── Stores ────────────────────────────────────────────────────────────────────

export const storesApi = {
  list: (listId: string) => get<Store[]>(`/lists/${listId}/stores`),
  create: (listId: string, name: string) =>
    post<Store>(`/lists/${listId}/stores`, { name }),
  recordOrder: (listId: string, storeId: string, order: string[]) =>
    post<Store>(`/lists/${listId}/stores/${storeId}/order`, { order }),
};

// ── Trips ─────────────────────────────────────────────────────────────────────

export const tripsApi = {
  list: (listId: string) => get<Trip[]>(`/lists/${listId}/trips`),
  complete: (listId: string, storeId?: string) =>
    post<Trip>(`/lists/${listId}/trips`, { storeId }),
  attachReceipt: async (
    listId: string,
    tripId: string,
    uri: string,
  ): Promise<Trip> => {
    const form = new FormData();
    form.append("receipt", {
      uri,
      name: "receipt.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    const headers: Record<string, string> = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const res = await fetch(
      `${BASE_URL}/lists/${listId}/trips/${tripId}/receipt`,
      {
        method: "POST",
        headers,
        body: form,
      },
    );
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
};

// ── Suggestions ───────────────────────────────────────────────────────────────

export const suggestionsApi = {
  get: (listId: string) => get<Suggestion[]>(`/lists/${listId}/suggestions`),
};
