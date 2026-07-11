import type { Camera } from '@/engine/core/Camera';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';

export class SharedUniforms {
  private readonly stateArray: Float32Array;
  private readonly cameraUniformBuffer: GPUBuffer;
  private readonly stateUniformBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly bindGroupLayout: GPUBindGroupLayout;

  constructor(private readonly gpu: WebGPUContext) {
    this.cameraUniformBuffer = gpu.device.createBuffer({
      label: 'Camera Uniform Buffer',
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.stateUniformBuffer = gpu.device.createBuffer({
      label: 'State Uniform Buffer',
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.stateArray = new Float32Array(1);

    this.bindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'Shared Bind Group Layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'Shared Bind Group',
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.cameraUniformBuffer,
        },
        {
          binding: 1,
          resource: this.stateUniformBuffer,
        },
      ],
    });
  }

  update(camera: Camera, timestamp: number): void {
    const viewMatrix = camera.viewMatrix;
    const projectionMatrix = camera.projectionMatrix;

    this.stateArray[0] = timestamp / 1000;

    this.gpu.queue.writeBuffer(
      this.cameraUniformBuffer,
      0,
      viewMatrix.buffer,
      viewMatrix.byteOffset,
      viewMatrix.byteLength,
    );

    this.gpu.queue.writeBuffer(
      this.cameraUniformBuffer,
      64,
      projectionMatrix.buffer,
      projectionMatrix.byteOffset,
      projectionMatrix.byteLength,
    );

    this.gpu.queue.writeBuffer(this.stateUniformBuffer, 0, this.stateArray);
  }

  getSharedBindGroup(): GPUBindGroup {
    return this.bindGroup;
  }

  getSharedBindGroupLayout(): GPUBindGroupLayout {
    return this.bindGroupLayout;
  }

  getSharedUniformBuffer(): GPUBuffer {
    return this.cameraUniformBuffer;
  }
}
