import type { Camera } from '@/engine/core/Camera';
import type { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { Chunk } from '@/engine/world/Chunk';
import { ChunkMap } from '@/engine/world/ChunkMap';
import type { AdjacentChunks } from '@/engine/world/ChunkMeshBuilder';
import { ChunkMeshMap } from '@/engine/world/ChunkMeshMap';

export interface WorldDescriptor {
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

const CHUNK_SIZE = 16;
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
  private pendingOperations: ChunkOperation[] = [];

  private currentChunkX: number | undefined;
  private currentChunkZ: number | undefined;

  constructor(gpu: WebGPUContext, descriptor: WorldDescriptor = {}) {
    const chunkRadius = descriptor.chunkRadius ?? DEFAULT_CHUNK_RADIUS;
    const maxChunkOperationsPerUpdate =
      descriptor.maxChunkOperationsPerUpdate ?? DEFAULT_MAX_CHUNK_OPERATIONS_PER_UPDATE;

    this.chunkRadius = chunkRadius;
    this.maxChunkOperationsPerUpdate = maxChunkOperationsPerUpdate;

    this.meshes = new ChunkMeshMap(gpu);
    this.chunks = new ChunkMap();
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
    chunk.generate();

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
