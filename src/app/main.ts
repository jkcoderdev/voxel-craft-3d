import '@/styles/main.scss';

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
});

frameLoop.start();
