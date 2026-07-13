export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

const PLANE_COUNT = 6;
const COMPONENTS_PER_PLANE = 4;
const TOTAL_COMPONENTS = PLANE_COUNT * COMPONENTS_PER_PLANE;

/**
 * View frustum for culling objects outside the camera's field of view.
 *
 * Extracts 6 planes (left, right, bottom, top, near, far) from the
 * view-projection matrix and tests axis-aligned bounding boxes against them.
 *
 * Designed for WebGPU clip space where z ∈ [0, 1].
 */
export class Frustum {
  private readonly planes = new Float32Array(TOTAL_COMPONENTS);

  /**
   * Extract frustum planes from a column-major view-projection matrix.
   *
   * The VP matrix is expected in column-major order (as produced by wgpu-matrix).
   * After extraction, each plane is normalized so that [a, b, c] forms a unit
   * normal and the signed distance from a point (x, y, z) to the plane is
   * simply `a*x + b*y + c*z + d`.
   */
  extractFromViewProjection(vp: Float32Array): void {
    const p = this.planes;

    // Left plane: row3 + row0
    p[0] = vp[3] + vp[0];
    p[1] = vp[7] + vp[4];
    p[2] = vp[11] + vp[8];
    p[3] = vp[15] + vp[12];
    this.normalizePlane(0);

    // Right plane: row3 - row0
    p[4] = vp[3] - vp[0];
    p[5] = vp[7] - vp[4];
    p[6] = vp[11] - vp[8];
    p[7] = vp[15] - vp[12];
    this.normalizePlane(1);

    // Bottom plane: row3 + row1
    p[8] = vp[3] + vp[1];
    p[9] = vp[7] + vp[5];
    p[10] = vp[11] + vp[9];
    p[11] = vp[15] + vp[13];
    this.normalizePlane(2);

    // Top plane: row3 - row1
    p[12] = vp[3] - vp[1];
    p[13] = vp[7] - vp[5];
    p[14] = vp[11] - vp[9];
    p[15] = vp[15] - vp[13];
    this.normalizePlane(3);

    // Near plane: row2 (WebGPU z ∈ [0, 1])
    p[16] = vp[2];
    p[17] = vp[6];
    p[18] = vp[10];
    p[19] = vp[14];
    this.normalizePlane(4);

    // Far plane: row3 - row2
    p[20] = vp[3] - vp[2];
    p[21] = vp[7] - vp[6];
    p[22] = vp[11] - vp[10];
    p[23] = vp[15] - vp[14];
    this.normalizePlane(5);
  }

  /**
   * Test whether an AABB is inside or intersecting the frustum.
   *
   * Uses the "positive vertex" test: for each plane, the corner of the AABB
   * farthest along the plane's normal is tested. If that corner lies on the
   * negative side of any plane, the entire AABB is outside the frustum.
   *
   * Returns `true` if the AABB is potentially visible (inside or intersecting),
   * `false` if it is fully outside and should be culled.
   */
  containsAABB(aabb: AABB): boolean {
    for (let i = 0; i < PLANE_COUNT; i++) {
      const offset = i * COMPONENTS_PER_PLANE;
      const a = this.planes[offset];
      const b = this.planes[offset + 1];
      const c = this.planes[offset + 2];
      const d = this.planes[offset + 3];

      // Positive vertex: the AABB corner farthest along the plane normal
      const px = a >= 0 ? aabb.maxX : aabb.minX;
      const py = b >= 0 ? aabb.maxY : aabb.minY;
      const pz = c >= 0 ? aabb.maxZ : aabb.minZ;

      // If positive vertex is outside this plane, the whole AABB is outside
      if (a * px + b * py + c * pz + d < 0) {
        return false;
      }
    }

    return true;
  }

  private normalizePlane(index: number): void {
    const offset = index * COMPONENTS_PER_PLANE;
    const a = this.planes[offset];
    const b = this.planes[offset + 1];
    const c = this.planes[offset + 2];
    const length = Math.sqrt(a * a + b * b + c * c);

    if (length === 0) return;

    const invLength = 1 / length;
    this.planes[offset] *= invLength;
    this.planes[offset + 1] *= invLength;
    this.planes[offset + 2] *= invLength;
    this.planes[offset + 3] *= invLength;
  }
}
