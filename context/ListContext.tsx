// src/context/ListContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  listsApi,
  itemsApi,
  storesApi,
  tripsApi,
  suggestionsApi,
  ListItem,
  ShoppingList,
  Store,
  Trip,
  Suggestion,
} from "../services/api";
import { wsClient, WsMessage } from "../services/ws";
import { useAuth } from "./AuthContext";

export type SyncState = "live" | "pending" | "offline";

interface ListCtx {
  list: ShoppingList | null;
  items: ListItem[];
  stores: Store[];
  trips: Trip[];
  suggestions: Suggestion[];
  syncState: SyncState;
  partnerCheckingId: string | null;
  loading: boolean;
  error: string | null;
  clearList: () => void;
  loadList: (id: string) => Promise<void>;
  addItem: (name: string, qty: number, unit: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  updateItem: (
    id: string,
    changes: Partial<Pick<ListItem, "name" | "quantity" | "unit">>,
  ) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  completeTrip: (storeId?: string, order?: string[]) => Promise<Trip>;
  loadSuggestions: () => Promise<void>;
}

const Ctx = createContext<ListCtx | null>(null);

export function ListProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [syncState, setSyncState] = useState<SyncState>("offline");
  const [partnerCheckingId, setPartnerCheckingId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listIdRef = useRef<string | null>(null);
  const partnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WebSocket wiring
  useEffect(() => {
    wsClient.onStatusChange = (s) => setSyncState(s);
    const unsub = wsClient.subscribe(handleWs);
    return () => {
      unsub();
      wsClient.onStatusChange = undefined;
    };
  }, []);

  const handleWs = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case "item:added":
        setItems((prev) => {
          const item = msg.payload as ListItem;
          return prev.some((i) => i.id === item.id) ? prev : [...prev, item];
        });
        break;
      case "item:updated":
        setItems((prev) =>
          prev.map((i) =>
            i.id === (msg.payload as ListItem).id
              ? { ...i, ...(msg.payload as ListItem) }
              : i,
          ),
        );
        break;
      case "item:removed":
        setItems((prev) =>
          prev.filter((i) => i.id !== (msg.payload as { id: string }).id),
        );
        break;
      case "item:checking": {
        const { itemId } = msg.payload as { itemId: string };
        setPartnerCheckingId(itemId);
        if (partnerTimer.current) clearTimeout(partnerTimer.current);
        partnerTimer.current = setTimeout(
          () => setPartnerCheckingId(null),
          2000,
        );
        break;
      }
      case "list:updated":
        setList((prev) =>
          prev ? { ...prev, ...(msg.payload as Partial<ShoppingList>) } : prev,
        );
        break;
      case "store:updated":
        setStores((prev) =>
          prev.map((s) =>
            s.id === (msg.payload as Store).id
              ? { ...s, ...(msg.payload as Store) }
              : s,
          ),
        );
        break;
      case "trip:completed":
        setTrips((prev) => [msg.payload as Trip, ...prev]);
        if (listIdRef.current) loadList(listIdRef.current);
        break;
    }
  }, []);

  const clearList = useCallback(() => {
    wsClient.disconnect();
    listIdRef.current = null;
    setList(null);
    setItems([]);
    setStores([]);
    setTrips([]);
    setSuggestions([]);
    setSyncState("offline");
  }, []);

  const loadList = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      listIdRef.current = id;
      try {
        const [listData, storeData, tripData] = await Promise.all([
          listsApi.get(id),
          storesApi.list(id),
          tripsApi.list(id),
        ]);
        setList(listData);
        setItems(listData.items);
        setStores(storeData);
        setTrips(tripData);
        if (token) wsClient.connect(id, token);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const loadSuggestions = useCallback(async () => {
    if (!listIdRef.current) return;
    try {
      const data = await suggestionsApi.get(listIdRef.current);
      setSuggestions(data);
    } catch {}
  }, []);

  const addItem = useCallback(
    async (name: string, qty: number, unit: string) => {
      if (!listIdRef.current) return;
      const item = await itemsApi.add(listIdRef.current, name, qty, unit);
      setItems((prev) => [...prev, item]);
    },
    [],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      if (!listIdRef.current) return;
      const current = items.find((i) => i.id === id);
      if (!current) return;
      const nowChecked = !current.checked;
      if (nowChecked)
        wsClient.send({ type: "item:checking", payload: { itemId: id } });
      // Optimistic
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, checked: nowChecked } : i)),
      );
      try {
        await itemsApi.update(listIdRef.current, id, { checked: nowChecked });
      } catch {
        // Rollback
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, checked: current.checked } : i,
          ),
        );
      }
    },
    [items],
  );

  const updateItem = useCallback(
    async (
      id: string,
      changes: Partial<Pick<ListItem, "name" | "quantity" | "unit">>,
    ) => {
      if (!listIdRef.current) return;
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...changes } : i)),
      );
      await itemsApi.update(listIdRef.current, id, changes);
    },
    [],
  );

  const removeItem = useCallback(async (id: string) => {
    if (!listIdRef.current) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await itemsApi.remove(listIdRef.current, id);
  }, []);

  const completeTrip = useCallback(
    async (storeId?: string, order?: string[]): Promise<Trip> => {
      if (!listIdRef.current) throw new Error("No list loaded");
      if (storeId && order?.length) {
        await storesApi.recordOrder(listIdRef.current, storeId, order);
      }
      const trip = await tripsApi.complete(listIdRef.current, storeId);
      setTrips((prev) => [trip, ...prev]);
      setItems([]);
      return trip;
    },
    [],
  );

  return (
    <Ctx.Provider
      value={{
        list,
        items,
        stores,
        trips,
        suggestions,
        syncState,
        partnerCheckingId,
        loading,
        error,
        loadList,
        addItem,
        toggleItem,
        updateItem,
        removeItem,
        completeTrip,
        loadSuggestions,
        clearList,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useList(): ListCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useList must be inside ListProvider");
  return ctx;
}
