import { onlineManager, type QueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const NETWORK_TIMEOUT_MS = 6_000;
const OFFLINE_RECHECK_MS = 30_000;

export type ConnectionStatus = "online" | "offline" | "checking";

let status: ConnectionStatus =
  typeof navigator === "undefined" || navigator.onLine ? "online" : "offline";
let ready = status === "online";
let retryFailed = false;
let probeUrl: string | undefined;
let checkToken = 0;
let activeRetry: Promise<boolean> | null = null;
const subscribers = new Set<() => void>();

class ConnectionUnavailableError extends Error {
  constructor() {
    super("connection_unavailable");
    this.name = "ConnectionUnavailableError";
  }
}

function notify() {
  subscribers.forEach((subscriber) => subscriber());
}

function setStatus(nextStatus: ConnectionStatus) {
  if (status === nextStatus) {
    onlineManager.setOnline(nextStatus === "online");
    return;
  }
  status = nextStatus;
  onlineManager.setOnline(nextStatus === "online");
  if (nextStatus !== "online") ready = false;
  notify();
}

function setReady(nextReady: boolean) {
  if (ready === nextReady) return;
  ready = nextReady;
  notify();
}

function setOffline() {
  checkToken += 1;
  setStatus("offline");
  setReady(false);
}

export function isOnline() {
  return status === "online";
}

export function isConnectionError(error: unknown) {
  if (error instanceof ConnectionUnavailableError) return true;
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.name === "TypeError" ||
    /failed to fetch|network(?:error)?|network request failed|timeout|load failed/i.test(error.message)
  );
}

export function connectionFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setOffline();
    return Promise.reject(new ConnectionUnavailableError());
  }

  if (!isOnline()) return Promise.reject(new ConnectionUnavailableError());

  const controller = new AbortController();
  let timedOut = false;
  let requestAborted = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, NETWORK_TIMEOUT_MS);
  const abortRequest = () => {
    requestAborted = true;
    controller.abort();
  };
  init?.signal?.addEventListener("abort", abortRequest, { once: true });

  return fetch(input, { ...init, signal: controller.signal })
    .then((response) => {
      if ([408, 502, 503, 504].includes(response.status)) setOffline();
      else if (status === "online") onlineManager.setOnline(true);
      return response;
    })
    .catch((error: unknown) => {
      if (timedOut || (!requestAborted && isConnectionError(error))) setOffline();
      throw timedOut ? new ConnectionUnavailableError() : error;
    })
    .finally(() => {
      window.clearTimeout(timeout);
      init?.signal?.removeEventListener("abort", abortRequest);
    });
}

function isCurrentCheck(token: number) {
  return token === checkToken;
}

function buildProbeUrl(healthUrl?: string) {
  if (!healthUrl) return undefined;
  return `${healthUrl.replace(/\/+$/, "")}/auth/v1/health`;
}

async function probeConnection(token: number) {
  if (!isCurrentCheck(token)) return null;
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  if (!probeUrl) return true;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    const response = await fetch(probeUrl, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
      signal: controller.signal,
    });
    if (!isCurrentCheck(token)) return null;
    return response.status < 500;
  } catch {
    return isCurrentCheck(token) ? false : null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function recoverQueries(queryClient: QueryClient, token: number) {
  if (!isCurrentCheck(token)) return false;

  const failedQueries = queryClient
    .getQueryCache()
    .findAll({ type: "active" })
    .filter((query) => query.state.status === "error" && isConnectionError(query.state.error));

  if (failedQueries.length > 0) {
    await queryClient.resetQueries({
      type: "active",
      predicate: (query) => failedQueries.some((failedQuery) => failedQuery === query),
    });
  }

  if (!isCurrentCheck(token) || !isOnline()) return false;
  await queryClient.refetchQueries({ type: "active" });
  return isCurrentCheck(token) && isOnline();
}

async function initializeConnection() {
  const token = ++checkToken;
  const reachable = await probeConnection(token);
  if (!isCurrentCheck(token)) return false;
  if (!reachable) {
    setOffline();
    return false;
  }
  setStatus("online");
  setReady(true);
  return true;
}

export function retryConnection(queryClient: QueryClient) {
  if (activeRetry) return activeRetry;

  const token = ++checkToken;
  retryFailed = false;
  setStatus("checking");
  setReady(false);

  activeRetry = (async () => {
    const reachable = await probeConnection(token);
    if (!isCurrentCheck(token)) return false;
    if (!reachable) {
      retryFailed = true;
      setOffline();
      notify();
      return false;
    }

    setStatus("online");
    const recovered = await recoverQueries(queryClient, token);
    if (!recovered || !isCurrentCheck(token)) {
      retryFailed = true;
      setOffline();
      notify();
      return false;
    }

    retryFailed = false;
    setReady(true);
    notify();
    return true;
  })().finally(() => {
    activeRetry = null;
  });

  return activeRetry;
}

function subscribe(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return `${status}:${ready}:${retryFailed}`;
}

function getServerSnapshot() {
  return "online:true:false";
}

interface ConnectivityContextValue {
  status: ConnectionStatus;
  isOnline: boolean;
  isReady: boolean;
  retryFailed: boolean;
  retryConnection: () => Promise<boolean>;
}

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);

export function ConnectivityProvider({
  children,
  queryClient,
  healthUrl,
}: {
  children: ReactNode;
  queryClient: QueryClient;
  healthUrl?: string;
}) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [snapshotStatus, snapshotReady, snapshotRetryFailed] = snapshot.split(":");
  probeUrl = buildProbeUrl(healthUrl);

  useEffect(() => {
    const handleOnline = () => void retryConnection(queryClient);
    const handleOffline = () => setOffline();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    onlineManager.setOnline(isOnline());
    if (!navigator.onLine) setOffline();
    else void initializeConnection();
    return () => {
      checkToken += 1;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  useEffect(() => {
    if (snapshotStatus !== "offline") return;
    const interval = window.setInterval(() => void retryConnection(queryClient), OFFLINE_RECHECK_MS);
    return () => window.clearInterval(interval);
  }, [queryClient, snapshotStatus]);

  const retry = useCallback(() => retryConnection(queryClient), [queryClient]);
  const connectionStatus = snapshotStatus as ConnectionStatus;
  const isReady = snapshotReady === "true";

  return (
    <ConnectivityContext.Provider
      value={{
        status: connectionStatus,
        isOnline: connectionStatus === "online" && isReady,
        isReady,
        retryFailed: snapshotRetryFailed === "true",
        retryConnection: retry,
      }}
    >
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  const context = useContext(ConnectivityContext);
  if (!context) throw new Error("useConnectivity must be used within ConnectivityProvider");
  return context;
}
