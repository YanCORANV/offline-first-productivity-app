import { z } from "zod";
import { jsonError, requirePlannerIdentity } from "@/lib/server/auth";
import { syncOperationSchema } from "@/lib/server/schemas";
import { isCloudConfigured, supabaseRpc } from "@/lib/server/supabase";

const requestSchema = z.object({
  operations: z.array(syncOperationSchema).max(500),
  cursor: z.number().int().nonnegative().default(0),
});

export async function POST(request: Request) {
  try {
    if (!isCloudConfigured()) {
      return Response.json(
        { message: "云同步尚未连接。", code: "CLOUD_UNCONFIGURED" },
        { status: 503 },
      );
    }
    const identity = requirePlannerIdentity(request);
    const input = requestSchema.parse(await request.json());
    const result = await supabaseRpc<Record<string, unknown>>("planner_push_operations", {
      p_owner: identity.ownerId,
      p_operations: input.operations,
      p_cursor: input.cursor,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { message: "同步数据格式无效。", issues: error.issues },
        { status: 400 },
      );
    }
    return jsonError(error, "同步上传失败。");
  }
}
