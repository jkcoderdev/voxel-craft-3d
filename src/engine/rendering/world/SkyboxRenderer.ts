import skyboxShaderCode from '@/shaders/skybox.wgsl?raw';
import type { Camera } from '@/engine/core/Camera';
import { StaticMesh } from '@/engine/graphics/webgpu/StaticMesh';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import type { SharedUniforms } from '@/engine/rendering/world/SharedUniforms';
import type { SubRenderer } from '@/engine/rendering/world/SubRenderer';
import type { RendererResources } from '@/engine/rendering/world/WorldRenderer';
import { mat4, quat } from 'wgpu-matrix';

const SKYBOX_SIZE = 500;

// prettier-ignore
const SKYBOX_VERTICES = new Float32Array([
  -1, -1,  1,
   1, -1,  1,
   1,  1,  1,
  -1,  1,  1,

   1, -1, -1,
  -1, -1, -1,
  -1,  1, -1,
   1,  1, -1,

  -1,  1,  1,
   1,  1,  1,
   1,  1, -1,
  -1,  1, -1,

  -1, -1, -1,
   1, -1, -1,
   1, -1,  1,
  -1, -1,  1,

   1, -1,  1,
   1, -1, -1,
   1,  1, -1,
   1,  1,  1,

  -1, -1, -1,
  -1, -1,  1,
  -1,  1,  1,
  -1,  1, -1,
]);

// prettier-ignore
const SKYBOX_INDICES = new Uint16Array([
  0, 1, 2,
  0, 2, 3,
  
  4, 5, 6,
  4, 6, 7,

  8, 9, 10,
  8, 10, 11,
  
  12, 13, 14,
  12, 14, 15,
  
  16, 17, 18,
  16, 18, 19,
  
  20, 21, 22,
  20, 22, 23,
]);

export class SkyboxRenderer implements SubRenderer {
  private readonly gpu: WebGPUContext;
  private readonly mesh: StaticMesh;
  private readonly pipeline: GPURenderPipeline;
  private readonly uniformBuffer: GPUBuffer;
  private readonly bindGroup: GPUBindGroup;
  private readonly modelMatrix = new Float32Array(16);

  constructor(resources: RendererResources) {
    const { gpu, surface, depthTexture, sharedUniforms } = resources;

    this.gpu = gpu;

    this.mesh = new StaticMesh(gpu, {
      label: 'Skybox Mesh',
      vertices: SKYBOX_VERTICES,
      indices: SKYBOX_INDICES,
    });

    const shaderModule = gpu.device.createShaderModule({
      label: 'SkyboxRenderer Shader Module',
      code: skyboxShaderCode,
    });

    const skyboxBindGroupLayout = gpu.device.createBindGroupLayout({
      label: 'Skybox Bind Group Layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    });

    this.uniformBuffer = gpu.device.createBuffer({
      label: 'Skybox Uniform Buffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = gpu.device.createBindGroup({
      label: 'Skybox Bind Group',
      layout: skyboxBindGroupLayout,
      entries: [{ binding: 0, resource: this.uniformBuffer }],
    });

    const pipelineLayout = gpu.device.createPipelineLayout({
      label: 'SkyboxRenderer Pipeline Layout',
      bindGroupLayouts: [sharedUniforms.getSharedBindGroupLayout(), skyboxBindGroupLayout],
    });

    this.pipeline = gpu.device.createRenderPipeline({
      label: 'SkyboxRenderer Pipeline',
      layout: pipelineLayout,

      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
          },
        ],
      },

      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{ format: surface.format }],
      },

      primitive: {
        topology: 'triangle-list',
        cullMode: 'front',
      },

      depthStencil: {
        depthCompare: 'less-equal',
        depthWriteEnabled: false,
        format: depthTexture.format,
      },
    });
  }

  private updateUniformBuffer(camera: Camera): void {
    mat4.fromQuat(quat.inverse(camera.rotation), this.modelMatrix);

    this.gpu.queue.writeBuffer(
      this.uniformBuffer,
      0,
      this.modelMatrix.buffer,
      this.modelMatrix.byteOffset,
      this.modelMatrix.byteLength,
    );
  }

  render(pass: GPURenderPassEncoder, shared: SharedUniforms, camera: Camera): void {
    this.updateUniformBuffer(camera);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, shared.getSharedBindGroup());
    pass.setBindGroup(1, this.bindGroup);
    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setIndexBuffer(this.mesh.indexBuffer, this.mesh.indexFormat);
    pass.drawIndexed(this.mesh.indexCount);
  }
}
