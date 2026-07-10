import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';

export interface TextureDescriptor {
  label?: string;
  width?: number;
  height?: number;
  usage: GPUTextureUsageFlags;
  format: GPUTextureFormat;
}

export class ResizableTexture {
  private _texture: GPUTexture;
  private _view: GPUTextureView;

  private readonly textureDescriptor: GPUTextureDescriptor & { size: [number, number] };
  private readonly viewDescriptor: GPUTextureViewDescriptor;

  constructor(
    private readonly gpu: WebGPUContext,
    descriptor: TextureDescriptor,
  ) {
    const label = descriptor.label ?? 'Texture';
    const width = descriptor.width ?? 1;
    const height = descriptor.height ?? 1;

    this.textureDescriptor = {
      label,

      size: [width, height],
      usage: descriptor.usage,
      format: descriptor.format,
    };

    this.viewDescriptor = {
      label: `${label} View`,
    };

    this._texture = this.gpu.device.createTexture(this.textureDescriptor);
    this._view = this._texture.createView(this.viewDescriptor);
  }

  get format(): GPUTextureFormat {
    return this.textureDescriptor.format;
  }

  get texture(): GPUTexture {
    return this._texture;
  }

  get view(): GPUTextureView {
    return this._view;
  }

  resize(width: number, height: number): void {
    if (this.textureDescriptor.size[0] !== width || this.textureDescriptor.size[1] !== height) {
      this._texture.destroy();

      this.textureDescriptor.size = [width, height];

      this._texture = this.gpu.device.createTexture(this.textureDescriptor);
      this._view = this._texture.createView(this.viewDescriptor);
    }
  }

  destroy(): void {
    this._texture.destroy();
  }
}
