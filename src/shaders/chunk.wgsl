struct CameraUniforms {
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;
@group(0) @binding(1) var<uniform> timestamp: f32;

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
  output.position = camera.projectionMatrix * camera.viewMatrix * vec4<f32>(input.position, 1.0);
  output.normal = input.normal;
  return output;
}

fn rotateHue(color: vec3f, angle: f32) -> vec3f {
  let k = vec3f(0.57735, 0.57735, 0.57735); 
  let cosAngle = cos(angle);
  let sinAngle = sin(angle);
  
  let rotatedColor = color * cosAngle + cross(k, color) * sinAngle + k * dot(k, color) * (1.0 - cosAngle);
                    
  return rotatedColor;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let normal = normalize(input.normal);
  let lightDir = normalize(vec3<f32>(0.5, 1.0, 0.8));
  let ambient = 0.2;
  let diffuse = max(dot(normal, lightDir), 0.0) * 0.8;
  let lighting = ambient + diffuse;

  let baseColor = vec3<f32>(0.2, 0.6, 1.0);
  let finalColor = rotateHue(baseColor, radians(length(input.position) + timestamp * 360.0 * 2.0)) * lighting * (sin(radians(timestamp * 360.0 * 0.125)) * 0.2 + 0.9);

  return vec4<f32>(finalColor, 1.0);
}
