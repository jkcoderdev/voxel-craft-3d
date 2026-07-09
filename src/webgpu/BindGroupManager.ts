import type { WebGPUContext } from '@/webgpu/WebGPUContext';

export interface UniformConfig {
  type: 'uniform';
  buffer: GPUBuffer;
  offset?: number;
  size?: number;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

export interface StorageConfig {
  type: 'storage';
  buffer: GPUBuffer;
  offset?: number;
  size?: number;
  readOnly?: boolean;
  hasDynamicOffset?: boolean;
  minBindingSize?: number;
}

export interface TextureConfig {
  type: 'texture';
  view: GPUTextureView;
  sampleType?: GPUTextureSampleType;
  viewDimension?: GPUTextureViewDimension;
  multisampled?: boolean;
}

export interface SamplerConfig {
  type: 'sampler';
  sampler: GPUSampler;
  samplerType?: GPUSamplerBindingType;
}

export interface ExternalTextureConfig {
  type: 'externalTexture';
  texture: GPUExternalTexture;
}

export type BindingConfig = UniformConfig | StorageConfig | TextureConfig | SamplerConfig | ExternalTextureConfig;

export interface BindGroupEntry {
  binding: number;
  visibility: GPUShaderStageFlags;
  config: BindingConfig;
}

export interface BindGroupDescriptor {
  label?: string;
  entries: BindGroupEntry[];
}

export interface BindGroupObject {
  bindGroupLayout: GPUBindGroupLayout;
  bindGroup: GPUBindGroup;
}

export class BindGroupManager {
  private readonly bindGroups: Map<string, BindGroupObject> = new Map();

  constructor(private readonly gpu: WebGPUContext) {}

  create(key: string, descriptor: BindGroupDescriptor): BindGroupObject {
    if (this.bindGroups.has(key)) {
      throw new Error(`A bind group "${key}" already exists`);
    }

    const label = descriptor.label ?? 'Bind Group';

    const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = [];
    const bindGroupEntries: GPUBindGroupEntry[] = [];

    for (const entry of descriptor.entries) {
      const bindGroupLayoutEntry = this.buildBindGroupLayoutEntry(entry);
      const bindGroupEntry = this.buildBindGroupEntry(entry);

      bindGroupLayoutEntries.push(bindGroupLayoutEntry);
      bindGroupEntries.push(bindGroupEntry);
    }

    const bindGroupLayout = this.gpu.device.createBindGroupLayout({
      label: `${label} Layout`,
      entries: bindGroupLayoutEntries,
    });

    const bindGroup = this.gpu.device.createBindGroup({
      label,
      layout: bindGroupLayout,
      entries: bindGroupEntries,
    });

    const bindGroupObject: BindGroupObject = { bindGroupLayout, bindGroup };
    this.bindGroups.set(key, bindGroupObject);

    return bindGroupObject;
  }

  private buildBindGroupLayoutEntry(entry: BindGroupEntry): GPUBindGroupLayoutEntry {
    const { binding, visibility, config } = entry;

    switch (config.type) {
      case 'uniform': {
        const buffer: GPUBufferBindingLayout = { type: 'uniform' };

        if (config.hasDynamicOffset !== undefined) {
          buffer.hasDynamicOffset = config.hasDynamicOffset;
        }

        if (config.minBindingSize !== undefined) {
          buffer.minBindingSize = config.minBindingSize;
        }

        return { binding, visibility, buffer };
      }

      case 'storage': {
        const buffer: GPUBufferBindingLayout = {
          type: config.readOnly ? 'read-only-storage' : 'storage',
        };

        if (config.hasDynamicOffset !== undefined) {
          buffer.hasDynamicOffset = config.hasDynamicOffset;
        }

        if (config.minBindingSize !== undefined) {
          buffer.minBindingSize = config.minBindingSize;
        }

        return { binding, visibility, buffer };
      }

      case 'texture': {
        const texture: GPUTextureBindingLayout = {
          sampleType: config.sampleType ?? 'float',
          viewDimension: config.viewDimension ?? '2d',
          multisampled: config.multisampled ?? false,
        };

        return { binding, visibility, texture };
      }

      case 'sampler': {
        const sampler: GPUSamplerBindingLayout = {
          type: config.samplerType ?? 'filtering',
        };

        return { binding, visibility, sampler };
      }

      case 'externalTexture': {
        return { binding, visibility, externalTexture: {} };
      }
    }
  }

  private buildBindGroupEntry(entry: BindGroupEntry): GPUBindGroupEntry {
    const { binding, config } = entry;

    switch (config.type) {
      case 'uniform':
      case 'storage':
        return {
          binding,
          resource: {
            buffer: config.buffer,
            offset: config.offset ?? 0,
            size: config.size,
          } satisfies GPUBufferBinding,
        };

      case 'texture':
        return {
          binding,
          resource: config.view,
        };

      case 'sampler':
        return {
          binding,
          resource: config.sampler,
        };

      case 'externalTexture':
        return {
          binding,
          resource: config.texture,
        };
    }
  }

  getBindGroup(key: string): GPUBindGroup {
    const bindGroupObject = this.bindGroups.get(key);

    if (!bindGroupObject) {
      throw new Error(`Bind group "${key} doesn't exist`);
    }

    return bindGroupObject.bindGroup;
  }

  getBindGroupLayout(key: string): GPUBindGroupLayout {
    const bindGroupObject = this.bindGroups.get(key);

    if (!bindGroupObject) {
      throw new Error(`Bind group "${key} doesn't exist`);
    }

    return bindGroupObject.bindGroupLayout;
  }
}
