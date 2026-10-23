export const DEFAULT_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
export const DEFAULT_VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return Response.json({ message: "通知服务尚未连接。" }, { status: 503 });
  }
  return Response.json({ publicKey }, { headers: { "cache-control": "no-store" } });
}
