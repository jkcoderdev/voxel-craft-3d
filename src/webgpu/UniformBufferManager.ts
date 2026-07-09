import type { WebGPUContext } from '@/webgpu/WebGPUContext';

export interface UniformBufferDescriptor {
  label?: string;
  size: number;
  usage?: GPUBufferUsageFlags;
}

export class UniformBufferManager {
  private readonly buffers: Map<string, GPUBuffer> = new Map();

  constructor(private readonly gpu: WebGPUContext) {}

  create(key: string, descriptor: UniformBufferDescriptor): GPUBuffer {
    const buffer = this.gpu.device.createBuffer({
      label: descriptor.label ?? 'Uniform Buffer',
      size: descriptor.size,
      usage: descriptor.usage ?? GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.buffers.set(key, buffer);

    return buffer;
  }

  get(key: string): GPUBuffer {
    const buffer = this.buffers.get(key);

    if (!buffer) {
      throw new Error(`Uniform buffer "${key}" doesn't exist`);
    }

    return buffer;
  }
}
