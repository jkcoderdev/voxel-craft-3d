export interface DepthTextureDescriptor {
  label?: string;
  format: GPUTextureFormat;
  usage: GPUTextureUsageFlags;

  width?: number;
  height?: number;
}

function assertTextureSize(width: number, height: number) {
  if (width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('Depth texture dimensions must be positive integers');
  }
}

export class DepthTexture {
  private _texture: GPUTexture;
  private _view: GPUTextureView;

  private readonly textureDescriptor: GPUTextureDescriptor & { size: [number, number] };
  private readonly viewDescriptor: GPUTextureViewDescriptor;

  constructor(
    private readonly device: GPUDevice,
    descriptor: DepthTextureDescriptor,
  ) {
    const width = descriptor.width ?? 1;
    const height = descriptor.height ?? 1;

    assertTextureSize(width, height);

    const label = descriptor.label ?? 'Depth Texture';

    this.textureDescriptor = {
      size: [width, height],
      usage: descriptor.usage,
      format: descriptor.format,
      label,
    };

    this.viewDescriptor = {
      label: `${label} View`,
    };

    this._texture = this.device.createTexture(this.textureDescriptor);
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
    assertTextureSize(width, height);

    if (this.textureDescriptor.size[0] !== width || this.textureDescriptor.size[1] !== height) {
      this._texture.destroy();

      this.textureDescriptor.size = [width, height];

      this._texture = this.device.createTexture(this.textureDescriptor);
      this._view = this._texture.createView(this.viewDescriptor);
    }
  }

  destroy(): void {
    this._texture.destroy();
  }
}
