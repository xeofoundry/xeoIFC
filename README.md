<!-- Generated file: edit the source in the dev repository. sha256:a603cbddb8b076ed -->
# xeoIFC

Public repository of xeoIFC, the xeoFoundry IFC toolkit.

Try xeoIFC Web, the WebAssembly demo viewer:
https://xeofoundry.github.io/xeoIFC/

xeoIFC is a Rust engine for reading, querying, tessellating, converting and writing IFC (`.ifc`, `.ifczip`; IFC 2x3 to IFC 4.3).
It is delivered in four forms:

1. **Command-line converter** — Windows AMD64, Linux ARM64, Linux AMD64; IFC to glTF/GLB with xeokit metadata, XKT for xeokit,
   and SLPK (I3S) for Esri ArcGIS. The successor to cxconverter.
2. **Native library** - `xeoifc.dll` / `libxeoifc.so` with a C ABI, for desktop and server applications in C++, C#, Python, Java, ...
3. **WebAssembly library** - wasm modules with a JavaScript/TypeScript API, for web applications; runs entirely in the browser.
4. **Loader for xeokit** - loads IFC directly into a xeokit viewer, without server side conversion steps.

The two libraries are the same engine with the same function groups, one for the browser and one for native programs; each
comes with an open-source demo viewer (xeoIFC Web, xeoIFC Qt). All four forms run on this engine, and the libraries and the
command-line tool share one document API (JSON ops in, JSON results out) for query, edit, split and merge; see
[Architecture](#architecture). The same API creates IFC models from scratch; see [Authoring](#authoring).


## 1. Command-line converter

The native converter turns `.ifc` and `.ifczip` files into glTF 2.0 (`.glb`, `.gltf`), xeokit `.xkt`, Esri `.slpk` (I3S) or a self-contained `.html` viewer, plus
xeokit-style metadata JSON. It keeps the cxconverter command-line flags and `cxconverter.json` configuration shape.

```powershell
.\xeoifc.exe -i Duplex.ifc -o test\duplex.glb
```

<!-- Features, options, output files and license key: [converter/README.md](converter/README.md) -
[configuration file](converter/configuration.md) - [metadata JSON format](converter/metadata-format.md)


# xeoIFC command-line converter

The xeoIFC converter is a native command-line application (Windows AMD64, Linux ARM64, Linux AMD64) for `.ifc` and `.ifczip` files. It
writes glTF 2.0 output (`.glb`, `.gltf`), xeokit `.xkt`, I3S `.slpk` or a self-contained `.html` viewer, plus metadata (xeokit-style JSON or a
metadata IFC) and a manifest JSON, with cxconverter-compatible configuration and output conventions.

It is one host of the xeoIFC toolkit; see the [repository overview](../README.md) for the WebAssembly library, the xeokit loader and the
native library.

-->



## Compatibility

xeoIFC targets xeokit-compatible glTF/GLB and metadata output. It is designed as a successor to
cxconverter, so existing conversion setups can keep using the familiar command-line flags and
`cxconverter.json` configuration shape.

For xeokit conversion tooling, see:
https://github.com/xeokit/xeokit-convert

## Features

- Extraction of the element tree structure from the IFC model and export as a scene graph, preserving GUIDs to enable metadata linking in xeokit.

- Conversion of IFC geometric representations to points, polylines, triangle meshes, and text labels for GPU rendering.

- Configurable export settings via a JSON configuration file.

- Filtering to exclude elements by type or GUID.

- Filtering to include only specified types or GUIDs.

- Mesh deduplication and element sorting to improve output size.

- [Outer-shape extraction](#outer-shape-extraction): remove hidden geometry from a model or a federation of models.

- Metadata export for property sets, element quantities, types, units, and related IFC data.

- Extraction of group and zone associations from the IFC model into the metadata JSON file.

- Metadata as IFC (`.ifc`, `.ifczip`): the input model without its geometry, next to the glTF or XKT output.

- Optional visualization of opening elements in IFC models, which are normally not visible in IFC viewers.

- Support for `.ifc` and `.ifczip` inputs.

- Native command-line application for batch processing.

- Compatibility-focused support for current IFC 4.3 files and older IFC versions such as IFC 2x3.

## Run the application

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.glb -m myModel.json
```

On Linux the call is the same, without `.exe`.

Options:

```text
-i, --input-path      input .ifc/.ifczip file or directory; repeat for several inputs
-o, --output-path     output .glb, .gltf, .xkt, .slpk or .html path; outer-shape extraction also supports .ifc/.ifczip
-m, --metadata-path   metadata output path: .json, or .ifc / .ifczip for a metadata IFC; no separate metadata file when omitted
--extract-outer-shape extract outer geometry; without -o, write out/{name}.outer.ifc for each input
-c                    configuration JSON path, see configuration.md
--license-key <key>   license key (overrides the XEO_IFC_LICENSE_KEY environment variable)
--accept-terms        accept the xeoIFC Testing License and run in evaluation mode without the y/N prompt
-v                    print version number
-h, --help            print help
```

Input files can be zipped (`.ifczip`), which saves significant disk space. With a license key or `--accept-terms` the converter never
asks for input, so it can run unattended in scripts and services. The exit code is 0 on success and 1 on any error.
The output path is required unless outer-shape extraction is enabled.

More documentation:

- [configuration.md](configuration.md) - the optional JSON configuration file: filters, geometry and glTF options.
- [metadata-format.md](metadata-format.md) - the metadata JSON: objects, property sets, element quantities, units.

## Output file types

| Extension | Content |
|---|---|
| `.glb` | Binary glTF 2.0 in one file. Recommended: smaller and faster to read than `.gltf`. |
| `.gltf` | The same content as JSON text, plus a `.bin` file with the binary buffers. |
| `.xkt` | xeokit's native format, written directly (no separate xeokit-convert step). The metadata is embedded. |
| `.slpk` | I3S 3D Object scene layer package for ArcGIS, with IFC element attributes and property sets embedded. Requires a projected coordinate system in metres. |
| `.html` | The complete model in one self-contained HTML document with a 3D viewer and a tree view of the project structure. It can be shared and opened in a web browser without a web server and without installing anything. |
| `.ifc`, `.ifczip` | With outer-shape extraction: the source IFC with reduced geometry, not a metadata-only IFC. See below. |

Output paths are used exactly as given; spaces in file names are kept.

## Outer-shape extraction

`--extract-outer-shape` (alias `--extractOuterShape`) removes geometry hidden from outside the model. It is useful for
lighter coordination and visualization models without manually selecting individual IFC elements. By default, a mesh
instance is kept whole if any of its triangles is visible; fully hidden instances can be removed.

Use a converter build whose `--help` lists `--extract-outer-shape`; older downloads may not include these options.

### Single model and federated inputs

Create a reduced GLB:

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.outer.glb --extract-outer-shape --accept-terms
```

Omit `-o` to write `out/myModel.outer.ifc` instead:

```powershell
.\xeoifc.exe -i myModel.ifc --extract-outer-shape --accept-terms
```

IFC output keeps the elements, GUIDs, properties, spatial structure and georeferencing. Elements with no retained geometry
lose their body; partially retained bodies are rewritten from the kept triangles. With the default whole-mesh setting,
unchanged bodies retain their authored geometry. This is different from `-m model.meta.ifc`, which removes all geometry.

For a federation, repeat `-i` or supply a directory. A directory includes its `.ifc` and `.ifczip` files, not subfolders.
Visibility is computed jointly, so elements in one input can hide elements in another. Inputs are placed using their
`IfcMapConversion`; models must be spatially aligned, and different coordinate systems are not reprojected automatically.
Without `-o`, each input gets its own `out/{name}.outer.ifc`. An explicit multi-input IFC output must use a `{name}` pattern,
for example `-o 'out/{name}.outer.ifc'`.

Create one SLPK from a folder of models, allowing visibility through transparent objects:

```powershell
.\xeoifc.exe -i .\models -o out\outer-shape.slpk --extract-outer-shape `
  --no-outer-shape-transparent-opaque --outer-shape-refine-passes 512 `
  --outer-shape-unresolved-policy keep --accept-terms
```

To select specific files instead of a folder, repeat `-i`. IFC and IFCZIP inputs can be mixed; this creates one combined SLPK:

```powershell
.\xeoifc.exe -i electrical.ifczip -i wallsAndSlabs.ifc -i windows.ifc -i terrain.ifc `
  -o out\outer-shape.slpk --extract-outer-shape `
  --no-outer-shape-transparent-opaque --accept-terms
```

For SLPK, the projected EPSG code comes from the inputs' `IfcProjectedCRS`. If none declares it, supply
`inputParameters.i3sWkid` in a configuration file passed with `-c`. Choose the code matching the model coordinates;
setting it does not transform them. SLPK keeps projected coordinates with Z up, rather than the glTF root rotation.

### Visibility settings

| Option | Default | Effect |
|---|---|---|
| `--outer-shape-strategy` | `gpu-raster` | GPU visibility sampling with adaptive close-ups and bounded ray recovery. Alternatives: CPU `raster` or `hybrid` (raster plus ray checks). If the GPU backend is unavailable, the CLI warns and falls back to CPU raster. |
| `--outer-shape-quality` | `fine` for GPU; `standard` for CPU | `fast`, `standard`, `fine` use 32, 70, 168 total views and 512, 1024, 2048 pixels per edge respectively. |
| `--outer-shape-view-directions` | `0` | Override with 1–4096 sampled directions, plus six fixed axis views. Zero uses the quality preset. |
| `--outer-shape-resolution` | `0` | Override the depth-buffer edge with 64–4096 pixels. Zero uses the quality preset; GPU close-ups use at least 512 pixels. |
| `--outer-shape-refine-passes` | `512` | Maximum adaptive GPU close-up passes, from 0 to 4096. Zero disables close-ups and ray recovery. Each pass evaluates multiple views, not just one image. |
| `--outer-shape-unresolved-policy` | `keep` | GPU-only: preserve unresolved meshes whole (`keep`) or remove them (`drop`). |
| `--no-outer-shape-keep-whole-meshes` | Whole meshes kept | Retain only triangles found visible instead of promoting a partly visible mesh to its whole geometry. Unresolved meshes still follow the keep/drop policy. |
| `--no-outer-shape-transparent-opaque` | Transparent objects occlude | With this flag, transparent objects hide nothing behind them. Their appearance is unchanged. |

The close-up budget and unresolved policy apply to the GPU backend. CLI options override the corresponding values under
`inputParameters` in a configuration file, for example:

```json
{
  "inputParameters": {
    "extractOuterShape": 1,
    "extractOuterShapeRefinePasses": 512,
    "extractOuterShapeUnresolvedPolicy": "keep",
    "extractOuterShapeTransparentOpaque": false
  }
}
```

### Keep or remove unresolved geometry

An unresolved mesh is **not proven hidden**. Small objects, thin surfaces and narrow openings can be missed by sampling.

- **`keep`** is safer against missing elements, but can retain substantial amounts of actually hidden geometry.
- **`drop`** produces a smaller result, but can remove visible elements that the visibility tests did not resolve.
- With **`keep`**, lowering the close-up budget can make the file **larger**, not smaller: more uncertain meshes may survive
  whole. Increasing the budget spends more time trying to resolve them; it does not guarantee complete visibility detection.

The `extractOuterShape refine:` log line and the manifest's `generalMessages` report the actual passes, unresolved meshes
and triangles kept or dropped, and ray-recovery counts. Use these alongside a visual comparison with the original model.

Extraction is an approximate visibility reduction, **not a watertight exterior solid**. Check thin elements, transparent
enclosures and recessed geometry before using the result. More views or a higher resolution improve sampling coverage,
but do not guarantee that every externally visible element is retained.

## Metadata file types

The extension of the `-m` path selects the metadata format:

| Extension | Content |
|---|---|
| `.json` | xeokit-style metadata JSON: object tree, property sets, element quantities, materials, groups and units. See [metadata-format.md](metadata-format.md). |
| `.ifc` | Metadata IFC: the input model without its geometry. It keeps the original header, the spatial structure, elements, types, property sets, quantities, materials, relationships and object placements. Shape representations and their styles are left out, and identical property values are stored once. |
| `.ifczip` | The metadata IFC, zipped. |

Any other extension gets `.json` appended.

A metadata IFC is a valid IFC file: any IFC software reads it, and IFC stays the only format of the model data. It is the metadata of
the glTF or XKT from the same conversion, matched by IFC GlobalId, for example with `XeoIFCLoaderPlugin.loadMetadata()` of the
[xeokit loader](https://xeofoundry.github.io/xeoIFC/xeokit-direct-ifc-loading/).

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.xkt -m myModel.meta.ifczip
```

The sample `Duplex.ifc` (2.4 MB) gives a 0.6 MB metadata IFC, 0.15 MB as `.ifczip`; its metadata JSON is 0.4 MB. The
[metadata options and filters](configuration.md#metadata-options) of the configuration file apply to the JSON only: a metadata IFC
always contains the whole model. Without a license key it carries no watermark, see [License key](#license-key).

## Manifest file

Every conversion also writes a manifest next to the output file, named after it: `myModel.glb` gives `myModel.manifest.json`.

```json
{
    "inputFile": "myModel.ifc",
    "converterApplication": "xeoifc.exe",
    "converterApplicationVersion": "1.0.11",
    "conversionDate": "2026-09-18 18:10:20",
    "gltfOutFiles": [ "myModel.glb" ],
    "metadataOutFiles": [ "myModel.json" ],
    "numGltfNodes": 1032,
    "numGltfAccessors": 360,
    "numGltfAccessorsIncludingReused": 1428,
    "numGltfMeshes": 247,
    "numGltfMeshesIncludingReused": 714,
    "numGltfVertices": 8565,
    "numGltfVerticesIncludingReused": 18469,
    "numGltfTriangles": 8518,
    "numGltfTrianglesIncludingReused": 27746,
    "numCreatedMetaObjects": 246,
    "numExportedPropertySetsOrElementQuantities": 1492,
    "modelBoundsMin": [ -0.2415, -1.55, -4.3827 ],
    "modelBoundsMax": [ 9.0415, 9.0, 22.1827 ],
    "generalMessages": [],
    "warnings": [],
    "errors": []
}
```

Paths are written the way they were given on the command line. The `...IncludingReused` counters show the size of the model
without deduplication; the difference is what the re-use of identical geometry saves. `warnings` and `errors` repeat the messages of
the conversion, so a calling service does not have to parse the console output.

## Units and coordinate system

The coordinates of points, lines and triangles in the output are always in metres, regardless of the project units of the IFC file
(metre, millimetre, foot, inch, ...).

IFC models are z-up, glTF defines y as the up axis. The converter writes the coordinates unchanged (z-up) and adds a root node
named `Z_UP` with a rotation of 90 degrees around the x axis, so that viewers show the model upright. The rotation can be changed
with `gltfRootNodeRotationVector` and `gltfRootNodeRotationInDegrees` in the [configuration file](configuration.md).

## License key

You can use the converter for testing without a license key. It then runs in evaluation mode: it asks you to accept the
[xeoIFC Testing License](https://xeofoundry.github.io/xeoIFC/xeoIFC-Testing-License.txt)
(`Do you accept the xeoIFC Testing License? [y/N]`; pass `--accept-terms` to accept without the prompt), adds
a visible "Evaluation version" watermark to the 3D output and appends " - evaluation version" to the name of the model root in the
metadata. Supplying a valid license key removes the prompt, the watermark and the suffix.

Without a key, every IFC file the tool writes (`split`, `merge`, `run`, `serve --mcp`) carries the "Evaluation version" text too. The
one exception is a metadata IFC written with `-m`: it is a sidecar of the 3D output (`-o`), which carries the watermark.

The key is taken from `--license-key`, else from the `XEO_IFC_LICENSE_KEY` environment variable, else from `licenseKey` in the
configuration file. An invalid or expired key stops the conversion with exit code 1; the converter does not silently fall back to
evaluation mode.

## Document API subcommands

The document API subcommands (`query`, `split`, `merge`, `run`, `serve --mcp`) are shown in the
[integration map](architecture/integration-map.md).

---






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
