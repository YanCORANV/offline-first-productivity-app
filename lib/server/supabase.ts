import "server-only";

interface SupabaseConfig {
  url: string;
  secret: string;
}

function getConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const secret = process.env.SUPABASE_SECRET_KEY;
  return url && secret ? { url, secret } : null;
}

export function isCloudConfigured(): boolean {
  return getConfig() !== null;
}

export async function supabaseRpc<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const config = getConfig();
  if (!config) throw new Error("云同步尚未连接，请先配置 Supabase。");

  const response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: config.secret,
      authorization: `Bearer ${config.secret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`[supabase:${functionName}] ${response.status} ${detail.slice(0, 400)}`);
    let errorMessage = `云端操作失败（${response.status}）`;
    try {
      const parsed = JSON.parse(detail);
      if (parsed && typeof parsed.message === "string") {
        errorMessage = `云端错误：${parsed.message}${parsed.details ? ` (${parsed.details})` : ""}`;
      } else if (parsed && typeof parsed.error === "string") {
        errorMessage = `云端错误：${parsed.error}`;
      }
    } catch {
      if (detail) {
        errorMessage = `云端错误（${response.status}）：${detail.slice(0, 200)}`;
      }
    }
    throw new Error(errorMessage);
  }
  return (await response.json()) as T;
}

export async function supabaseRest<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const config = getConfig();
  if (!config) throw new Error("云同步尚未连接，请先配置 Supabase。");

  const response = await fetch(`${config.url}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      apikey: config.secret,
      authorization: `Bearer ${config.secret}`,
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`[supabase:${endpoint}] ${response.status} ${detail.slice(0, 400)}`);
    let errorMessage = `云端数据读取失败（${response.status}）`;
    try {
      const parsed = JSON.parse(detail);
      if (parsed && typeof parsed.message === "string") {
        errorMessage = `云端错误：${parsed.message}${parsed.details ? ` (${parsed.details})` : ""}`;
      } else if (parsed && typeof parsed.error === "string") {
        errorMessage = `云端错误：${parsed.error}`;
      }
    } catch {
      if (detail) {
        errorMessage = `云端错误（${response.status}）：${detail.slice(0, 200)}`;
      }
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null as T;
  }
  return (await response.json()) as T;
}
