<!-- Generated file: edit the source in the dev repository. sha256:de3e3a04b055e6ee -->
# xeoIFC

Public repository of xeoIFC, the xeoFoundry IFC toolkit.

Try xeoIFC Web, the WebAssembly demo viewer:
https://xeofoundry.github.io/xeoIFC/

xeoIFC is a Rust engine for reading, querying, tessellating, converting and writing IFC (`.ifc`, `.ifczip`; IFC 2x3 to IFC 4.3).
It is delivered in four forms:

1. **Command-line converter** — Windows AMD64, Linux ARM64, Linux AMD64; IFC to glTF/GLB with xeokit metadata, XKT for xeokit,
   and SLPK (I3S) for Esri ArcGIS. The successor to cxconverter.
2. **Native library** - `xeoifc.dll` / `libxeoifc.so` with a C ABI, for desktop and server applications in C++, C#, Python, Java, ...
3. **WebAssembly library** - wasm modules with a JavaScript/TypeScript API, for web applications.
4. **Loader for xeokit** - loads IFC directly into a xeokit viewer, without server side conversion steps.

The two libraries are the same engine with the same function groups, one for the browser and one for native programs. Each
comes with an open-source demo viewer (xeoIFC Web, xeoIFC Qt). All four forms run on this engine, and the libraries and the
command-line tool share one document API (JSON ops in, JSON results out) for create, query, edit, split and merge.


## 1. Command-line converter

The native converter turns `.ifc` and `.ifczip` files into glTF 2.0 (`.glb`, `.gltf`) with xeokit metadata, xeokit `.xkt`, Esri `.slpk` (I3S) or a self-contained `.html` viewer. It keeps the cxconverter command-line flags and `cxconverter.json` configuration shape.

```powershell
.\xeoifc.exe -i Duplex.ifc -o test\duplex.glb
```

Features, options, output files and license key: [converter/README.md](converter/README.md)



## 2. Native library

`xeoifc.dll` (`libxeoifc.so` on Linux) exposes the engine through a C ABI for desktop and server applications in C++, C#,
Python, Java and other languages.

Library details, examples and the Qt demo viewer: [Native library](native/README.md).

## 3. WebAssembly library

The WebAssembly library is the xeoIFC engine for web applications: wasm modules with JavaScript bindings and TypeScript
declarations. IFC files are processed in the browser; nothing is uploaded.

Library details, demo viewer, features and downloads: [WebAssembly library](webassembly/README.md).


## 4. Loader for xeokit (XeoIFCLoaderPlugin)

The WebAssembly library also feeds a [xeokit](https://github.com/xeokit/xeokit-sdk) viewer directly, without a conversion step:
the plugin runs xeoIFC in a Web Worker, unpacks its geometry buffer into a xeokit `SceneModel`, builds the `MetaModel` from the
object tree and queries property sets from the loaded model. It loads `.ifc` and `.ifczip` files (no upload of
any data).

Documentation and live examples:
https://xeofoundry.github.io/xeoIFC/xeokit-direct-ifc-loading/

The examples: a xeokit viewer that loads dropped files, and metadata from IFC for geometry from XKT.

## Authoring

**New and experimental:** IFC authoring is still under active development.

The document API creates IFC models from scratch, including geometry, materials and property sets. The command-line tool
runs authoring scripts. See [Authoring](authoring/README.md) for examples, screenshots and code.

## Architecture

One Rust engine powers the WebAssembly library, the command-line converter and the native library, with a shared document
API and geometry engine. See [Architecture](architecture/integration-map.md) for details.

## Third-party software

The xeoIFC libraries and the converter include open-source components (Rust crates under MIT, Apache-2.0,
ISC, Zlib and similar permissive licences, among them `laz` for LAZ point clouds, `wgpu`, `i_overlay`,
`earcutr` and `delaunator`), plus code derived from jcadlib and csg.js. The full list with all licence
texts ships as `THIRD-PARTY-NOTICES.txt` in every release package and with xeoIFC Web:
[THIRD-PARTY-NOTICES.txt](https://xeofoundry.github.io/xeoIFC/THIRD-PARTY-NOTICES.txt)
