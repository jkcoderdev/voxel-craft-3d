import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { ChunkMap } from '@/engine/world/ChunkMap';
import { ChunkMeshMap } from '@/engine/world/ChunkMeshMap';

export class World {
  private readonly meshes: ChunkMeshMap;
  private readonly chunks: ChunkMap;

  constructor(gpu: WebGPUContext) {
    this.meshes = new ChunkMeshMap(gpu);
    this.chunks = new ChunkMap();
  }
}
