import { mat4, quat, vec3, type Mat4, type Quat, type Vec3 } from 'wgpu-matrix';

export interface CameraDescriptor {
  position?: Vec3;
  rotation?: Quat;
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
}

const DEFAULT_POSITION = vec3.create(0, 0, 0);
const DEFAULT_FOV = Math.PI / 4;
const DEFAULT_ASPECT = 1;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000.0;
const MIN_QUATERNION_LENGTH = 0.000001;

function validateFiniteNumber(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid camera ${name}: expected a finite number.`);
  }
}

function validatePosition(position: Vec3): void {
  for (let index = 0; index < 3; index++) {
    validateFiniteNumber(`position[${index}]`, position[index]);
  }
}

function validateRotation(rotation: Quat): void {
  for (let index = 0; index < 4; index++) {
    validateFiniteNumber(`rotation[${index}]`, rotation[index]);
  }

  const length = Math.hypot(rotation[0], rotation[1], rotation[2], rotation[3]);
  if (length < MIN_QUATERNION_LENGTH) {
    throw new Error('Invalid camera rotation: quaternion length must be greater than zero.');
  }
}

function validateFov(value: number): void {
  validateFiniteNumber('fov', value);

  if (value <= 0 || value >= Math.PI) {
    throw new Error('Invalid camera fov: expected a value greater than 0 and less than PI radians.');
  }
}

function validateAspect(value: number): void {
  validateFiniteNumber('aspect', value);

  if (value <= 0) {
    throw new Error('Invalid camera aspect: expected a value greater than 0.');
  }
}

function validateNear(value: number, far: number): void {
  validateFiniteNumber('near', value);

  if (value <= 0) {
    throw new Error('Invalid camera near: expected a value greater than 0.');
  }

  if (value >= far) {
    throw new Error('Invalid camera near: expected near to be less than far.');
  }
}

function validateFar(value: number, near: number): void {
  validateFiniteNumber('far', value);

  if (value <= near) {
    throw new Error('Invalid camera far: expected far to be greater than near.');
  }
}

export class Camera {
  private _position: Vec3;
  private _rotation: Quat;

  private _fov: number;
  private _aspect: number;
  private _near: number;
  private _far: number;

  private viewMatrix: Mat4 = mat4.create();
  private projectionMatrix: Mat4 = mat4.create();
  private _viewProjectionMatrix: Mat4 = mat4.create();

  private negativePosition = vec3.create();
  private normalizedRotation = quat.identity();

  private viewDirty = true;
  private projectionDirty = true;

  constructor(descriptor: CameraDescriptor = {}) {
    const {
      position = DEFAULT_POSITION,
      rotation = quat.identity(),
      fov = DEFAULT_FOV,
      aspect = DEFAULT_ASPECT,
      near = DEFAULT_NEAR,
      far = DEFAULT_FAR,
    } = descriptor;

    validatePosition(position);
    validateRotation(rotation);
    validateFov(fov);
    validateAspect(aspect);
    validateNear(near, far);
    validateFar(far, near);

    this._position = vec3.clone(position);
    this._rotation = quat.clone(rotation);

    this._fov = fov;
    this._aspect = aspect;
    this._near = near;
    this._far = far;

    this.update();
  }

  set position(value: Vec3) {
    validatePosition(value);

    if (this._position[0] !== value[0] || this._position[1] !== value[1] || this._position[2] !== value[2]) {
      this._position = vec3.clone(value);
      this.viewDirty = true;
    }
  }

  get position(): Vec3 {
    return vec3.clone(this._position);
  }

  set positionX(value: number) {
    validateFiniteNumber('positionX', value);

    if (this._position[0] !== value) {
      this._position[0] = value;
      this.viewDirty = true;
    }
  }

  get positionX(): number {
    return this._position[0];
  }

  set positionY(value: number) {
    validateFiniteNumber('positionY', value);

    if (this._position[1] !== value) {
      this._position[1] = value;
      this.viewDirty = true;
    }
  }

  get positionY(): number {
    return this._position[1];
  }

  set positionZ(value: number) {
    validateFiniteNumber('positionZ', value);

    if (this._position[2] !== value) {
      this._position[2] = value;
      this.viewDirty = true;
    }
  }

  get positionZ(): number {
    return this._position[2];
  }

  set rotation(value: Quat) {
    validateRotation(value);

    if (
      this._rotation[0] !== value[0] ||
      this._rotation[1] !== value[1] ||
      this._rotation[2] !== value[2] ||
      this._rotation[3] !== value[3]
    ) {
      this._rotation = quat.clone(value);
      this.viewDirty = true;
    }
  }

  get rotation(): Quat {
    return quat.clone(this._rotation);
  }

  set rotationX(value: number) {
    validateFiniteNumber('rotationX', value);

    if (this._rotation[0] !== value) {
      const rotation = quat.clone(this._rotation);
      rotation[0] = value;
      validateRotation(rotation);
      this._rotation = rotation;
      this.viewDirty = true;
    }
  }

  get rotationX(): number {
    return this._rotation[0];
  }

  set rotationY(value: number) {
    validateFiniteNumber('rotationY', value);

    if (this._rotation[1] !== value) {
      const rotation = quat.clone(this._rotation);
      rotation[1] = value;
      validateRotation(rotation);
      this._rotation = rotation;
      this.viewDirty = true;
    }
  }

  get rotationY(): number {
    return this._rotation[1];
  }

  set rotationZ(value: number) {
    validateFiniteNumber('rotationZ', value);

    if (this._rotation[2] !== value) {
      const rotation = quat.clone(this._rotation);
      rotation[2] = value;
      validateRotation(rotation);
      this._rotation = rotation;
      this.viewDirty = true;
    }
  }

  get rotationZ(): number {
    return this._rotation[2];
  }

  set rotationW(value: number) {
    validateFiniteNumber('rotationW', value);

    if (this._rotation[3] !== value) {
      const rotation = quat.clone(this._rotation);
      rotation[3] = value;
      validateRotation(rotation);
      this._rotation = rotation;
      this.viewDirty = true;
    }
  }

  get rotationW(): number {
    return this._rotation[3];
  }

  set fov(value: number) {
    validateFov(value);

    if (this._fov !== value) {
      this._fov = value;
      this.projectionDirty = true;
    }
  }

  get fov(): number {
    return this._fov;
  }

  set aspect(value: number) {
    validateAspect(value);

    if (this._aspect !== value) {
      this._aspect = value;
      this.projectionDirty = true;
    }
  }

  get aspect(): number {
    return this._aspect;
  }

  set near(value: number) {
    validateNear(value, this._far);

    if (this._near !== value) {
      this._near = value;
      this.projectionDirty = true;
    }
  }

  get near(): number {
    return this._near;
  }

  set far(value: number) {
    validateFar(value, this._near);

    if (this._far !== value) {
      this._far = value;
      this.projectionDirty = true;
    }
  }

  get far(): number {
    return this._far;
  }

  update(): void {
    const viewProjectionDirty = this.viewDirty || this.projectionDirty;

    if (this.viewDirty) {
      const rotationLength = Math.hypot(this._rotation[0], this._rotation[1], this._rotation[2], this._rotation[3]);

      this.normalizedRotation[0] = this._rotation[0] / rotationLength;
      this.normalizedRotation[1] = this._rotation[1] / rotationLength;
      this.normalizedRotation[2] = this._rotation[2] / rotationLength;
      this.normalizedRotation[3] = this._rotation[3] / rotationLength;

      // 1. Get the rotation matrix from the quaternion (R)
      mat4.fromQuat(this.normalizedRotation, this.viewMatrix);

      // 2. Transpose it. Now viewMatrix = R^-1
      mat4.transpose(this.viewMatrix, this.viewMatrix);

      // 3. Negate the position. Now negPosition = T^-1
      vec3.negate(this._position, this.negativePosition);

      // 4. Multiply: R^-1 * T^-1.
      // In wgpu-matrix, mat4.translate(M, v) is M * Translation(v).
      // This gives us the final View Matrix without ever calling invert().
      mat4.translate(this.viewMatrix, this.negativePosition, this.viewMatrix);

      this.viewDirty = false;
    }

    // 5. Build Projection Matrix (only if needed)
    if (this.projectionDirty) {
      mat4.perspective(this._fov, this._aspect, this._near, this._far, this.projectionMatrix);
      this.projectionDirty = false;
    }

    // 6. Combine (only if either source matrix changed)
    if (viewProjectionDirty) {
      mat4.multiply(this.projectionMatrix, this.viewMatrix, this._viewProjectionMatrix);
    }
  }

  get viewProjectionMatrix(): Float32Array {
    return this._viewProjectionMatrix as Float32Array;
  }
}
