# xeoIFC

Public repository of the Creoox IFC to glTF conversion tool.

xeoIFC is a native Rust converter for `.ifc` and `.ifczip` files. It writes glTF 2.0 output
(`.glb`, `.gltf`, or `.html`) plus XeoKit-style metadata and manifest JSON, with cxconverter-compatible configuration and output conventions.

## Demo

Try the browser demo:
https://xeofoundry.github.io/xeoIfc/

The demo runs locally in the browser. Use **Open IFC...** to select an `.ifc` or `.ifczip` file from
your machine.

## Compatibility

xeoIFC targets XeoKit-compatible glTF/GLB and metadata output. It is designed as the Rust successor to
cxconverter, so existing conversion setups can keep using the familiar command-line flags and
`cxconverter.json` configuration shape.

For XeoKit conversion tooling, see:
https://github.com/xeokit/xeokit-convert

## Features include:

- Extraction of the element tree structure from the IFC model and export as a scene graph, preserving GUIDs to enable metadata linking in XeoKit.

- Conversion of IFC geometric representations to points, polylines, triangle meshes, and text labels for GPU rendering.

- Configurable export settings via a JSON configuration file.

- Filtering to exclude elements by type or GUID.

- Filtering to include only specified types or GUIDs.

- Mesh deduplication and element sorting to improve output size.

- File splitting to handle large models efficiently.

- Metadata export for property sets, element quantities, types, units, and related IFC data.

- Extraction of group and zone associations from the IFC model into the metadata JSON file.

- Optional visualization of opening elements in IFC models, which are normally not visible in IFC viewers.

- Support for `.ifc` and `.ifczip` inputs.

- Native Rust command-line application for batch processing.

- Compatibility-focused support for current IFC 4.3 files and older IFC versions such as IFC 2x3.

You can use the converter for testing without a license key. Without a license key, generated metadata
marks the model root as an evaluation version. Supplying a valid license key removes that marker.

## Build and run

```powershell
cargo build --release
.\target\release\xeoifc.exe -i Duplex.ifc -o test\duplex.glb
```

Common options:

```text
-i  input .ifc or .ifczip path
-o  output .glb, .gltf, or .html path
-m  metadata JSON output path
-c  configuration JSON path
-k  license key
-v  print version number
-h  print help
```

`cargo test` does not always leave a fresh release executable, so build explicitly before running
`xeoifc.exe`.

## CMake

Cargo remains the build system. `CMakeLists.txt` is a thin wrapper for Visual Studio, CLion, ctest, and
superbuild workflows, and stages the converter under `build\bin`.

```powershell
cmake -S . -B build
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```

Extra CMake targets:

```text
clippy
clippy-qt
format
web-build
viewer-qt
test-qt
```

To build without the runtime license check for internal builds:

```powershell
cmake -S . -B build -DXEOIFC_INTERNAL_BUILD=ON
```

## Web viewer

```powershell
cd web
npm install
npm run dev
npm run build
```

`npm run build` builds the wasm facade and writes the production bundle to `target\web`.

## Qt viewer

The native Qt viewer is separate from the default converter build. It requires Qt 6 and the C++ toolchain
expected by `cxx-qt`. If Qt is not auto-discovered, set `QMAKE` or put `qmake6` on `PATH`.

```powershell
cargo build -p viewer-qt
cmake --build build --target viewer-qt
cmake --build build --target test-qt
```

Distribution scripts live in `scripts\dist-qt*` and write packages under `dist\`.

## Debugging

Diagnostic environment variables:

| Variable | Effect |
|---|---|
| `XEOIFC_DEBUG=1` | Print scene statistics after geometry conversion. |
| `XEOIFC_CLIP_DEBUG=1` | Print per-plane trace output from the convex clipper. |
| `XEOIFC_CSG_DUMP=<dir>` | Write per-stage OBJ dumps for CSG operands and results. |
| `XEOIFC_PROFILE=1` | Print CSG kernel stage timings with scene statistics. |
| `XEO_NO_FAST2D=1` | Disable the 2D extrusion fast path. |
| `XEO_CSG_ALL=1` | Route every boolean operation through the CSG kernel. |
| `RUST_BACKTRACE=1` | Print a Rust backtrace on panic. |

## License

The Rust workspace is licensed as `MIT OR Apache-2.0`.
