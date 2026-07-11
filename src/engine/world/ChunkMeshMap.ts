import type { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import type { Chunk } from '@/engine/world/Chunk';
import { ChunkMeshBuilder, type AdjacentChunks } from '@/engine/world/ChunkMeshBuilder';

export class ChunkMeshMap {
  private readonly meshes: Map<Chunk, StaticMesh> = new Map();
  private readonly builder: ChunkMeshBuilder;

  constructor(gpu: WebGPUContext) {
    this.builder = new ChunkMeshBuilder(gpu);
  }

  build(chunk: Chunk, adjacentChunks: AdjacentChunks = {}): StaticMesh {
    const oldMesh = this.meshes.get(chunk);
    oldMesh?.destroy();

    const mesh = this.builder.build(chunk, adjacentChunks);
    this.meshes.set(chunk, mesh);

    return mesh;
  }

  getAll(): IterableIterator<StaticMesh> {
    return this.meshes.values();
  }

  delete(chunk: Chunk): boolean {
    const mesh = this.meshes.get(chunk);
    mesh?.destroy();

    return this.meshes.delete(chunk);
  }

  clear(): void {
    for (const mesh of this.meshes.values()) {
      mesh.destroy();
    }

    this.meshes.clear();
  }
}
