import { type DrawMeshCommand, drawMesh } from '@/engine/rendering/commands/DrawMeshCommand';

export type RenderCommand = { priority: number } & DrawMeshCommand;

type RenderCommandFunction = (pass: GPURenderPassEncoder, command: RenderCommand) => void;
const commandFunctions: Record<RenderCommand['kind'], RenderCommandFunction> = {
  drawMesh,
};

export class RenderQueue {
  private readonly commands: RenderCommand[] = [];

  push(command: RenderCommand): void {
    this.commands.push(command);
  }

  clear(): void {
    this.commands.length = 0;
  }

  execute(pass: GPURenderPassEncoder): void {
    this.commands.sort((a, b) => a.priority - b.priority);

    for (const command of this.commands) {
      commandFunctions[command.kind](pass, command);
    }
  }
}
