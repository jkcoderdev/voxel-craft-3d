import '@/styles/main.scss';

import chunkShader from '@/shaders/chunk.wgsl?raw';

import { WebGPUContext } from '@/webgpu/WebGPUContext';
import { queryCanvasById, queryElementById } from '@/shared/dom';
import { Camera } from '@/engine/core/Camera';
import { ResizeTracker } from '@/engine/core/ResizeTracker';
import { FrameLoop } from '@/engine/core/FrameLoop';
import { vec3, utils, mat4 } from 'wgpu-matrix';
import { DepthTexture } from '@/webgpu/DepthTexture';
import { WebGPUSurface } from '@/webgpu/WebGPUSurface';
import { FlyCameraController } from '@/engine/core/FlyCameraController';
import { Chunk } from '@/engine/world/Chunk';
import { ChunkMeshBuilder } from '@/engine/world/ChunkMeshBuilder';
import { WorldRenderer } from '@/engine/rendering/WorldRenderer';
import { RenderQueue } from '@/engine/rendering/RenderQueue';

const container = queryElementById('container');
const overlayCanvas = queryCanvasById('overlay-canvas');

const gpu = await WebGPUContext.create();
const worldCanvasSurface = WebGPUSurface.create('#world-canvas', gpu, {
  alphaMode: 'opaque',
});

const camera = new Camera({
  position: vec3.create(0, 32, 32),
  fov: utils.degToRad(60),
});

const depthTexture = new DepthTexture(gpu.device, {
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
  label: 'Depth Texture',
});

const worldRenderer = new WorldRenderer(gpu, worldCanvasSurface, depthTexture);

const renderQueue = new RenderQueue();

const cameraController = new FlyCameraController({
  camera,
  element: container,
});

container.addEventListener('click', () => {
  void cameraController.requestPointerLock();
});

const resizeTracker = new ResizeTracker(container, ({ physicalWidth, physicalHeight }) => {
  worldCanvasSurface.resize(physicalWidth, physicalHeight);

  overlayCanvas.width = physicalWidth;
  overlayCanvas.height = physicalHeight;

  depthTexture.resize(physicalWidth, physicalHeight);

  camera.aspect = physicalWidth / physicalHeight;
});

resizeTracker.update();

// const shaderModule = gpu.device.createShaderModule({
//   label: 'Chunk Shader Module',
//   code: chunkShader,
// });

// const pipeline = gpu.device.createRenderPipeline({
//   label: 'Chunk Render Pipeline',
//   layout: 'auto',
//   vertex: {
//     module: shaderModule,
//     entryPoint: 'vsMain',
//     buffers: [
//       {
//         arrayStride: 24,
//         attributes: [
//           { shaderLocation: 0, offset: 0, format: 'float32x3' },
//           { shaderLocation: 1, offset: 12, format: 'float32x3' },
//         ],
//       },
//     ],
//   },
//   fragment: {
//     module: shaderModule,
//     entryPoint: 'fsMain',
//     targets: [{ format: gpu.preferredCanvasFormat }],
//   },
//   primitive: {
//     topology: 'triangle-list',
//     cullMode: 'back',
//   },
//   depthStencil: {
//     depthCompare: 'less',
//     depthWriteEnabled: true,
//     format: depthTexture.format,
//   },
// });

// const UNIFORM_BUFFER_SIZE = 64; // bytes -> viewProjectionMatrix (16 * 4 bytes [32-bit float])

// const uniformBuffer = gpu.device.createBuffer({
//   label: 'Common Uniform Buffer',
//   size: UNIFORM_BUFFER_SIZE,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });

// const bindGroup = gpu.device.createBindGroup({
//   label: 'Common Bind Group',
//   layout: pipeline.getBindGroupLayout(0),
//   entries: [
//     {
//       binding: 0,
//       resource: { buffer: uniformBuffer },
//     },
//   ],
// });

const chunk = new Chunk(0, 0);
chunk.generate();

const chunkMeshBuilder = new ChunkMeshBuilder(gpu);
const chunkMesh = chunkMeshBuilder.build(chunk);

worldRenderer.addMesh(chunkMesh);

const frameLoop = new FrameLoop(({ timestamp, deltaTime }) => {
  resizeTracker.update();
  cameraController.update(deltaTime / 1000);
  camera.update();

  worldRenderer.render(camera, timestamp, renderQueue);

  // const viewProjectionMatrix = camera.viewProjectionMatrix;

  // gpu.queue.writeBuffer(uniformBuffer, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, 64);

  // const commandEncoder = gpu.device.createCommandEncoder({
  //   label: 'Cube Command Encoder',
  // });

  // const renderPass = commandEncoder.beginRenderPass({
  //   label: 'Cube Render Pass',
  //   colorAttachments: [
  //     {
  //       view: worldCanvasSurface.view,
  //       clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
  //       loadOp: 'clear',
  //       storeOp: 'store',
  //     },
  //   ],
  //   depthStencilAttachment: {
  //     view: depthTexture.view,
  //     depthClearValue: 1.0,
  //     depthLoadOp: 'clear',
  //     depthStoreOp: 'store',
  //   },
  // });

  // if (!chunkMesh.isEmpty) {
  //   renderPass.setPipeline(pipeline);
  //   renderPass.setVertexBuffer(0, chunkMesh.vertexBuffer);
  //   renderPass.setIndexBuffer(chunkMesh.indexBuffer, chunkMesh.indexFormat);
  //   renderPass.setBindGroup(0, bindGroup);
  //   renderPass.drawIndexed(chunkMesh.indexCount);
  // }

  // renderPass.end();

  // gpu.queue.submit([commandEncoder.finish()]);
});

frameLoop.start();
