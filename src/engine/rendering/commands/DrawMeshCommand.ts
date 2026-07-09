export type DrawMeshCommand = {
  kind: 'drawMesh';
  pipeline: GPURenderPipeline;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
  indexFormat: GPUIndexFormat;
  bindGroups?: { index: number; bindGroup: GPUBindGroup }[];
};

export function drawMesh(pass: GPURenderPassEncoder, command: DrawMeshCommand): void {
  if (!command.indexCount) return;

  pass.setPipeline(command.pipeline);
  pass.setVertexBuffer(0, command.vertexBuffer);
  pass.setIndexBuffer(command.indexBuffer, command.indexFormat);

  if (command.bindGroups) {
    for (const { index, bindGroup } of command.bindGroups) {
      pass.setBindGroup(index, bindGroup);
    }
  }

  pass.drawIndexed(command.indexCount);
}
