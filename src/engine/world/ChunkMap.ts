import type { Chunk } from '@/engine/world/Chunk';

export class ChunkMap {
  private readonly chunks: Map<number, Map<number, Chunk>> = new Map();

  has(cx: number, cz: number): boolean {
    const inner = this.chunks.get(cx);
    if (!inner) return false;

    return inner.has(cz);
  }

  set(cx: number, cz: number, chunk: Chunk): void {
    let inner = this.chunks.get(cx);
    if (!inner) {
      inner = new Map();
      this.chunks.set(cx, inner);
    }

    if (inner.has(cz)) {
      throw new Error(`Chunk [${cx}:${cz}] already exists`);
    }

    inner.set(cz, chunk);
  }

  get(cx: number, cz: number): Chunk {
    const chunk = this.chunks.get(cx)?.get(cz);
    if (!chunk) {
      throw new Error(`Chunk [${cx}:${cz}] doesn't exist and therefore can't be accessed`);
    }

    return chunk;
  }

  *getAll(): IterableIterator<Chunk> {
    for (const inner of this.chunks.values()) {
      yield* inner.values();
    }
  }

  delete(cx: number, cz: number): boolean {
    const inner = this.chunks.get(cx);
    if (!inner) return false;

    const existed = inner.delete(cz);

    if (inner.size === 0) {
      this.chunks.delete(cx);
    }

    return existed;
  }

  clear(): void {
    this.chunks.clear();
  }
}
