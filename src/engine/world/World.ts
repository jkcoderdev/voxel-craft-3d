import type { Camera } from '@/engine/core/Camera';
import type { AABB, Frustum } from '@/engine/core/Frustum';
import type { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { Chunk, CHUNK_HEIGHT, CHUNK_SIZE } from '@/engine/world/Chunk';
import { ChunkMap } from '@/engine/world/ChunkMap';
import type { AdjacentChunks } from '@/engine/world/ChunkMeshBuilder';
import { ChunkMeshMap } from '@/engine/world/ChunkMeshMap';
import { WorldGenerator } from '@/engine/world/WorldGenerator';

export interface WorldDescriptor {
  seed: number;
  chunkRadius?: number;
  maxChunkOperationsPerUpdate?: number;
}

type ChunkOperationType = 'load' | 'unload';

interface ChunkOperation {
  type: ChunkOperationType;
  cx: number;
  cz: number;
}

interface ChunkCoordinates {
  cx: number;
  cz: number;
}

const DEFAULT_CHUNK_RADIUS = 4;
const DEFAULT_MAX_CHUNK_OPERATIONS_PER_UPDATE = 1;

function getChunkKey(cx: number, cz: number): string {
  return `${cx}:${cz}`;
}

export class World {
  private readonly chunkRadius: number;
  private readonly maxChunkOperationsPerUpdate: number;

  private readonly meshes: ChunkMeshMap;
  private readonly chunks: ChunkMap;
  private readonly generator: WorldGenerator;

  private pendingOperations: ChunkOperation[] = [];

  private currentChunkX: number | undefined;
  private currentChunkZ: number | undefined;

  constructor(gpu: WebGPUContext, descriptor: WorldDescriptor) {
    const chunkRadius = descriptor.chunkRadius ?? DEFAULT_CHUNK_RADIUS;
    const maxChunkOperationsPerUpdate =
      descriptor.maxChunkOperationsPerUpdate ?? DEFAULT_MAX_CHUNK_OPERATIONS_PER_UPDATE;

    this.chunkRadius = chunkRadius;
    this.maxChunkOperationsPerUpdate = maxChunkOperationsPerUpdate;

    this.meshes = new ChunkMeshMap(gpu);
    this.chunks = new ChunkMap();
    this.generator = new WorldGenerator(descriptor.seed);
  }

  update(camera: Camera): void {
    const chunkX = Math.floor(camera.positionX / CHUNK_SIZE);
    const chunkZ = Math.floor(camera.positionZ / CHUNK_SIZE);

    if (chunkX !== this.currentChunkX || chunkZ !== this.currentChunkZ) {
      this.currentChunkX = chunkX;
      this.currentChunkZ = chunkZ;
      this.rebuildPendingOperations();
    }

    this.processPendingOperations();
  }

  getChunkMeshes(): IterableIterator<StaticMesh> {
    return this.meshes.getAll();
  }

  /**
   * Get chunk meshes whose bounding boxes intersect the camera frustum.
   * Empty meshes (0 indices) are skipped to avoid no-op draw calls.
   *
   * @param frustum - The view frustum, already extracted from the camera's VP matrix.
   * @param result  - Pre-allocated array that will be cleared and filled with visible meshes.
   */
  getVisibleChunkMeshes(frustum: Frustum, result: StaticMesh[]): void {
    result.length = 0;

    for (const chunk of this.chunks.getAll()) {
      const minX = chunk.cx * CHUNK_SIZE;
      const minZ = chunk.cz * CHUNK_SIZE;

      const aabb: AABB = {
        minX,
        minY: 0,
        minZ,
        maxX: minX + CHUNK_SIZE,
        maxY: CHUNK_HEIGHT,
        maxZ: minZ + CHUNK_SIZE,
      };

      if (!frustum.containsAABB(aabb)) continue;

      const mesh = this.meshes.get(chunk);
      if (mesh && !mesh.isEmpty) {
        result.push(mesh);
      }
    }
  }

  getBlock(x: number, y: number, z: number): number {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);

    if (!this.chunks.has(cx, cz)) return 0;

    const chunk = this.chunks.get(cx, cz);
    const localX = x - cx * CHUNK_SIZE;
    const localY = y;
    const localZ = z - cz * CHUNK_SIZE;

    return chunk.getBlock(localX, localY, localZ);
  }

  setBlock(x: number, y: number, z: number, value: number): void {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);

    if (!this.chunks.has(cx, cz)) return;

    const chunk = this.chunks.get(cx, cz);
    const localX = x - cx * CHUNK_SIZE;
    const localY = y;
    const localZ = z - cz * CHUNK_SIZE;

    chunk.setBlock(localX, localY, localZ, value);

    // Rebuild the chunk mesh for the modified chunk
    this.meshes.build(chunk, this.getAdjacentChunks(chunk));

    // Rebuild neighbor meshes if the block is on a chunk boundary
    const needsMinusX = localX === 0;
    const needsPlusX = localX === CHUNK_SIZE - 1;
    const needsMinusZ = localZ === 0;
    const needsPlusZ = localZ === CHUNK_SIZE - 1;

    if (needsMinusX) {
      const neighbor = this.getLoadedChunk(cx - 1, cz);
      if (neighbor) this.meshes.build(neighbor, this.getAdjacentChunks(neighbor));
    }
    if (needsPlusX) {
      const neighbor = this.getLoadedChunk(cx + 1, cz);
      if (neighbor) this.meshes.build(neighbor, this.getAdjacentChunks(neighbor));
    }
    if (needsMinusZ) {
      const neighbor = this.getLoadedChunk(cx, cz - 1);
      if (neighbor) this.meshes.build(neighbor, this.getAdjacentChunks(neighbor));
    }
    if (needsPlusZ) {
      const neighbor = this.getLoadedChunk(cx, cz + 1);
      if (neighbor) this.meshes.build(neighbor, this.getAdjacentChunks(neighbor));
    }
  }

  private rebuildPendingOperations(): void {
    const currentChunkX = this.currentChunkX;
    const currentChunkZ = this.currentChunkZ;

    if (currentChunkX === undefined || currentChunkZ === undefined) return;

    const desiredChunks = this.getDesiredChunks(currentChunkX, currentChunkZ);
    const desiredChunkKeys = new Set(desiredChunks.map(({ cx, cz }) => getChunkKey(cx, cz)));
    const operations: ChunkOperation[] = [];

    for (const chunk of this.chunks.getAll()) {
      if (!desiredChunkKeys.has(getChunkKey(chunk.cx, chunk.cz))) {
        operations.push({ type: 'unload', cx: chunk.cx, cz: chunk.cz });
      }
    }

    const chunksToLoad: ChunkOperation[] = [];
    for (const coordinates of desiredChunks) {
      if (!this.chunks.has(coordinates.cx, coordinates.cz)) {
        chunksToLoad.push({ type: 'load', cx: coordinates.cx, cz: coordinates.cz });
      }
    }

    chunksToLoad.sort((left, right) => {
      const leftDistance = this.getDistanceSquared(left.cx, left.cz, currentChunkX, currentChunkZ);
      const rightDistance = this.getDistanceSquared(right.cx, right.cz, currentChunkX, currentChunkZ);
      return leftDistance - rightDistance;
    });

    operations.push(...chunksToLoad);
    this.pendingOperations = operations;
  }

  private getDesiredChunks(centerX: number, centerZ: number): ChunkCoordinates[] {
    const desiredChunks: ChunkCoordinates[] = [];
    const radiusSquared = (this.chunkRadius + 1) ** 2;

    for (let offsetZ = -this.chunkRadius; offsetZ <= this.chunkRadius; offsetZ++) {
      for (let offsetX = -this.chunkRadius; offsetX <= this.chunkRadius; offsetX++) {
        if (offsetX * offsetX + offsetZ * offsetZ >= radiusSquared) continue;

        desiredChunks.push({ cx: centerX + offsetX, cz: centerZ + offsetZ });
      }
    }

    return desiredChunks;
  }

  private getDistanceSquared(cx: number, cz: number, centerX: number, centerZ: number): number {
    const offsetX = cx - centerX;
    const offsetZ = cz - centerZ;
    return offsetX * offsetX + offsetZ * offsetZ;
  }

  private processPendingOperations(): void {
    let processedOperations = 0;

    while (processedOperations < this.maxChunkOperationsPerUpdate && this.pendingOperations.length > 0) {
      const operation = this.pendingOperations.shift();
      if (!operation) return;

      if (operation.type === 'load') {
        this.loadChunk(operation.cx, operation.cz);
      } else {
        this.unloadChunk(operation.cx, operation.cz);
      }

      processedOperations++;
    }
  }

  private loadChunk(cx: number, cz: number): void {
    if (this.chunks.has(cx, cz)) return;

    const chunk = new Chunk(cx, cz);
    chunk.generate(this.generator);

    this.chunks.set(cx, cz, chunk);
    this.meshes.build(chunk, this.getAdjacentChunks(chunk));
    this.rebuildNeighborMeshes(chunk);
  }

  private unloadChunk(cx: number, cz: number): void {
    if (!this.chunks.has(cx, cz)) return;

    const chunk = this.chunks.get(cx, cz);
    this.meshes.delete(chunk);
    this.chunks.delete(cx, cz);
    this.rebuildNeighborMeshes(chunk);
  }

  private getAdjacentChunks(chunk: Chunk): AdjacentChunks {
    return {
      minusZ: this.getLoadedChunk(chunk.cx, chunk.cz - 1),
      plusZ: this.getLoadedChunk(chunk.cx, chunk.cz + 1),
      minusX: this.getLoadedChunk(chunk.cx - 1, chunk.cz),
      plusX: this.getLoadedChunk(chunk.cx + 1, chunk.cz),
    };
  }

  private getLoadedChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.has(cx, cz) ? this.chunks.get(cx, cz) : undefined;
  }

  private rebuildNeighborMeshes(chunk: Chunk): void {
    const neighbors = [
      this.getLoadedChunk(chunk.cx, chunk.cz - 1),
      this.getLoadedChunk(chunk.cx, chunk.cz + 1),
      this.getLoadedChunk(chunk.cx - 1, chunk.cz),
      this.getLoadedChunk(chunk.cx + 1, chunk.cz),
    ];

    for (const neighbor of neighbors) {
      if (!neighbor) continue;
      this.meshes.build(neighbor, this.getAdjacentChunks(neighbor));
    }
  }
}
