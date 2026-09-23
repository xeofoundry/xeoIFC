<!-- Generated file: edit the source in the dev repository. sha256:ac90c7b75d2d70af -->
# xeoIFC command-line converter

The xeoIFC converter is a native command-line application (Windows AMD64, Linux ARM64, Linux AMD64) for `.ifc` and `.ifczip` files. It
writes glTF 2.0 output (`.glb`, `.gltf`), xeokit `.xkt` or a self-contained `.html` viewer, plus metadata (xeokit-style JSON or a
metadata IFC) and a manifest JSON, with cxconverter-compatible configuration and output conventions.

It is one host of the xeoIFC toolkit; see the [repository overview](../README.md) for the WebAssembly library, the xeokit loader and the
native library.

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
-i, --input-path      input .ifc or .ifczip path (required)
-o, --output-path     output .glb, .gltf, .xkt or .html path (required)
-m, --metadata-path   metadata output path: .json, or .ifc / .ifczip for a metadata IFC; no metadata is written when omitted
-c                    configuration JSON path, see configuration.md
--license-key <key>   license key (overrides the XEO_IFC_LICENSE_KEY environment variable)
--accept-terms        accept the xeoIFC Testing License and run in evaluation mode without the y/N prompt
-v                    print version number
-h, --help            print help
```

Input files can be zipped (`.ifczip`), which saves significant disk space. With a license key or `--accept-terms` the converter never
asks for input, so it can run unattended in scripts and services. The exit code is 0 on success and 1 on any error.

More documentation:

- [configuration.md](configuration.md) - the optional JSON configuration file: filters, geometry and glTF options.
- [metadata-format.md](metadata-format.md) - the metadata JSON: objects, property sets, element quantities, units.

## Output file types

| Extension | Content |
|---|---|
| `.glb` | Binary glTF 2.0 in one file. Recommended: smaller and faster to read than `.gltf`. |
| `.gltf` | The same content as JSON text, plus a `.bin` file with the binary buffers. |
| `.xkt` | xeokit's native format, written directly (no separate xeokit-convert step). The metadata is embedded. |
| `.html` | The complete model in one self-contained HTML document with a 3D viewer and a tree view of the project structure. It can be shared and opened in a web browser without a web server and without installing anything. |

Output paths are used exactly as given; spaces in file names are kept.

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
[integration map](../architecture/integration-map.md).

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)
