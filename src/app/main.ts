import '@/styles/main.scss';

import cubeShader from '@/shaders/cube.wgsl?raw';

import { WebGPUContext } from '@/webgpu/WebGPUContext';
import { queryCanvasById, queryElementById } from '@/shared/dom';
import { Camera } from '@/engine/core/Camera';
import { ResizeTracker } from '@/engine/core/ResizeTracker';
import { FrameLoop } from '@/engine/core/FrameLoop';
import { vec3, utils, mat4 } from 'wgpu-matrix';
import { DepthTexture } from '@/webgpu/DepthTexture';
import { WebGPUSurface } from '@/webgpu/WebGPUSurface';
import { FlyCameraController } from '@/engine/core/FlyCameraController';

const container = queryElementById('container');
const overlayCanvas = queryCanvasById('overlay-canvas');

const gpu = await WebGPUContext.create();
const worldCanvasSurface = WebGPUSurface.create('#world-canvas', gpu, {
  alphaMode: 'opaque',
});

const camera = new Camera({
  position: vec3.create(0, 0, 5),
  fov: utils.degToRad(60),
});

const cameraController = new FlyCameraController({
  camera,
  element: container,
});

container.addEventListener('click', () => {
  void cameraController.requestPointerLock();
});

const depthTexture = new DepthTexture(gpu.device, {
  format: 'depth24plus',
  usage: GPUTextureUsage.RENDER_ATTACHMENT,
  label: 'Depth Texture',
});

const resizeTracker = new ResizeTracker(container, ({ physicalWidth, physicalHeight }) => {
  worldCanvasSurface.resize(physicalWidth, physicalHeight);

  overlayCanvas.width = physicalWidth;
  overlayCanvas.height = physicalHeight;

  depthTexture.resize(physicalWidth, physicalHeight);

  camera.aspect = physicalWidth / physicalHeight;
});

resizeTracker.update();

const shaderModule = gpu.device.createShaderModule({
  label: 'Cube Shader Module',
  code: cubeShader,
});

const pipeline = gpu.device.createRenderPipeline({
  label: 'Cube Render Pipeline',
  layout: 'auto',
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
    targets: [{ format: gpu.preferredCanvasFormat }],
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

const UNIFORM_BUFFER_SIZE = 128; // 64 bytes viewProjectionMatrix (16 * 4 bytes) + 64 bytes modelMatrix (16 * 4 bytes)

const uniformBuffer = gpu.device.createBuffer({
  label: 'Cube Uniform Buffer',
  size: UNIFORM_BUFFER_SIZE,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const bindGroup = gpu.device.createBindGroup({
  label: 'Cube Bind Group',
  layout: pipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: uniformBuffer },
    },
  ],
});

// prettier-ignore
const VERTEX_DATA = new Float32Array([
  // Front face (z = 1)
  // position         normal
  -1, -1,  1,         0,  0,  1,
   1, -1,  1,         0,  0,  1,
   1,  1,  1,         0,  0,  1,
  -1, -1,  1,         0,  0,  1,
   1,  1,  1,         0,  0,  1,
  -1,  1,  1,         0,  0,  1,

  // Back face (z = -1)
   1, -1, -1,         0,  0, -1,
  -1, -1, -1,         0,  0, -1,
  -1,  1, -1,         0,  0, -1,
   1, -1, -1,         0,  0, -1,
  -1,  1, -1,         0,  0, -1,
   1,  1, -1,         0,  0, -1,

  // Top face (y = 1)
  -1,  1,  1,         0,  1,  0,
   1,  1,  1,         0,  1,  0,
   1,  1, -1,         0,  1,  0,
  -1,  1,  1,         0,  1,  0,
   1,  1, -1,         0,  1,  0,
  -1,  1, -1,         0,  1,  0,

  // Bottom face (y = -1)
  -1, -1, -1,         0, -1,  0,
   1, -1, -1,         0, -1,  0,
   1, -1,  1,         0, -1,  0,
  -1, -1, -1,         0, -1,  0,
   1, -1,  1,         0, -1,  0,
  -1, -1,  1,         0, -1,  0,

  // Right face (x = 1)
   1, -1,  1,         1,  0,  0,
   1, -1, -1,         1,  0,  0,
   1,  1, -1,         1,  0,  0,
   1, -1,  1,         1,  0,  0,
   1,  1, -1,         1,  0,  0,
   1,  1,  1,         1,  0,  0,

  // Left face (x = -1)
  -1, -1, -1,        -1,  0,  0,
  -1, -1,  1,        -1,  0,  0,
  -1,  1,  1,        -1,  0,  0,
  -1, -1, -1,        -1,  0,  0,
  -1,  1,  1,        -1,  0,  0,
  -1,  1, -1,        -1,  0,  0,
]);

const vertexBuffer = gpu.device.createBuffer({
  label: 'Cube Vertex Buffer',
  size: VERTEX_DATA.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

gpu.queue.writeBuffer(vertexBuffer, 0, VERTEX_DATA);

const VERTEX_COUNT = VERTEX_DATA.length / 6;

const ANIMATION_DURATION = 4; // seconds

const modelMatrix = mat4.create();

const frameLoop = new FrameLoop(({ timestamp, deltaTime }) => {
  resizeTracker.update();
  cameraController.update(deltaTime / 1000);
  camera.update();

  const angle = (timestamp / 1000 / ANIMATION_DURATION) * Math.PI * 2;

  mat4.rotationY(angle, modelMatrix);
  mat4.rotateX(modelMatrix, angle * 0.125, modelMatrix);
  mat4.rotateZ(modelMatrix, angle * 0.125, modelMatrix);

  const viewProjectionMatrix = camera.viewProjectionMatrix;

  gpu.queue.writeBuffer(uniformBuffer, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, 64);
  gpu.queue.writeBuffer(uniformBuffer, 64, modelMatrix.buffer, modelMatrix.byteOffset, 64);

  const commandEncoder = gpu.device.createCommandEncoder({
    label: 'Cube Command Encoder',
  });

  const renderPass = commandEncoder.beginRenderPass({
    label: 'Cube Render Pass',
    colorAttachments: [
      {
        view: worldCanvasSurface.view,
        clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.view,
      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  });

  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(VERTEX_COUNT, 1, 0, 0);
  renderPass.end();

  gpu.queue.submit([commandEncoder.finish()]);
});

frameLoop.start();
