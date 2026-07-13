export interface RaycastHit {
  blockX: number;
  blockY: number;
  blockZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
}

const MAX_DISTANCE = 8;

/**
 * Performs voxel ray traversal using the DDA (Digital Differential Analyzer)
 * algorithm. Returns the first solid block hit, along with the face normal
 * indicating which side was entered through.
 */
export function raycast(
  getBlock: (x: number, y: number, z: number) => number,
  originX: number,
  originY: number,
  originZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
): RaycastHit | null {
  // Current voxel coordinates
  let x = Math.floor(originX);
  let y = Math.floor(originY);
  let z = Math.floor(originZ);

  // Step direction (+1 or -1)
  const stepX = dirX > 0 ? 1 : dirX < 0 ? -1 : 0;
  const stepY = dirY > 0 ? 1 : dirY < 0 ? -1 : 0;
  const stepZ = dirZ > 0 ? 1 : dirZ < 0 ? -1 : 0;

  // tDelta: how far along the ray (in t) to move one full voxel in each axis
  const tDeltaX = dirX !== 0 ? Math.abs(1 / dirX) : Infinity;
  const tDeltaY = dirY !== 0 ? Math.abs(1 / dirY) : Infinity;
  const tDeltaZ = dirZ !== 0 ? Math.abs(1 / dirZ) : Infinity;

  // tMax: how far along the ray to reach the next voxel boundary in each axis
  let tMaxX = dirX > 0 ? (x + 1 - originX) / dirX : dirX < 0 ? (x - originX) / dirX : Infinity;
  let tMaxY = dirY > 0 ? (y + 1 - originY) / dirY : dirY < 0 ? (y - originY) / dirY : Infinity;
  let tMaxZ = dirZ > 0 ? (z + 1 - originZ) / dirZ : dirZ < 0 ? (z - originZ) / dirZ : Infinity;

  // Track which face was entered through (normal of the face)
  let normalX = 0;
  let normalY = 0;
  let normalZ = 0;

  let distance = 0;

  while (distance <= MAX_DISTANCE) {
    // Check if the current voxel is solid
    if (getBlock(x, y, z) !== 0) {
      return { blockX: x, blockY: y, blockZ: z, normalX, normalY, normalZ };
    }

    // Step to the next voxel along the axis with the smallest tMax
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      distance = tMaxX;
      tMaxX += tDeltaX;
      normalX = -stepX;
      normalY = 0;
      normalZ = 0;
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      distance = tMaxY;
      tMaxY += tDeltaY;
      normalX = 0;
      normalY = -stepY;
      normalZ = 0;
    } else {
      z += stepZ;
      distance = tMaxZ;
      tMaxZ += tDeltaZ;
      normalX = 0;
      normalY = 0;
      normalZ = -stepZ;
    }
  }

  return null;
}
