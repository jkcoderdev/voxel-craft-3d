import chunkShaderCode from '@/shaders/chunk.wgsl?raw';
import type { SharedUniforms } from '@/engine/rendering/world/SharedUniforms';
import type { SubRenderer } from '@/engine/rendering/world/SubRenderer';
import type { RendererResources } from '@/engine/rendering/world/WorldRenderer';
import type { World } from '@/engine/world/World';

export class ChunkRenderer implements SubRenderer {
  private readonly pipeline: GPURenderPipeline;

  constructor(
    resources: RendererResources,
    private readonly world: World,
  ) {
    const { gpu, surface, depthTexture, sharedUniforms } = resources;

    const shaderModule = gpu.device.createShaderModule({
      label: 'ChunkRenderer Shader Module',
      code: chunkShaderCode,
    });

    const pipelineLayout = gpu.device.createPipelineLayout({
      label: 'ChunkRenderer Pipeline Layout',
      bindGroupLayouts: [sharedUniforms.getSharedBindGroupLayout()],
    });

    this.pipeline = gpu.device.createRenderPipeline({
      label: 'ChunkRenderer Pipeline',
      layout: pipelineLayout,

      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
            ],
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
        cullMode: 'back',
      },

      depthStencil: {
        depthCompare: 'less',
        depthWriteEnabled: true,
        format: depthTexture.format,
      },
    });
  }

  render(pass: GPURenderPassEncoder, shared: SharedUniforms): void {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, shared.getSharedBindGroup());

    const meshes = this.world.getChunkMeshes();

    for (const mesh of meshes) {
      pass.setVertexBuffer(0, mesh.vertexBuffer);
      pass.setIndexBuffer(mesh.indexBuffer, mesh.indexFormat);
      pass.drawIndexed(mesh.indexCount);
    }
  }
}
