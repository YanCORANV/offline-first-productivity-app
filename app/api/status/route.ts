import { isCloudConfigured } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasPush = Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );

  return Response.json(
    {
      cloud: isCloudConfigured() ? "connected" : "unconfigured",
      push: hasPush ? "connected" : "unconfigured",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
