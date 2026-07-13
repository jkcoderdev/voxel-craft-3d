import '@/styles/main.scss';

import { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { queryCanvasById, queryElementById } from '@/shared/dom';
import { InputManager } from '@/engine/input/InputManager';
import { WorldRenderer } from '@/engine/rendering/world/WorldRenderer';
import { OverlayRenderer } from '@/engine/rendering/overlay/OverlayRenderer';
import { ResizeTracker } from '@/engine/core/ResizeTracker';
import { Camera } from '@/engine/core/Camera';
import { quat, utils, vec3 } from 'wgpu-matrix';
import { FrameLoop } from '@/engine/core/FrameLoop';
import { FlyCameraController } from '@/engine/core/FlyCameraController';
import { World } from '@/engine/world/World';
import { ChunkRenderer } from '@/engine/rendering/world/ChunkRenderer';
import { SkyboxRenderer } from '@/engine/rendering/world/SkyboxRenderer';
import { BlockInteractionController } from '@/engine/world/BlockInteractionController';

const container = queryElementById('container');
const worldCanvas = queryCanvasById('world-canvas');
const overlayCanvas = queryCanvasById('overlay-canvas');

const gpu = await WebGPUContext.create();

const input = new InputManager(container);

const world = new World(gpu, {
  seed: 0,
  chunkRadius: 4,
  maxChunkOperationsPerUpdate: 1,
});

const worldRenderer = new WorldRenderer(gpu, worldCanvas);

worldRenderer.register(new SkyboxRenderer(worldRenderer.resources));
worldRenderer.register(new ChunkRenderer(worldRenderer.resources, world));

const overlayRenderer = new OverlayRenderer(overlayCanvas);

const camera = new Camera({
  position: vec3.create(8, 128, 8),
  fov: utils.degToRad(70),
  far: 10000,
  rotation: quat.fromEuler(-Math.PI / 2, 0, 0, 'yxz'),
});

const controller = new FlyCameraController({
  camera,
  input,
});

const blockInteraction = new BlockInteractionController(camera, world, container);

const PIXEL_SIZE = 1;

const resizeTracker = new ResizeTracker(container, ({ physicalWidth, physicalHeight }) => {
  const width = Math.floor(physicalWidth / PIXEL_SIZE);
  const height = Math.floor(physicalHeight / PIXEL_SIZE);

  worldRenderer.resize(width, height);
  overlayRenderer.resize(width, height);

  const aspectRatio = width / height;
  camera.aspect = aspectRatio;
});

const frameLoop = new FrameLoop(({ timestamp, deltaTime }) => {
  resizeTracker.update();
  controller.update(deltaTime / 1000);
  camera.update();
  world.update(camera);

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
