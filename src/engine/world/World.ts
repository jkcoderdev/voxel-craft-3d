import type { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { Chunk } from '@/engine/world/Chunk';
import { ChunkMap } from '@/engine/world/ChunkMap';
import { ChunkMeshMap } from '@/engine/world/ChunkMeshMap';

export class World {
  private readonly meshes: ChunkMeshMap;
  private readonly chunks: ChunkMap;

  constructor(gpu: WebGPUContext) {
    this.meshes = new ChunkMeshMap(gpu);
    this.chunks = new ChunkMap();

    const chunk = new Chunk(0, 0);
    chunk.generate();
    this.meshes.build(chunk);
  }

  getChunkMeshes(): IterableIterator<StaticMesh> {
    return this.meshes.getAll();
  }
}
