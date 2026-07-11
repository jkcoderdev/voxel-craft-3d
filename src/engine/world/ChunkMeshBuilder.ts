import type { Chunk } from '@/engine/world/Chunk';
import { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';

export interface AdjacentChunks {
  /** The chunk at (cx, cz - 1). */
  minusZ?: Chunk;
  /** The chunk at (cx, cz + 1). */
  plusZ?: Chunk;
  /** The chunk at (cx - 1, cz). */
  minusX?: Chunk;
  /** The chunk at (cx + 1, cz). */
  plusX?: Chunk;
}

export type FaceCorner = [number, number, number];
export type Normal = [number, number, number];

export interface Face {
  corners: FaceCorner[];
  normal: Normal;
}

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 256;

const CUBE_FACES: Face[] = [
  // Front face (z = 1)
  {
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    normal: [0, 0, 1],
  },

  // Back face (z = -1)
  {
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    normal: [0, 0, -1],
  },

  // Top face (y = 1)
  {
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    normal: [0, 1, 0],
  },

  // Bottom face (y = -1)
  {
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    normal: [0, -1, 0],
  },

  // Right face (x = 1)
  {
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    normal: [1, 0, 0],
  },

  // Left face (x = -1)
  {
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    normal: [-1, 0, 0],
  },
];

export class ChunkMeshBuilder {
  constructor(private readonly gpu: WebGPUContext) {}

  build(chunk: Chunk, adjacentChunks: AdjacentChunks = {}): StaticMesh {
    const vertices = [];
    const indices = [];

    let indexOffset = 0;

    const offsetX = chunk.cx * CHUNK_SIZE;
    const offsetZ = chunk.cz * CHUNK_SIZE;

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const block = chunk.getBlock(x, y, z);

          for (const face of CUBE_FACES) {
            const normal = face.normal;
            const adjacentBlock = this.getAdjacentBlock(chunk, adjacentChunks, x, y, z, normal);

            if (block === 0 || adjacentBlock !== 0) continue;

            for (const corner of face.corners) {
              vertices.push(corner[0] + x + offsetX, corner[1] + y, corner[2] + z + offsetZ, ...normal);
            }

            indices.push(indexOffset, indexOffset + 1, indexOffset + 2, indexOffset, indexOffset + 2, indexOffset + 3);

            indexOffset += 4;
          }
        }
      }
    }

    return new StaticMesh(this.gpu, {
      label: `Chunk (${chunk.cx}:${chunk.cz}) Mesh`,
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
    });
  }

  private getAdjacentBlock(
    chunk: Chunk,
    adjacentChunks: AdjacentChunks,
    x: number,
    y: number,
    z: number,
    normal: number[],
  ): number {
    const adjacentX = x + normal[0];
    const adjacentY = y + normal[1];
    const adjacentZ = z + normal[2];

    if (
      adjacentX >= 0 &&
      adjacentX < CHUNK_SIZE &&
      adjacentY >= 0 &&
      adjacentY < CHUNK_HEIGHT &&
      adjacentZ >= 0 &&
      adjacentZ < CHUNK_SIZE
    ) {
      return chunk.getBlock(adjacentX, adjacentY, adjacentZ);
    }

    if (adjacentY < 0 || adjacentY >= CHUNK_HEIGHT) return 0;

    if (adjacentX < 0) {
      return adjacentChunks.minusX?.getBlock(CHUNK_SIZE - 1, adjacentY, adjacentZ) ?? 0;
    }

    if (adjacentX >= CHUNK_SIZE) {
      return adjacentChunks.plusX?.getBlock(0, adjacentY, adjacentZ) ?? 0;
    }

    if (adjacentZ < 0) {
      return adjacentChunks.minusZ?.getBlock(adjacentX, adjacentY, CHUNK_SIZE - 1) ?? 0;
    }

    if (adjacentZ >= CHUNK_SIZE) {
      return adjacentChunks.plusZ?.getBlock(adjacentX, adjacentY, 0) ?? 0;
    }

    return 0;
  }
}
