**Voxel Craft 3D** is a voxel sandbox game inspired by Minecraft.

**Technologies**:

- Vite
  - development server on port 8000 (appType: MPA)
  - build bundler
  - `@` alias pointing to `./src` directory
- Typescript
  - strict mode
  - webgpu and 2d Canvas API
- SCSS
- Prettier
  - force semicolons
  - single qoutes
  - 2 spaces indentation
  - 120 characters width

**Node.js dependencies**:

- vite@8 (dev)
- sass@1 (dev)
- typescript@6 (dev)

**Project structure**:

```text
index.html
src/
  styles/
    main.scss
  shared/
    types/ (.d.ts files)
    dom.ts (DOM helpers)
  app/
    main.ts (app entrypoint)
  webgpu/ (WebGPU helpers and abstractions)
  assets/
    shaders/ (.wgsl shaders)
    textures/ (.png textures)
  engine/
    core/
    graphics/
      2d/
      webgpu/
    rendering/
    input/
    world/
    math/
  wasm/
    bin/ (generated .wasm files)
    source/ (.c source files)
    Makefile
  workers/ (.ts worker files)
```

**Style guide**:

- use aliased paths when possible (except outside of `./src` directory)
- classes are `PascalCase`
- variables and objects (let, const) are `camelCase`
- constants (constant values) are `UPPERCASE_SNAKE_CASE`
- do not use redundant `public` keywords (only) for methods
- use descriptors for constructors and methods that need many parameters
- use `// prettier-ignore` where the code should not be formated
- every function and method must have a return type defined

**Important files (fragments)**:

src/shared/types/vite.d.ts

```ts
/// <reference types="vite/client" />

declare module '*.scss';
declare module '*.wgsl?raw';
```

index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Voxel Craft 3D</title>
  </head>
  <body>
    <div id="container">
      <canvas id="world-canvas"></canvas>
      <canvas id="overlay-canvas"></canvas>
    </div>

    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

src/styles/main.scss

```scss
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  background-color: black;
  color: white;
}

#container {
  width: 100%;
  height: 100vh;
  position: fixed;
  inset: 0;
}

#world-canvas,
#overlay-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

// ...
```

src/webgpu/WebGPUContext.ts

```ts
export class WebGPUContext {
  public readonly adapter: GPUAdapter;
  public readonly device: GPUDevice;
  public readonly preferredCanvasFormat: GPUTextureFormat;

  private constructor(adapter: GPUAdapter, device: GPUDevice, format: GPUTextureFormat) {
    this.adapter = adapter;
    this.device = device;
    this.preferredCanvasFormat = format;
  }

  static async create(): Promise<WebGPUContext> {
    // ...
  }

  get queue(): GPUQueue {
    return this.device.queue;
  }

  destroy(): void {
    this.device.destroy();
  }
}
```

src/app/main.ts

```ts
import '@/styles/main.scss';

// ...
```
