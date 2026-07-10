export class WebGPUContext {
  public readonly adapter: GPUAdapter;
  public readonly device: GPUDevice;
  public readonly preferredCanvasFormat: GPUTextureFormat;

  private constructor(adapter: GPUAdapter, device: GPUDevice, format: GPUTextureFormat) {
    this.adapter = adapter;
    this.device = device;
    this.preferredCanvasFormat = format;
  }

  static async create(): Promise<WebGPUContext> {
    if (!navigator.gpu) {
      throw new Error(
        'WebGPU is not supported in this browser. ' +
          'Please use a recent version of Chrome, Edge, or Firefox with WebGPU enabled.',
      );
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error(
        'No compatible GPU adapter found. ' +
          'Ensure your device has a supported GPU and that hardware acceleration is enabled.',
      );
    }

    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();

    return new WebGPUContext(adapter, device, format);
  }

  get queue(): GPUQueue {
    return this.device.queue;
  }

  destroy(): void {
    this.device.destroy();
  }
}
