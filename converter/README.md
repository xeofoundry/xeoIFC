<!-- Generated file: edit the source in the dev repository. sha256:60a13507b4d05d58 -->
# xeoIFC command-line converter

The xeoIFC converter is a native command-line application (Windows AMD64, Linux ARM64, Linux AMD64) for `.ifc` and `.ifczip` files. It
writes glTF 2.0 output (`.glb`, `.gltf`), xeokit `.xkt`, I3S `.slpk` or a self-contained `.html` viewer, plus metadata (xeokit-style JSON or a
metadata IFC) and a manifest JSON, with cxconverter-compatible configuration and output conventions.


## Contents

- [Features](#features)
- [Run the application](#run-the-application)
- [Output file types](#output-file-types)
- [Outer-shape extraction](#outer-shape-extraction)
  - [Scripted folder conversion to SLPK](#scripted-folder-conversion-to-slpk)
- [Metadata file types](#metadata-file-types)
- [Manifest file](#manifest-file)
- [Units and coordinate system](#units-and-coordinate-system)
- [Configuration](#configuration)
- [License key](#license-key)
- [Document API subcommands](#document-api-subcommands)


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
-c                    configuration JSON path, see Configuration below
--license-key <key>   license key (overrides the XEO_IFC_LICENSE_KEY environment variable)
--accept-terms        accept the xeoIFC Testing License and run in evaluation mode without the y/N prompt
-v                    print version number
-h, --help            print help
```

Input files can be zipped (`.ifczip`), which saves significant disk space. With a license key or `--accept-terms` the converter never
asks for input, so it can run unattended in scripts and services. The exit code is 0 on success and 1 on any error.
The output path is required unless outer-shape extraction is enabled.

More documentation:

- [Configuration](#configuration) - the optional JSON configuration file: filters, geometry and glTF options.
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

Write outer shape back into a new IFC file:

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.outer.ifc --extract-outer-shape --accept-terms
```

IFC output keeps the elements, GUIDs, properties, spatial structure and georeferencing. Elements with no retained geometry
lose their body; partially retained bodies are rewritten from the kept triangles. With the default whole-mesh setting,
unchanged bodies retain their authored geometry. This is different from `-m model.meta.ifc`, which removes all geometry.

For a federation, repeat `-i` or supply a directory. A directory includes its `.ifc` and `.ifczip` files, not subfolders.
Visibility is computed jointly, so elements in one input can hide elements in another.
Without `-o`, each input gets its own `out/{name}.outer.ifc`. An explicit multi-input IFC output must use a `{name}` pattern,
for example `-o 'out/{name}.outer.ifc'`.

Create one SLPK from a folder of models, allowing visibility through transparent objects:

```powershell
.\xeoifc.exe -i .\models -o out\outer-shape.slpk --extract-outer-shape `
  --no-outer-shape-transparent-opaque --outer-shape-refine-passes 512 `
  --outer-shape-unresolved-policy drop --accept-terms
```

To select specific files instead of a folder, repeat `-i`. IFC and IFCZIP inputs can be mixed; this creates one combined SLPK:

```powershell
.\xeoifc.exe -i electrical.ifczip -i wallsAndSlabs.ifc -i windows.ifc -i terrain.ifc `
  -o out\outer-shape.slpk --extract-outer-shape `
  --no-outer-shape-transparent-opaque --accept-terms
```

For SLPK, the projected EPSG code comes from the inputs' `IfcProjectedCRS`. If none declares it, supply
`inputParameters.i3sWkid` in a configuration file passed with `-c`. Choose the code matching the model coordinates;
setting it does not transform them. Without a declared code and without `i3sWkid`, the layer is placed from the IfcSite
latitude, longitude and elevation (EPSG:2056 in Switzerland, else the WGS84 UTM zone). SLPK keeps projected coordinates with Z up, rather than the glTF root rotation.

### Scripted folder conversion to SLPK

A Windows batch script can process all `.ifc` and `.ifczip` files in the current working folder in one conversion.
The files form one federation: geometry in one file can hide geometry in another. Subfolders are not scanned, and the
result is **one combined SLPK**, not a separate package for each input file. Passing the directory to `-i` replaces the
need for a `for` loop over individual files.

Save this portable version of `extract-outer-shape-to-i3s.cmd` next to your converter, for example in
`C:\tools\xeoifc`, and change `XEOIFC` to the location of your executable:

```bat
@echo off
setlocal
set "XEOIFC=C:\tools\xeoifc\xeoifc.exe"
set "DIR=%CD%"

if not exist "%DIR%\out" mkdir "%DIR%\out"
"%XEOIFC%" -i "%DIR%" -o "%DIR%\out\outer-shape.slpk" ^
  --extract-outer-shape --no-outer-shape-transparent-opaque ^
  --accept-terms %* --outer-shape-unresolved-policy drop
exit /b %ERRORLEVEL%
```

Run it from **Command Prompt**, after changing to the folder containing the models. The script uses that working folder,
not the folder in which the script is stored:

```bat
cd /d "C:\models\campus"
call "C:\tools\xeoifc\extract-outer-shape-to-i3s.cmd"
```

The result is `C:\models\campus\out\outer-shape.slpk`. Transparent objects do not occlude geometry behind them.
As in the original script, the final `--outer-shape-unresolved-policy drop` forces unresolved GPU geometry to be removed;
this can remove visible elements that sampling did not resolve. Check the output against the original models.

Additional arguments are forwarded through `%*`. If the inputs do not declare an EPSG code, save a `wkid.json` in the
model folder, using the projected CRS that matches the model coordinates (2056 is an example, not a coordinate conversion):

```json
{"inputParameters":{"i3sWkid":2056}}
```

Then run, for example:

```bat
call "C:\tools\xeoifc\extract-outer-shape-to-i3s.cmd" -c "wkid.json" --outer-shape-quality fine
```

For licensed conversion, set `XEO_IFC_LICENSE_KEY` in the environment before running the script; do not embed a key in a
shared batch file. Without a key, `--accept-terms` accepts the testing license and runs in evaluation mode. This version
omits the original script's `pause` and returns the converter's exit code, so it can be called from another script or job.

### Visibility settings

| Option | Default | Effect |
|---|---|---|
| `--outer-shape-strategy` | `gpu-raster` | GPU visibility sampling with adaptive close-ups and bounded ray recovery. Alternatives: CPU `raster` or `hybrid` (raster plus ray checks). If the GPU backend is unavailable, the CLI warns and falls back to CPU raster. |
| `--outer-shape-quality` | `fine` for GPU; `standard` for CPU | `fast`, `standard`, `fine` use 32, 70, 168 total views and 512, 1024, 2048 pixels per edge respectively. |
| `--outer-shape-view-directions` | `0` | Override with 1–4096 sampled directions, plus six fixed axis views. Zero uses the quality preset. |
| `--outer-shape-resolution` | `0` | Override the depth-buffer edge with 64–4096 pixels. Zero uses the quality preset; GPU close-ups use at least 512 pixels. |
| `--outer-shape-refine-passes` | `512` | Maximum adaptive GPU close-up passes, from 0 to 4096. Zero disables close-ups and ray recovery. Each pass evaluates multiple views, not just one image. |
| `--outer-shape-unresolved-policy` | `drop` | GPU-only: remove undecided meshes by default (`drop`, labelled **Remove** in the viewer); preserve them whole only with explicit `keep`. |
| `--no-outer-shape-keep-whole-meshes` | Whole meshes kept | Retain only triangles found visible instead of promoting a partly visible mesh to its whole geometry. Unresolved meshes still follow the keep/drop policy. |
| `--no-outer-shape-transparent-opaque` | Transparent objects occlude | With this flag, transparent objects hide nothing behind them. Their appearance is unchanged. |

The close-up budget and unresolved policy apply to the GPU backend. CLI options override the corresponding values under
`inputParameters` in a configuration file, for example:

```json
{
  "inputParameters": {
    "extractOuterShape": 1,
    "extractOuterShapeRefinePasses": 512,
    "extractOuterShapeUnresolvedPolicy": "drop",
    "extractOuterShapeTransparentOpaque": false
  }
}
```

### Keep or remove unresolved geometry

**Remove is the default** in the CLI, JSON configuration, shared engine and viewer, including when the close-up budget is exhausted or zero. The CLI/JSON value is `drop`; `keep` remains an explicit opt-in.

An unresolved mesh is **not proven hidden**. Small objects, thin surfaces and narrow openings can be missed by sampling.

- **`drop` (default; Remove)** produces a smaller result, but can remove visible elements that the visibility tests did not resolve.
- **`keep` (opt-in)** is safer against missing elements, but can retain substantial amounts of actually hidden geometry.
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
[metadata options and filters](#metadata-options) of the configuration file apply to the JSON only: a metadata IFC
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
with `gltfRootNodeRotationVector` and `gltfRootNodeRotationInDegrees` in the [configuration file](#configuration).

## Configuration

The converter reads optional settings from a JSON file before every conversion.

### Which file is loaded

1. The path given with `-c <path>`.
2. Otherwise `cxconverter.json` in the current working directory.
3. Otherwise `cxconverter.json` next to the executable.

The file name is the same as for cxconverter, so existing deployments keep working. A missing file is not an error; the
converter then runs with the defaults listed below. The loaded path is printed as `Settings loaded: <path>`.

### File layout

All settings live in one object named `inputParameters`. Unknown keys are ignored, so an unused key can serve as a comment.

```json
{
  "inputParameters": {
    "exportPropertySets": "yes",
    "exportIfcPropertyTypes": "yes",
    "exportIfcValueTypes": "yes",
    "exportPolylines": "no",
    "exportTextLabels": "no",
    "exportExtrusionPaths": "no",
    "excludeGeometryForIfcTypes": [ "IfcOpeningElement" ],
    "exportGeometryOnlyForIfcTypes": [],
    "excludeMetadataForIfcTypes": [],
    "excludeGUIDs": [],
    "exportOnlyGUIDs": [],
    "includeOrphanedElements": "no",
    "centerModelAtOrigin": "no",
    "ignoreProfileRadius": "no",
    "numPointsPerCircle": 18,
    "gltfRootNodeRotationVector": [ 1, 0, 0 ],
    "gltfRootNodeRotationInDegrees": 90,
    "maxTransparency": 0.9,
    "deduplicateMaterials": 1,
    "deduplicateAccessors": 1,
    "coordinatesOutputPrecision": 0.00001,
    "deduplicateMeshes": 1,
    "licenseKey": ""
  }
}
```

The values above are the defaults, i.e. what the converter uses when there is no configuration file.

### Metadata options

| Key | Values | Default | Effect |
|---|---|---|---|
| `exportPropertySets` | `"yes"` / `"no"` | `"yes"` | Write property sets and element quantities into the metadata file. |
| `exportIfcPropertyTypes` | `"yes"` / `"no"` | `"yes"` | Add `ifcPropertyType` to every property, for example `IfcPropertySingleValue`. |
| `exportIfcValueTypes` | `"yes"` / `"no"` | `"yes"` | Add `ifcValueType` to every property, for example `IfcPowerMeasure`. |
| `excludeMetadataForIfcTypes` | array of IFC type names | `[]` | Leave objects of these types out of the metadata file. |

See [metadata-format.md](metadata-format.md) for the resulting JSON. These options and the GUID filters below apply to the metadata
JSON only; a metadata IFC (`-m <path>.ifc` or `.ifczip`) always contains the whole model.

### Filters

| Key | Values | Default | Effect |
|---|---|---|---|
| `excludeGeometryForIfcTypes` | array of IFC type names | `["IfcOpeningElement"]` | No geometry is exported for these types. |
| `exportGeometryOnlyForIfcTypes` | array of IFC type names | `[]` | When not empty, only these types (and their subtypes) get geometry. |
| `excludeGUIDs` | array of GlobalId strings | `[]` | Exclude these objects from the glTF and the metadata JSON. |
| `exportOnlyGUIDs` | array of GlobalId strings | `[]` | When not empty, only these objects are exported. |
| `includeOrphanedElements` | see below | `"no"` | Export elements that are not part of the spatial structure. |

Type names are not case sensitive. An array given in the file replaces the default, it is not merged with it.

- To make opening elements visible (they are normally hidden in IFC viewers), remove `IfcOpeningElement` from
  `excludeGeometryForIfcTypes`: `"excludeGeometryForIfcTypes": []`.
- To hide the (usually transparent) space volumes, add `IfcSpace`: `"excludeGeometryForIfcTypes": ["IfcOpeningElement", "IfcSpace"]`.

#### includeOrphanedElements

Some models contain elements with a geometric representation that are not included in the spatial structure of the `IfcProject`.
This violates the IFC standard, but it occurs. By default these elements are not exported.

| Value | Effect |
|---|---|
| `"no"` or omitted | Orphaned elements are not exported. |
| `"yes"` or `"insertAtIfcSite"` | Exported under an additional object named `UnreferencedObjects`, attached below the first child of `IfcProject` (usually an `IfcSite`). |
| `"insertAtIfcProject"` | Same, attached directly below `IfcProject`. |
| `"insertAtRoot"` | Same, as a root-level glTF branch without an IFC parent in the metadata. |

### Geometry options

| Key | Values | Default | Effect |
|---|---|---|---|
| `exportPolylines` | `"yes"` / `"no"` | `"no"` | Export line geometry (2D footprints, axis representations, grid axes) as glTF line strips. Triangle meshes are always exported. |
| `exportTextLabels` | `"yes"` / `"no"` | `"no"` | Export text labels, for example the axis labels of an `IfcGrid`. |
| `exportExtrusionPaths` | `"yes"` / `"no"` | `"no"` | Attach the extrusion path of distribution elements (pipes, ducts, ...) to their glTF primitives as `extras`. |
| `numPointsPerCircle` | integer | `18` | Number of points a full circle is discretized into; arcs get proportionally fewer points. glTF only knows points, lines and triangles, so every arc becomes a polyline. |
| `ignoreProfileRadius` | `"yes"` / `"no"` | `"no"` | Replace the rounding radii of parameterized profiles by sharp corners. An I-shape profile has 8 quarter circles; ignoring them reduces the mesh size of steel models significantly. |
| `maxTransparency` | number 0..1 | `0.9` | Upper limit for the transparency of a material, so that an object with transparency 1 does not seem to be missing in the viewer. |

### glTF output options

| Key | Values | Default | Effect |
|---|---|---|---|
| `centerModelAtOrigin` | `"yes"` / `"no"` | `"no"` | Translate the root node by the negative centre of the model bounding box. |
| `gltfRootNodeRotationVector` | `[x, y, z]` | `[1, 0, 0]` | Axis of the root node rotation, see [coordinate system](#units-and-coordinate-system). |
| `gltfRootNodeRotationInDegrees` | number | `90` | Angle of the root node rotation. |
| `deduplicateMaterials` | `1` / `0` | `1` | Re-use an existing material instead of writing one per mesh. |
| `deduplicateAccessors` | `1` / `0` | `1` | Re-use accessors whose data is identical (vertex coordinates: within `coordinatesOutputPrecision`), which also removes the duplicate buffer data. |
| `coordinatesOutputPrecision` | number (metres) | `0.00001` | Tolerance of `deduplicateAccessors` for vertex coordinates: an accessor is re-used when its coordinates differ by at most this distance, so vertices can move by that much. The default of 10 µm merges the rounding noise of repeated parts; `0` re-uses only identical data. cxconverter used `0.001`, which also merges parts that really differ by less than a millimetre and changes the volume of thin parts. |
| `deduplicateMeshes` | `1` / `0` | `1` | Re-use identical mesh and primitive objects across glTF nodes. |

IFC models repeat the same geometry very often (the mesh of one door type can occur thousands of times), so the three deduplication
options typically reduce the output size by 50% to 80%. Switch them off only for debugging.

### Accepted for compatibility

These cxconverter keys are accepted so that existing configuration files load without changes, but they have no effect in xeoIFC:
`enableGltfCompression`, `enableGltfQuantization`, `exportNormals`, `enableTextureExport` (a warning is printed, textures are not
exported), `maxNumberOfThreads`, `loadingPriorityTypes`, `exportIfcSpaceGeometry`.

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

In the [configuration file](#configuration), set the key under `inputParameters`:

| Key | Values | Effect |
|---|---|---|
| `licenseKey` (or `licenceKey`) | string | License key. `--license-key` on the command line and the `XEO_IFC_LICENSE_KEY` environment variable take precedence. |

## Document API subcommands

The document API subcommands (`query`, `split`, `merge`, `run`, `serve --mcp`) are shown in the
[integration map](../architecture/integration-map.md).

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)
