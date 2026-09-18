# xeoIFC converter configuration file

The [command-line converter](README.md) reads optional settings from a JSON file before every conversion.

## Which file is loaded

1. The path given with `-c <path>`.
2. Otherwise `cxconverter.json` in the current working directory.
3. Otherwise `cxconverter.json` next to the executable.

The file name is the same as for cxconverter, so existing deployments keep working. A missing file is not an error; the
converter then runs with the defaults listed below. The loaded path is printed as `Settings loaded: <path>`.

## File layout

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
    "deduplicateMeshes": 1,
    "licenseKey": ""
  }
}
```

The values above are the defaults, i.e. what the converter uses when there is no configuration file.

## Metadata options

| Key | Values | Default | Effect |
|---|---|---|---|
| `exportPropertySets` | `"yes"` / `"no"` | `"yes"` | Write property sets and element quantities into the metadata file. |
| `exportIfcPropertyTypes` | `"yes"` / `"no"` | `"yes"` | Add `ifcPropertyType` to every property, for example `IfcPropertySingleValue`. |
| `exportIfcValueTypes` | `"yes"` / `"no"` | `"yes"` | Add `ifcValueType` to every property, for example `IfcPowerMeasure`. |
| `excludeMetadataForIfcTypes` | array of IFC type names | `[]` | Leave objects of these types out of the metadata file. |

See [metadata-format.md](metadata-format.md) for the resulting JSON.

## Filters

| Key | Values | Default | Effect |
|---|---|---|---|
| `excludeGeometryForIfcTypes` | array of IFC type names | `["IfcOpeningElement"]` | No geometry is exported for these types. |
| `exportGeometryOnlyForIfcTypes` | array of IFC type names | `[]` | When not empty, only these types (and their subtypes) get geometry. |
| `excludeGUIDs` | array of GlobalId strings | `[]` | Exclude these objects from the glTF and the metadata. |
| `exportOnlyGUIDs` | array of GlobalId strings | `[]` | When not empty, only these objects are exported. |
| `includeOrphanedElements` | see below | `"no"` | Export elements that are not part of the spatial structure. |

Type names are not case sensitive. An array given in the file replaces the default, it is not merged with it.

- To make opening elements visible (they are normally hidden in IFC viewers), remove `IfcOpeningElement` from
  `excludeGeometryForIfcTypes`: `"excludeGeometryForIfcTypes": []`.
- To hide the (usually transparent) space volumes, add `IfcSpace`: `"excludeGeometryForIfcTypes": ["IfcOpeningElement", "IfcSpace"]`.

### includeOrphanedElements

Some models contain elements with a geometric representation that are not included in the spatial structure of the `IfcProject`.
This violates the IFC standard, but it occurs. By default these elements are not exported.

| Value | Effect |
|---|---|
| `"no"` or omitted | Orphaned elements are not exported. |
| `"yes"` or `"insertAtIfcSite"` | Exported under an additional object named `UnreferencedObjects`, attached below the first child of `IfcProject` (usually an `IfcSite`). |
| `"insertAtIfcProject"` | Same, attached directly below `IfcProject`. |
| `"insertAtRoot"` | Same, as a root-level glTF branch without an IFC parent in the metadata. |

## Geometry options

| Key | Values | Default | Effect |
|---|---|---|---|
| `exportPolylines` | `"yes"` / `"no"` | `"no"` | Export line geometry (2D footprints, axis representations, grid axes) as glTF line strips. Triangle meshes are always exported. |
| `exportTextLabels` | `"yes"` / `"no"` | `"no"` | Export text labels, for example the axis labels of an `IfcGrid`. |
| `exportExtrusionPaths` | `"yes"` / `"no"` | `"no"` | Attach the extrusion path of distribution elements (pipes, ducts, ...) to their glTF primitives as `extras`. |
| `numPointsPerCircle` | integer | `18` | Number of points a full circle is discretized into; arcs get proportionally fewer points. glTF only knows points, lines and triangles, so every arc becomes a polyline. |
| `ignoreProfileRadius` | `"yes"` / `"no"` | `"no"` | Replace the rounding radii of parameterized profiles by sharp corners. An I-shape profile has 8 quarter circles; ignoring them reduces the mesh size of steel models significantly. |
| `maxTransparency` | number 0..1 | `0.9` | Upper limit for the transparency of a material, so that an object with transparency 1 does not seem to be missing in the viewer. |

## glTF output options

| Key | Values | Default | Effect |
|---|---|---|---|
| `centerModelAtOrigin` | `"yes"` / `"no"` | `"no"` | Translate the root node by the negative centre of the model bounding box. |
| `gltfRootNodeRotationVector` | `[x, y, z]` | `[1, 0, 0]` | Axis of the root node rotation, see [coordinate system](README.md#units-and-coordinate-system). |
| `gltfRootNodeRotationInDegrees` | number | `90` | Angle of the root node rotation. |
| `deduplicateMaterials` | `1` / `0` | `1` | Re-use an existing material instead of writing one per mesh. |
| `deduplicateAccessors` | `1` / `0` | `1` | Re-use accessors whose binary data is identical (compared by hash), which also removes the duplicate buffer data. |
| `deduplicateMeshes` | `1` / `0` | `1` | Re-use identical mesh and primitive objects across glTF nodes. |

IFC models repeat the same geometry very often (the mesh of one door type can occur thousands of times), so the three deduplication
options typically reduce the output size by 50% to 80%. Switch them off only for debugging.

## License key

| Key | Values | Effect |
|---|---|---|
| `licenseKey` (or `licenceKey`) | string | License key. `--license-key` on the command line and the `XEO_IFC_LICENSE_KEY` environment variable take precedence. |

Without a license key the converter runs in evaluation mode, see [README.md](README.md#license-key).

## Accepted for compatibility

These cxconverter keys are accepted so that existing configuration files load without changes, but they have no effect in xeoIFC:
`enableGltfCompression`, `enableGltfQuantization`, `exportNormals`, `enableTextureExport` (a warning is printed, textures are not
exported), `maxNumberOfThreads`, `loadingPriorityTypes`, `exportIfcSpaceGeometry`.

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)
