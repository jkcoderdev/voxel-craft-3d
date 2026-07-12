export class HeightMapCache {
  private readonly capacity: number;

  private readonly outer: Map<number, Map<number, number>> = new Map();
  private readonly ringX: Float64Array;
  private readonly ringZ: Float64Array;
  
  private cursor = 0;
  private count = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('capacity must be a positive integer');
    }

    this.capacity = capacity;
    this.ringX = new Float64Array(capacity);
    this.ringZ = new Float64Array(capacity);
  }

  get size(): number {
    return this.count;
  }

  has(x: number, z: number): boolean {
    return this.outer.get(x)?.has(z) ?? false;
  }

  get(x: number, z: number): number | undefined {
    return this.outer.get(x)?.get(z);
  }

  set(x: number, z: number, value: number): void {
    if (this.outer.get(x)?.has(z)) return;
    this.writeEntry(x, z, value);
  }

  getOrCompute(x: number, z: number, compute: () => number): number {
    const cached = this.outer.get(x)?.get(z);
    if (cached !== undefined) return cached;

    const value = compute();
    this.writeEntry(x, z, value);
    return value;
  }

  clear(): void {
    this.outer.clear();
    this.cursor = 0;
    this.count = 0;
  }

  private writeEntry(x: number, z: number, value: number): void {
    if (this.count === this.capacity) {
      const oldX = this.ringX[this.cursor]!;
      const oldZ = this.ringZ[this.cursor]!;

      const oldInner = this.outer.get(oldX)!;
      oldInner.delete(oldZ);

      if (oldInner.size === 0) {
        this.outer.delete(oldX);
      }
    } else {
      this.count++;
    }

    this.ringX[this.cursor] = x;
    this.ringZ[this.cursor] = z;

    let inner = this.outer.get(x);
    if (inner === undefined) {
      inner = new Map();
      this.outer.set(x, inner);
    }
    inner.set(z, value);

    if (++this.cursor === this.capacity) {
      this.cursor = 0;
    }
  }
}