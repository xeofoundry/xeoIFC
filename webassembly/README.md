<!-- Generated file: edit the source in the dev repository. sha256:bb49b63680bc998d -->
# WebAssembly library

[Back to xeoIFC](../README.md#1-webassembly-library)

The WebAssembly library is the xeoIFC engine for web applications: wasm modules with JavaScript bindings and TypeScript
declarations. IFC files are processed in the browser; nothing is uploaded. A Web Worker calls its engine functions: load (the
file streamed in chunks, then tessellated), query (model tree, properties, georeference), the document API (the same JSON ops as
the native library and the command-line tool), the IFC export (split and merge) and the licence key. On the page, its WebGPU
`Viewer` class draws the models into a canvas, with camera, picking, selection, visibility and clip planes. Other formats (JT,
STEP, point clouds and meshes) are format modules that load on first use.

Try xeoIFC Web, the WebAssembly demo viewer on the library:
https://xeofoundry.github.io/xeoIFC/

Drag&Drop `.ifc` or `.ifczip` files from your machine to render them locally in the browser (no upload of any IFC data).

<a href="https://xeofoundry.github.io/xeoIFC/showcase/">
  <img width="900" alt="xeoIFC Web showing the Viadotto Acerno bridge - click for the live version of this view" src="https://github.com/user-attachments/assets/c5272d82-81b3-41b8-8290-16657814b002" />
</a>

Click the image for the [live version of this view](https://xeofoundry.github.io/xeoIFC/showcase/): the showcase page of
xeoIFC Web, with the running viewer in place of the screenshot and this model (Viadotto Acerno, IFC 4.3) loaded. Or open the
model in the [full viewer](https://xeofoundry.github.io/xeoIFC/?load=Viadotto-Acerno.ifczip).

xeoIFC Web is a browser IFC viewer powered by the xeoIFC WebAssembly library. The
[showcase page](https://xeofoundry.github.io/xeoIFC/showcase/) shows the calls it makes.

Download **xeoifc-wasm.zip** from [Releases](https://github.com/xeofoundry/xeoIFC/releases/) to integrate the library into
your own application. It contains prebuilt WASM modules, generated JavaScript bindings, TypeScript declarations, package
metadata, the library licence, third-party notices and an integration README. The viewer application is not included.

<br/>

xeoIFC Web supports
- Loading of any number of files into one scene.
- Selecting elements in the tree view or 3D view, show element properties and property sets/quantities.
- Search for GUIDs, names, types etc.
- Load terrain from public GIS databases around georeferenced IFC models.
- Export of selected elements to a new IFC file (split).
- Export of several loaded files to a new IFC file (merge).
- BCF, Minimap, storey shift, clip planes, measuring tool, compare revisions tool.
- File types: .ifc,.ifczip,.jt,.stp,.step,.glb,.bcf,.bcfzip,.las,.laz
