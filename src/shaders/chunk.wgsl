struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  timestamp: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
};

@vertex
fn vsMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  output.position = uniforms.viewProjectionMatrix * vec4<f32>(input.position, 1.0);
  output.normal = input.normal;
  return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let normal = normalize(input.normal);
  let lightDir = normalize(vec3<f32>(0.5, 1.0 - ((uniforms.timestamp % 1) * 0.2), 0.8));
  let ambient = 0.2;
  let diffuse = max(dot(normal, lightDir), 0.0) * 0.8;
  let lighting = ambient + diffuse;

  let baseColor = vec3<f32>(0.2, 0.6, 1.0);
  let finalColor = baseColor * lighting;

  return vec4<f32>(finalColor, 1.0);
}
