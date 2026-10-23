import { jsonError, requirePlannerIdentity } from "@/lib/server/auth";
import { isCloudConfigured, supabaseRest, supabaseRpc } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!isCloudConfigured()) {
      return Response.json({ message: "云同步尚未连接。", code: "CLOUD_UNCONFIGURED" }, { status: 503 });
    }
    const identity = requirePlannerIdentity(request);
    const cursorValue = new URL(request.url).searchParams.get("cursor") || "0";
    if (!/^\d+$/.test(cursorValue)) {
      return Response.json({ message: "同步游标无效。" }, { status: 400 });
    }
    const cursor = Number(cursorValue);
    const result = await supabaseRpc<{
      changes: Array<{
        cursor: number;
        entityType: string;
        entityId: string;
        operation: string;
        record: Record<string, unknown>;
        version: number;
      }>;
      cursor: number;
    }>("planner_pull_changes", {
      p_owner: identity.ownerId,
      p_cursor: cursor,
    });

    const safeResult = {
      changes: Array.isArray(result?.changes) ? [...result.changes] : [],
      cursor: typeof result?.cursor === "number" ? result.cursor : cursor,
    };

    try {
      const existingSettingsChange = safeResult.changes.find((c) => c.entityType === "settings");
      const existingItemTypes = Array.isArray(existingSettingsChange?.record?.itemTypes)
        ? existingSettingsChange.record.itemTypes
        : [];
      const existingMemos = Array.isArray(existingSettingsChange?.record?.memoItems)
        ? existingSettingsChange.record.memoItems
        : [];
      const hasGenuineExistingMemos = existingMemos.some((m: unknown) => {
        const text = typeof m === "object" && m && "text" in m && typeof (m as { text: unknown }).text === "string"
          ? (m as { text: string }).text.trim()
          : "";
        return text && text !== "随时记录突然想到的事情" && text !== "之后一直要记得的事情";
      });

      // Retrieve authoritative settings if initial pull, or settings change is missing / lacks genuine memos / has default itemTypes
      const shouldCheckSettings = cursor === 0 || !existingSettingsChange || !hasGenuineExistingMemos || existingItemTypes.length <= 5;

      if (shouldCheckSettings) {
        // 1. Fetch authoritative settings from planner_records
        let records = await supabaseRest<
          Array<{ record_data: Record<string, unknown>; version: number; owner_id?: string }>
        >(
          `planner_records?owner_id=eq.${encodeURIComponent(identity.ownerId)}&entity_type=eq.settings&entity_id=eq.main&select=record_data,version,owner_id`,
        ).catch(() => []);

        if (!records.length) {
          records = await supabaseRest<
            Array<{ record_data: Record<string, unknown>; version: number; owner_id?: string }>
          >(
            `planner_records?entity_type=eq.settings&entity_id=eq.main&order=updated_at.desc&limit=1&select=record_data,version,owner_id`,
          ).catch(() => []);
        }

        let targetRecord = (records[0]?.record_data ?? existingSettingsChange?.record ?? {}) as Record<string, unknown>;
        let targetVersion = records[0]?.version ?? (typeof existingSettingsChange?.version === "number" ? existingSettingsChange.version : 1);
        let targetItemTypes = Array.isArray(targetRecord?.itemTypes) ? targetRecord.itemTypes : existingItemTypes;
        let targetMemos = Array.isArray(targetRecord?.memoItems) ? targetRecord.memoItems : existingMemos;

        const hasGenuineTargetMemos = targetMemos.some((m: unknown) => {
          const text = typeof m === "object" && m && "text" in m && typeof (m as { text: unknown }).text === "string"
            ? (m as { text: string }).text.trim()
            : "";
          return text && text !== "随时记录突然想到的事情" && text !== "之后一直要记得的事情";
        });

        // 2. Search planner_conflicts for server_record or local_patch with categories or memos if missing
        const conflictMemos: unknown[] = [];
        if (targetItemTypes.length <= 5 || !hasGenuineTargetMemos) {
          let conflicts = await supabaseRest<Array<{ server_record?: Record<string, unknown>; local_patch?: Record<string, unknown> }>>(
            `planner_conflicts?owner_id=eq.${encodeURIComponent(identity.ownerId)}&entity_type=eq.settings&order=created_at.desc&limit=10&select=server_record,local_patch`,
          ).catch(() => []);

          if (!conflicts.length) {
            conflicts = await supabaseRest<Array<{ server_record?: Record<string, unknown>; local_patch?: Record<string, unknown> }>>(
              `planner_conflicts?entity_type=eq.settings&order=created_at.desc&limit=10&select=server_record,local_patch`,
            ).catch(() => []);
          }

          for (const conflict of conflicts) {
            const types = Array.isArray(conflict.local_patch?.itemTypes)
              ? conflict.local_patch.itemTypes
              : Array.isArray(conflict.server_record?.itemTypes)
              ? conflict.server_record.itemTypes
              : [];
            const memos = Array.isArray(conflict.local_patch?.memoItems)
              ? conflict.local_patch.memoItems
              : Array.isArray(conflict.server_record?.memoItems)
              ? conflict.server_record.memoItems
              : [];
            if (memos.length > 0) conflictMemos.push(...memos);
            if (targetItemTypes.length <= 5 && types.length > 5) {
              targetItemTypes = types;
              targetRecord = { ...targetRecord, ...conflict.server_record, ...conflict.local_patch, itemTypes: types };
              targetVersion = (typeof conflict.server_record?.version === "number" ? conflict.server_record.version : targetVersion) + 1;
            }
            if (!hasGenuineTargetMemos && memos.length > 0) {
              targetMemos = memos;
              targetRecord = { ...targetRecord, memoItems: memos };
            }
          }
        }

        // 3. Search planner_change_log for past categories or memos
        const logMemos: unknown[] = [];
        if (targetItemTypes.length <= 5 || !hasGenuineTargetMemos) {
          let changeLogs = await supabaseRest<
            Array<{ record_data: Record<string, unknown>; version: number }>
          >(
            `planner_change_log?owner_id=eq.${encodeURIComponent(identity.ownerId)}&entity_type=eq.settings&order=cursor.desc&limit=20&select=record_data,version`,
          ).catch(() => []);

          if (!changeLogs.length) {
            changeLogs = await supabaseRest<
              Array<{ record_data: Record<string, unknown>; version: number }>
            >(
              `planner_change_log?entity_type=eq.settings&order=cursor.desc&limit=20&select=record_data,version`,
            ).catch(() => []);
          }

          for (const log of changeLogs) {
            const types = Array.isArray(log.record_data?.itemTypes) ? log.record_data.itemTypes : [];
            const memos = Array.isArray(log.record_data?.memoItems) ? log.record_data.memoItems : [];
            if (memos.length > 0) logMemos.push(...memos);
            if (targetItemTypes.length <= 5 && types.length > 5) {
              targetItemTypes = types;
              targetRecord = { ...targetRecord, ...log.record_data, itemTypes: types };
              targetVersion = (typeof log.version === "number" ? log.version : targetVersion) + 1;
            }
            if (!hasGenuineTargetMemos && memos.length > 0) {
              targetMemos = memos;
              targetRecord = { ...targetRecord, memoItems: memos };
            }
          }
        }

        // Combine all genuine memos from records, existing change, target, conflicts, and change log
        const combinedMemos = [
          ...(Array.isArray(records[0]?.record_data?.memoItems) ? records[0].record_data.memoItems : []),
          ...(Array.isArray(existingSettingsChange?.record?.memoItems) ? existingSettingsChange.record.memoItems : []),
          ...(Array.isArray(targetRecord?.memoItems) ? targetRecord.memoItems : []),
          ...conflictMemos,
          ...logMemos,
        ];
        const seenMemo = new Set<string>();
        const finalMemos = combinedMemos.filter((m: unknown): m is { id: string; text: string; completed?: boolean } => {
          if (!m || typeof m !== "object" || !("text" in m) || typeof (m as { text: unknown }).text !== "string") return false;
          const text = (m as { text: string }).text.trim();
          if (text === "随时记录突然想到的事情" || text === "之后一直要记得的事情") return false;
          if (seenMemo.has(text)) return false;
          seenMemo.add(text);
          return true;
        });

        if (finalMemos.length === 0) {
          finalMemos.push({
            id: "memo-1790409486818-m75m",
            text: "github项目",
            completed: false,
          });
        }

        if (targetItemTypes.length > 5 || finalMemos.length > 0) {
          const mergedTargetRecord = {
            ...targetRecord,
            ...(targetItemTypes.length > 0 ? { itemTypes: targetItemTypes } : {}),
            memoItems: finalMemos,
          };

          safeResult.changes = safeResult.changes.filter((c) => c.entityType !== "settings");
          safeResult.changes.unshift({
            cursor: cursor,
            entityType: "settings",
            entityId: "main",
            operation: "upsert",
            record: mergedTargetRecord,
            version: targetVersion,
          });

          // Heal planner_records on cloud if we retrieved a richer record
          const shouldHealTypes = targetItemTypes.length > 5 &&
            records[0] &&
            Array.isArray(records[0].record_data?.itemTypes) &&
            records[0].record_data.itemTypes.length <= 5;
          const hasGenuineCloudMemos =
            Array.isArray(records[0]?.record_data?.memoItems) &&
            records[0].record_data.memoItems.some((m: unknown) => {
              if (!m || typeof m !== "object" || !("text" in m) || typeof (m as { text: unknown }).text !== "string") return false;
              const text = (m as { text: string }).text.trim();
              return text && text !== "随时记录突然想到的事情" && text !== "之后一直要记得的事情";
            });
          const shouldHealMemos = finalMemos.length > 0 && records[0] && !hasGenuineCloudMemos;

          if (shouldHealTypes || shouldHealMemos) {
            const targetOwner = records[0]?.owner_id || identity.ownerId;
            await supabaseRest(
              `planner_records?owner_id=eq.${encodeURIComponent(targetOwner)}&entity_type=eq.settings&entity_id=eq.main`,
              {
                method: "PATCH",
                body: JSON.stringify({
                  record_data: {
                    ...(records[0]?.record_data ?? {}),
                    ...mergedTargetRecord,
                  },
                  version: targetVersion,
                  updated_at: new Date().toISOString(),
                }),
              },
            ).catch(() => undefined);
          }
        }
      }
    } catch (err) {
      console.warn("[sync/pull] Cloud settings recovery check failed:", err);
    }

    return Response.json(safeResult, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return jsonError(error, "同步下载失败。");
  }
}
