# Voxel Craft 3D

A voxel sandbox game.

![Voxel Craft 3D Screenshot](achievements/5-block-placing-and-removing.png 'Voxel Craft 3D Screenshot')

## Setup

> The entire guide currently covers Windows only.

### Prerequisites

- [Git](https://git-scm.com/install/)
- [Node.js](https://nodejs.org/) with npm
- [Visual Studio Code](https://code.visualstudio.com/)
- [Emscripten SDK](https://emscripten.org/docs/getting_started/downloads.html)
- [GNU Make](https://www.gnu.org/software/make/)

### Project configuration

Copy the C/C++ IntelliSense template:

```bat
copy .vscode\c_cpp_properties.template.json .vscode\c_cpp_properties.json
```

Open `.vscode/c_cpp_properties.json` and replace both occurrences of:

```text
<Emscripten SDK Repository Folder>
```

with the absolute path to the Emscripten SDK repository. Use forward slashes. For an SDK installed at `C:\tools\emsdk`, the values should be:

```json
"emsdk": "C:/tools/emsdk",
"emscriptenSysroot": "C:/tools/emsdk/upstream/emscripten/cache/sysroot"
```

The configured `.vscode/c_cpp_properties.json` file is ignored by Git because the SDK path is specific to each computer.

## Building WebAssembly

Use an Emscripten Command Prompt, or activate the SDK in the current Command Prompt before building:

```bat
call C:\tools\emsdk\emsdk_env.bat
```

Create a debug build:

```bat
make -C src\wasm debug
```

Create a release build:

```bat
make -C src\wasm release
```

Remove the WebAssembly build outputs:

```bat
make -C src\wasm clean
```

The Makefile compiles every `.c` and `.cpp` file in `src/wasm/source` as a separate WebAssembly module. It writes binary modules to `src/wasm/bin` and WebAssembly text files to `src/wasm/wat`, preserving each source filename. For example:

```text
src/wasm/source/coordinator.c
  -> src/wasm/bin/coordinator.wasm
  -> src/wasm/wat/coordinator.wat
```

The debug and release targets use the same output filenames, so running one replaces the output from the other.

## Running the Development Server

Start the Vite development server:

```bat
npm run dev
```

## Production Build

Compile the release WebAssembly modules, then build the web application:

```bat
make -C src\wasm release
npm run build
```

The web application build is written to `dist`.

## Recommended Extensions for VSCode

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- [Makefile Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.makefile-tools)
- [WebAssembly DWARF Debugging](https://marketplace.visualstudio.com/items?itemName=ms-vscode.wasm-dwarf-debugging)
- [WebAssembly](https://marketplace.visualstudio.com/items?itemName=dtsvet.vscode-wasm)
- [WGSL](https://marketplace.visualstudio.com/items?itemName=PolyMeilex.wgsl)
