import '@/styles/main.scss';

import { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { queryCanvasById, queryElementById } from '@/shared/dom';
import { InputManager } from '@/engine/input/InputManager';
import { WorldRenderer } from '@/engine/rendering/world/WorldRenderer';
import { OverlayRenderer } from '@/engine/rendering/overlay/OverlayRenderer';
import { ResizeTracker } from '@/engine/core/ResizeTracker';
import { Camera } from '@/engine/core/Camera';
import { utils, vec3 } from 'wgpu-matrix';
import { FrameLoop } from '@/engine/core/FrameLoop';
import { FlyCameraController } from '@/engine/core/FlyCameraController';
import { World } from '@/engine/world/World';
import { ChunkRenderer } from '@/engine/rendering/world/ChunkRenderer';

const container = queryElementById('container');
const worldCanvas = queryCanvasById('world-canvas');
const overlayCanvas = queryCanvasById('overlay-canvas');

const gpu = await WebGPUContext.create();

const input = new InputManager(container);

const world = new World(gpu);

const worldRenderer = new WorldRenderer(gpu, worldCanvas);

worldRenderer.register(new ChunkRenderer(worldRenderer.resources, world));

const overlayRenderer = new OverlayRenderer(overlayCanvas);

const camera = new Camera({
  position: vec3.create(8, 32, 32),
  fov: utils.degToRad(70),
});

const controller = new FlyCameraController({
  camera,
  input,
});

const resizeTracker = new ResizeTracker(container, ({ physicalWidth, physicalHeight }) => {
  worldRenderer.resize(physicalWidth, physicalHeight);
  overlayRenderer.resize(physicalWidth, physicalHeight);

  const aspectRatio = physicalWidth / physicalHeight;
  camera.aspect = aspectRatio;
});

const frameLoop = new FrameLoop(({ timestamp, deltaTime }) => {
  resizeTracker.update();
  controller.update(deltaTime / 1000);
  camera.update();

  worldRenderer.render(camera, timestamp);
  overlayRenderer.render();
});

resizeTracker.update();
frameLoop.start();

container.addEventListener('click', () => {
  void controller.requestPointerLock();
});

window.addEventListener('blur', () => {
  frameLoop.stop();
});

window.addEventListener('focus', () => {
  frameLoop.start();
});
