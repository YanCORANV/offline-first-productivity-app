import "server-only";

export interface PlannerIdentity {
  ownerId: string;
  email: string | null;
}

const OWNER_HEADERS = [
  "oai-authenticated-user-email",
  "oai-authenticated-user-id",
  "x-openai-authenticated-user-id",
  "cf-access-authenticated-user-email",
] as const;

export function requirePlannerIdentity(request: Request): PlannerIdentity {
  for (const header of OWNER_HEADERS) {
    const value = request.headers.get(header)?.trim();
    if (value) {
      return {
        ownerId: value.toLowerCase(),
        email: request.headers.get("oai-authenticated-user-email")?.trim() || null,
      };
    }
  }
  const customOwner = request.headers.get("x-planner-owner")?.trim();
  if (customOwner) {
    return { ownerId: customOwner.toLowerCase(), email: null };
  }

  if (process.env.PLANNER_OWNER_ID) {
    return {
      ownerId: process.env.PLANNER_OWNER_ID.trim().toLowerCase(),
      email: process.env.OWNER_EMAIL?.trim() || null,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return { ownerId: "local-owner", email: null };
  }

  // Default single-user owner for standalone deployments without OAuth gateway
  return {
    ownerId: (process.env.OWNER_EMAIL || "demo-owner").toLowerCase(),
    email: process.env.OWNER_EMAIL?.trim() || null,
  };
}

export function jsonError(error: unknown, fallback = "请求处理失败。"): Response {
  if (error instanceof Response) {
    const contentType = error.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return error;
    }
  }
  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ message }, { status: 500 });
}
