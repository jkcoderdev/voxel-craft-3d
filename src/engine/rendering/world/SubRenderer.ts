import type { Camera } from '@/engine/core/Camera';
import type { SharedUniforms } from '@/engine/rendering/world/SharedUniforms';

export interface SubRenderer {
  render(pass: GPURenderPassEncoder, shared: SharedUniforms, camera: Camera, timestamp: number): void;
}
