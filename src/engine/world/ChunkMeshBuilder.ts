import type { Chunk } from '@/engine/world/Chunk';
import { StaticMesh } from '@/webgpu/StaticMesh';
import type { WebGPUContext } from '@/webgpu/WebGPUContext';
import { mat4, vec3 } from 'wgpu-matrix';

const CUBE_FACES = [
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

  build(chunk: Chunk): StaticMesh {
    const vertices = [];
    const indices = [];

    let indexOffset = 0;

    for (let y = 0; y < 256; y++) {
      for (let z = 0; z < 16; z++) {
        for (let x = 0; x < 16; x++) {
          const block = chunk.getBlock(x, y, z);

          for (const face of CUBE_FACES) {
            const normal = face.normal;

            const adjacentX = x + normal[0];
            const adjacentY = y + normal[1];
            const adjacentZ = z + normal[2];

            let adjacentBlock = 0;
            if (
              adjacentX >= 0 &&
              adjacentX < 16 &&
              adjacentY >= 0 &&
              adjacentY < 256 &&
              adjacentZ >= 0 &&
              adjacentZ < 16
            ) {
              adjacentBlock = chunk.getBlock(adjacentX, adjacentY, adjacentZ);
            }

            if (block === 0 || adjacentBlock !== 0) continue;

            for (const corner of face.corners) {
              vertices.push(corner[0] + x, corner[1] + y, corner[2] + z, ...normal);
            }

            indices.push(indexOffset, indexOffset + 1, indexOffset + 2, indexOffset, indexOffset + 2, indexOffset + 3);

            indexOffset += 4;
          }
        }
      }
    }

    return new StaticMesh(
      this.gpu,
      new Float32Array(vertices),
      new Uint32Array(indices),
      mat4.translation(vec3.create(chunk.cx * 16, 0, chunk.cz * 16)),
    );
  }
}
