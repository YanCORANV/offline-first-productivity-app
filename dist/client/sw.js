const CACHE_NAME = "quiet-plan-shell-v6";
const CLOUD_SYNC_LOCK = "quiet-plan-cloud-sync";
const SYNC_REQUEST_TIMEOUT_MS = 15_000;
const SHELL = [
  "/today",
  "/quick",
  "/focus",
  "/inbox",
  "/calendar",
  "/projects",
  "/settings",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("quiet-plan-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))),
      )
      .then(resetCachedSyncCursor)
      .then(() => self.clients.claim())
      .then(async () => {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const client of clients) client.postMessage({ type: "PLANNER_SYNC_REQUESTED" });
      }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // API responses are live, account-specific data, never offline shell assets.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;
  if (
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1" ||
    url.pathname.startsWith("/@") ||
    url.pathname.includes("/node_modules/.vite/")
  ) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/today"))),
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

async function resetCachedSyncCursor() {
  const reset = async () => {
    const database = await openPlannerDatabase();
    try {
      if (!database.objectStoreNames.contains("settings")) return;
      const transaction = database.transaction("settings", "readwrite");
      const store = transaction.objectStore("settings");
      const request = store.get("main");
      request.onsuccess = () => {
        // Replay changes once after removing cached API responses. Keep all
        // records, pending operations, conflicts and user settings intact.
        if (request.result) store.put({ ...request.result, cloudCursor: 0 });
      };
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  };
  if (self.navigator?.locks) await self.navigator.locks.request(CLOUD_SYNC_LOCK, reset);
  else await reset();
}

self.addEventListener("sync", (event) => {
  if (event.tag === "planner-sync") event.waitUntil(runExclusiveBackgroundSync());
});

async function runExclusiveBackgroundSync() {
  if (self.navigator?.locks) {
    return self.navigator.locks.request(CLOUD_SYNC_LOCK, runBackgroundSync);
  }
  return runBackgroundSync();
}

async function runBackgroundSync() {
  const database = await openPlannerDatabase();
  try {
    let settings = await readRecord(database, "settings", "main");
    if (!settings) return;
    const operations = (await readAll(database, "operations")).filter(
      (operation) => operation.status === "pending" || operation.status === "syncing",
    );

    if (operations.length) {
      const response = await fetchWithTimeout("/api/sync/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ operations, cursor: settings.cloudCursor || 0 }),
      });
      if (!response.ok) throw new Error(`Background sync push failed: ${response.status}`);
      const result = await response.json();
      await writeSyncResult(database, result);
      const pushedCursor =
        typeof result.cursor === "number" ? result.cursor : settings.cloudCursor || 0;
      const previousCursor = settings.cloudCursor || 0;
      settings = {
        ...settings,
        cloudCursor: pushedCursor,
      };
      if (pushedCursor !== previousCursor) await writeRecord(database, "settings", settings);
    }

    const pull = await fetchWithTimeout(`/api/sync/pull?cursor=${settings.cloudCursor || 0}`, {
      headers: { accept: "application/json" },
    });
    if (!pull.ok) throw new Error(`Background sync pull failed: ${pull.status}`);
    const result = await pull.json();
    await writeSyncResult(database, result);
    const pulledCursor = result.cursor || settings.cloudCursor || 0;
    if (pulledCursor !== (settings.cloudCursor || 0)) {
      settings = { ...settings, cloudCursor: pulledCursor };
      await writeRecord(database, "settings", settings);
    }

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) client.postMessage({ type: "PLANNER_SYNC_COMPLETED" });
  } finally {
    database.close();
  }
}

async function fetchWithTimeout(input, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYNC_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function openPlannerDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("planner-v1");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function readRecord(database, storeName, key) {
  const transaction = database.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).get(key));
}

async function readAll(database, storeName) {
  const transaction = database.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).getAll());
}

async function writeRecord(database, storeName, value) {
  const transaction = database.transaction(storeName, "readwrite");
  transaction.objectStore(storeName).put(value);
  await transactionDone(transaction);
}

async function writeSyncResult(database, result) {
  await writeSyncMetadata(database, result);
  const entityStore = {
    thought: "thoughts",
    task: "tasks",
    event: "events",
    goal: "goals",
    project: "projects",
    projectNode: "projectNodes",
    scheduleBlock: "scheduleBlocks",
    fragmentActivity: "fragmentActivities",
    notification: "notifications",
    originLink: "originLinks",
    aiRun: "aiRuns",
    settings: "settings",
  };
  const recordsByStore = new Map();
  for (const change of result.changes || []) {
    const storeName = entityStore[change.entityType];
    if (!storeName || !database.objectStoreNames.contains(storeName)) continue;
    const records = recordsByStore.get(storeName) || [];
    records.push(change.record);
    recordsByStore.set(storeName, records);
  }
  const storeNames = [...recordsByStore.keys()];
  if (storeNames.length) {
    const transaction = database.transaction(storeNames, "readwrite");
    for (const [storeName, records] of recordsByStore) {
      const store = transaction.objectStore(storeName);
      for (const record of records) store.put(record);
    }
    await transactionDone(transaction);
  }
}

async function writeSyncMetadata(database, result) {
  const storeNames = ["operations", "conflicts"].filter((storeName) =>
    database.objectStoreNames.contains(storeName),
  );
  if (!storeNames.length) return;
  const transaction = database.transaction(storeNames, "readwrite");
  const stores = Object.fromEntries(
    storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]),
  );
  for (const operationId of result.acknowledged || []) stores.operations?.delete(operationId);
  for (const conflict of result.conflicts || []) {
    stores.conflicts?.put(conflict);
    const request = stores.operations?.get(conflict.operationId);
    if (request) {
      request.onsuccess = () => {
        if (request.result) stores.operations.put({ ...request.result, status: "conflict" });
      };
    }
  }
  await transactionDone(transaction);
}

self.addEventListener("push", (event) => {
  let payload = {
    title: "Quiet Plan",
    body: "你有一条待处理提醒",
    url: "/today",
    reminderId: "unknown",
  };
  try {
    payload = { ...payload, ...(event.data ? event.data.json() : {}) };
  } catch {
    // A malformed payload still produces a useful generic notification.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: `planner-reminder-${payload.reminderId}`,
      renotify: false,
      data: { url: payload.url, reminderId: payload.reminderId },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          await client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
