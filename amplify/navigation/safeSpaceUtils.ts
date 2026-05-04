import type { SafeSpace, SafeSpaceType } from "./safeSpaces";

export function getOrderedUniqueStopIds(
  stopSafeSpaceIds?: number[],
  stopSafeSpaceId?: number,
): number[] {
  const selectedStopIds =
    Array.isArray(stopSafeSpaceIds) && stopSafeSpaceIds.length > 0
      ? stopSafeSpaceIds
      : stopSafeSpaceId !== undefined
        ? [stopSafeSpaceId]
        : [];

  return Array.from(new Set(selectedStopIds));
}

export function filterSafeSpacesByTypes(
  safeSpaces: SafeSpace[],
  safeSpaceTypes?: SafeSpaceType[],
): SafeSpace[] {
  if (!safeSpaceTypes || safeSpaceTypes.length === 0) {
    return safeSpaces;
  }

  return safeSpaces.filter((safeSpace) =>
    safeSpaceTypes.includes(safeSpace.type),
  );
}