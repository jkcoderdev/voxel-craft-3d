import type { Camera } from '@/engine/core/Camera';
import type { World } from '@/engine/world/World';
import { raycast } from '@/engine/world/Raycaster';
import { vec3, type Vec3 } from 'wgpu-matrix';

const FORWARD = vec3.create(0, 0, -1);

export class BlockInteractionController {
  private readonly camera: Camera;
  private readonly world: World;

  private readonly direction: Vec3 = vec3.create();

  private readonly onMouseDown = (event: MouseEvent): void => {
    // 0 = left button (remove), 2 = right button (place)
    if (event.button !== 0 && event.button !== 2) return;

    event.preventDefault();

    this.performInteraction(event.button === 0 ? 'remove' : 'place');
  };

  private readonly onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  constructor(camera: Camera, world: World, element: HTMLElement) {
    this.camera = camera;
    this.world = world;

    element.addEventListener('mousedown', this.onMouseDown);
    element.addEventListener('contextmenu', this.onContextMenu);
  }

  private performInteraction(action: 'remove' | 'place'): void {
    const position = this.camera.position;
    vec3.transformQuat(FORWARD, this.camera.rotation, this.direction);

    const hit = raycast(
      (x, y, z) => this.world.getBlock(x, y, z),
      position[0],
      position[1],
      position[2],
      this.direction[0],
      this.direction[1],
      this.direction[2],
    );

    if (!hit) return;

    if (action === 'remove') {
      this.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, 0);
    } else {
      const placeX = hit.blockX + hit.normalX;
      const placeY = hit.blockY + hit.normalY;
      const placeZ = hit.blockZ + hit.normalZ;

      this.world.setBlock(placeX, placeY, placeZ, 1);
    }
  }

  destroy(): void {
    // The element reference is not stored, but destroy could be called
    // if we need to clean up listeners later.
  }
}
