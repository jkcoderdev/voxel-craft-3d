import '@/styles/main.scss';

import { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { queryCanvasById, queryElementById } from '@/shared/dom';
import { InputManager } from '@/engine/input/InputManager';
import { WorldRenderer } from '@/engine/rendering/world/WorldRenderer';
import { OverlayRenderer } from '@/engine/rendering/overlay/OverlayRenderer';
import { ResizeTracker } from '@/engine/core/ResizeTracker';
import { Camera } from '@/engine/core/Camera';
import { utils } from 'wgpu-matrix';
import { FrameLoop } from '@/engine/core/FrameLoop';
import { FlyCameraController } from '@/engine/core/FlyCameraController';
import { World } from '@/engine/world/World';

const container = queryElementById('container');
const overlayCanvas = queryCanvasById('world-canvas');
const worldCanvas = queryCanvasById('overlay-canvas');

const gpu = await WebGPUContext.create();

const input = new InputManager(container);

const world = new World(gpu);

const worldRenderer = new WorldRenderer(gpu, worldCanvas);
const overlayRenderer = new OverlayRenderer(overlayCanvas);

const camera = new Camera({
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

const frameLoop = new FrameLoop(({ deltaTime }) => {
  resizeTracker.update();
  controller.update(deltaTime / 1000);
  camera.update();

  worldRenderer.render(camera);
});

resizeTracker.update();
frameLoop.start();

container.addEventListener('click', () => {
  void controller.requestPointerLock();
});
