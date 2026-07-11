import type { Camera } from '@/engine/core/Camera';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';

export class SharedUniforms {
  private readonly array: Float32Array;
  private readonly buffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly bindGroupLayout: GPUBindGroupLayout;

  constructor(private readonly gpu: WebGPUContext) {
    this.buffer = gpu.device.createBuffer({
      label: 'Shared Uniform Buffer',
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.array = new Float32Array(17);

    this.bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'Shared Bind Group Layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'Shared Bind Group',
      layout: this.bindGroupLayout,
      entries: [{ binding: 0, resource: this.buffer }],
    });
  }

  update(camera: Camera, timestamp: number): void {
    const viewProjectionMatrix = camera.viewProjectionMatrix;

    this.array.set(viewProjectionMatrix, 0);
    this.array[16] = timestamp / 1000;

    this.gpu.queue.writeBuffer(this.buffer, 0, this.array.buffer, this.array.byteOffset, this.array.byteLength);
  }

  getSharedBindGroup(): GPUBindGroup {
    return this.bindGroup;
  }

  getSharedBindGroupLayout(): GPUBindGroupLayout {
    return this.bindGroupLayout;
  }

  getSharedUniformBuffer(): GPUBuffer {
    return this.buffer;
  }
}
