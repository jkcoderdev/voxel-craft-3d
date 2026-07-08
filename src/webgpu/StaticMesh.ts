import type { WebGPUContext } from '@/webgpu/WebGPUContext';
import type { Mat4 } from 'wgpu-matrix';

export class StaticMesh {
  public readonly vertexBuffer: GPUBuffer;
  public readonly indexBuffer: GPUBuffer;
  public readonly indexCount: number;
  public readonly indexFormat: GPUIndexFormat;

  constructor(gpu: WebGPUContext, vertices: Float32Array, indices: Uint32Array | Uint16Array) {
    this.vertexBuffer = gpu.device.createBuffer({
      label: 'Mesh Vertex Buffer',
      size: Math.max(vertices.byteLength, 4),
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = gpu.device.createBuffer({
      label: 'Mesh Index Buffer',
      size: Math.max(indices.byteLength, 4),
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    gpu.queue.writeBuffer(this.vertexBuffer, 0, vertices);
    gpu.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.indexCount = indices.length;
    this.indexFormat = indices instanceof Uint16Array ? 'uint16' : 'uint32';
  }

  get isEmpty(): boolean {
    return this.indexCount === 0;
  }

  destroy(): void {
    this.vertexBuffer.destroy();
    this.indexBuffer.destroy();
  }
}
