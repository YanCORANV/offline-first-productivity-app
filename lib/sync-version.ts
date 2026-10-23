export function shouldApplyCloudRecord(
  current: unknown,
  incoming: unknown,
): boolean {
  const currentVersion = (current as { version?: unknown } | null)?.version;
  const incomingVersion = (incoming as { version?: unknown } | null)?.version;

  return (
    typeof currentVersion !== "number" ||
    typeof incomingVersion !== "number" ||
    incomingVersion >= currentVersion
  );
}
