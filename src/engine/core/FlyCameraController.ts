import type { Camera } from '@/engine/core/Camera';
import type { InputManager } from '@/engine/input/InputManager';
import { Keyboard } from '@/engine/input/Keyboard';
import { PointerLockHandler, type PointerLockMoveDelta } from '@/engine/input/PointerLockHandler';
import { quat, vec3, type Vec3 } from 'wgpu-matrix';

export interface FlyCameraControllerDescriptor {
  camera: Camera;
  input: InputManager;

  moveSpeed?: number;
  sprintMultiplier?: number;
  lookSensitivity?: number;
}

const DEFAULT_MOVE_SPEED = 8; // units per second
const DEFAULT_SPRINT_MULTIPLIER = 3;
const DEFAULT_LOOK_SENSITIVITY = 0.0025; // radians per pixel

const MIN_PITCH = -Math.PI / 2 + 0.001;
const MAX_PITCH = Math.PI / 2 - 0.001;

const FORWARD = vec3.create(0, 0, -1);
const RIGHT = vec3.create(1, 0, 0);
const UP = vec3.create(0, 1, 0);

const MOVE_FORWARD_KEYS = ['KeyW', 'ArrowUp'];
const MOVE_BACKWARD_KEYS = ['KeyS', 'ArrowDown'];
const MOVE_LEFT_KEYS = ['KeyA', 'ArrowLeft'];
const MOVE_RIGHT_KEYS = ['KeyD', 'ArrowRight'];
const MOVE_UP_KEYS = ['Space'];
const MOVE_DOWN_KEYS = ['ShiftLeft', 'ShiftRight'];
const SPRINT_KEYS = ['KeyQ', 'KeyQ'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class FlyCameraController {
  private readonly camera: Camera;

  private readonly keyboard: Keyboard;
  private readonly pointerLock: PointerLockHandler;

  private readonly moveSpeed: number;
  private readonly sprintMultiplier: number;
  private readonly lookSensitivity: number;

  private yaw = 0;
  private pitch = 0;

  private readonly moveDirection: Vec3 = vec3.create();
  private readonly forward: Vec3 = vec3.create();
  private readonly right: Vec3 = vec3.create();

  private readonly handleLook = (delta: PointerLockMoveDelta): void => {
    this.yaw -= delta.deltaX * this.lookSensitivity;
    this.pitch -= delta.deltaY * this.lookSensitivity;
    this.pitch = clamp(this.pitch, MIN_PITCH, MAX_PITCH);
  };

  constructor(descriptor: FlyCameraControllerDescriptor) {
    this.camera = descriptor.camera;

    this.moveSpeed = descriptor.moveSpeed ?? DEFAULT_MOVE_SPEED;
    this.sprintMultiplier = descriptor.sprintMultiplier ?? DEFAULT_SPRINT_MULTIPLIER;
    this.lookSensitivity = descriptor.lookSensitivity ?? DEFAULT_LOOK_SENSITIVITY;

    this.keyboard = descriptor.input.keyboard;
    this.pointerLock = descriptor.input.pointerLockHandler;

    this.pointerLock.on('move', this.handleLook);

    this.syncAnglesFromCamera();
  }

  private syncAnglesFromCamera(): void {
    const rotation = this.camera.rotation;
    vec3.transformQuat(FORWARD, rotation, this.forward);

    this.yaw = Math.atan2(-this.forward[0], -this.forward[2]);
    this.pitch = clamp(Math.asin(clamp(this.forward[1], -1, 1)), MIN_PITCH, MAX_PITCH);
  }

  requestPointerLock(): Promise<void> {
    return this.pointerLock.lock();
  }

  releasePointerLock(): void {
    this.pointerLock.unlock();
  }

  update(deltaSeconds: number): void {
    const rotation = quat.fromEuler(this.pitch, this.yaw, 0, 'yxz');
    this.camera.rotation = rotation;

    vec3.zero(this.moveDirection);

    if (this.keyboard.isAnyKeyDown(MOVE_FORWARD_KEYS)) {
      vec3.add(this.moveDirection, this.forward, this.moveDirection);
    }
    if (this.keyboard.isAnyKeyDown(MOVE_BACKWARD_KEYS)) {
      vec3.subtract(this.moveDirection, this.forward, this.moveDirection);
    }
    if (this.keyboard.isAnyKeyDown(MOVE_RIGHT_KEYS)) {
      vec3.add(this.moveDirection, this.right, this.moveDirection);
    }
    if (this.keyboard.isAnyKeyDown(MOVE_LEFT_KEYS)) {
      vec3.subtract(this.moveDirection, this.right, this.moveDirection);
    }
    if (this.keyboard.isAnyKeyDown(MOVE_UP_KEYS)) {
      vec3.add(this.moveDirection, UP, this.moveDirection);
    }
    if (this.keyboard.isAnyKeyDown(MOVE_DOWN_KEYS)) {
      vec3.subtract(this.moveDirection, UP, this.moveDirection);
    }

    if (vec3.lengthSq(this.moveDirection) > 0) {
      vec3.normalize(this.moveDirection, this.moveDirection);

      const sprinting = this.keyboard.isAnyKeyDown(SPRINT_KEYS);
      const speed = this.moveSpeed * (sprinting ? this.sprintMultiplier : 1);

      this.camera.position = vec3.addScaled(this.camera.position, this.moveDirection, speed * deltaSeconds);
    }
  }
}
