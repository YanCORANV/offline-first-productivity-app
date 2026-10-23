import { z } from "zod";
import { jsonError, requirePlannerIdentity } from "@/lib/server/auth";
import { isCloudConfigured, supabaseRpc } from "@/lib/server/supabase";

const requestSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  timezone: z.string().min(1).max(100),
  userAgent: z.string().max(1000),
});

export async function POST(request: Request) {
  try {
    if (!isCloudConfigured()) {
      return Response.json({ message: "云同步尚未连接，无法保存设备订阅。" }, { status: 503 });
    }
    const identity = requirePlannerIdentity(request);
    const input = requestSchema.parse(await request.json());
    const result = await supabaseRpc<Record<string, unknown>>("planner_register_push", {
      p_owner: identity.ownerId,
      p_subscription: input.subscription,
      p_timezone: input.timezone,
      p_user_agent: input.userAgent,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ message: "设备订阅数据无效。" }, { status: 400 });
    }
    return jsonError(error, "保存设备订阅失败。");
  }
}
