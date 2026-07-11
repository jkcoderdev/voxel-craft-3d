import type { SharedUniforms } from '@/engine/rendering/world/SharedUniforms';

export interface SubRenderer {
  render(pass: GPURenderPassEncoder, shared: SharedUniforms): void;
}
