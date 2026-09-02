# xeoIFC

Public repository of the xeoFoundry IFC to glTF conversion tool.

xeoIFC is a native converter application (Windows AMD64, Linux ARM64, Linux AMD64) for `.ifc` and `.ifczip` files. It writes glTF 2.0 output
(`.glb`, `.gltf`, or `.html`) plus xeoKit-style metadata and manifest JSON, with cxconverter-compatible configuration and output conventions.

## Demo for WebAssembly (WASM) browser version

Try the browser demo:
https://xeofoundry.github.io/xeoIFC/

The demo runs locally in the browser. Drag&Drop `.ifc` or `.ifczip` files from your machine to render them locally in the browser (no upload of any IFC data).

The WASM viewer supports 
- Loading of any number of files into one scene.
- Selecting elements in the tree view or 3D view, show element properties and property sets/quantities.
- Search for GUIDs, names, types etc.
- Load terrain from public GIS databases around georeferenced IFC models.
- Export of selected elements to a new IFC file (split).
- Export of several loaded files to a new IFC file (merge).

## Compatibility

xeoIFC targets xeoKit-compatible glTF/GLB and metadata output. It is designed as a successor to
cxconverter, so existing conversion setups can keep using the familiar command-line flags and
`cxconverter.json` configuration shape.

For xeoKit conversion tooling, see:
https://github.com/xeokit/xeokit-convert

## Features include:

- Extraction of the element tree structure from the IFC model and export as a scene graph, preserving GUIDs to enable metadata linking in xeoKit.

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

- Native command-line application for batch processing.

- Compatibility-focused support for current IFC 4.3 files and older IFC versions such as IFC 2x3.

You can use the converter for testing without a license key. Without a license key, generated metadata
marks the model root as an evaluation version. Supplying a valid license key removes that marker.

## Run the application

```powershell
.\xeoifc.exe -i Duplex.ifc -o test\duplex.glb
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
