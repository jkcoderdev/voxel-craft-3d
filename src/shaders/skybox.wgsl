struct CommonUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  timestamp: f32,
};

@group(0) @binding(0) var<uniform> commonUniforms: CommonUniforms;

struct SkyboxUniforms {
  cameraPosition: vec3<f32>,
  skyboxSize: f32,
};

@group(1) @binding(0) var<uniform> skybox: SkyboxUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) direction: vec3<f32>,
};

@vertex
fn vsMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let worldPosition = skybox.cameraPosition + input.position * skybox.skyboxSize;

  output.position = commonUniforms.viewProjectionMatrix * vec4<f32>(worldPosition, 1.0);
  output.direction = input.position;
  return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let direction = normalize(input.direction);
  let horizonColor = vec3<f32>(0.72, 0.86, 1.0);
  let zenithColor = vec3<f32>(0.08, 0.28, 0.72);
  let nadirColor = vec3<f32>(0.035, 0.06, 0.12);

  let horizonToZenith = smoothstep(-0.12, 0.78, direction.y);
  var color = mix(horizonColor, zenithColor, horizonToZenith);

  let belowHorizon = 1.0 - smoothstep(-0.42, 0.02, direction.y);
  color = mix(color, nadirColor, belowHorizon);

  let sunDirection = normalize(vec3<f32>(-0.45, 0.65, -0.6));
  let sunAlignment = max(dot(direction, sunDirection), 0.0);
  let sunGlow = pow(sunAlignment, 32.0) * 0.22;
  let sunDisk = smoothstep(0.997, 0.9995, sunAlignment);
  let sunColor = vec3<f32>(1.0, 0.78, 0.38);
  let diskColor = vec3<f32>(1.0, 0.97, 0.82);

  color += sunColor * sunGlow;
  color = mix(color, diskColor, sunDisk);

  return vec4<f32>(color, 1.0);
}
