import '@/styles/main.scss';

import { GPUInstance } from '@/webgpu/GPUInstance';
import { queryCanvasById, queryElementById } from '@/shared/dom';

const container = queryElementById('container');
const worldCanvas = queryCanvasById('world-canvas');
const overlayCanvas = queryCanvasById('overlay-canvas');

const gpu = await GPUInstance.create();
