<!-- Generated file: edit the source in the dev repository. sha256:9de4b13e164fe907 -->
# Esri ArcGIS export (I3S / SLPK)

[Back to xeoIFC](../README.md#esri-arcgis-export)

xeoIFC exports IFC models (`.ifc`, `.ifczip`) as I3S scene layer packages (`.slpk`) for Esri ArcGIS: ArcGIS Pro, ArcGIS
Online, ArcGIS Enterprise and web applications on the ArcGIS Maps SDK for JavaScript. The
[command-line converter](../converter/README.md) and xeoIFC Web, the viewer of the
[WebAssembly library](../webassembly/README.md), write the same package with the same engine. Several IFC files go into
one layer, and every IFC element keeps its attributes and property sets as fields.

By default the layer is global: every vertex is transformed from the coordinate reference system (CRS) the IFC files
declare into WGS 84, so the model shows in its place on the globe, over world imagery and terrain.

## Contents

- [What the package contains](#what-the-package-contains)
- [Global or local referencing](#global-or-local-referencing)
- [Where the position comes from](#where-the-position-comes-from)
- [Export from xeoIFC Web](#export-from-xeoifc-web)
- [Export with the command-line converter](#export-with-the-command-line-converter)
  - [I3S options](#i3s-options)
  - [Manifest](#manifest)
  - [Scripted folder conversion](#scripted-folder-conversion)
- [Show and check the layer in ArcGIS](#show-and-check-the-layer-in-arcgis)
- [Messages](#messages)
- [Licence](#licence)

## What the package contains

An I3S 1.9 3D Object scene layer in one `.slpk` file, with one feature per IFC element with geometry. Coordinates are in
metres, Z up.

Every feature has the fields OBJECTID, GlobalId, IfcClass, Name, ObjectType, PredefinedType, Tag, TypeName, Material,
Storey, StoreyElevation (metres), Container, ContainerClass, Project, SourceFile and SourceModel (`model<n>`, the input
file it comes from). Then follows one typed field per property or quantity, named `<Pset>_<Property>` with the alias
`<Pset>.<Property>`:

- Property sets of the element type are included; a value on the element itself wins.
- The fields are ranked by how many features have a value. The properties beyond the field limit (250 by default) go
  into one `OtherProperties` text field as JSON, at most 16 KiB per feature.
- Lengths, areas, volumes, masses and times are in SI units; the alias names the unit.
- Booleans are text: `true`, `false` or `unknown`.

Polylines, text labels and extrusion paths are not written. The glTF settings `centerModelAtOrigin` and the root node
rotation do not apply.

For large models, extract the outer shape first: it removes the geometry hidden from outside, which makes the layer much
smaller. In xeoIFC Web this is the Outer shape tool, in the converter `--extract-outer-shape`, see
[Outer-shape extraction](../converter/README.md#outer-shape-extraction).

## Global or local referencing

| Referencing | Layer CRS | Shows in |
|---|---|---|
| Global (default) | WGS 84 (EPSG:4326), I3S global mode | Global scenes with world basemaps and elevation: ArcGIS Online Scene Viewer, ArcGIS Pro global scenes, a global `SceneView` of the ArcGIS Maps SDK for JavaScript. |
| Local | A projected CRS: the one the IFC files declare, or another EPSG code | Local scenes in the same CRS. A layer in Web Mercator (EPSG:3857) also shows in global scenes. |

A global layer transforms every vertex from the CRS of its IFC file into WGS 84. Choose local for a local scene in a
national CRS, or when the IFC files declare a CRS that xeoIFC cannot transform (see below): a local layer in the declared
CRS needs no transformation.

The heights are written as they are; no vertical datum transformation is done. A global layer declares them as EGM96
heights (EPSG:5773), a local layer as the vertical CRS the IFC files declare. `i3sVcsWkid` overrides both, for example
5728 for LN02.

## Where the position comes from

The CRS of each IFC file is the EPSG code of its `IfcProjectedCRS` (in IFC 4.3 also as the target of an
`IfcRigidOperation`), and its `IfcMapConversion` places the model coordinates in that CRS. In a federation, each file is
placed with its own map conversion, and files that declare different CRSs are transformed into the layer CRS. When the
Name gives a code xeoIFC cannot transform and another attribute names one it can, that one is used, with a warning:
some Deutsche Bahn exports name 'EPSG:6258' (the ETRS89 datum) and give EPSG:5684 in the Description.

The transformations cover the projected CRSs of the EPSG database in common use, 570 projected and 122 compound CRSs:
the UTM zones (WGS 84, ETRS89, NAD83), LV95 and LV03, Gauss-Krueger, Lambert-93, RD New, the British National Grid, EOV,
MGA, the Japan plane rectangular CRSs, CGCS2000 Gauss-Krueger, Web Mercator and more. The datum shifts are the ones PROJ
applies without grid files, and the results match PROJ to below a millimetre. A CRS outside them, such as S-JTSK /
Krovak, can still be written as a local layer in that CRS.

IFC files that declare no CRS:

- In a federation in which other files declare one, they are taken to be in the CRS most files declare, with a warning.
- When no file declares one, `i3sWkid` (in xeoIFC Web: *Model EPSG code*) names the projected CRS the coordinates are
  in. It names them, it does not transform them. A geographic CRS is refused, and so is a code that differs from the one
  the files declare. If a file has an IfcSite latitude and longitude, its coordinates must lie within 50 km of that
  position: model coordinates near the origin, taken for map coordinates, are refused.
- Without either, the layer is placed from the first IfcSite with `RefLatitude` and `RefLongitude`: the model origin at
  that position and `RefElevation`, turned by `TrueNorth`. A global layer takes the model as it is, in the
  east-north-up frame at that position. A local layer is placed in LV95 (EPSG:2056, approximate formulas, about 1 m) for
  a position in Switzerland, else in the WGS 84 UTM zone of the position. Latitude and longitude given only to whole
  arc-minutes place the layer to about 1 km.
- Without such an IfcSite, or when a file has an `IfcMapConversion` without an EPSG code, the export is refused.

Before an export, the Georeferencing tool of [xeoIFC Web](https://xeofoundry.github.io/xeoIFC/) shows the coordinate
metadata of the loaded models and checks their reference points.

## Export from xeoIFC Web

[xeoIFC Web](https://xeofoundry.github.io/xeoIFC/) exports in the browser; the IFC files are not uploaded.

**Export button.** The button next to *Export* shows the export format (`.ifc` at first) and opens the export settings.
Choose *I3S scene layer (.slpk)* as the format:

| Setting | Effect |
|---|---|
| Referencing | *Global (WGS 84)* or *Local (projected CRS)*, see [Global or local referencing](#global-or-local-referencing). The viewer remembers the choice. |
| Layer EPSG code | Local only: the projected CRS of the layer. It is pre-filled with the CRS most loaded IFC files declare, and the dialog shows which CRSs the files declare. Blank keeps the declared CRS; `3857` is Web Mercator. Files in other CRSs are transformed. |
| Model EPSG code | Only for IFC files that declare no CRS: the projected CRS their coordinates are in (`i3sWkid`). Blank places such files from their IfcSite latitude and longitude. |

*Export* then writes the selected elements, or all loaded IFC models when nothing is selected, into one package.

**Outer shape tool.** The *Extract outer shape* tool removes hidden geometry from the loaded models. Its output
*I3S scene layer (.slpk)* writes all models into one package, with the same three settings. Under *Equivalent CLI input*
the tool shows the converter command for the same extraction, for models too large for a browser. For a local layer or
a model EPSG code it adds the configuration file `outer-shape.json`, because `i3sOutputWkid` and `i3sWkid` have no
command-line options.

## Export with the command-line converter

The output extension `.slpk` selects the I3S export:

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.slpk
```

Several inputs give one layer: repeat `-i`, or pass a folder for all its `.ifc` and `.ifczip` files. With
`--extract-outer-shape`, the hidden geometry is removed first:

```powershell
.\xeoifc.exe -i building.ifc -i site.ifczip -o project.slpk
.\xeoifc.exe -i .\models -o out\outer-shape.slpk --extract-outer-shape --accept-terms
```

On Linux the call is the same, without `.exe`. The referencing and the other I3S settings are read from the
[configuration file](../converter/README.md#configuration), for example a local layer in the declared CRS:

```powershell
.\xeoifc.exe -i myModel.ifc -o myModel.slpk -c i3s.json
```

```json
{"inputParameters":{"i3sOutputWkid":"source"}}
```

### I3S options

All keys go under `inputParameters`:

| Key | Default | Effect |
|---|---|---|
| `i3sOutputWkid` | `4326` | The layer CRS. `4326` or `"global"`: a global WGS 84 layer. `"source"` (or `"local"`): the CRS the inputs declare (the one most of them declare; inputs in other CRSs are transformed into it), or the IfcSite placement in EPSG:2056 / the WGS 84 UTM zone. A projected EPSG code, e.g. `3857`: a local layer in that CRS. Vertices are transformed, never relabelled. |
| `i3sWkid` | none | The projected CRS of the coordinates of inputs that declare none. It names them, it does not transform them; it must equal a code the inputs declare. |
| `i3sVcsWkid` | none | The vertical CRS, overriding a declared one (e.g. 5728 for LN02). A global layer writes 5773 (EGM96) without it. The heights are not transformed. |
| `i3sMaxPropertyFields` | `250` | The number of typed property fields, 0 to 1000; the other properties go to `OtherProperties`. |
| `i3sPropertySets` | `["*"]` | The property sets to include, by name: globs with `*` and `?`, not case sensitive. |
| `i3sExcludePropertySets` | `[]` | The property sets to leave out (globs). |
| `i3sOtherProperties` | `"yes"` | `"no"` drops the properties beyond the field limit instead of writing `OtherProperties`. |

An `i3sOutputWkid` that is none of these is ignored with a warning. Example: only the standard property sets and
quantities, in at most 100 fields:

```json
{
  "inputParameters": {
    "i3sPropertySets": ["Pset_*", "Qto_*"],
    "i3sMaxPropertyFields": 100
  }
}
```

### Manifest

The [manifest](../converter/README.md#manifest-file) of an SLPK conversion has an `i3s` object: the layer `mode`
(`"global"` or `"local"`), its `wkid` and `vcsWkid`, the `sourceWkid` of the model coordinates, how many inputs declare
the CRS, are assumed to use it and are transformed (`inputsDeclaringCrs`, `inputsAssumedCrs`, `inputsReprojected`),
`crsSource` (`"IfcSite"` for a layer placed from IfcSite), and the size of the layer: features, fields, nodes,
triangles, extent and bytes.

### Scripted folder conversion

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

set "OUTER_SHAPE_OPTIONS="
choice /c YN /n /t 5 /d Y /m "Treat transparent objects as opaque? [Y/N, default Y in 5 s] "
if errorlevel 2 if not errorlevel 3 set "OUTER_SHAPE_OPTIONS=--no-outer-shape-transparent-opaque"

if not exist "%DIR%\out" mkdir "%DIR%\out"
"%XEOIFC%" -i "%DIR%" -o "%DIR%\out\outer-shape.slpk" ^
  --extract-outer-shape %OUTER_SHAPE_OPTIONS% ^
  --accept-terms %* --outer-shape-unresolved-policy drop
exit /b %ERRORLEVEL%
```

Linux version:

```bash
#!/usr/bin/env bash
XEOIFC="/opt/xeoifc/xeoifc"
DIR="$PWD"

OUTER_SHAPE_OPTIONS=()
if [ -t 0 ]; then
  read -r -n 1 -t 5 -p "Treat transparent objects as opaque? [Y/N, default Y in 5 s] " ANSWER
  echo
  case "$ANSWER" in [nN]) OUTER_SHAPE_OPTIONS=(--no-outer-shape-transparent-opaque) ;; esac
fi

mkdir -p "$DIR/out"
"$XEOIFC" -i "$DIR" -o "$DIR/out/outer-shape.slpk" \
  --extract-outer-shape "${OUTER_SHAPE_OPTIONS[@]}" \
  --accept-terms "$@" --outer-shape-unresolved-policy drop
```

Save it as `extract-outer-shape-to-i3s.sh`, change `XEOIFC` to the location of your executable and make it executable
with `chmod +x extract-outer-shape-to-i3s.sh`. Run it from the folder containing the models.

The script asks whether transparent objects are treated as opaque. `Y` keeps the converter default: glazing and other
transparent objects hide what lies behind them. `N` adds `--no-outer-shape-transparent-opaque`, so geometry seen through
them is kept. Without an answer within 5 seconds, or when the script runs without a console, it continues with the
default (`Y`).

Run it from **Command Prompt**, after changing to the folder containing the models. The script uses that working folder,
not the folder in which the script is stored:

```bat
cd /d "C:\models\campus"
call "C:\tools\xeoifc\extract-outer-shape-to-i3s.cmd"
```

The result is `C:\models\campus\out\outer-shape.slpk`.
As in the original script, the final `--outer-shape-unresolved-policy drop` forces unresolved GPU geometry to be removed;
this can remove visible elements that sampling did not resolve. Check the output against the original models.

Additional arguments are forwarded through `%*`. If the inputs do not declare an EPSG code, save a `wkid.json` in the
model folder, using the projected CRS that matches the model coordinates (2056 is an example, not a coordinate conversion;
add `"i3sOutputWkid":"source"` for a local layer in that CRS instead of a global one):

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

## Show and check the layer in ArcGIS

- **ArcGIS Pro**: add the `.slpk` to a scene like other data: a global layer to a global scene, a local layer to a local
  scene in its CRS.
- **ArcGIS Online** and ArcGIS Enterprise: in *Content* > *My content*, choose *New item* > *Your device*, select the
  `.slpk` and let it create a hosted layer from the package. Open that layer in Scene Viewer: a global layer opens in a
  global scene, a layer in a projected CRS in a local scene.
- **ArcGIS Maps SDK for JavaScript**: load the hosted layer as a `SceneLayer`. A global `SceneView`, for example with
  the basemap `satellite` and the ground `world-elevation`, shows WGS 84 and Web Mercator layers; a local layer needs a
  `SceneView` with `viewingMode: "local"` in the CRS of the layer.

To check the position of a global layer, look at it over satellite imagery and terrain:

1. **Position.** Zoom to street level and compare the footprint with the imagery, at corners on the ground: tall
   buildings lean outward in aerial images. An offset of a metre or two can come from the imagery itself.
2. **Rotation.** The walls should run along the outlines in the image. A footprint that is turned points to the rotation
   of the `IfcMapConversion` (`XAxisAbscissa`, `XAxisOrdinate`), or for a layer placed from IfcSite to `TrueNorth`; a
   constant shift points to its eastings and northings.
3. **Height.** Look at the base of the model against the terrain. The heights are written unchanged, and a national
   height system can differ from the heights of the terrain by a metre or more. A model that floats or is buried by
   more points to the `OrthogonalHeight` of the map conversion or to `RefElevation`.
4. **A known point.** Compare a point you know, such as a surveyed corner or the origin of the map conversion,
   converted to latitude and longitude with [epsg.io](https://epsg.io) or PROJ.

## Messages

The converter lists these messages in the manifest (`errors`, `warnings`). A note that concerns several input files comes
once, with the list of the files. xeoIFC Web shows them in its own terms: *Model EPSG code* for `i3sWkid`, the referencing
and *Layer EPSG code* for `i3sOutputWkid`; the notes of an export that succeeded are shown as notes, not as an error.

| Message | Meaning |
|---|---|
| `... not among the CRSs xeoIFC can transform ...` | The declared CRS (or `i3sWkid`) is not in xeoIFC's table. Write a local layer in it: `"i3sOutputWkid": "source"`, or *Local* referencing in xeoIFC Web. |
| `the inputs declare EPSG:..., inputParameters.i3sWkid is ...` | `i3sWkid` differs from the CRS the files declare. It is only for files without a declaration: remove it. The layer CRS is set with `i3sOutputWkid`. |
| `EPSG:... is a geographic CRS` | `i3sWkid` must be a projected CRS in metres; a global layer needs no code. `i3sOutputWkid` takes 4326 or a projected CRS. |
| `... lie at ..., ... km from its IfcSite position` | The coordinates are not in the CRS given as `i3sWkid`; often they are local coordinates near the origin. Without `i3sWkid` the layer is placed from IfcSite. |
| `I3S output needs a projected CRS: no input declares an EPSG code ...` | No declared CRS, no `i3sWkid` and no IfcSite latitude and longitude, or a map conversion without an EPSG code. Set `i3sWkid`, or add the georeferencing to the IFC file. |
| Warning: `... EPSG:... in IfcProjectedCRS, not a projected CRS xeoIFC can transform; EPSG:... of its (their) other attributes is used` | The name of the CRS has a code xeoIFC cannot transform (often not a CRS code at all), another attribute one it can. Check that it is the CRS of the coordinates. |
| Warning: `... inputs declare no EPSG code and are assumed to use EPSG:...` | Files of a federation without a CRS are taken to be in the CRS most files declare. Check that they are. |
| Warning: `... km from its (their) IfcSite latitude/longitude ...; the layer uses its (their) IfcMapConversion ...` | The map conversion and the IfcSite position are more than 50 km apart. The layer is placed with the map conversion: if the model sits in the right place, the IfcSite position is wrong. |
| Warning: `... km from the other inputs and has no IfcMapConversion` | A file in local coordinates among georeferenced files. |
| Warning: `... lie within 1 km of the origin of EPSG:...` | The coordinates given an `i3sWkid` look like local model coordinates. |
| Warning: `no vertical datum declared` | A local layer without a vertical CRS: set `i3sVcsWkid`. |

A layer that does not show in a scene is usually a local layer in a scene with another CRS: export it global, or open a
local scene in its CRS.

## Licence

Without a licence key the export runs for testing and evaluation: the layer name ends in " - evaluation version", and one
more feature shows the evaluation marker text. Unmarked layers need a licence: Pro for exports from the viewers, Server
for the command-line converter. See [Licence and pricing](../README.md#licence-and-pricing).

---

Powered by xeoFoundry - [www.xeofoundry.com](https://xeofoundry.com)
